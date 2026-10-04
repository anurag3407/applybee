"use client";

import { useEffect } from "react";

/**
 * Marketing scroll + reveal motion (§9).
 * - Lenis owns marketing-page scroll smoothing only; never app/editor scroll.
 * - GSAP + ScrollTrigger own section entrances (12–20 px + opacity).
 * - Everything is progressive enhancement: HTML is readable before JS, and
 *   `.js-motion` classes are added only after successful setup — copy is
 *   never permanently hidden.
 * - prefers-reduced-motion disables Lenis, reveals, and spatial effects.
 */
export function MarketingMotion() {
  useEffect(() => {
    const reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      // Mobile may use native scroll by default (§9.3).
      window.innerWidth < 768;
    if (reduced) return;

    let cleanup: Array<() => void> = [];
    let cancelled = false;

    (async () => {
      try {
        document.documentElement.classList.add("js-motion");

        const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
          import("lenis"),
        ]);
        if (cancelled) return;

        gsap.registerPlugin(ScrollTrigger);

        // Lenis driven by GSAP's ticker (single RAF strategy, §9.3).
        const lenis = new Lenis({ duration: 0.9, smoothWheel: true });
        lenis.on("scroll", ScrollTrigger.update);
        const tickerFn = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tickerFn);
        gsap.ticker.lagSmoothing(0);

        const reveals = gsap.utils.toArray<HTMLElement>('[data-motion="reveal"]');
        for (const el of reveals) {
          const tween = gsap.fromTo(
            el,
            { opacity: 0, y: 16 },
            {
              opacity: 1,
              y: 0,
              duration: 0.55,
              ease: "power2.out",
              scrollTrigger: { trigger: el, start: "top 88%", once: true },
              onStart: () => el.classList.add("is-revealed"),
            },
          );
          cleanup.push(() => tween.scrollTrigger?.kill());
        }

        // Stagger groups: children with data-motion="stagger-item".
        const groups = gsap.utils.toArray<HTMLElement>('[data-motion="stagger"]');
        for (const group of groups) {
          const items = group.querySelectorAll<HTMLElement>('[data-motion="stagger-item"]');
          if (items.length === 0) continue;
          const tween = gsap.fromTo(
            items,
            { opacity: 0, y: 14 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.08,
              ease: "power2.out",
              scrollTrigger: { trigger: group, start: "top 85%", once: true },
            },
          );
          cleanup.push(() => tween.scrollTrigger?.kill());
        }

        // Reduced-motion changing mid-session kills everything safely (§9.4).
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const onReducedChange = (e: MediaQueryListEvent) => {
          if (e.matches) {
            gsap.globalTimeline.clear();
            ScrollTrigger.getAll().forEach((t) => t.kill());
            lenis.destroy();
            document.documentElement.classList.remove("js-motion");
            document.querySelectorAll('[data-motion="reveal"]').forEach((el) => {
              (el as HTMLElement).style.opacity = "1";
              (el as HTMLElement).style.transform = "none";
            });
          }
        };
        mq.addEventListener("change", onReducedChange);

        cleanup.push(() => {
          mq.removeEventListener("change", onReducedChange);
          gsap.ticker.remove(tickerFn);
          lenis.destroy();
          ScrollTrigger.getAll().forEach((t) => t.kill());
          document.documentElement.classList.remove("js-motion");
        });
      } catch {
        // Enhancement failed: content stays fully visible.
        document.documentElement.classList.remove("js-motion");
      }
    })();

    return () => {
      cancelled = true;
      cleanup.forEach((fn) => fn());
    };
  }, []);

  return null;
}
