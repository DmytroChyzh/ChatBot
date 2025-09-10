'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface Robot3DProps {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
}

// 3D Robot Model Component
const RobotModel: React.FC<{ 
  isListening: boolean; 
  isSpeaking: boolean; 
  isProcessing: boolean; 
}> = ({ isListening, isSpeaking, isProcessing }) => {
  const { scene } = useGLTF('/robot.glb');
  const meshRef = useRef<THREE.Group>(null);
  const eyeRef = useRef<THREE.Mesh>(null);
  
  // Animation states
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Base floating animation
    meshRef.current.position.y = Math.sin(time * 2) * 0.1;
    meshRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
    
    // Listening animation - more active movement
    if (isListening) {
      meshRef.current.rotation.x = Math.sin(time * 4) * 0.2;
      meshRef.current.scale.setScalar(1 + Math.sin(time * 6) * 0.05);
    }
    
    // Speaking animation - mouth movement simulation
    if (isSpeaking) {
      meshRef.current.rotation.z = Math.sin(time * 8) * 0.1;
      meshRef.current.scale.setScalar(1 + Math.sin(time * 10) * 0.1);
    }
    
    // Processing animation - thinking pose
    if (isProcessing) {
      meshRef.current.rotation.y += 0.02;
      meshRef.current.position.y = Math.sin(time * 3) * 0.15;
    }
  });

  // Eye glow effect
  useEffect(() => {
    if (eyeRef.current) {
      const material = eyeRef.current.material as THREE.MeshStandardMaterial;
      if (isListening || isSpeaking || isProcessing) {
        material.emissive = new THREE.Color(0x00ff00);
        material.emissiveIntensity = 0.5;
      } else {
        material.emissive = new THREE.Color(0x000000);
        material.emissiveIntensity = 0;
      }
    }
  }, [isListening, isSpeaking, isProcessing]);

  return (
    <group ref={meshRef} scale={2} position={[0, -1.5, 0]}>
      <primitive object={scene} />
      {/* Add glowing eyes */}
      <mesh ref={eyeRef} position={[0, 0.5, 0.8]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

// Main 3D Robot Component
const Robot3D: React.FC<Robot3DProps> = ({
  isActive,
  isListening,
  isSpeaking,
  isProcessing
}) => {
  if (!isActive) return null;

  return (
    <div className="fixed bottom-0 left-0 w-[300px] h-[400px] z-50 pointer-events-none">
      <Canvas
        camera={{ position: [0, 1, 5], fov: 35 }}
        style={{ background: 'transparent' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#651FFF" />
        
        {/* Robot Model */}
        <RobotModel 
          isListening={isListening}
          isSpeaking={isSpeaking}
          isProcessing={isProcessing}
        />
        
        {/* Controls - disabled for UI */}
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
      
      {/* Status indicator */}
      <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
        {isListening && "🎤 Listening..."}
        {isSpeaking && "🔊 Speaking..."}
        {isProcessing && "🤔 Processing..."}
        {!isListening && !isSpeaking && !isProcessing && "🤖 Ready"}
      </div>
    </div>
  );
};

export default Robot3D;
