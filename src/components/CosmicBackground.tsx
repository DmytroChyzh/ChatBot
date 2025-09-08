"use client";

import { useEffect } from "react";
import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { Engine } from "@tsparticles/engine";

export default function CosmicBackground() {
  useEffect(() => {
    document.body.style.background =
      "radial-gradient(circle at 20% 20%, #2e026d, #000000 70%)";
    document.body.style.overflow = "hidden";
  }, []);

  const particlesInit = async (engine: Engine) => {
    await loadSlim(engine);
  };

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
        init={particlesInit}
        options={{
          background: {
            color: "transparent",
          },
          fpsLimit: 60,
          interactivity: {
            events: {
              onHover: {
                enable: true,
                mode: "repulse",
              },
            },
            modes: {
              repulse: {
                distance: 100,
              },
            },
          },
          particles: {
            number: {
              value: 120,
              density: {
                enable: true,
                value_area: 800,
              },
            },
            color: {
              value: "#ffffff",
            },
            shape: {
              type: "circle",
            },
            opacity: {
              value: 0.8,
              random: true,
            },
            size: {
              value: 2,
              random: true,
            },
            move: {
              enable: true,
              speed: 0.6,
              direction: "none",
              outModes: "out",
            },
          },
          detectRetina: true,
        }}
      />
    </div>
  );
}
