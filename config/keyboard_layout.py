from enum import Enum
from typing import Dict, List, Optional
from dataclasses import dataclass

class Hand(Enum):
    LEFT = "left"
    RIGHT = "right"

class Finger(Enum):
    LEFT_PINKY = "left_pinky"
    LEFT_RING = "left_ring"
    LEFT_MIDDLE = "left_middle"
    LEFT_INDEX = "left_index"
    LEFT_THUMB = "left_thumb"
    RIGHT_THUMB = "right_thumb"
    RIGHT_INDEX = "right_index"
    RIGHT_MIDDLE = "right_middle"
    RIGHT_RING = "right_ring"
    RIGHT_PINKY = "right_pinky"

    @property
    def hand(self) -> Hand:
        if "left" in self.value:
            return Hand.LEFT
        return Hand.RIGHT

# MediaPipe Hand Landmarks
FINGERTIP_LANDMARK: Dict[Finger, int] = {
    Finger.LEFT_THUMB: 4,
    Finger.LEFT_INDEX: 8,
    Finger.LEFT_MIDDLE: 12,
    Finger.LEFT_RING: 16,
    Finger.LEFT_PINKY: 20,
    Finger.RIGHT_THUMB: 4,
    Finger.RIGHT_INDEX: 8,
    Finger.RIGHT_MIDDLE: 12,
    Finger.RIGHT_RING: 16,
    Finger.RIGHT_PINKY: 20,
}

FINGER_MCP_LANDMARK: Dict[Finger, int] = {
    Finger.LEFT_THUMB: 2,
    Finger.LEFT_INDEX: 5,
    Finger.LEFT_MIDDLE: 9,
    Finger.LEFT_RING: 13,
    Finger.LEFT_PINKY: 17,
    Finger.RIGHT_THUMB: 2,
    Finger.RIGHT_INDEX: 5,
    Finger.RIGHT_MIDDLE: 9,
    Finger.RIGHT_RING: 13,
    Finger.RIGHT_PINKY: 17,
}

HOME_ROW_KEYS: Dict[Finger, str] = {
    Finger.LEFT_PINKY: "A",
    Finger.LEFT_RING: "S",
    Finger.LEFT_MIDDLE: "D",
    Finger.LEFT_INDEX: "F",
    Finger.LEFT_THUMB: "SPACE",
    Finger.RIGHT_THUMB: "SPACE",
    Finger.RIGHT_INDEX: "J",
    Finger.RIGHT_MIDDLE: "K",
    Finger.RIGHT_RING: "L",
    Finger.RIGHT_PINKY: ";",
}

@dataclass
class KeyNode:
    key: str
    neighbors: Dict[str, str] # direction ("up", "down", "left", "right") -> key
    row: int # 0=top, 1=home, 2=bottom, 3=thumb

# Geometric fallback graph
# This dictates what key is hit if a finger moves from home in a certain direction
KEYBOARD: Dict[str, KeyNode] = {
    "A": KeyNode("A", {"up": "Q", "down": "Z"}, 1),
    "S": KeyNode("S", {"up": "W", "down": "X"}, 1),
    "D": KeyNode("D", {"up": "E", "down": "C"}, 1),
    "F": KeyNode("F", {"up": "R", "down": "V", "right": "G", "right_up": "T", "right_down": "B"}, 1),
    "J": KeyNode("J", {"up": "U", "down": "N", "left": "H", "left_up": "Y"}, 1),
    "K": KeyNode("K", {"up": "I", "down": "M"}, 1),
    "L": KeyNode("L", {"up": "O", "down": ","}, 1),
    ";": KeyNode(";", {"up": "P", "down": "."}, 1),
    "SPACE": KeyNode("SPACE", {}, 3),
}

def all_keys_for_finger(finger: Finger) -> List[str]:
    # All keys a specific finger is responsible for reaching in standard touch typing
    mapping = {
        Finger.LEFT_PINKY: ["A", "Q", "Z"],
        Finger.LEFT_RING: ["S", "W", "X"],
        Finger.LEFT_MIDDLE: ["D", "E", "C"],
        Finger.LEFT_INDEX: ["F", "R", "V", "G", "T", "B"],
        Finger.LEFT_THUMB: ["SPACE"],
        Finger.RIGHT_THUMB: ["SPACE"],
        Finger.RIGHT_INDEX: ["J", "U", "N", "H", "Y"],
        Finger.RIGHT_MIDDLE: ["K", "I", "M"],
        Finger.RIGHT_RING: ["L", "O", ","],
        Finger.RIGHT_PINKY: [";", "P", "."],
    }
    return mapping.get(finger, [])
