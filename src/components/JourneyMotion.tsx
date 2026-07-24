"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

export function JourneyMotion() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = reduced ? null : new Lenis({ duration: 1.05, smoothWheel: true, anchors: true });
    let frame = 0;
    const tick = (time: number) => { lenis?.raf(time); frame = requestAnimationFrame(tick); };
    if (lenis) frame = requestAnimationFrame(tick);
    lenis?.on("scroll", ScrollTrigger.update);

    const context = gsap.context(() => {
      if (!reduced) {
        gsap.from(".record-intro-copy > *", { y: 38, opacity: 0, stagger: .08, duration: .85, ease: "power3.out" });
        gsap.from(".today-card", { y: 45, opacity: 0, duration: 1, delay: .15, ease: "power3.out" });
        gsap.utils.toArray<HTMLElement>(".ledger-archive>article").forEach((day) => {
          gsap.from(day, {
            y: 55,
            opacity: 0,
            stagger: .08,
            duration: .9,
            ease: "power3.out",
            scrollTrigger: { trigger: day, start: "top 78%", once: true },
          });
        });
      }
    });

    return () => { context.revert(); lenis?.destroy(); cancelAnimationFrame(frame); };
  }, []);

  return null;
}
