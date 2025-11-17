
import React, { useMemo } from 'react';

const AnimatedBackground: React.FC = () => {
  const stars = useMemo(() => {
    const starArray = [];
    for (let i = 0; i < 50; i++) {
      const size = Math.random() * 2 + 1;
      starArray.push({
        id: i,
        style: {
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `twinkle ${Math.random() * 5 + 3}s linear infinite`,
          animationDelay: `${Math.random() * 5}s`,
          width: `${size}px`,
          height: `${size}px`,
        },
      });
    }
    return starArray;
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden bg-gradient-to-b from-slate-900 to-indigo-900">
      {/* Stars */}
      {stars.map(star => (
        <div
          key={star.id}
          className="absolute bg-white rounded-full"
          style={star.style}
        />
      ))}
      
      {/* Clouds */}
      <div 
        className="absolute -bottom-1/4 -left-1/4 w-full h-1/2 bg-slate-800/20 rounded-full opacity-50 blur-2xl"
        style={{ animation: 'move-clouds-slow 40s linear infinite' }}
      ></div>
      <div 
        className="absolute -bottom-1/3 -right-1/4 w-3/4 h-1/2 bg-indigo-900/20 rounded-full opacity-70 blur-3xl"
        style={{ animation: 'move-clouds-fast 30s linear infinite' }}
      ></div>

      {/* Shooting Star */}
      <div 
        className="absolute top-1/4 -right-96 w-48 h-0.5 bg-gradient-to-l from-white to-transparent"
        style={{ animation: 'shooting-star 15s ease-in-out infinite', animationDelay: '5s' }}
      ></div>
    </div>
  );
};

export default AnimatedBackground;
