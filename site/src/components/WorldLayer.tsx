import { useEffect, useMemo, useRef, useState } from "react";
import LanternScene from "./three/LanternScene";
import SigilScene from "./three/SigilScene";
import WorldMapScene from "./three/WorldMapScene";
import usePrefersReducedMotion from "./three/usePrefersReducedMotion";

type SceneKey = "lantern" | "sigil" | "worldmap";

type Props = {
  scene: SceneKey;
};

const sceneMap: Record<SceneKey, () => JSX.Element> = {
  lantern: () => <LanternScene />,
  sigil: () => <SigilScene />,
  worldmap: () => <WorldMapScene />,
};

export default function WorldLayer({ scene }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();

  const Scene = useMemo(() => sceneMap[scene] ?? null, [scene]);

  useEffect(() => {
    const target = containerRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handler = () => {
      setIsActive(document.visibilityState === "visible");
    };
    handler();
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  if (!Scene || !isVisible || !isActive || prefersReducedMotion) {
    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
  }

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <Scene />
    </div>
  );
}
