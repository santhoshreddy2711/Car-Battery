import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// 3D Car Battery Model
const BatteryModel: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Animate battery rotation and mouse tilt
  useFrame((state) => {
    if (groupRef.current) {
      // Auto-rotation around Y axis
      groupRef.current.rotation.y += 0.007;
      
      // Dynamic tilt based on mouse position
      const targetRotationX = (state.pointer.y * Math.PI) * 0.15;
      const targetRotationZ = (-state.pointer.x * Math.PI) * 0.1;
      
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotationX, 0.05);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotationZ, 0.05);
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.4, 0]}>
      {/* 1. Main Casing */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.3, 1.2]} />
        <meshStandardMaterial color="#1a1a24" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* 2. Top Cover lid (Red accent) */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[2.22, 0.12, 1.22]} />
        <meshStandardMaterial color="#E53E3E" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* 3. Negative Terminal (Black/Metallic) */}
      <group position={[-0.8, 0.82, 0.3]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.1, 0.12, 0.22, 16]} />
          <meshStandardMaterial color="#2D3748" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Minus Sign */}
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.08, 0.02, 0.02]} />
          <meshBasicMaterial color="#718096" />
        </mesh>
      </group>

      {/* 4. Positive Terminal (Red/Copper) */}
      <group position={[0.8, 0.82, 0.3]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.1, 0.12, 0.22, 16]} />
          <meshStandardMaterial color="#DD6B20" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Plus Sign */}
        <group position={[0, 0.12, 0]}>
          <mesh>
            <boxGeometry args={[0.08, 0.02, 0.02]} />
            <meshBasicMaterial color="#FEB2B2" />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.08, 0.02, 0.02]} />
            <meshBasicMaterial color="#FEB2B2" />
          </mesh>
        </group>
      </group>

      {/* 5. Casing Grid lines (Visual details) */}
      <mesh position={[0, 0, 0.61]}>
        <boxGeometry args={[1.8, 0.9, 0.01]} />
        <meshStandardMaterial color="#2d2d3a" roughness={0.4} />
      </mesh>

      {/* 6. Glowing Battery Label */}
      <mesh position={[0, 0, 0.62]}>
        <boxGeometry args={[1.2, 0.4, 0.01]} />
        <meshStandardMaterial 
          color="#1a1a24" 
          emissive="#E53E3E" 
          emissiveIntensity={0.6} 
          roughness={0.1} 
        />
      </mesh>
      
      {/* 7. Handles */}
      <mesh position={[0, 0.75, -0.4]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.3, 0.04, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#2d2d3a" roughness={0.6} />
      </mesh>
    </group>
  );
};

// Rising Energy Sparks (Particle System)
const ChargingParticles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 100;
  
  const [positions, speeds] = React.useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const spd = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      // Place particles in a column around the battery
      pos[i * 3] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
      
      spd[i] = 0.01 + Math.random() * 0.02;
    }
    return [pos, spd];
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      const geo = pointsRef.current.geometry;
      const posArr = geo.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
        // Move particle upwards
        posArr[i * 3 + 1] += speeds[i];
        
        // If it goes too high, reset to bottom
        if (posArr[i * 3 + 1] > 2.5) {
          posArr[i * 3 + 1] = -2.5;
          posArr[i * 3] = (Math.random() - 0.5) * 4;
          posArr[i * 3 + 2] = (Math.random() - 0.5) * 3;
        }
      }
      geo.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#F56565"
        size={0.06}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Canvas Wrapper
export const Canvas3D: React.FC<{ isHero?: boolean }> = ({ isHero = true }) => {
  return (
    <div className={`w-full h-full min-h-[300px] md:min-h-[450px] relative ${isHero ? 'cursor-grab active:cursor-grabbing' : ''}`}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 4.2]} fov={50} />
        
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[5, 8, 5]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        
        {/* Back glowing spotlight */}
        <spotLight 
          position={[0, 5, -2]} 
          intensity={1.8} 
          angle={Math.PI / 3} 
          penumbra={1} 
          color="#E53E3E" 
        />

        <BatteryModel />
        <ChargingParticles />
        <Stars radius={100} depth={50} count={300} factor={4} saturation={0.5} fade speed={1.5} />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          maxPolarAngle={Math.PI / 1.8} 
          minPolarAngle={Math.PI / 2.5}
        />
      </Canvas>
      
      {/* Decorative overlay glow indicators */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 bg-glass-white dark:bg-glass-dark border border-brand/20 rounded-full px-3 py-1 text-xs text-brand font-medium backdrop-blur-md no-print">
        <span className="w-2 h-2 rounded-full bg-brand animate-ping" />
        <span>3D Engine Active</span>
      </div>
    </div>
  );
};
