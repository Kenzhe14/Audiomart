import { useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';

function Product3DModel() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color="#444444"
        metalness={0.6}
        roughness={0.2}
      />
    </mesh>
  );
}

export function ProductView3D() {
  return (
    <div className="h-[400px] w-full cursor-grab active:cursor-grabbing">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Product3DModel />
        <OrbitControls
          enableZoom={false}
          autoRotate
          autoRotateSpeed={4}
        />
      </Canvas>
    </div>
  );
}