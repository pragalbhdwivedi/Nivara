type LanternState = {
  lanternProgress?: number;
};

declare global {
  interface Window {
    __nivara?: LanternState;
  }
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function initLanternSection() {
  const section = document.querySelector<HTMLElement>("[data-lantern-section]");
  if (!section) {
    return () => {};
  }

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const state = (window.__nivara = window.__nivara ?? {});
  let rafId = 0;
  let active = false;

  const publish = (progress: number) => {
    state.lanternProgress = progress;
    window.dispatchEvent(new CustomEvent("nivara:lantern-progress", { detail: { progress } }));
  };

  const update = () => {
    rafId = 0;
    if (!active || reduce) {
      return;
    }
    const rect = section.getBoundingClientRect();
    const sectionTop = window.scrollY + rect.top;
    const sectionHeight = rect.height;
    const viewportHeight = window.innerHeight || 1;
    const denom = Math.max(sectionHeight - viewportHeight, 1);
    const progress = clamp01((window.scrollY - sectionTop) / denom);
    publish(progress);
  };

  const requestUpdate = () => {
    if (rafId) {
      return;
    }
    rafId = window.requestAnimationFrame(update);
  };

  const handleIntersect: IntersectionObserverCallback = (entries) => {
    active = Boolean(entries[0]?.isIntersecting);
    if (active) {
      requestUpdate();
      window.addEventListener("scroll", requestUpdate, { passive: true });
      window.addEventListener("resize", requestUpdate);
    } else {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    }
  };

  const observer = new IntersectionObserver(handleIntersect, {
    rootMargin: "0px 0px -15% 0px",
    threshold: 0.1,
  });

  observer.observe(section);

  if (reduce) {
    publish(0);
  }

  return () => {
    observer.disconnect();
    window.removeEventListener("scroll", requestUpdate);
    window.removeEventListener("resize", requestUpdate);
    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }
  };
}
