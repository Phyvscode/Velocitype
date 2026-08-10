import React, { useEffect, useRef, useState } from 'react';
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

interface Props {
  durationVal: number;
  timeLeft: number;
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

export default function HourglassAnimation({ durationVal, timeLeft }: Props) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const curveLeftTop = useRef<SVGPathElement>(null);
  const curveLeftBottom = useRef<SVGPathElement>(null);
  const curveRightTop = useRef<SVGPathElement>(null);
  const curveRightBottom = useRef<SVGPathElement>(null);

  const [streaming, setStreaming] = useState(false);
  const [playing, setPlaying] = useState(false);
  
  const initialIndex = Math.max(0, HOURS.findIndex(h => h.val === durationVal));
  const minuteAngle = initialIndex * 30;

  useEffect(() => {
    // Start animation shortly after view transition begins
    setTimeout(() => {
      setPlaying(true);
      setTimeout(() => {
        const curves = [curveLeftTop.current, curveLeftBottom.current, curveRightTop.current, curveRightBottom.current];
        curves.forEach(p => {
          if (p) {
            p.style.transition = 'stroke-dashoffset 700ms ease';
            p.style.strokeDashoffset = '0';
          }
        });
        setTimeout(() => setStreaming(true), 700);
      }, 100);
    }, 400); // Wait 400ms so view transition is halfway done
  }, []);

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

  return (
    <div className="w-[345px] h-[480px] relative flex items-center justify-center" style={{ viewTransitionName: 'hourglass-clock' }}>
      <style>{`
        .hg-anim-scene {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 460px;
          height: 640px;
          transform: translate(-50%, -50%) scale(0.75);
          pointer-events: none;
        }

        .hg-anim-clock {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 260px;
          height: 260px;
          transform: translate(-50%,-50%);
          transition: transform 1.1s cubic-bezier(.65,0,.35,1);
        }

        .hg-anim-face-content {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          transition: opacity .9s ease;
        }

        .hg-anim-face {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #ffffff;
          border: 4px solid var(--hot);
          box-shadow: 0 0 40px 10px rgba(255, 255, 255, 0.15), 0 8px 20px rgba(0,0,0,.35);
        }

        .hg-anim-tick-wrap {
          position: absolute;
          inset: 0;
          display: flex;
          justify-content: center;
        }

        .hg-anim-tick {
          margin-top: 15px;
          font-family: monospace;
          font-weight: bold;
          font-size: 13px;
          color: #111;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hg-anim-pivot {
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

        .hg-anim-minute-hand {
          position: absolute;
          left: 50%;
          top: 50%;
          transform-origin: 50% 100%;
          background: var(--hot);
          border-radius: 4px;
          z-index: 4;
          width: 5px;
          height: 92px;
        }

        .hg-anim-sand {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          opacity: 0;
          transition: opacity .9s ease;
          background: var(--hot);
          box-shadow: 0 0 40px 10px rgba(255,255,255,.1);
        }

        .hg-anim-scene.playing #animTopClock {
          transform: translate(-50%,-50%) translateY(-190px) scaleY(.34);
        }
        .hg-anim-scene.playing #animTopClock .absolute.inset-0 {
          opacity: 0;
        }
        .hg-anim-scene.playing #animBottomClock {
          transform: translate(-50%,-50%) translateY(190px) scaleY(.34);
        }
        .hg-anim-scene.playing #animBottomClock .hg-anim-face-content { opacity: 0; }
        .hg-anim-scene.playing #animBottomClock .hg-anim-sand { opacity: 1; }

        #animBottomClock { opacity: 0; transition: opacity .35s ease, transform 1.1s cubic-bezier(.65,0,.35,1); }
        .hg-anim-scene.playing #animBottomClock { opacity: 1; }

        .hg-anim-curves {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        .hg-anim-curves path {
          fill: none;
          stroke: var(--hot);
          stroke-width: 2.5;
          stroke-linecap: round;
          filter: drop-shadow(0 0 4px var(--hot));
        }

        .hg-anim-dots {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .hg-anim-dots span {
          position: absolute;
          left: 227px;
          top: 150px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--hot);
          opacity: 0;
        }
        .hg-anim-scene.streaming .hg-anim-dots span {
          animation: fall 1.6s linear infinite;
        }
        .hg-anim-dots span:nth-child(1) { animation-delay: 0s; left: 220px; }
        .hg-anim-dots span:nth-child(2) { animation-delay: .5s; left: 236px; }
        .hg-anim-dots span:nth-child(3) { animation-delay: 1s; left: 228px; }
        .hg-anim-dots span:nth-child(4) { animation-delay: .25s; left: 232px; }

        @keyframes fall {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(316px); opacity: 0; }
        }
      `}</style>

      <div className={cn("hg-anim-scene", playing && "playing", streaming && (timeLeft > 0) && "streaming")} ref={sceneRef}>
        <div className="hg-anim-clock" id="animTopClock">
          <div className="hg-anim-face-content">
            <div className="hg-anim-face"></div>
            <div className="absolute inset-0 transition-opacity duration-500">
              {HOURS.map((h, i) => (
                <div key={i} className="hg-anim-tick-wrap" style={{ transform: `rotate(${i * 30}deg)` }}>
                  <div className="hg-anim-tick" style={{ transform: `rotate(${-i * 30}deg)` }}>
                    {h.label}
                  </div>
                </div>
              ))}
            </div>
            <div
              className="hg-anim-minute-hand"
              style={{ transform: `translate(-50%,-100%) rotate(${minuteAngle}deg)` }}
            ></div>
            <div className="hg-anim-pivot"></div>
          </div>
        </div>

        <div className="hg-anim-clock" id="animBottomClock">
          <div className="hg-anim-face-content">
            <div className="hg-anim-face"></div>
            <div className="absolute inset-0 transition-opacity duration-500">
              {HOURS.map((h, i) => (
                <div key={i} className="hg-anim-tick-wrap" style={{ transform: `rotate(${i * 30}deg)` }}>
                  <div className="hg-anim-tick" style={{ transform: `rotate(${-i * 30}deg)` }}>
                    {h.label}
                  </div>
                </div>
              ))}
            </div>
            <div
              className="hg-anim-minute-hand"
              style={{ transform: `translate(-50%,-100%) rotate(${minuteAngle}deg)` }}
            ></div>
            <div className="hg-anim-pivot"></div>
          </div>
          <div className="hg-anim-sand"></div>
        </div>

        <svg className="hg-anim-curves" viewBox="0 0 460 640" preserveAspectRatio="none">
          <path ref={curveLeftTop}></path>
          <path ref={curveLeftBottom}></path>
          <path ref={curveRightTop}></path>
          <path ref={curveRightBottom}></path>
        </svg>

        <div className="hg-anim-dots">
          <span></span><span></span><span></span><span></span>
        </div>
      </div>
    </div>
  );
}
