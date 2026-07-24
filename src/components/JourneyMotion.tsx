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
        gsap.from(".journey-hero h1 span", { yPercent: 110, stagger: .12, duration: 1.1, ease: "power4.out" });
        gsap.from(".journey-calendar a", { y: 45, opacity: 0, stagger: .04, duration: .7, ease: "power3.out" });
        gsap.utils.toArray<HTMLElement>(".journey-day").forEach((day) => {
          gsap.from(day.querySelectorAll("[data-day-reveal]"), {
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
