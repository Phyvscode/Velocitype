"""
Top-level orchestration service used by the backend WebSocket handler.

State machine per session:

  WAITING_FOR_CALIBRATION
        |  (all 8 home-row fingers within tolerance for N consecutive frames)
        v
  CALIBRATED  <----------------------------+
        |  (a finger's displacement from    |
        |   its home key exceeds MOVE_EPS)  |
        v                                   |
  PREDICTING --- (press detected) --> emit prediction, log sample, reset -+

Movement -> key inference has two backends:
  1. Neural (default once a trained checkpoint exists): run KeyPredictor.
  2. Geometric fallback (always available, used before any training data
     exists): project the finger's displacement vector onto the 4-directional
     neighbor graph in config/keyboard_layout.py and walk toward the nearest
     neighbor in that direction — this implements the spec's worked examples
     (pinky forward->Q, backward->Z, etc.) directly and deterministically.
"""

from __future__ import annotations

import math
import time
from collections import deque
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Optional

import numpy as np
import torch

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "config"))
from keyboard_layout import Finger, KEYBOARD, HOME_ROW_KEYS, all_keys_for_finger  # noqa: E402

from .hand_tracker import HandTracker, FrameHandState  # noqa: E402
from .feature_extractor import (  # noqa: E402
    CalibrationReference, build_calibration, calibration_error, is_posture_correct,
    most_active_finger, extract_features, F_DIM,
)
from models.key_predictor import KeyPredictor, key_mask_for_finger, KEY_TO_IDX, IDX_TO_KEY  # noqa: E402

MOVE_EPS = 0.045          # displacement (norm image units) that counts as "left home row"
PRESS_VELOCITY_EPS = 0.9  # matches FingerState.is_pressing threshold
SEQUENCE_LEN = 8          # trailing frames fed to the GRU
CALIBRATION_HOLD_SECONDS = 5.0

class SessionPhase(str, Enum):
    WAITING_FOR_CALIBRATION = "waiting_for_calibration"
    CALIBRATED = "calibrated"
    PREDICTING = "predicting"


@dataclass
class PredictionResult:
    phase: SessionPhase
    posture_correct: bool
    finger_errors: dict[str, float]
    active_finger: Optional[str]
    predicted_key: Optional[str]
    confidence: float
    key_press_detected: bool
    latency_ms: float
    fps: float
    calibration_time_remaining: float = 0.0


@dataclass
class _SessionState:
    calibration: Optional[CalibrationReference] = None
    calibration_streak: int = 0
    phase: SessionPhase = SessionPhase.WAITING_FOR_CALIBRATION
    feature_buffer: deque = field(default_factory=lambda: deque(maxlen=SEQUENCE_LEN))
    active_finger: Optional[Finger] = None
    last_prediction_bucket: int = 0
    calibration_start_time: Optional[float] = None
    out_of_posture_frames: int = 0
    frame_times: deque = field(default_factory=lambda: deque(maxlen=60))


