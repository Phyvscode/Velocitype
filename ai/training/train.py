"""
Training entrypoint for the KeyPredictor model.

Reads every dataset/<user>/<session>/trajectories.jsonl produced by
ai/services/dataset_writer.py, builds (sequence, key_mask, label) tuples,
and trains ai/models/key_predictor.py with cross-entropy loss over the
masked key vocabulary.

Usage:
    python -m ai.training.train --epochs 30 --batch-size 64 --lr 1e-3
    python -m ai.training.train --user user001 --session session001
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader, random_split

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))
from config.keyboard_layout import Finger, all_keys_for_finger  # noqa: E402
from models.key_predictor import KeyPredictor, KEY_TO_IDX, NUM_KEYS, key_mask_for_finger  # noqa: E402
from services.feature_extractor import F_DIM  # noqa: E402

DATASET_ROOT = Path(__file__).resolve().parents[2] / "ai" / "dataset"
CHECKPOINT_DIR = Path(__file__).resolve().parents[2] / "ai" / "models" / "checkpoints"
SEQUENCE_LEN = 8


class KeypressDataset(Dataset):
    """
    Loads (feature_sequence, active_finger, label_key) triples from every
    trajectories.jsonl file under dataset/. Each stored trajectory already
    contains the pre-computed feature-vector windows written at collection
    time (see dataset_writer + prediction_service integration in the
    websocket handler), so no re-derivation from raw landmarks is required
    here — this keeps training fast and decoupled from the live tracker.
    """

    def __init__(self, user_filter: str | None = None, session_filter: str | None = None):
        self.samples: list[dict] = []
        self._load(user_filter, session_filter)

    def _load(self, user_filter, session_filter):
        if not DATASET_ROOT.exists():
            return
        for user_dir in DATASET_ROOT.iterdir():
            if not user_dir.is_dir():
                continue
            if user_filter and user_dir.name != user_filter:
                continue
            for session_dir in user_dir.iterdir():
                if not session_dir.is_dir():
                    continue
                if session_filter and session_dir.name != session_filter:
                    continue
                traj_file = session_dir / "trajectories.jsonl"
                if not traj_file.exists():
                    continue
                with open(traj_file, "r") as f:
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        record = json.loads(line)
                        if record.get("actual_key") and record.get("active_finger") and record.get("trajectory"):
                            self.samples.append(record)

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):
        record = self.samples[idx]
        seq = np.array(record["trajectory"], dtype=np.float32)  # (T, F_DIM)
        if seq.shape[0] < SEQUENCE_LEN:
            pad = np.repeat(seq[:1], SEQUENCE_LEN - seq.shape[0], axis=0)
            seq = np.concatenate([pad, seq], axis=0)
        else:
            seq = seq[-SEQUENCE_LEN:]

        finger = Finger(record["active_finger"])
        reachable = all_keys_for_finger(finger)
        mask = np.zeros(NUM_KEYS, dtype=bool)
        for k in reachable:
            if k in KEY_TO_IDX:
                mask[KEY_TO_IDX[k]] = True

        label = KEY_TO_IDX.get(record["actual_key"].upper(), KEY_TO_IDX.get("SPACE"))
        return (
            torch.from_numpy(seq),
            torch.from_numpy(mask),
            torch.tensor(label, dtype=torch.long),
        )


def collate(batch):
    seqs, masks, labels = zip(*batch)
    return torch.stack(seqs), torch.stack(masks), torch.stack(labels)


def train(epochs: int, batch_size: int, lr: float, user: str | None, session: str | None,
          val_split: float = 0.15, device_str: str = "auto"):
    device = torch.device("cuda" if (device_str == "auto" and torch.cuda.is_available()) else
                           ("cpu" if device_str == "auto" else device_str))

    dataset = KeypressDataset(user_filter=user, session_filter=session)
    if len(dataset) < 20:
        raise RuntimeError(
            f"Only {len(dataset)} training samples found under {DATASET_ROOT}. "
            "Run a live session first (self-learning logging happens automatically "
            "via the /ws/predict endpoint) to accumulate keypress data before training."
        )

    val_size = max(1, int(len(dataset) * val_split))
    train_size = len(dataset) - val_size
    train_ds, val_ds = random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, collate_fn=collate)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, collate_fn=collate)

    model = KeyPredictor(feature_dim=F_DIM).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
    criterion = torch.nn.CrossEntropyLoss()

    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    best_val_acc = 0.0

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss, train_correct, train_total = 0.0, 0, 0
        for seqs, masks, labels in train_loader:
            seqs, masks, labels = seqs.to(device), masks.to(device), labels.to(device)
            optimizer.zero_grad()
            logits = model(seqs, masks)
            loss = criterion(logits, labels)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=2.0)
            optimizer.step()

            train_loss += loss.item() * seqs.size(0)
            train_correct += (logits.argmax(dim=-1) == labels).sum().item()
            train_total += seqs.size(0)

        scheduler.step()

        model.eval()
        val_correct, val_total = 0, 0
        with torch.no_grad():
            for seqs, masks, labels in val_loader:
                seqs, masks, labels = seqs.to(device), masks.to(device), labels.to(device)
                logits = model(seqs, masks)
                val_correct += (logits.argmax(dim=-1) == labels).sum().item()
                val_total += seqs.size(0)

        train_acc = train_correct / max(train_total, 1)
        val_acc = val_correct / max(val_total, 1)
        print(f"epoch {epoch:03d}/{epochs} | loss {train_loss / max(train_total,1):.4f} "
              f"| train_acc {train_acc:.3f} | val_acc {val_acc:.3f}")

        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            torch.save({
                "model_state_dict": model.state_dict(),
                "feature_dim": F_DIM,
                "epoch": epoch,
                "val_acc": val_acc,
            }, CHECKPOINT_DIR / "key_predictor.pt")

    print(f"Training complete. Best val_acc={best_val_acc:.3f}. "
          f"Checkpoint saved to {CHECKPOINT_DIR / 'key_predictor.pt'}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train the VelocityAI KeyPredictor model")
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--user", type=str, default=None)
    parser.add_argument("--session", type=str, default=None)
    parser.add_argument("--device", type=str, default="auto")
    args = parser.parse_args()

    train(epochs=args.epochs, batch_size=args.batch_size, lr=args.lr,
          user=args.user, session=args.session, device_str=args.device)
