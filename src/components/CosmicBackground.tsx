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
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`nebula-${i}`}
            className="absolute rounded-full opacity-15 animate-pulse"
            style={{
              width: `${150 + Math.random() * 300}px`,
              height: `${150 + Math.random() * 300}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(ellipse, ${i === 0 ? '#8B5CF6' : i === 1 ? '#06B6D4' : i === 2 ? '#EC4899' : '#F59E0B'}30, transparent 60%)`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 6}s`,
            }}
          />
        ))}
        
        {/* Зоряні скупчення */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`cluster-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          >
            {Array.from({ length: 8 }).map((_, j) => (
              <div
                key={`cluster-star-${i}-${j}`}
                className="absolute w-0.5 h-0.5 bg-yellow-200 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 40 - 20}px`,
                  top: `${Math.random() * 40 - 20}px`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        ))}
        
        {/* Комети */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={`comet-${i}`}
            className="absolute w-1 h-1 bg-cyan-300 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 12}s`,
              animationDuration: `${6 + Math.random() * 4}s`,
              boxShadow: '0 0 10px #06B6D4, 0 0 20px #06B6D4, 0 0 30px #06B6D4',
            }}
          />
        ))}
        
        {/* Пульсари */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`pulsar-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `cosmic-pulsar ${1 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
              boxShadow: '0 0 5px #ffffff, 0 0 10px #ffffff, 0 0 15px #ffffff',
            }}
          />
        ))}
        
        {/* Галактичний пил */}
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={`dust-${i}`}
            className="absolute w-0.5 h-0.5 bg-gray-400 rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `cosmic-drift ${20 + Math.random() * 30}s linear infinite`,
              animationDelay: `${Math.random() * 20}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