class PredictionService:
    def __init__(self, model_checkpoint: Optional[str] = None, device: str = "auto"):
        self.device = torch.device(
            "cuda" if (device == "auto" and torch.cuda.is_available()) else
            ("cpu" if device == "auto" else device)
        )
        self.tracker = HandTracker()
        self.model: Optional[KeyPredictor] = None
        self._load_model(model_checkpoint)
        self._session = _SessionState()

    def _load_model(self, checkpoint: Optional[str]) -> None:
        path = Path(checkpoint) if checkpoint else Path(__file__).resolve().parents[2] / "ai" / "models" / "checkpoints" / "key_predictor.pt"
        if path.exists():
            self.model = KeyPredictor(feature_dim=F_DIM).to(self.device)
            state = torch.load(path, map_location=self.device)
            self.model.load_state_dict(state["model_state_dict"])
            self.model.eval()
        else:
            self.model = None  # geometric fallback will be used

    def reset_calibration(self) -> None:
        self._session = _SessionState()

    def process_frame(self, frame_bgr: np.ndarray) -> PredictionResult:
        t0 = time.perf_counter()
        frame_state = self.tracker.process(frame_bgr)
        sess = self._session

        now = time.time()
        sess.frame_times.append(now)
        fps = self._compute_fps(sess.frame_times)

        if sess.phase == SessionPhase.WAITING_FOR_CALIBRATION:
            return self._handle_calibration_phase(frame_state, fps, t0)

        errors = calibration_error(frame_state, sess.calibration) if sess.calibration else {}
        posture_ok = sess.calibration is not None and is_posture_correct(frame_state, sess.calibration, tolerance=0.1)

        active = most_active_finger(frame_state)
        predicted_key, confidence, pressed = None, 0.0, False

        posture_ok = is_posture_correct(frame_state, sess.calibration, tolerance=0.08)
        if not posture_ok:
            sess.out_of_posture_frames += 1
            if sess.out_of_posture_frames > 15: # ~1 second out of posture
                print("Posture lost, recalibrating...")
                sess.phase = SessionPhase.WAITING_FOR_CALIBRATION
                sess.calibration = None
                sess.calibration_start_time = None
                sess.out_of_posture_frames = 0
                return self._handle_calibration_phase(frame_state, fps, t0)
        else:
            sess.out_of_posture_frames = 0

        if active is not None:
            # For geometric prediction, we don't rely solely on displacement.
            # If the finger is pressing (velocity heuristic), we trigger a prediction.
            pressed = self._detect_press(frame_state, active)
            if pressed:
                sess.phase = SessionPhase.PREDICTING
                sess.active_finger = active
                predicted_key, confidence = self._predict_key(frame_state, sess, active)
                
                sess.phase = SessionPhase.CALIBRATED
                sess.feature_buffer.clear()
                if predicted_key and predicted_key in KEYBOARD:
                    sess.last_prediction_bucket = KEYBOARD[predicted_key].row
            else:
                sess.phase = SessionPhase.CALIBRATED
                sess.active_finger = None

        latency_ms = (time.perf_counter() - t0) * 1000.0
        return PredictionResult(
            phase=sess.phase,
            posture_correct=posture_ok,
            finger_errors={f.value: e for f, e in errors.items()} if errors else {},
            active_finger=sess.active_finger.value if sess.active_finger else None,
            predicted_key=predicted_key,
            confidence=confidence,
            key_press_detected=bool(pressed),
            latency_ms=latency_ms,
            fps=fps,
            calibration_time_remaining=0.0
        )

    # -- internals ---------------------------------------------------------

    def _handle_calibration_phase(self, frame_state: FrameHandState, fps: float, t0: float) -> PredictionResult:
        sess = self._session
        candidate = build_calibration(frame_state)
        posture_ok = False
        time_remaining = 0.0

        if candidate is not None:
            if sess.calibration_start_time is None:
                # Start the countdown
                sess.calibration_start_time = time.perf_counter()
                sess.calibration = candidate
            
            # During the 5-second window, we continually update the calibration 
            # to their *current* posture, so they can get comfortable.
            sess.calibration = candidate
            posture_ok = True  # We assume it's OK during the warm-up
            
            elapsed = time.perf_counter() - sess.calibration_start_time
            time_remaining = max(0.0, CALIBRATION_HOLD_SECONDS - elapsed)
            if elapsed >= CALIBRATION_HOLD_SECONDS:
                # Lock it in
                sess.phase = SessionPhase.CALIBRATED
        else:
            # If they drop their hands during countdown, reset
            sess.calibration_start_time = None
            sess.calibration = None
            time_remaining = CALIBRATION_HOLD_SECONDS

        errors = calibration_error(frame_state, sess.calibration) if sess.calibration else {}
        latency_ms = (time.perf_counter() - t0) * 1000.0
        return PredictionResult(
            phase=sess.phase,
            posture_correct=posture_ok,
            finger_errors={f.value: e for f, e in errors.items()},
            active_finger=None,
            predicted_key=None,
            confidence=0.0,
            key_press_detected=False,
            latency_ms=latency_ms,
            fps=fps,
            calibration_time_remaining=time_remaining
        )

    def _predict_key(self, frame_state: FrameHandState, sess: _SessionState, active: Finger) -> tuple[Optional[str], float]:
        feat = extract_features(frame_state, sess.calibration, active, sess.last_prediction_bucket)
        sess.feature_buffer.append(feat)

        reachable = all_keys_for_finger(active)
        if not reachable:
            return None, 0.0

        if self.model is not None and len(sess.feature_buffer) >= 1:
            return self._predict_neural(sess, active, reachable)
        return self._predict_geometric(frame_state, sess.calibration, active, reachable)

    def _predict_geometric(self, frame_state: FrameHandState, calibration: CalibrationReference,
                            active: Finger, reachable: list[str]) -> tuple[Optional[str], float]:
        """Deterministic fallback: project the finger's displacement onto the
        four cardinal directions relative to its home key and walk the
        keyboard-graph neighbor in that direction, per the MOVEMENT LOGIC spec."""
        hand_state = frame_state.hands.get(active.hand)
        if hand_state is None or active not in hand_state.fingers:
            return None, 0.0
        fstate = hand_state.fingers[active]
        tip = fstate.tip_xyz
        wrist = hand_state.landmarks[0]
        home_tip = calibration.finger_home_xyz.get(active)
        home_wrist = calibration.wrist_home_xyz.get(active.hand)
        if home_tip is None or home_wrist is None:
            return None, 0.0

        # Calculate drift-invariant home by shifting the home tip by the wrist drift
        drift = wrist - home_wrist
        expected_home_tip = home_tip + drift

        dx, dy = tip[0] - expected_home_tip[0], tip[1] - expected_home_tip[1]
        magnitude = math.hypot(dx, dy)
        home_key = HOME_ROW_KEYS.get(active)
        
        # Enforce double-thumb space press
        if active in (Finger.LEFT_THUMB, Finger.RIGHT_THUMB):
            other = Finger.RIGHT_THUMB if active == Finger.LEFT_THUMB else Finger.LEFT_THUMB
            other_hand = frame_state.hands.get(other.hand)
            if other_hand and other in other_hand.fingers and other_hand.fingers[other].is_pressing:
                return "SPACE", 1.0
            return None, 0.0
        
        # If the displacement from home row is small, they are just pressing the home key.
        # We use a larger threshold (0.075) so they have to deliberately slide their finger 
        # further to hit top/bottom rows.
        if magnitude < 0.075:
            print(f"[{active.value}] magnitude {magnitude:.4f} < 0.075 -> HOME KEY {home_key}")
            return home_key, 1.0

        # For keys that only have up/down neighbors, relying on dy is much more robust than angles.
        direction = None
        
        # Lateral movement check (only F and J have lateral neighbors)
        is_lateral_finger = active in (Finger.LEFT_INDEX, Finger.RIGHT_INDEX)
        
        if is_lateral_finger and dx > 0.06 and active == Finger.LEFT_INDEX:
            if dy < -0.04: direction = "right_up"
            elif dy > 0.04: direction = "right_down"
            else: direction = "right"
        elif is_lateral_finger and dx < -0.06 and active == Finger.RIGHT_INDEX:
            if dy < -0.04: direction = "left_up"
            else: direction = "left"
        else:
            # Strictly vertical check
            if dy < -0.05: direction = "up"
            elif dy > 0.05: direction = "down"

        if home_key is None or home_key not in KEYBOARD:
            return None, 0.0

        key = KEYBOARD[home_key]
        target_label = key.neighbors.get(direction, home_key)
        confidence = float(min(magnitude / 0.12, 1.0)) * 0.75  # geometric confidence is intentionally capped
        
        print(f"[{active.value}] dx: {dx:.4f}, dy: {dy:.4f}, mag: {magnitude:.4f}, dir: {direction}, target: {target_label}")
        return target_label, confidence
    def _predict_neural(self, sess: _SessionState, active: Finger, reachable: list[str]) -> tuple[str, float]:
        seq = list(sess.feature_buffer)
        while len(seq) < SEQUENCE_LEN:
            seq.insert(0, seq[0])
        tensor = torch.tensor(np.stack(seq), dtype=torch.float32, device=self.device).unsqueeze(0)
        mask = key_mask_for_finger(reachable, self.device).unsqueeze(0)
        proba = self.model.predict_proba(tensor, mask).squeeze(0)
        idx = int(torch.argmax(proba).item())
        return IDX_TO_KEY[idx], float(proba[idx].item())

    def _detect_press(self, frame_state: FrameHandState, active_finger: Finger) -> bool:
        sess = self._session
        sess.feature_buffer.append(frame_state)
        # Always use the heuristic for air-typing since the camera angle is out-of-distribution for the GRU model
        hand_state = frame_state.hands.get(active_finger.hand)
        if hand_state and active_finger in hand_state.fingers:
            fstate = hand_state.fingers[active_finger]
            print(f"Finger {active_finger.value} active. is_pressing: {fstate.is_pressing}, velocity: {fstate.velocity}")
            return fstate.is_pressing
        return False

    @staticmethod
    def _compute_fps(frame_times: deque) -> float:
        if len(frame_times) < 2:
            return 0.0
        span = frame_times[-1] - frame_times[0]
        return (len(frame_times) - 1) / span if span > 0 else 0.0
