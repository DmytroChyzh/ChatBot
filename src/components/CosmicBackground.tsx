"use client";

import { useEffect } from "react";

export default function CosmicBackground() {
  useEffect(() => {
    document.body.style.background =
      "radial-gradient(ellipse at 20% 20%, #1e1b4b, #312e81, #1e1b4b, #000000 80%), linear-gradient(45deg, #0f0f23, #1a1a2e, #16213e)";
    document.body.style.overflow = "hidden";
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      {/* Анімовані зорі */}
      <div className="absolute inset-0">
        {/* Малі зорі - зменшено кількість */}
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `cosmic-twinkle ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 6}s`,
            }}
          />
        ))}
        
        {/* Середні зорі - зменшено кількість */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={`medium-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `cosmic-twinkle ${4 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
        
        {/* Великі зорі - зменшено кількість */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`large-${i}`}
            className="absolute w-1.5 h-1.5 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `cosmic-twinkle ${5 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          />
        ))}
        
        {/* Рухливі зорі (метеори) - зменшено кількість */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`meteor-${i}`}
            className="absolute w-0.5 h-0.5 bg-blue-300 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `cosmic-drift ${8 + Math.random() * 4}s linear infinite`,
              animationDelay: `${Math.random() * 8}s`,
            }}
          />
        ))}
        
        {/* Планети - зменшено кількість */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={`planet-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${8 + Math.random() * 8}px`,
              height: `${8 + Math.random() * 8}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i === 0 ? '#8B5CF6' : '#06B6D4',
              animation: `cosmic-pulse ${6 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 8}s`,
            }}
          />
        ))}
        
        {/* Туманності - зменшено кількість */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={`nebula-${i}`}
            className="absolute rounded-full opacity-10"
            style={{
              width: `${200 + Math.random() * 200}px`,
              height: `${200 + Math.random() * 200}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(ellipse, ${i === 0 ? '#8B5CF6' : '#06B6D4'}20, transparent 60%)`,
              animation: `cosmic-nebula ${15 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 15}s`,
            }}
          />
        ))}
        
        {/* Зоряні скупчення - зменшено кількість */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={`cluster-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          >
            {Array.from({ length: 5 }).map((_, j) => (
              <div
                key={`cluster-star-${i}-${j}`}
                className="absolute w-0.5 h-0.5 bg-yellow-200 rounded-full"
                style={{
                  left: `${Math.random() * 30 - 15}px`,
                  top: `${Math.random() * 30 - 15}px`,
                  animation: `cosmic-twinkle ${3 + Math.random() * 2}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 4}s`,
                }}
              />
            ))}
          </div>
        ))}
        
        {/* Комети - зменшено кількість */}
        {Array.from({ length: 1 }).map((_, i) => (
          <div
            key={`comet-${i}`}
            className="absolute w-1 h-1 bg-cyan-300 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `cosmic-comet ${10 + Math.random() * 5}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`,
              boxShadow: '0 0 8px #06B6D4, 0 0 16px #06B6D4',
            }}
          />
        ))}
        
        {/* Пульсари - зменшено кількість */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`pulsar-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `cosmic-pulsar ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              boxShadow: '0 0 4px #ffffff, 0 0 8px #ffffff',
            }}
          />
        ))}
        
        {/* Галактичний пил - зменшено кількість */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`dust-${i}`}
            className="absolute w-0.5 h-0.5 bg-gray-400 rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `cosmic-drift ${25 + Math.random() * 20}s linear infinite`,
              animationDelay: `${Math.random() * 25}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
