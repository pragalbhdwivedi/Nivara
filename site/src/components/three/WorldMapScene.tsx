import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import usePrefersReducedMotion from "./usePrefersReducedMotion";

function FloatingIslands() {
  const groupRef = useRef<THREE.Group>(null);
  const islands = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => ({
        key: index,
        position: [Math.sin(index) * 1.4, -0.4 + (index % 3) * 0.3, Math.cos(index) * 0.6],
        scale: 0.4 + (index % 3) * 0.2,
      })),
    []
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return;
    }
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.05;
    groupRef.current.position.y = Math.sin(t * 0.3) * 0.08;
  });

  return (
    <group ref={groupRef}>
      {islands.map((island) => (
        <mesh key={island.key} position={island.position as [number, number, number]} scale={island.scale}>
          <circleGeometry args={[0.6, 36]} />
          <meshStandardMaterial color="#2a2f3d" metalness={0.4} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function MistField() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!meshRef.current) {
      return;
    }
    meshRef.current.position.y = -0.6 + Math.sin(clock.getElapsedTime() * 0.2) * 0.05;
  });
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
      <planeGeometry args={[6, 6, 1, 1]} />
      <meshStandardMaterial color="#101522" transparent opacity={0.65} />
    </mesh>
  );
}

export default function WorldMapScene() {
  const reduceMotion = usePrefersReducedMotion();

  if (reduceMotion) {
    return (
      <div style={{ width: "100%", height: "100%", background: "rgba(8,10,16,0.7)" }} aria-hidden="true" />
    );
  }

  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.8, 3], fov: 55 }}>
      <color attach="background" args={["#05070f"]} />
      <fog attach="fog" args={["#05070f", 2, 6]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[2, 4, 3]} intensity={0.8} color="#b6d4ff" />
      <pointLight position={[-2, -1, 2]} intensity={0.4} color="#6a85b6" />
      <FloatingIslands />
      <MistField />
    </Canvas>
  );
}
