# Dataset directory

This directory holds per-user, per-session training data collected by the
self-learning loop (see `ai/services/dataset_writer.py`).

Structure, per the project spec:

```
dataset/
    <user_id>/
        <session_id>/
            webcam.mp4         # raw session video (optional, not written by
                                # this repo's backend by default — add a
                                # recorder in backend/app/services if you
                                # want raw video retained)
            landmarks.json      # every tracked frame's 21-point hand landmarks
            keypress.csv         # one row per completed, compared keypress
            metadata.json         # session summary (accuracy, WPM, etc.)
            trajectories.jsonl     # feature-vector windows behind each keypress,
                                    # consumed directly by ai/training/train.py
```

`user001/session001/` is checked in as an empty-session example so the
directory shape is visible; the generated data files themselves
(`landmarks.json`, `keypress.csv`, `trajectories.jsonl`, `webcam.mp4`) are
gitignored since they're per-user runtime output, not source code.

A new session directory (and its `metadata.json`) is created automatically
the moment a client connects to `/ws/predict` — see
`backend/app/services/session_manager.py`.
