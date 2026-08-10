import React, { useEffect, useRef, useState } from 'react';
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

interface Props {
  durationVal: number;
  setDurationInput: (val: string) => void;
}

const HOURS = [
  { label: '30s', val: 30 },
  { label: '40s', val: 40 },
  { label: '50s', val: 50 },
  { label: '1m', val: 60 },
  { label: '2m', val: 120 },
  { label: '3m', val: 180 },
  { label: '4m', val: 240 },
  { label: '5m', val: 300 },
  { label: '6m', val: 360 },
  { label: '7m', val: 420 },
  { label: '8m', val: 480 },
  { label: '10m', val: 600 },
];

export default function ClockTimeSelector({ durationVal, setDurationInput }: Props) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const topClockRef = useRef<HTMLDivElement>(null);
  const minuteHandRef = useRef<HTMLDivElement>(null);
  const minuteHand2Ref = useRef<HTMLDivElement>(null);
  const curveLeftTop = useRef<SVGPathElement>(null);
  const curveLeftBottom = useRef<SVGPathElement>(null);
  const curveRightTop = useRef<SVGPathElement>(null);
  const curveRightBottom = useRef<SVGPathElement>(null);

  const [playing, setPlaying] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [dragging, setDragging] = useState(false);
  
  // Find initial angle based on durationVal
  const initialIndex = Math.max(0, HOURS.findIndex(h => h.val === durationVal));
  const [minuteAngle, setMinuteAngle] = useState(initialIndex * 30);
  
  const minuteAngleRef = useRef(initialIndex * 30);
  const playingRef = useRef(playing);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

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
    if (playingRef.current) return;
    setDragging(true);
    if (e.cancelable) {
      // e.preventDefault(); // removed to not break react completely, usually not needed here
    }
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

  useEffect(() => {
    // Setup curves geometry
    const cx = 230, cyCenter = 320, offset = 190, rx = 130;
    const topCy = cyCenter - offset;
    const bottomCy = cyCenter + offset;
    const waistGap = 9;

    const cLT = curveLeftTop.current;
    const cLB = curveLeftBottom.current;
    const cRT = curveRightTop.current;
    const cRB = curveRightBottom.current;

    if (cLT) cLT.setAttribute('d', `M ${cx - waistGap},${cyCenter} C ${cx - waistGap},${cyCenter - 45} ${cx - rx},${topCy + 95} ${cx - rx},${topCy}`);
    if (cLB) cLB.setAttribute('d', `M ${cx - waistGap},${cyCenter} C ${cx - waistGap},${cyCenter + 45} ${cx - rx},${bottomCy - 95} ${cx - rx},${bottomCy}`);
    if (cRT) cRT.setAttribute('d', `M ${cx + waistGap},${cyCenter} C ${cx + waistGap},${cyCenter - 45} ${cx + rx},${topCy + 95} ${cx + rx},${topCy}`);
    if (cRB) cRB.setAttribute('d', `M ${cx + waistGap},${cyCenter} C ${cx + waistGap},${cyCenter + 45} ${cx + rx},${bottomCy - 95} ${cx + rx},${bottomCy}`);

    [cLT, cLB, cRT, cRB].forEach(p => {
      if (p) {
        const len = p.getTotalLength();
        p.style.strokeDasharray = String(len);
        p.style.strokeDashoffset = String(len);
        p.style.transition = 'none';
      }
    });
  }, []);

  const drawCurves = () => {
    const curves = [curveLeftTop.current, curveLeftBottom.current, curveRightTop.current, curveRightBottom.current];
    curves.forEach(p => {
      if (p) {
        p.style.transition = 'stroke-dashoffset 700ms ease';
        p.style.strokeDashoffset = '0';
      }
    });
  };

  const hideCurves = () => {
    const curves = [curveLeftTop.current, curveLeftBottom.current, curveRightTop.current, curveRightBottom.current];
    curves.forEach(p => {
      if (p) {
        const len = p.getTotalLength();
        p.style.transition = 'stroke-dashoffset 450ms ease';
        p.style.strokeDashoffset = String(len);
      }
    });
  };

  const toggleAnimation = () => {
    if (!playing) {
      setPlaying(true);
      applyAngle(minuteHand2Ref.current, minuteAngle);
      setTimeout(() => {
        drawCurves();
        setTimeout(() => setStreaming(true), 700);
      }, 1050);
    } else {
      setPlaying(false);
      setStreaming(false);
      hideCurves();
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center my-4 overflow-hidden pt-12 pb-4">
      <style>{`
        .hg-scene {
          position: relative;
          width: 460px;
          max-width: 100%;
          height: 640px;
          max-height: 140vw;
          aspect-ratio: 460 / 640;
          transform: scale(0.65);
          margin: -140px 0 -100px 0;
        }
        @media (min-width: 640px) {
          .hg-scene { transform: scale(0.85); margin: -80px 0 -50px 0; }
        }

        .hg-clock {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 260px;
          height: 260px;
          transform: translate(-50%,-50%);
          transition: transform 1.1s cubic-bezier(.65,0,.35,1);
          will-change: transform;
        }

        .hg-face-content {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          transition: opacity .9s ease;
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

        .hg-sand {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          opacity: 0;
          transition: opacity .9s ease;
          background: radial-gradient(ellipse at 36% 30%, var(--hot), #eef0f4 55%, #ccd0d8 100%);
          box-shadow: 0 0 40px 10px rgba(255,255,255,.1);
        }

        .hg-scene.playing #topClock {
          transform: translate(-50%,-50%) translateY(-190px) scaleY(.34);
        }
        .hg-scene.playing #bottomClock {
          transform: translate(-50%,-50%) translateY(190px) scaleY(.34);
        }
        .hg-scene.playing #bottomClock .hg-face-content { opacity: 0; }
        .hg-scene.playing #bottomClock .hg-sand { opacity: 1; }

        #bottomClock { opacity: 0; transition: opacity .35s ease, transform 1.1s cubic-bezier(.65,0,.35,1); }
        .hg-scene.playing #bottomClock { opacity: 1; }

        .hg-curves {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        .hg-curves path {
          fill: none;
          stroke: var(--hot);
          stroke-width: 2.5;
          stroke-linecap: round;
          filter: drop-shadow(0 0 4px var(--hot));
        }

        .hg-dots {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .hg-dots span {
          position: absolute;
          left: 227px;
          top: 150px;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--hot);
          opacity: 0;
        }
        .hg-scene.streaming .hg-dots span {
          animation: fall 1.6s linear infinite;
        }
        .hg-dots span:nth-child(1) { animation-delay: 0s; left: 224px; }
        .hg-dots span:nth-child(2) { animation-delay: .5s; left: 232px; }
        .hg-dots span:nth-child(3) { animation-delay: 1s; left: 228px; }
        .hg-dots span:nth-child(4) { animation-delay: .25s; left: 230px; }

        @keyframes fall {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(316px); opacity: 0; }
        }
      `}</style>

      <div className={cn("hg-scene", playing && "playing", streaming && "streaming")} ref={sceneRef}>
        <div className="hg-clock" id="topClock" ref={topClockRef}>
          <div className="hg-face-content">
            <div className="hg-face"></div>
            <div className="absolute inset-0">
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

        <div className="hg-clock" id="bottomClock">
          <div className="hg-face-content">
            <div className="hg-face"></div>
            <div className="absolute inset-0">
              {HOURS.map((h, i) => (
                <div key={i} className="hg-tick-wrap" style={{ transform: `rotate(${i * 30}deg)` }}>
                  <div className="hg-tick" style={{ transform: `rotate(${-i * 30}deg)` }}>
                    {h.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="hg-minute-hand" ref={minuteHand2Ref}></div>
            <div className="hg-pivot"></div>
          </div>
          <div className="hg-sand"></div>
        </div>

        <svg className="hg-curves" viewBox="0 0 460 640" preserveAspectRatio="none">
          <path ref={curveLeftTop}></path>
          <path ref={curveLeftBottom}></path>
          <path ref={curveRightTop}></path>
          <path ref={curveRightBottom}></path>
        </svg>

        <div className="hg-dots">
          <span></span><span></span><span></span><span></span>
        </div>
      </div>

      <div className="flex flex-col items-center mt-[-20px] relative z-10">
        <p className="text-xs font-mono text-slate-500 mb-4 uppercase tracking-widest text-center">
          Drag hand to set limit ({HOURS[Math.round(minuteAngle / 30) % 12].val}s)
        </p>

        <button
          onClick={toggleAnimation}
          className="px-8 py-3 rounded-full border border-[var(--hot)] text-[var(--hot)] hover:bg-[var(--hot)] hover:text-white font-mono font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_var(--color-hot-soft)] hover:shadow-[0_0_25px_var(--color-hot-soft)]"
        >
          {playing ? 'Reset Timer' : 'Confirm Time'}
        </button>
      </div>
    </div>
  );
}
