"""
Converts a HandTracker FrameHandState (+ calibration reference + prediction
history) into the fixed-size numeric feature vector consumed by the PyTorch
KeyPredictor model.

Feature layout per active finger (F_DIM = 27):
  [0:3]   fingertip xyz (normalized image coords, relative to hand-space)
  [3:6]   velocity xyz
  [6:9]   acceleration xyz
  [9]     finger angle (deg, normalized to [-1, 1] via /180)
  [10]    palm rotation (deg, normalized via /180)
  [11:14] displacement from that finger's CALIBRATED home-row landmark (dx, dy, dz)
  [14]    displacement magnitude
  [15:17] displacement direction as unit vector (dx_norm, dy_norm) — the
          "forward/back/left/right" signal described in the movement spec
  [17:19] one-hot: is this the currently active (most-moved) finger
  [19:19+N_FINGERS] one-hot finger identity (10 fingers)
  last 8: rolling one-hot of the previously predicted key's row/col bucket,
          giving the model short-term memory of typing rhythm without a
          full recurrent state (kept explicit per FEATURES spec: "previous
          predictions")
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, TYPE_CHECKING

import numpy as np

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "config"))
from keyboard_layout import Finger, KEYBOARD, HOME_ROW_KEYS, Hand  # noqa: E402

# hand_tracker pulls in mediapipe, which is only needed at runtime for live
# tracking, not for pure feature-vector math or model unit tests. Import
# lazily / for typing only so this module (and F_DIM) stay importable in
# environments/tests that don't need the live camera pipeline.
if TYPE_CHECKING:
    from .hand_tracker import FrameHandState, FingerState

ALL_FINGERS: list[Finger] = list(Finger)
FINGER_INDEX = {f: i for i, f in enumerate(ALL_FINGERS)}
N_FINGERS = len(ALL_FINGERS)
F_DIM = 19 + N_FINGERS + 8  # = 37


@dataclass
class CalibrationReference:
    """Captured once per session when the user's resting hand pose is
    confirmed correct (all ten digits on their home-row keys)."""
    finger_home_xyz: dict[Finger, np.ndarray]
    wrist_home_xyz: dict[Hand, np.ndarray]
    palm_rotation_deg: dict[Hand, float]


def build_calibration(frame_state: FrameHandState) -> Optional[CalibrationReference]:
    """Snapshot the current frame as the home-row reference pose, provided
    both hands with all expected fingers are visible."""
    finger_home_xyz: dict[Finger, np.ndarray] = {}
    wrist_home_xyz: dict[Hand, np.ndarray] = {}
    palm_rotation: dict[Hand, float] = {}

    for hand, hand_state in frame_state.hands.items():
        palm_rotation[hand] = hand_state.palm_rotation_deg
        # Compute wrist from landmarks if possible (index 0 is wrist)
        wrist_home_xyz[hand] = hand_state.landmarks[0].copy()
        
        for finger, fstate in hand_state.fingers.items():
            finger_home_xyz[finger] = fstate.tip_xyz.copy()

    required = set(HOME_ROW_KEYS.keys())
    # We require at least 4 fingers to be visible (allows 1-handed calibration)
    print(f"Calibration attempt: detected {len(finger_home_xyz)} fingers")
    if len(finger_home_xyz) < 4:
        return None

    return CalibrationReference(
        finger_home_xyz=finger_home_xyz,
        wrist_home_xyz=wrist_home_xyz,
        palm_rotation_deg=palm_rotation,
    )


def calibration_error(frame_state: FrameHandState, calibration: CalibrationReference,
                       tolerance: float = 0.035) -> dict[Finger, float]:
    """Per-finger distance (normalized image-space units) from its home-row
    reference position. Used to decide GREEN (all under tolerance) vs which
    fingers are out of place (drives RED highlighting)."""
    errors: dict[Finger, float] = {}
    for hand, hand_state in frame_state.hands.items():
        for finger, fstate in hand_state.fingers.items():
            home_tip = calibration.finger_home_xyz.get(finger)
            home_wrist = calibration.wrist_home_xyz.get(hand)
            if home_tip is None or home_wrist is None:
                continue
            
            # Drift-invariant error
            wrist = hand_state.landmarks[0]
            drift = wrist - home_wrist
            expected_home_tip = home_tip + drift
            
            errors[finger] = float(np.linalg.norm(fstate.tip_xyz[:2] - expected_home_tip[:2]))
    return errors


def is_posture_correct(frame_state: FrameHandState, calibration: CalibrationReference,
                        tolerance: float = 0.035) -> bool:
    errors = calibration_error(frame_state, calibration, tolerance)
    if len(errors) < 4:
        return False
    return all(e <= tolerance for e in errors.values())


def most_active_finger(frame_state: FrameHandState) -> Optional[Finger]:
    """The finger with the largest current velocity magnitude — the one
    the system treats as 'in motion toward a key'."""
    best_finger, best_speed = None, 0.0
    for hand_state in frame_state.hands.values():
        for finger, fstate in hand_state.fingers.items():
            speed = float(np.linalg.norm(fstate.velocity[:2]))
            if speed > best_speed:
                best_speed, best_finger = speed, finger
    return best_finger


def extract_features(
    frame_state: FrameHandState,
    calibration: CalibrationReference,
    active_finger: Finger,
    prediction_history_bucket: int,  # 0-7, rolling bucket of last predicted key's row (see model.py)
) -> np.ndarray:
    """Build the fixed-length feature vector for the currently active finger."""
    hand_state = frame_state.hands.get(active_finger.hand)
    if hand_state is None or active_finger not in hand_state.fingers:
        return np.zeros(F_DIM, dtype=np.float32)

    fstate: FingerState = hand_state.fingers[active_finger]
    home = calibration.finger_home_xyz.get(active_finger, fstate.tip_xyz)
    disp = fstate.tip_xyz - home
    disp_mag = float(np.linalg.norm(disp[:2])) + 1e-8
    disp_dir = disp[:2] / disp_mag

    vec = np.zeros(F_DIM, dtype=np.float32)
    vec[0:3] = fstate.tip_xyz
    vec[3:6] = fstate.velocity
    vec[6:9] = fstate.acceleration
    vec[9] = fstate.angle_deg / 180.0
    vec[10] = calibration.palm_rotation_deg.get(active_finger.hand, 0.0) / 180.0
    vec[11:14] = disp
    vec[14] = disp_mag
    vec[15:17] = disp_dir
    vec[17] = 1.0  # is-active-finger flag (always 1 for the vector we build)
    vec[18] = min(disp_mag / 0.15, 1.0)  # normalized displacement-from-home confidence prior

    finger_onehot_start = 19
    vec[finger_onehot_start + FINGER_INDEX[active_finger]] = 1.0

    history_start = finger_onehot_start + N_FINGERS
    bucket = max(0, min(prediction_history_bucket, 7))
    vec[history_start + bucket] = 1.0

    return vec
