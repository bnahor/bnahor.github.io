import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

function useMousePosition() {
  const mouse = useRef({ x: 0, y: 0 });

  if (typeof window !== 'undefined') {
    const handler = (e: globalThis.MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    // Attach once
    if (!(window as unknown as Record<string, boolean>).__heroMouseAttached) {
      window.addEventListener('mousemove', handler, { passive: true });
      (window as unknown as Record<string, boolean>).__heroMouseAttached = true;
    }
  }

  return mouse;
}

function WireframeIcosahedron() {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouse = useMousePosition();
  const targetRotation = useRef({ x: 0, y: 0 });

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || 'ontouchstart' in window;
  }, []);

  const prefersReduced = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (prefersReduced) return;

    if (isMobile) {
      meshRef.current.rotation.y += delta * 0.15;
      meshRef.current.rotation.x += delta * 0.05;
    } else {
      targetRotation.current.y = mouse.current.x * 0.4;
      targetRotation.current.x = -mouse.current.y * 0.3;

      meshRef.current.rotation.y += (targetRotation.current.y - meshRef.current.rotation.y) * 2 * delta;
      meshRef.current.rotation.x += (targetRotation.current.x - meshRef.current.rotation.x) * 2 * delta;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5} floatingRange={[-0.1, 0.1]}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[2.2, 1]} />
        <meshBasicMaterial
          color="#79D6A5"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>
      {/* Inner glow sphere */}
      <mesh>
        <icosahedronGeometry args={[2.0, 1]} />
        <meshBasicMaterial
          color="#D8B45F"
          transparent
          opacity={0.025}
        />
      </mesh>
    </Float>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.5]}
    >
      <WireframeIcosahedron />
    </Canvas>
  );
}
