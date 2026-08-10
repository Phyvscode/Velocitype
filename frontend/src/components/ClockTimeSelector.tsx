import React, { useEffect, useRef, useState } from 'react';
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

interface Props {
  durationVal: number;
  setDurationInput: (val: string) => void;
}

const HOURS = [
  { label: '12', val: 30 },
  { label: '1', val: 40 },
  { label: '2', val: 50 },
  { label: '3', val: 60 },
  { label: '4', val: 120 },
  { label: '5', val: 180 },
  { label: '6', val: 240 },
  { label: '7', val: 300 },
  { label: '8', val: 360 },
  { label: '9', val: 420 },
  { label: '10', val: 480 },
  { label: '11', val: 600 },
];

export default function ClockTimeSelector({ durationVal, setDurationInput }: Props) {
  const topClockRef = useRef<HTMLDivElement>(null);
  const minuteHandRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  
  // Find initial angle based on durationVal
  const initialIndex = Math.max(0, HOURS.findIndex(h => h.val === durationVal));
  const [minuteAngle, setMinuteAngle] = useState(initialIndex * 30);
  const minuteAngleRef = useRef(initialIndex * 30);

  const applyAngle = (el: HTMLElement | null, angle: number) => {
    if (el) {
      el.style.transform = `translate(-50%,-100%) rotate(${angle}deg)`;
    }
  };

  useEffect(() => {
    applyAngle(minuteHandRef.current, minuteAngle);
  }, [minuteAngle]);

  const angleFromEvent = (clientX: number, clientY: number) => {
    if (!topClockRef.current) return 0;
    const rect = topClockRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    let deg = Math.atan2(dx, -dy) * 180 / Math.PI;
    if (deg < 0) deg += 360;
    return deg;
  };

  const handleStartDrag = (e: React.MouseEvent | React.TouchEvent) => {
    setDragging(true);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      const point = 'touches' in e ? e.touches[0] : (e as MouseEvent);
      const raw = angleFromEvent(point.clientX, point.clientY);
      let snapped = Math.round(raw / 30) * 30;
      if (snapped >= 360) snapped = 0;
      setMinuteAngle(snapped);
      minuteAngleRef.current = snapped;
      applyAngle(minuteHandRef.current, snapped);
    };

    const handleEnd = () => {
      if (dragging) {
        setDragging(false);
        const snapped = minuteAngleRef.current;
        const index = Math.round(snapped / 30) % 12;
        setDurationInput(String(HOURS[index].val));
      }
    };

    if (dragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [dragging, setDurationInput]);

  return (
    <div className="w-full flex flex-col items-center justify-center my-4 overflow-hidden pt-12 pb-4">
      <style>{`
        .hg-scene {
          position: relative;
          width: 300px;
          height: 300px;
          margin: 0 auto;
        }

        .hg-clock {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 260px;
          height: 260px;
          transform: translate(-50%,-50%);
        }

        .hg-face-content {
          position: absolute;
          inset: 0;
          border-radius: 50%;
        }

        .hg-ticks-container {
          position: absolute;
          inset: 0;
        }


        .hg-face {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #ffffff;
          border: 4px solid var(--hot);
          box-shadow: 0 0 40px 10px rgba(255, 255, 255, 0.15), 0 8px 20px rgba(0,0,0,.35);
        }

        .hg-tick-wrap {
          position: absolute;
          inset: 0;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .hg-tick {
          margin-top: 15px;
          font-family: monospace;
          font-weight: bold;
          font-size: 13px;
          color: #111;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hg-pivot {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--hot);
          transform: translate(-50%,-50%);
          z-index: 5;
        }

        .hg-minute-hand {
          position: absolute;
          left: 50%;
          top: 50%;
          transform-origin: 50% 100%;
          background: var(--hot);
          border-radius: 4px;
          z-index: 4;
          cursor: grab;
          width: 5px;
          height: 92px;
          transform: translate(-50%,-100%) rotate(0deg);
        }
        .hg-minute-hand.dragging { cursor: grabbing; }
      `}</style>

      <div className="hg-scene" style={{ viewTransitionName: 'hourglass-clock' }}>
        <div className="hg-clock" ref={topClockRef}>
          <div className="hg-face-content">
            <div className="hg-face"></div>
            <div className="hg-ticks-container">
              {HOURS.map((h, i) => (
                <div key={i} className="hg-tick-wrap" style={{ transform: `rotate(${i * 30}deg)` }}>
                  <div className="hg-tick" style={{ transform: `rotate(${-i * 30}deg)` }}>
                    {h.label}
                  </div>
                </div>
              ))}
            </div>
            <div
              className={cn("hg-minute-hand", dragging && "dragging")}
              ref={minuteHandRef}
              onMouseDown={handleStartDrag}
              onTouchStart={handleStartDrag}
            ></div>
            <div className="hg-pivot"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
