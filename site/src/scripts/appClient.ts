import barba from "@barba/core";
import Lenis from "lenis";
import { bindLenis, initSigilProgress } from "./sigilProgress";
import { initLanternSection } from "./lanternSection";

let started = false;
let lenis: Lenis | null = null;
let lenisRaf = 0;
let sigilCleanup: (() => void) | null = null;
let lanternCleanup: (() => void) | null = null;
let barbaStarted = false;

const transitionDuration = 300;

function destroyLenis() {
  if (lenisRaf) {
    cancelAnimationFrame(lenisRaf);
    lenisRaf = 0;
  }
  if (lenis) {
    lenis.destroy();
    lenis = null;
  }
}

function initLenis() {
  destroyLenis();
  lenis = new Lenis({
    smoothWheel: true,
    smoothTouch: false,
    lerp: 0.12,
    wheelMultiplier: 1,
    touchMultiplier: 1,
    overscroll: false,
    autoRaf: false,
  });
  bindLenis(lenis);
  const raf = (time: number) => {
    lenis?.raf(time);
    lenisRaf = requestAnimationFrame(raf);
  };
  lenisRaf = requestAnimationFrame(raf);
}

function initPageWiring() {
  if (sigilCleanup) {
    sigilCleanup();
  }
  sigilCleanup = initSigilProgress();

  if (lanternCleanup) {
    lanternCleanup();
  }
  lanternCleanup = initLanternSection();
}

function initBarba() {
  if (barbaStarted) {
    return;
  }
  barbaStarted = true;

  barba.hooks.beforeLeave(() => {
    document.documentElement.classList.add("is-transitioning");
  });

  barba.hooks.afterEnter(() => {
    document.documentElement.classList.remove("is-transitioning");
  });

  barba.hooks.after(() => {
    initLenis();
    initPageWiring();
  });

  barba.init({
    transitions: [
      {
        name: "fade",
        leave({ current }) {
          current.container.style.opacity = "0";
          return new Promise((resolve) => {
            window.setTimeout(resolve, transitionDuration);
          });
        },
        enter({ next }) {
          next.container.style.opacity = "0";
          next.container.style.transition = `opacity ${transitionDuration}ms ease`;
          requestAnimationFrame(() => {
            next.container.style.opacity = "1";
          });
        },
      },
    ],
  });
}

export function initAppClient() {
  if (started) {
    return;
  }
  started = true;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  initPageWiring();

  if (reduce) {
    destroyLenis();
    return;
  }

  initLenis();
  initBarba();
}

initAppClient();
