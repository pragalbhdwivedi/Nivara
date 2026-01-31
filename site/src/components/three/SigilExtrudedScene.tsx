import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import usePrefersReducedMotion from "./usePrefersReducedMotion";

type SigilExtrudedSceneProps = {
  svgUrl: string;
  progress?: number;
  title?: string;
  isActive?: boolean;
};

type SigilState = {
  progress: number;
  isActive: boolean;
};

const DEFAULT_STATE: SigilState = { progress: 0, isActive: true };

function useSigilRuntimeState(): SigilState {
  const [state, setState] = useState<SigilState>(DEFAULT_STATE);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<SigilState>).detail;
      if (!detail) {
        return;
      }
      setState({
        progress: detail.progress ?? 0,
        isActive: detail.isActive ?? true,
      });
    };

    window.addEventListener("sigil-progress", handleUpdate as EventListener);

    const existing = window.__nivara?.sigilProgress;
    const existingActive = window.__nivara?.sigilIsActive;
    if (typeof existing === "number") {
      setState({
        progress: existing,
        isActive: typeof existingActive === "boolean" ? existingActive : true,
      });
    }

    return () => {
      window.removeEventListener("sigil-progress", handleUpdate as EventListener);
    };
  }, []);

  return state;
}

function SigilMeshes({
  shapes,
  progress,
  isActive,
  prefersReducedMotion,
}: {
  shapes: THREE.Shape[];
  progress: number;
  isActive: boolean;
  prefersReducedMotion: boolean;
}) {
  const outerRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const { invalidate } = useThree();

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1a1c24",
        metalness: 0.6,
        roughness: 0.35,
        emissive: new THREE.Color("#0b0d13"),
        emissiveIntensity: 0.2,
      }),
    []
  );

  const geometries = useMemo(
    () => shapes.map((shape) => new THREE.ExtrudeGeometry(shape, { depth: 0.15, bevelEnabled: false })),
    [shapes]
  );

  useLayoutEffect(() => {
    if (!innerRef.current || geometries.length === 0) {
      return;
    }

    const bounds = new THREE.Box3();
    geometries.forEach((geometry) => {
      geometry.computeBoundingBox();
      if (geometry.boundingBox) {
        bounds.union(geometry.boundingBox);
      }
    });

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);

    const maxAxis = Math.max(size.x, size.y, size.z);
    const scale = maxAxis > 0 ? 2 / maxAxis : 1;

    innerRef.current.position.set(-center.x, -center.y, -center.z);
    innerRef.current.scale.setScalar(scale);
  }, [geometries]);

  useEffect(() => {
    return () => {
      geometries.forEach((geometry) => geometry.dispose());
      material.dispose();
    };
  }, [geometries, material]);

  useEffect(() => {
    if (isActive) {
      invalidate();
    }
  }, [isActive, progress, invalidate]);

  useFrame(() => {
    if (!outerRef.current || prefersReducedMotion) {
      return;
    }

    if (!isActive) {
      return;
    }

    const clampedProgress = Math.min(1, Math.max(0, progress));
    const rotationY = (clampedProgress - 0.5) * 0.5;
    const rotationX = -0.3 + clampedProgress * 0.2;
    const lift = (clampedProgress - 0.5) * 0.2;

    outerRef.current.rotation.set(rotationX, rotationY, 0);
    outerRef.current.position.y = lift;
  });

  return (
    <group ref={outerRef}>
      <group ref={innerRef}>
        {geometries.map((geometry, index) => (
          <mesh key={index} geometry={geometry} material={material} />
        ))}
      </group>
    </group>
  );
}

export default function SigilExtrudedScene({ svgUrl, progress, title, isActive }: SigilExtrudedSceneProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const runtimeState = useSigilRuntimeState();
  const [shapes, setShapes] = useState<THREE.Shape[]>([]);

  const resolvedProgress = progress ?? runtimeState.progress;
  const resolvedIsActive = isActive ?? runtimeState.isActive;

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    let isMounted = true;

    const loadSvg = async () => {
      const response = await fetch(svgUrl);
      const svgText = await response.text();
      const loader = new SVGLoader();
      const data = loader.parse(svgText);
      const nextShapes: THREE.Shape[] = [];

      data.paths.forEach((path) => {
        nextShapes.push(...SVGLoader.createShapes(path));
      });

      if (isMounted) {
        setShapes(nextShapes);
      }
    };

    loadSvg();

    return () => {
      isMounted = false;
    };
  }, [prefersReducedMotion, svgUrl]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div className="sigil-3d__react">
      {title && <p className="sigil-3d__title">{title}</p>}
      <Canvas
        dpr={[1, 1.5]}
        frameloop="demand"
        camera={{ position: [0.3, 0.4, 3.1], fov: 45 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#080a12"]} />
        <ambientLight intensity={0.35} color="#ffffff" />
        <directionalLight position={[2.5, 3.5, 3]} intensity={0.9} color="#f5f7ff" />
        <pointLight position={[-2.5, -1.5, 2.5]} intensity={0.4} color="#c9ccd8" />
        {shapes.length > 0 && (
          <SigilMeshes
            shapes={shapes}
            progress={resolvedProgress}
            isActive={resolvedIsActive}
            prefersReducedMotion={prefersReducedMotion}
          />
        )}
      </Canvas>
    </div>
  );
}
