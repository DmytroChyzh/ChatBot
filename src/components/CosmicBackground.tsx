"use client";

import { useEffect } from "react";

export default function CosmicBackground() {
  useEffect(() => {
    document.body.style.background =
      "radial-gradient(circle at 20% 20%, #2e026d, #000000 70%)";
    document.body.style.overflow = "hidden";
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      {/* Анімовані зорі */}
      <div className="absolute inset-0">
        {/* Малі зорі */}
        {Array.from({ length: 150 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${1.5 + Math.random() * 2.5}s`,
            }}
          />
        ))}
        
        {/* Середні зорі */}
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={`medium-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
        
        {/* Великі зорі */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={`large-${i}`}
            className="absolute w-1.5 h-1.5 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
        
        {/* Рухливі зорі (метеори) */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={`meteor-${i}`}
            className="absolute w-0.5 h-0.5 bg-blue-300 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          />
        ))}
        
        {/* Планети */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`planet-${i}`}
            className="absolute rounded-full animate-pulse"
            style={{
              width: `${8 + Math.random() * 12}px`,
              height: `${8 + Math.random() * 12}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i === 0 ? '#8B5CF6' : i === 1 ? '#06B6D4' : '#F59E0B',
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${5 + Math.random() * 3}s`,
            }}
          />
        ))}
        
        {/* Туманності */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={`nebula-${i}`}
            className="absolute rounded-full opacity-20 animate-pulse"
            style={{
              width: `${100 + Math.random() * 200}px`,
              height: `${100 + Math.random() * 200}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, ${i === 0 ? '#8B5CF6' : '#06B6D4'}40, transparent 70%)`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
