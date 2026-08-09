import asyncio
import json
import os
import base64
import numpy as np
import cv2
import websockets
from ai.services.prediction_service import PredictionService

async def handle_connection(websocket):
    print("Client connected to Virtual Keyboard AI")
    service = PredictionService()

    try:
        async for message in websocket:
            # We expect the frontend to send base64 encoded JPEG frames
            try:
                if isinstance(message, str):
                    if message.startswith('data:image/jpeg;base64,'):
                        message = message.split(',')[1]
                    img_data = base64.b64decode(message)
                else:
                    img_data = message

                nparr = np.frombuffer(img_data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if frame is not None:
                    result = service.process_frame(frame)
                    
                    response = {
                        "phase": result.phase.value,
                        "posture_correct": result.posture_correct,
                        "finger_errors": result.finger_errors,
                        "active_finger": result.active_finger,
                        "predicted_key": result.predicted_key,
                        "confidence": result.confidence,
                        "key_press_detected": result.key_press_detected,
                        "latency_ms": result.latency_ms,
                        "fps": result.fps
                    }
                    await websocket.send(json.dumps(response))
            except Exception as e:
                print(f"Error processing frame: {e}")
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")

async def main():
    port = int(os.environ.get("PORT", 8765))
    print(f"Starting Virtual Keyboard AI WebSocket server on ws://0.0.0.0:{port}")
    async with websockets.serve(handle_connection, "0.0.0.0", port):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
