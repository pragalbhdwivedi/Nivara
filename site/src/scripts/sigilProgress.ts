let callbacks = new Set<(progress: number) => void>();
let rafPending = false;
let lastProgress = -1;

export function getScrollProgress01(): number {
  const doc = document.documentElement;
  const scrollTop = window.scrollY || doc.scrollTop || 0;
  const maxScroll = Math.max(doc.scrollHeight - window.innerHeight, 0);
  if (maxScroll === 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, scrollTop / maxScroll));
}

function publish(progress: number) {
  if (progress === lastProgress) {
    return;
  }
  lastProgress = progress;
  document.documentElement.style.setProperty("--sigil-progress", progress.toString());
  callbacks.forEach((cb) => cb(progress));
}

function scheduleUpdate() {
  if (rafPending) {
    return;
  }
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    publish(getScrollProgress01());
  });
}

export function onProgress(callback: (progress: number) => void) {
  callbacks.add(callback);
  return () => callbacks.delete(callback);
}

export function initSigilProgress() {
  scheduleUpdate();
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  return () => {
    window.removeEventListener("scroll", scheduleUpdate);
    window.removeEventListener("resize", scheduleUpdate);
  };
}

export function bindLenis(lenis: { on: (event: string, cb: () => void) => void }) {
  if (!lenis || typeof lenis.on !== "function") {
    return;
  }
  lenis.on("scroll", scheduleUpdate);
}
