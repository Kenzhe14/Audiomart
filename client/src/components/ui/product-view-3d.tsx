import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Loader2 } from 'lucide-react';

function Model() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#666666" />
    </mesh>
  );
}

export function ProductView3D() {
  return (
    <div className="h-[400px] w-full relative">
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }>
        <Canvas
          camera={{ position: [0, 0, 5] }}
          style={{ background: '#111111' }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Model />
          <OrbitControls 
            enableZoom={false}
            autoRotate
            autoRotateSpeed={4}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}