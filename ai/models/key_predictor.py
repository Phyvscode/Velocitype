"""
PyTorch model for finger-motion -> key prediction.

Architecture:
  Per-frame feature vector (F_DIM) -> small MLP encoder
    -> GRU over the last T frames (captures motion trajectory, i.e.
       "previous frames" from the spec, without hand-crafted windowing)
    -> attention-pooled final hidden state
    -> classification head over the fixed key vocabulary.

Output: a probability distribution (softmax) over every key the ACTIVE
finger could plausibly reach (the model is trained per-finger; the finger
identity is also encoded directly into the input features, and the
classification head is masked at inference time to only the keys that
finger is anatomically responsible for, per config/keyboard_layout.py).
"""

from __future__ import annotations

import torch
import torch.nn as nn
import torch.nn.functional as F

# Full addressable key vocabulary (must match config/keyboard_layout.py KEYBOARD keys).
KEY_VOCAB = [
    "`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=",
    "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",
    "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'",
    "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/",
    "SPACE",
]
KEY_TO_IDX = {k: i for i, k in enumerate(KEY_VOCAB)}
IDX_TO_KEY = {i: k for k, i in KEY_TO_IDX.items()}
NUM_KEYS = len(KEY_VOCAB)


class TemporalAttentionPool(nn.Module):
    """Learns to weight frames in the trajectory window, so a sharp final
    approach-to-key frame can matter more than earlier idle frames."""

    def __init__(self, hidden_dim: int):
        super().__init__()
        self.score = nn.Linear(hidden_dim, 1)

    def forward(self, sequence: torch.Tensor) -> torch.Tensor:
        # sequence: (batch, T, hidden_dim)
        weights = F.softmax(self.score(sequence).squeeze(-1), dim=1)  # (batch, T)
        pooled = torch.einsum("bt,bth->bh", weights, sequence)
        return pooled


class KeyPredictor(nn.Module):
    def __init__(self, feature_dim: int, hidden_dim: int = 128, gru_layers: int = 2,
                 num_keys: int = NUM_KEYS, dropout: float = 0.2):
        super().__init__()
        self.feature_dim = feature_dim
        self.hidden_dim = hidden_dim

        self.encoder = nn.Sequential(
            nn.Linear(feature_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim),
            nn.GELU(),
        )

        self.gru = nn.GRU(
            input_size=hidden_dim,
            hidden_size=hidden_dim,
            num_layers=gru_layers,
            batch_first=True,
            dropout=dropout if gru_layers > 1 else 0.0,
            bidirectional=False,
        )

        self.attn_pool = TemporalAttentionPool(hidden_dim)

        self.head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 2, num_keys),
        )

    def forward(self, sequence: torch.Tensor, key_mask: torch.Tensor | None = None) -> torch.Tensor:
        """
        sequence: (batch, T, feature_dim) — a short trailing window of frames
                  for the currently active finger.
        key_mask: optional (batch, num_keys) boolean mask; False entries are
                  driven to -inf before softmax so the model only distributes
                  probability over keys the active finger can anatomically reach.
        returns: (batch, num_keys) logits.
        """
        batch, t, _ = sequence.shape
        encoded = self.encoder(sequence.reshape(batch * t, self.feature_dim)).reshape(batch, t, self.hidden_dim)
        gru_out, _ = self.gru(encoded)
        pooled = self.attn_pool(gru_out)
        logits = self.head(pooled)

        if key_mask is not None:
            logits = logits.masked_fill(~key_mask, float("-inf"))

        return logits

    def predict_proba(self, sequence: torch.Tensor, key_mask: torch.Tensor | None = None) -> torch.Tensor:
        with torch.no_grad():
            logits = self.forward(sequence, key_mask)
            return F.softmax(logits, dim=-1)


def key_mask_for_finger(finger_reachable_keys: list[str], device: torch.device) -> torch.Tensor:
    """Build a (num_keys,) boolean mask restricting predictions to the keys
    a specific finger is responsible for (per config/keyboard_layout.py
    all_keys_for_finger)."""
    mask = torch.zeros(NUM_KEYS, dtype=torch.bool, device=device)
    for k in finger_reachable_keys:
        if k in KEY_TO_IDX:
            mask[KEY_TO_IDX[k]] = True
    return mask
