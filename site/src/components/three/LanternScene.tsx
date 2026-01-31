import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type Props = {
  progress?: number;
};

type LanternEvent = CustomEvent<{ progress: number }>;

declare global {
  interface Window {
    __nivara?: {
      lanternProgress?: number;
    };
  }
}

function useLanternProgress(input?: number) {
  const initial = typeof window !== "undefined" ? window.__nivara?.lanternProgress ?? 0 : 0;
  const [progress, setProgress] = useState(input ?? initial);

  useEffect(() => {
    if (input !== undefined) {
      setProgress(input);
    }
  }, [input]);

  useEffect(() => {
    if (input !== undefined) {
      return;
    }
    const handler = (event: Event) => {
      const detail = (event as LanternEvent).detail;
      if (detail && typeof detail.progress === "number") {
        setProgress(detail.progress);
      }
    };
    window.addEventListener("nivara:lantern-progress", handler);
    return () => window.removeEventListener("nivara:lantern-progress", handler);
  }, [input]);

  return progress;
}

function LanternRig({ progress, reduceMotion }: { progress: number; reduceMotion: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const { camera, invalidate } = useThree();
  const clamped = reduceMotion ? 0 : Math.min(1, Math.max(0, progress));

  useEffect(() => {
    if (lightRef.current) {
      lightRef.current.intensity = 0.9 + clamped * 0.6;
    }
    if (shellRef.current) {
      const material = shellRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.25 + clamped * 0.35;
    }
    if (coreRef.current) {
      const material = coreRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.8 + clamped * 0.6;
    }
    camera.position.z = 3.4 - clamped * 0.35;
    camera.position.y = 0.4 + clamped * 0.06;
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, clamped, invalidate]);

  return (
    <group>
      <mesh ref={shellRef} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.6, 0.45, 1.4, 32]} />
        <meshStandardMaterial color="#d1c7a8" emissive="#8f7a44" emissiveIntensity={0.25} />
      </mesh>
      <mesh ref={coreRef} position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.24, 32, 32]} />
        <meshStandardMaterial color="#f7e7b6" emissive="#f0d59e" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, -0.55, 0]}>
        <torusGeometry args={[0.4, 0.05, 16, 48]} />
        <meshStandardMaterial color="#8d876b" emissive="#3b3320" emissiveIntensity={0.1} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.2, 0]} intensity={1} distance={8} color="#ffd8a3" />
    </group>
  );
}

export default function LanternScene({ progress }: Props) {
  const reduceMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const lanternProgress = useLanternProgress(progress);

  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.4, 3.4], fov: 50 }}
    >
      <color attach="background" args={["#070812"]} />
      <fog attach="fog" args={["#070812", 2, 7]} />
      <ambientLight intensity={0.2} />
      <LanternRig progress={lanternProgress} reduceMotion={reduceMotion} />
    </Canvas>
  );
}
