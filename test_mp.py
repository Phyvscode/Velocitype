import os
os.environ["GLOG_minloglevel"] = "0"
os.environ["GLOG_v"] = "2"
import mediapipe as mp
with open(os.path.join("ai", "hand_landmarker.task"), "rb") as f:
    model_bytes = f.read()

options = mp.tasks.vision.HandLandmarkerOptions(
    base_options=mp.tasks.BaseOptions(model_asset_buffer=model_bytes),
    running_mode=mp.tasks.vision.RunningMode.IMAGE,
    num_hands=2)
print("Creating")
landmarker = mp.tasks.vision.HandLandmarker.create_from_options(options)
print("Success")
