import React, { useState, useEffect } from 'react';

interface AnimatedCharacterProps {
  id: string;
  className?: string;
  staticMode?: boolean;
}

export function AnimatedCharacter({ id, className = "h-48 object-contain", staticMode = false }: AnimatedCharacterProps) {
  const [frame, setFrame] = useState(1);

  const frameCount = id === 'screwed' ? 42 : 8;
  const fps = id === 'screwed' ? 10 : 7.8;

  useEffect(() => {
    if (staticMode) return;
    
    const int = setInterval(() => {
      setFrame(f => (f >= frameCount ? 1 : f + 1));
    }, 1000 / fps);
    return () => clearInterval(int);
  }, [staticMode, frameCount, fps]);

  // Map IDs to their paths
  let src = "";
  if (id === 'mushgirl') {
    src = `/characters/Mushgirl/girlwithoutmush_000${frame}.png`;
  } else if (id === 'screwed') {
    const frameStr = String(frame).padStart(4, '0');
    src = `/characters/Screwed/screwed_${frameStr}.png`;
  }

  if (!src) return null;

  return (
    <img src={src} className={className} alt={id} />
  );
}
