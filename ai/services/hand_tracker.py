"""
MediaPipe-based hand tracking service.

Wraps mediapipe.solutions.hands to produce, per frame, a structured
FrameHandState for each detected hand: 21 landmarks, per-finger tip
position, velocity, acceleration, angle, and palm rotation. Consumes a
rolling buffer of previous frames so velocity/acceleration can be derived
without any external filtering library.
"""

from __future__ import annotations

import time
from collections import deque
from dataclasses import dataclass, field
from typing import Deque, Optional

import numpy as np

# The legacy `mediapipe.solutions.hands` API (used here) shipped through
# mediapipe 0.10.x and is what this module targets — see backend/requirements.txt
# which pins mediapipe==0.10.14. mediapipe >=0.10.18 removed the legacy
# `solutions` package in favor of the newer Tasks API (`mediapipe.tasks`),
# so this import is deliberately defensive: it works with the pinned
# version and fails with a clear, actionable message on newer/older
# installs instead of a confusing AttributeError deep in this module.
import mediapipe as mp
BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "config"))
from keyboard_layout import Finger, FINGERTIP_LANDMARK, FINGER_MCP_LANDMARK, Hand  # noqa: E402

FINGER_ORDER: dict[Hand, list[Finger]] = {
    Hand.LEFT: [Finger.LEFT_PINKY, Finger.LEFT_RING, Finger.LEFT_MIDDLE, Finger.LEFT_INDEX, Finger.LEFT_THUMB],
    Hand.RIGHT: [Finger.RIGHT_THUMB, Finger.RIGHT_INDEX, Finger.RIGHT_MIDDLE, Finger.RIGHT_RING, Finger.RIGHT_PINKY],
}


@dataclass
class FingerState:
    finger: Finger
    tip_xyz: np.ndarray            # (3,) normalized image coords + relative z
    mcp_xyz: np.ndarray            # (3,) base joint, used for angle calc
    velocity: np.ndarray = field(default_factory=lambda: np.zeros(3))
    acceleration: np.ndarray = field(default_factory=lambda: np.zeros(3))
    angle_deg: float = 0.0         # angle of fingertip->mcp vector vs vertical
    curl_ratio: float = 1.0        # ratio of tip-mcp distance to normal
    curl_velocity: float = 0.0
    is_pressing: bool = False      # true when the finger's z-velocity indicates a downward press


@dataclass
class HandState:
    hand: Hand
    landmarks: np.ndarray          # (21, 3)
    palm_rotation_deg: float
    fingers: dict[Finger, FingerState]
    timestamp: float


@dataclass
class FrameHandState:
    hands: dict[Hand, HandState]
    frame_index: int
    timestamp: float


