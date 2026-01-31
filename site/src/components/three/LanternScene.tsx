import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function Lantern() {
  const lightRef = useRef<THREE.PointLight>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (lightRef.current) {
      lightRef.current.intensity = 1.2 + Math.sin(t * 0.8) * 0.4;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.15;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.6, 0.45, 1.4, 32]} />
        <meshStandardMaterial color="#d1c7a8" emissive="#8f7a44" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color="#f7e7b6" emissive="#f7d98a" emissiveIntensity={1.2} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.2, 0]} intensity={1.2} distance={8} color="#ffddb0" />
    </group>
  );
}

export default function LanternScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop="always"
      camera={{ position: [0, 0.4, 3.4], fov: 50 }}
    >
      <color attach="background" args={["#070812"]} />
      <fog attach="fog" args={["#070812", 2, 7]} />
      <ambientLight intensity={0.2} />
      <Lantern />
      <OrbitControls enabled={false} />
    </Canvas>
  );
}
