"use client";

import { useEffect } from "react";

export default function CosmicBackground() {
  useEffect(() => {
    document.body.style.background =
      "radial-gradient(circle at 20% 20%, #2e026d, #000000 70%)";
    document.body.style.overflow = "hidden";
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      {/* Космічний туман */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "url('https://i.ibb.co/k1MT7dy/nebula-purple.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(30px)",
        }}
      />

      {/* Анімовані зорі CSS */}
      <div className="absolute inset-0">
        {/* Зорі */}
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
        
        {/* Рухливі зорі */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`moving-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${3 + Math.random() * 4}s infinite`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
