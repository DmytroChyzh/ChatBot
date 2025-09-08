"use client";

import { useEffect, useCallback } from "react";
import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, Engine } from "@tsparticles/engine";

export default function CosmicBackground() {
  useEffect(() => {
    document.body.style.background =
      "radial-gradient(circle at 20% 20%, #2e026d, #000000 70%)";
    document.body.style.overflow = "hidden";
  }, []);

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async (container: Container | undefined) => {
    console.log("Particles loaded:", container);
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
        init={particlesInit}
        loaded={particlesLoaded}
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
