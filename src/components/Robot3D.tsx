'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import ThoughtBubble from './ThoughtBubble';

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
  const { scene } = useGLTF('/humanoid-robot-ai-realistic/source/model.glb');
  const meshRef = useRef<THREE.Group>(null);
  
  // Animation states
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Base floating animation - slower and more subtle
    meshRef.current.position.y = Math.sin(time * 0.8) * 0.05;
    meshRef.current.rotation.y = Math.sin(time * 0.3) * 0.05;
    
    // Listening animation - gentle head movement only
    if (isListening) {
      meshRef.current.rotation.x = Math.sin(time * 1.5) * 0.1;
      // No body movement during listening
    }
    
    // Speaking animation - NO movement, only eye glow
    if (isSpeaking) {
      // Robot stays still while speaking - only eyes glow
      meshRef.current.rotation.x = 0;
      meshRef.current.rotation.y = 0;
      meshRef.current.rotation.z = 0;
      // Keep original scale - don't change size!
    }
    
    // Processing animation - gentle thinking pose
    if (isProcessing) {
      meshRef.current.rotation.y += 0.01; // Slower rotation
      meshRef.current.position.y = Math.sin(time * 1.2) * 0.08;
    }
  });

  // Eye glow effect removed - green sphere was not needed

  return (
    <group ref={meshRef} scale={1.5} position={[0, 0.5, 0]}>
      <primitive object={scene} />
      {/* Green sphere removed - not needed */}
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
      
      {/* Thought Bubble */}
      <ThoughtBubble
        isVisible={isProcessing || isSpeaking}
        isThinking={isProcessing}
        isSpeaking={isSpeaking}
      />
      
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
