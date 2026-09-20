import React, { useState, useEffect } from 'react';

interface AnimatedCharacterProps {
  id: string;
  className?: string;
}

export function AnimatedCharacter({ id, className = "h-48 object-contain" }: AnimatedCharacterProps) {
  const [frame, setFrame] = useState(1);

  useEffect(() => {
    const int = setInterval(() => {
      setFrame(f => (f >= 8 ? 1 : f + 1));
    }, 100);
    return () => clearInterval(int);
  }, []);

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
