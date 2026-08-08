"""
Self-learning dataset writer.

Every completed key press (prediction resolved + actual keyboard event
received and compared) is appended as a training sample under:

  dataset/<user_id>/<session_id>/
      landmarks.json    - list of {frame_index, timestamp, hand, landmarks(21x3)}
      keypress.csv       - one row per completed press
      metadata.json       - session-level summary, updated incrementally
      webcam.mp4          - optional raw video (written by the frontend/
                             backend video recorder service, not this module)

This module only handles the structured (non-video) side of the dataset,
which is what the training pipeline in ai/training/train.py consumes.
"""

from __future__ import annotations

import csv
import json
import time
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Optional

import numpy as np

DATASET_ROOT = Path(__file__).resolve().parents[2] / "ai" / "dataset"

KEYPRESS_CSV_FIELDS = [
    "timestamp", "predicted_key", "actual_key", "correct",
    "active_finger", "confidence", "reaction_time_ms", "typing_speed_wpm",
]


@dataclass
class KeypressSample:
    timestamp: float
    predicted_key: Optional[str]
    actual_key: str
    correct: bool
    active_finger: Optional[str]
    confidence: float
    reaction_time_ms: float
    typing_speed_wpm: float
    landmarks: list  # (21, 3) float list for the frame the press was detected on
    trajectory: list  # list of (21, 3) frames leading up to the press (feature history)


class DatasetWriter:
    def __init__(self, user_id: str, session_id: str):
        self.user_id = user_id
        self.session_id = session_id
        self.session_dir = DATASET_ROOT / user_id / session_id
        self.session_dir.mkdir(parents=True, exist_ok=True)

        self._landmarks_path = self.session_dir / "landmarks.json"
        self._keypress_path = self.session_dir / "keypress.csv"
        self._metadata_path = self.session_dir / "metadata.json"

        self._landmark_records: list[dict] = []
        self._press_count = 0
        self._correct_count = 0
        self._session_start = time.time()

        if not self._keypress_path.exists():
            with open(self._keypress_path, "w", newline="") as f:
                csv.DictWriter(f, fieldnames=KEYPRESS_CSV_FIELDS).writeheader()

    def log_landmark_frame(self, frame_index: int, hand: str, landmarks: np.ndarray) -> None:
        self._landmark_records.append({
            "frame_index": frame_index,
            "timestamp": time.time(),
            "hand": hand,
            "landmarks": landmarks.tolist(),
        })
        # Flush periodically rather than per-frame to avoid I/O overhead at 60fps.
        if len(self._landmark_records) >= 120:
            self._flush_landmarks()

    def log_keypress(self, sample: KeypressSample) -> None:
        with open(self._keypress_path, "a", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=KEYPRESS_CSV_FIELDS)
            writer.writerow({
                "timestamp": sample.timestamp,
                "predicted_key": sample.predicted_key or "",
                "actual_key": sample.actual_key,
                "correct": sample.correct,
                "active_finger": sample.active_finger or "",
                "confidence": sample.confidence,
                "reaction_time_ms": sample.reaction_time_ms,
                "typing_speed_wpm": sample.typing_speed_wpm,
            })

        # Store the rich trajectory/landmark payload separately, keyed by
        # timestamp, so train.py can join keypress.csv rows to their
        # corresponding motion window without bloating the CSV.
        traj_path = self.session_dir / "trajectories.jsonl"
        with open(traj_path, "a") as f:
            f.write(json.dumps({
                "timestamp": sample.timestamp,
                "landmarks": sample.landmarks,
                "trajectory": sample.trajectory,
                "predicted_key": sample.predicted_key,
                "actual_key": sample.actual_key,
                "active_finger": sample.active_finger,
            }) + "\n")

        self._press_count += 1
        if sample.correct:
            self._correct_count += 1
        self._write_metadata()

    def _flush_landmarks(self) -> None:
        existing = []
        if self._landmarks_path.exists():
            with open(self._landmarks_path, "r") as f:
                try:
                    existing = json.load(f)
                except json.JSONDecodeError:
                    existing = []
        existing.extend(self._landmark_records)
        with open(self._landmarks_path, "w") as f:
            json.dump(existing, f)
        self._landmark_records = []

    def _write_metadata(self) -> None:
        accuracy = self._correct_count / self._press_count if self._press_count else 0.0
        elapsed_min = max((time.time() - self._session_start) / 60.0, 1e-6)
        metadata = {
            "user_id": self.user_id,
            "session_id": self.session_id,
            "session_start": self._session_start,
            "last_updated": time.time(),
            "total_keypresses": self._press_count,
            "correct_predictions": self._correct_count,
            "prediction_accuracy": accuracy,
            "average_wpm": self._press_count / 5.0 / elapsed_min,
        }
        with open(self._metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)

    def close(self) -> None:
        self._flush_landmarks()
        self._write_metadata()
