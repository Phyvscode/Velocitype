import React, { useState, useEffect } from 'react';

interface AnimatedCharacterProps {
  id: string;
  className?: string;
  staticMode?: boolean;
}

export function AnimatedCharacter({ id, className = "h-48 object-contain", staticMode = false }: AnimatedCharacterProps) {
  const [frame, setFrame] = useState(1);

  useEffect(() => {
    if (staticMode) return;
    
    // 7.8 fps = ~128.2ms per frame
    const int = setInterval(() => {
      setFrame(f => (f >= 8 ? 1 : f + 1));
    }, 128);
    return () => clearInterval(int);
  }, [staticMode]);

  // Map IDs to their paths
  let src = "";
  if (id === 'mushgirl') {
    src = `/characters/Mushgirl/girlwithoutmush_000${frame}.png`;
  }

  if (!src) return null;

  return (
    <img src={src} className={className} alt={id} />
  );
}
