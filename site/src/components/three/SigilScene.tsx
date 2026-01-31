import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function Sigil() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.2;
      meshRef.current.rotation.y = t * 0.35;
      meshRef.current.position.y = Math.sin(t * 0.8) * 0.08;
    }
  });

  return (
    <mesh ref={meshRef} onClick={() => {}}>
      <torusKnotGeometry args={[0.6, 0.18, 120, 16]} />
      <meshStandardMaterial color="#7bd1ff" emissive="#1d6fa8" emissiveIntensity={0.4} />
    </mesh>
  );
}

export default function SigilScene() {
  return (
    <Canvas dpr={[1, 1.5]} frameloop="always" camera={{ position: [0, 0, 3.2], fov: 55 }}>
      <color attach="background" args={["#060814"]} />
      <fog attach="fog" args={["#060814", 2, 7]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[2, 3, 4]} intensity={0.8} color="#9bdcff" />
      <Sigil />
    </Canvas>
  );
}
