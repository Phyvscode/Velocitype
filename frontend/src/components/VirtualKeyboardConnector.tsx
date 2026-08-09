import { useEffect, useRef, useState } from 'react';

interface Props {
  onKeyDetected?: (key: string) => void;
  isActive?: boolean;
}

export default function VirtualKeyboardConnector({ onKeyDetected, isActive = true }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [predictedKey, setPredictedKey] = useState<string | null>(null);
  const [isPostureCorrect, setIsPostureCorrect] = useState<boolean>(false);
  const [phase, setPhase] = useState<string>('waiting_for_calibration');
  const [lastResult, setLastResult] = useState<any>(null);
  
  useEffect(() => {
    if (!isActive) return;

    let isRunning = true;
    let stream: MediaStream | null = null;

    const start = async () => {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (!isRunning) {
          newStream.getTracks().forEach(t => t.stop());
          return;
        }
        stream = newStream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const wsUrl = import.meta.env.VITE_AI_WS_URL || 'ws://localhost:8765';
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setStatus('Connected to AI engine');
          // Start capturing frames
          captureFrame();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastResult(data);
            setIsPostureCorrect(!!data.posture_correct);
            if (data.phase) setPhase(data.phase);
            if (data.key_press_detected && data.predicted_key) {
              setPredictedKey(data.predicted_key);
              if (onKeyDetected) onKeyDetected(data.predicted_key);
              
              let k = data.predicted_key;
              let keyVal = k;
              let codeVal = '';
              if (k === 'SPACE') {
                keyVal = ' ';
                codeVal = 'Space';
              } else if (k === 'backspace' || k === 'BACKSPACE') {
                keyVal = 'Backspace';
                codeVal = 'Backspace';
              } else {
                keyVal = k.toLowerCase();
                codeVal = 'Key' + k.toUpperCase();
              }
              
              const target = document.activeElement || document.body;
              const downEvent = new KeyboardEvent('keydown', { key: keyVal, code: codeVal, bubbles: true });
              target.dispatchEvent(downEvent);
              
              if (document.activeElement && 
                 (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
                 const el = document.activeElement as HTMLInputElement;
                 if (keyVal === 'Backspace') {
                   el.value = el.value.slice(0, -1);
                 } else if (keyVal.length === 1) {
                   el.value = el.value + keyVal;
                 }
                 el.dispatchEvent(new Event('input', { bubbles: true }));
                 el.dispatchEvent(new Event('change', { bubbles: true }));
              }
              
              setTimeout(() => {
                const upEvent = new KeyboardEvent('keyup', { key: keyVal, code: codeVal, bubbles: true });
                target.dispatchEvent(upEvent);
                setPredictedKey(null);
              }, 150);
            }
          } catch (e) {
            console.error('Invalid WS message', e);
          }
        };

        ws.onclose = () => {
          setStatus('Disconnected from AI engine');
        };

        ws.onerror = () => {
          setStatus('Connection error. Is the AI server running?');
        };

        const captureFrame = () => {
          if (!isRunning || ws.readyState !== WebSocket.OPEN) return;

          if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0, 640, 480);
              // Convert to base64 jpeg
              const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.5);
              ws.send(dataUrl);
            }
          }

          // Target ~15 FPS
          setTimeout(captureFrame, 1000 / 15);
        };

      } catch (err) {
        console.error(err);
        setStatus('Failed to access webcam.');
      }
    };

    start();

    return () => {
      isRunning = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isActive, onKeyDetected]);

  if (!isActive) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl z-50 flex flex-col items-center gap-2">
      <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex justify-between w-full">
        <span>AI Vision Keyboard</span>
        <span className={status.includes('Connected') ? 'text-emerald-400' : 'text-rose-400'}>&bull;</span>
      </div>
      <div className={`relative w-[280px] h-[210px] rounded overflow-hidden bg-black border-2 transition-colors ${status.includes('Connected') ? (isPostureCorrect ? 'border-emerald-500' : 'border-rose-500') : 'border-slate-800'}`}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover transform -scale-x-100"
        />
        <canvas ref={canvasRef} width={640} height={480} className="hidden" />
        
        {predictedKey && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-4xl font-display text-[var(--hot)] drop-shadow-md">{predictedKey}</span>
          </div>
        )}
        {phase === 'waiting_for_calibration' && !predictedKey && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-2 text-center">
            <span className="text-[12px] font-mono text-white leading-tight mb-2">Hold steady to calibrate</span>
            {typeof (lastResult as any)?.calibration_time_remaining === 'number' && (lastResult as any).calibration_time_remaining > 0 && (
              <span className="text-3xl font-display text-emerald-400 drop-shadow-md">
                {((lastResult as any).calibration_time_remaining).toFixed(1)}s
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="text-[10px] font-mono text-slate-500 w-full text-center truncate">
        {status}
      </div>
    </div>
  );
}