class HandTracker:
    """Stateful tracker: call `process(frame_bgr)` once per webcam frame."""

    def __init__(self, history_len: int = 5, max_num_hands: int = 2,
                 min_detection_confidence: float = 0.3, min_tracking_confidence: float = 0.3):
        options = HandLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=os.path.join(os.path.dirname(__file__), '..', 'hand_landmarker.task')),
            running_mode=VisionRunningMode.IMAGE,
            num_hands=max_num_hands,
            min_hand_detection_confidence=min_detection_confidence,
            min_hand_presence_confidence=min_tracking_confidence,
            min_tracking_confidence=min_tracking_confidence
        )
        self._hands = HandLandmarker.create_from_options(options)
        self._history: Deque[FrameHandState] = deque(maxlen=history_len)
        self._frame_index = 0

    def close(self) -> None:
        pass

    def process(self, frame_bgr: np.ndarray) -> FrameHandState:
        # Debug: save the first 10 frames to disk to see what the AI is getting
        if self._frame_index < 10:
            import cv2
            import os
            debug_dir = os.path.expanduser('~/.gemini/antigravity-cli/brain/1e8409b9-6d2d-4364-afaf-b060b62e882d/scratch')
            os.makedirs(debug_dir, exist_ok=True)
            cv2.imwrite(os.path.join(debug_dir, f'debug_frame_{self._frame_index}.jpg'), frame_bgr)

        rgb = frame_bgr[:, :, ::-1]
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        results = self._hands.detect(mp_image)
        now = time.time()
        hands: dict[Hand, HandState] = {}

        if results.hand_landmarks and results.handedness:
            for hand_landmarks, handedness in zip(results.hand_landmarks, results.handedness):
                hand = Hand.LEFT if handedness[0].category_name == "Left" else Hand.RIGHT
                pts = np.array([[lm.x, lm.y, lm.z] for lm in hand_landmarks], dtype=np.float32)

                palm_rotation = self._compute_palm_rotation(pts)
                fingers = self._compute_finger_states(hand, pts, now)

                hands[hand] = HandState(
                    hand=hand,
                    landmarks=pts,
                    palm_rotation_deg=palm_rotation,
                    fingers=fingers,
                    timestamp=now,
                )

        state = FrameHandState(hands=hands, frame_index=self._frame_index, timestamp=now)
        self._history.append(state)
        self._frame_index += 1
        return state

    # -- internals ---------------------------------------------------------

    def _compute_palm_rotation(self, pts: np.ndarray) -> float:
        wrist = pts[0]
        middle_mcp = pts[9]
        vec = middle_mcp - wrist
        return float(np.degrees(np.arctan2(vec[0], -vec[1])))

    def _compute_finger_states(self, hand: Hand, pts: np.ndarray, now: float) -> dict[Finger, FingerState]:
        prev_state = self._find_prev_hand_state(hand)
        out: dict[Finger, FingerState] = {}

        for finger in FINGER_ORDER[hand]:
            tip_idx = FINGERTIP_LANDMARK[finger]
            mcp_idx = FINGER_MCP_LANDMARK[finger]
            tip = pts[tip_idx]
            mcp = pts[mcp_idx]

            vec = tip - mcp
            angle = float(np.degrees(np.arctan2(vec[0], -vec[1])))

            velocity = np.zeros(3, dtype=np.float32)
            acceleration = np.zeros(3, dtype=np.float32)
            is_pressing = False

            if prev_state is not None and finger in prev_state.fingers:
                prev = prev_state.fingers[finger]
                dt = max(now - prev_state.timestamp, 1e-4)
                velocity = (tip - prev.tip_xyz) / dt
                acceleration = (velocity - prev.velocity) / dt
                # A press is a sharp increase in "downward" (+y in image space)
                # and "toward camera" (+z, MediaPipe z is negative = closer)
                # velocity that decelerates quickly - i.e. a tap, not a drift.
                
                # Air-typing heuristic: if the finger curls inward, the distance between tip and mcp decreases.
                curl = float(np.linalg.norm(tip[:2] - mcp[:2]))
                prev_curl = float(np.linalg.norm(prev.tip_xyz[:2] - prev.mcp_xyz[:2]))
                curl_velocity = (curl - prev_curl) / dt
                
                # Flat surface heuristic: A tap is when the finger WAS moving down (or curling), 
                # but has now suddenly stopped (hit the desk).
                hit_desk_y = (prev.velocity[1] > 0.35) and (velocity[1] < 0.2)
                hit_desk_curl = (prev.curl_velocity < -0.35) and (curl_velocity > -0.1)
                
                is_pressing_np = hit_desk_y or hit_desk_curl
                is_pressing = bool(is_pressing_np)
            else:
                curl_velocity = 0.0

            out[finger] = FingerState(
                finger=finger,
                tip_xyz=tip,
                mcp_xyz=mcp,
                velocity=velocity,
                acceleration=acceleration,
                angle_deg=angle,
                curl_ratio=1.0,
                curl_velocity=curl_velocity,
                is_pressing=is_pressing,
            )
        return out

    def _find_prev_hand_state(self, hand: Hand) -> Optional[HandState]:
        if not self._history:
            return None
        last = self._history[-1]
        return last.hands.get(hand)
