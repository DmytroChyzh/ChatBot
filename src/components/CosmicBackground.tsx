"use client";

import { useEffect } from "react";
import Particles from "@tsparticles/react";

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

      {/* Зорі */}
      <Particles
        id="tsparticles"
        options={{
          particles: {
            number: {
              value: 50,
            },
            color: {
              value: "#ffffff",
            },
            shape: {
              type: "circle",
            },
            opacity: {
              value: 0.8,
            },
            size: {
              value: 2,
            },
            move: {
              enable: true,
              speed: 0.5,
            },
          },
        }}
      />
    </div>
  );
}
