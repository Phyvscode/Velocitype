import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks.python.vision.hand_landmarker import HandLandmarker, HandLandmarkerOptions
from mediapipe.tasks.python.core.base_options import BaseOptions
import urllib.request

options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path='ai/hand_landmarker.task'),
    running_mode=mp.tasks.vision.RunningMode.IMAGE,
    num_hands=2,
    min_hand_detection_confidence=0.1,
    min_hand_presence_confidence=0.1,
    min_tracking_confidence=0.1
)
hands = HandLandmarker.create_from_options(options)

# Download a sample hand image
url = "https://raw.githubusercontent.com/google/mediapipe/master/docs/images/mobile/hand_tracking_3d_android_gpu.gif"
# wait, better to just use cv2 to create a dummy hand? No, we need a real hand.
url = "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Open_hand.jpg/640px-Open_hand.jpg"
req = urllib.request.urlopen(url)
arr = np.asarray(bytearray(req.read()), dtype=np.uint8)
img = cv2.imdecode(arr, -1)
rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
results = hands.detect(mp_image)

print("Hand landmarks detected:", len(results.hand_landmarks) if results.hand_landmarks else 0)
if results.hand_landmarks:
    for h in results.handedness:
        print("Handedness:", h[0].category_name)
