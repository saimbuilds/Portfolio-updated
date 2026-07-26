"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

export function StoryMotion() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // NOTE: We intentionally ignore prefers-reduced-motion here so animations always
    // run on real devices. The iOS Accessibility setting was silently killing everything.
    // CSS handles reduced motion for decorative effects (see globals.css).
    const reduced = false;

    // Detect touch-only device (real phone/tablet) — Lenis smooth scroll fights
    // native iOS momentum scroll and breaks ScrollTrigger on real devices.
    const isTouchOnly = window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(pointer: fine)").matches;

    const lenis = isTouchOnly ? null : new Lenis({
      duration: 1.25,
      smoothWheel: true,
      wheelMultiplier: 0.78,
      anchors: true,
    });


    let animationFrame = 0;
    let hashTimer = 0;
    let loaderFallback = 0;
    const updateLenis = (time: number) => {
      lenis?.raf(time);
      animationFrame = requestAnimationFrame(updateLenis);
    };
    if (lenis) animationFrame = requestAnimationFrame(updateLenis);
    lenis?.on("scroll", ScrollTrigger.update);

    const interactionCleanups: Array<() => void> = [];
    const soundCue = (detail: "portal" | "resolve" | "tick") => document.dispatchEvent(new CustomEvent("saim:sound", { detail }));
    const searchParams = new URLSearchParams(window.location.search);
    const skipLoader = searchParams.has("skipLoader");
    const showLoader = !reduced && !skipLoader;

    const lockScrollY = window.scrollY;
    const lockScroll = () => {
      document.body.style.position = "fixed";
      document.body.style.top = `-${lockScrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    };
    const unlockScroll = () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, lockScrollY);
    };
    const loader = document.querySelector<HTMLElement>(".cinema-loader");
    if (!showLoader) {
      loader?.classList.add("loader-skip");
    } else {
      loader?.classList.add("loader-show");
      lockScroll();
    }

    // Helper: refresh ScrollTrigger after a delay to let mobile browser chrome settle
    const refreshScrollTrigger = () => {
      // On mobile, the viewport height changes as the browser chrome hides/shows.
      // We need to wait for the layout to settle before refreshing ScrollTrigger.
      // Use a 300ms delay + one extra rAF to ensure we get the final dimensions.
      setTimeout(() => {
        requestAnimationFrame(() => {
          ScrollTrigger.refresh(true);
        });
      }, 300);
    };

    const context = gsap.context(() => {
      // Build the intro timeline regardless — it'll be played after loader or immediately
      const introTimeline = reduced
        ? null
        : gsap.timeline({ paused: true, defaults: { ease: "power4.out" } })
          .from("[data-hero-line]", { yPercent: 110, duration: 1.25, stagger: 0.12 })
          .from("[data-hero-copy]", { y: 24, opacity: 0, duration: 0.75, stagger: 0.08 }, "-=0.75")
          .from("[data-product-frame]", { xPercent: 20, yPercent: 12, rotate: 8, opacity: 0, duration: 1.05 }, "-=0.8");

      if (!reduced) {
        if (showLoader) {
          let loaderFinished = false;
          const finishLoader = () => {
            if (loaderFinished) return;
            loaderFinished = true;
            if (loaderFallback) window.clearTimeout(loaderFallback);
            unlockScroll();
            loader?.classList.add("loader-skip");
            if (loader) loader.style.display = "none";
            introTimeline?.play(0);
            refreshScrollTrigger();
          };

          // Always set fallback timer FIRST so animation errors never block the site
          loaderFallback = window.setTimeout(finishLoader, 3200);

          try {
            const loaderTimeline = gsap.timeline({ onComplete: finishLoader });
            const inkStrokes = gsap.utils.toArray<SVGPathElement>(".loader-draw-path");
            const portalDot = document.querySelector<SVGCircleElement>(".loader-portal-dot");
            const portalField = document.querySelector<HTMLElement>(".loader-portal-field");

            inkStrokes.forEach((stroke) => {
              let length = 600;
              try {
                length = stroke.getTotalLength() || 600;
              } catch {
                length = 600;
              }
              gsap.set(stroke, { strokeDasharray: `${length + 2} ${length + 2}`, strokeDashoffset: length + 2 });
            });

            inkStrokes.forEach((stroke) => {
              let length = 600;
              try {
                length = stroke.getTotalLength() || 600;
              } catch {
                length = 600;
              }
              loaderTimeline.set(stroke, { opacity: 1 });
              loaderTimeline.to(stroke, {
                strokeDashoffset: 0,
                duration: Math.max(.16, length / 800),
                ease: "none",
              });
            });

            if (portalDot && portalField) {
              let matrix: DOMMatrix | null = null;
              try {
                matrix = portalDot.getScreenCTM();
              } catch {
                matrix = null;
              }

              const dotX = Number(portalDot.getAttribute("cx") || "696");
              const dotY = Number(portalDot.getAttribute("cy") || "198");
              const screenX = (matrix && typeof matrix.a === "number") ? (matrix.a * dotX + matrix.c * dotY + matrix.e) : window.innerWidth / 2;
              const screenY = (matrix && typeof matrix.b === "number") ? (matrix.b * dotX + matrix.d * dotY + matrix.f) : window.innerHeight / 2;
              const coverScale = Number.isFinite(screenX) && Number.isFinite(screenY)
                ? Math.hypot(
                    Math.max(screenX, window.innerWidth - screenX),
                    Math.max(screenY, window.innerHeight - screenY),
                  ) / 9 + 4
                : 200;
              gsap.set(portalField, { left: screenX - 9, top: screenY - 9, scale: 0 });

              loaderTimeline
                .to(portalDot, { attr: { r: 9 }, duration: .16, ease: "power2.out" })
                .to({}, { duration: .32 })
                .set(portalField, { scale: 1 })
                .set(portalDot, { visibility: "hidden" })
                .to(portalField, { scale: coverScale, backgroundColor: "#a7bdc1", duration: 1.08, ease: "power3.inOut", force3D: true })
                .to({}, { duration: .1 })
                .set(".cinema-loader-wash", { opacity: 0 });
            }
          } catch {
            finishLoader();
          }
        } else {
          // No loader — play hero intro immediately then refresh ScrollTrigger
          introTimeline?.play(0);
          refreshScrollTrigger();
        }

        const heroTimeline = gsap.timeline({
          scrollTrigger: { trigger: ".cinema-hero", start: "top top", end: "bottom top", scrub: 1.15 },
        });
        heroTimeline
          .to(".cinema-hero h1", { xPercent: -11, opacity: 0.08, scale: 0.92, ease: "none" }, 0)
          .to(".hero-media", { xPercent: -48, yPercent: -14, scale: 1.72, rotate: 0, ease: "none" }, 0)
          .to(".hero-intro", { y: -90, opacity: 0, ease: "none" }, 0)
          .to(".today-now", { yPercent: -45, opacity: 0, ease: "none" }, 0.1);

        gsap.timeline({
          scrollTrigger: { trigger: ".zoom-bridge", start: "top bottom", end: "bottom top", scrub: 1 },
        })
          .fromTo(".zoom-word span", { scale: 0.5, letterSpacing: "-.16em" }, { scale: 1.45, letterSpacing: "-.08em", ease: "none" }, 0)
          .fromTo(".zoom-word i", { rotate: -120, scale: 0.5 }, { rotate: 120, scale: 1.1, ease: "none" }, 0);

        const horizontalTween = gsap.to(".horizontal-track", {
          x: () => -window.innerWidth * 3,
          ease: "none",
          scrollTrigger: {
            trigger: ".horizontal-story",
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });

        gsap.to(".horizontal-progress i", {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".horizontal-story",
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        });

        gsap.from(".panel-opening h2", {
          xPercent: 18,
          scale: 0.88,
          opacity: 0,
          scrollTrigger: { trigger: ".panel-opening", containerAnimation: horizontalTween, start: "left 85%", end: "center center", scrub: 1 },
        });
        gsap.from(".product-window", {
          rotate: -13,
          scale: 0.62,
          yPercent: 35,
          scrollTrigger: { trigger: ".panel-product", containerAnimation: horizontalTween, start: "left 85%", end: "center center", scrub: 1 },
        });
        gsap.from(".proof-number", {
          scale: 0.55,
          transformOrigin: "left center",
          scrollTrigger: { trigger: ".panel-proof-new", containerAnimation: horizontalTween, start: "left 85%", end: "center center", scrub: 1 },
        });
        gsap.from(".pitch-place strong", {
          scale: 0.42,
          rotate: -8,
          transformOrigin: "left bottom",
          scrollTrigger: { trigger: ".panel-pitch", containerAnimation: horizontalTween, start: "left 85%", end: "center center", scrub: 1 },
        });
        gsap.from(".panel-pitch h2", {
          xPercent: 30,
          opacity: 0,
          scrollTrigger: { trigger: ".panel-pitch", containerAnimation: horizontalTween, start: "left 78%", end: "center center", scrub: 1 },
        });
        gsap.from(".pitch-ticket", {
          yPercent: 75,
          rotate: 14,
          scrollTrigger: { trigger: ".panel-pitch", containerAnimation: horizontalTween, start: "left 70%", end: "center center", scrub: 1 },
        });

        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
          gsap.from(element, {
            y: 50,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 86%", once: true },
          });
        });

        gsap.fromTo("[data-statement]", { scale: 0.78, xPercent: 12 }, {
          scale: 1,
          xPercent: 0,
          ease: "none",
          scrollTrigger: { trigger: ".vertical-statement", start: "top bottom", end: "70% 55%", scrub: 1.1 },
        });

        gsap.to(".statement-orbit > i", {
          rotate: 240,
          ease: "none",
          scrollTrigger: { trigger: ".vertical-statement", start: "top bottom", end: "bottom top", scrub: 1 },
        });

        const networkTimeline = gsap.timeline({
          scrollTrigger: { trigger: ".network-story", start: "top top", end: "bottom bottom", scrub: 1.15 },
        });
        networkTimeline
          .to("[data-network-copy]", { yPercent: -16, opacity: 0, duration: 0.28, ease: "power2.in" }, 0.18)
          .fromTo("[data-network-field]", { scale: 0.82, y: 70, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.42, ease: "power3.out" }, 0.48)
          .from(".conversation-card", { y: 70, rotateY: -7, opacity: 0, stagger: .055, duration: 0.3, ease: "power3.out" }, 0.5)
          .to("[data-network-field]", { scale: 1.015, duration: 0.18, ease: "sine.inOut" }, 0.86);

        const portrait = document.querySelector<HTMLElement>("[data-portrait]");
        const orbitTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: ".portrait-story",
            start: "top top",
            end: "bottom bottom",
            scrub: 1.2,
            onEnter: () => soundCue("portal"),
            onEnterBack: () => soundCue("portal"),
            onLeave: () => soundCue("resolve"),
            onLeaveBack: () => soundCue("resolve"),
          },
        });
        orbitTimeline
          .to("[data-portrait-copy]", { xPercent: 14, opacity: 0, duration: .1, ease: "power2.in" }, 0)
          .to(portrait, {
            x: () => {
              const rect = portrait?.getBoundingClientRect();
              return rect ? window.innerWidth / 2 - (rect.left + rect.width / 2) : 0;
            },
            y: () => {
              const rect = portrait?.getBoundingClientRect();
              return rect ? window.innerHeight / 2 - (rect.top + rect.height / 2) : 0;
            },
            scale: window.innerWidth < 800 ? .72 : .58,
            rotate: 0,
            duration: .2,
            ease: "power2.inOut",
          }, .02)
          .fromTo("[data-identity-orbit]", { autoAlpha: 0 }, { autoAlpha: 1, duration: .11, ease: "power2.out" }, .07)
          .to("[data-orbit-rings]", { rotate: 150, scale: 1.14, duration: .83, ease: "none" }, .12)
          .fromTo(".orbit-beat-one", { xPercent: 42, z: -260, rotateY: -12, opacity: 0 }, { xPercent: 0, z: 0, rotateY: 0, opacity: 1, duration: .13, ease: "power3.out" }, .18)
          .to(".orbit-beat-one", { xPercent: -30, z: 180, opacity: 0, duration: .1, ease: "power2.in" }, .34)
          .fromTo(".orbit-beat-two", { yPercent: 38, z: -260, rotateX: 10, opacity: 0 }, { yPercent: 0, z: 0, rotateX: 0, opacity: 1, duration: .13, ease: "power3.out" }, .38)
          .to(".orbit-beat-two", { yPercent: -28, z: 180, opacity: 0, duration: .1, ease: "power2.in" }, .54)
          .fromTo(".orbit-beat-three", { xPercent: -38, z: -260, rotateY: 12, opacity: 0 }, { xPercent: 0, z: 0, rotateY: 0, opacity: 1, duration: .13, ease: "power3.out" }, .58)
          .to(".orbit-beat-three", { xPercent: 25, z: 180, opacity: 0, duration: .1, ease: "power2.in" }, .74)
          .to(portrait, { scale: .34, opacity: 0, duration: .12, ease: "power2.in" }, .72)
          .fromTo("[data-orbit-exit]", { scale: .68, opacity: 0 }, { scale: 1, opacity: 1, duration: .18, ease: "power3.out" }, .78);

        gsap.from(".daily-summary > div", {
          y: 60,
          stagger: 0.1,
          scrollTrigger: { trigger: ".daily-summary", start: "top 84%", end: "bottom 72%", scrub: 0.7 },
        });

        if (window.matchMedia("(pointer: fine)").matches) {
          document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((node) => {
            const move = (event: PointerEvent) => {
              const rect = node.getBoundingClientRect();
              gsap.to(node, {
                x: (event.clientX - rect.left - rect.width / 2) * 0.12,
                y: (event.clientY - rect.top - rect.height / 2) * 0.12,
                duration: 0.35,
                ease: "power2.out",
              });
            };
            const leave = () => gsap.to(node, { x: 0, y: 0, duration: 0.65, ease: "elastic.out(1,.35)" });
            node.addEventListener("pointermove", move);
            node.addEventListener("pointerleave", leave);
            interactionCleanups.push(() => {
              node.removeEventListener("pointermove", move);
              node.removeEventListener("pointerleave", leave);
            });
          });

          const vexilotLink = document.querySelector<HTMLElement>("[data-vexilot-link]");
          const vexilotCursor = document.querySelector<HTMLElement>(".vexilot-cursor");
          if (vexilotLink && vexilotCursor) {
            const cursorX = gsap.quickTo(vexilotCursor, "x", { duration: .28, ease: "power3.out" });
            const cursorY = gsap.quickTo(vexilotCursor, "y", { duration: .28, ease: "power3.out" });
            const move = (event: PointerEvent) => { cursorX(event.clientX); cursorY(event.clientY); };
            const enter = () => {
              vexilotCursor.classList.add("is-active");
              gsap.to(vexilotCursor, { scale: 1, duration: .38, ease: "power3.out", overwrite: "auto" });
              soundCue("tick");
            };
            const leave = () => {
              vexilotCursor.classList.remove("is-active");
              gsap.to(vexilotCursor, { scale: .25, duration: .22, ease: "power2.out", overwrite: "auto" });
            };
            const cursorBoundary = ScrollTrigger.create({
              trigger: ".zoom-bridge",
              start: "top bottom",
              end: "bottom top",
              onLeave: leave,
              onLeaveBack: leave,
            });
            vexilotLink.addEventListener("pointermove", move);
            vexilotLink.addEventListener("pointerenter", enter);
            vexilotLink.addEventListener("pointerleave", leave);
            vexilotLink.addEventListener("pointercancel", leave);
            window.addEventListener("scroll", leave, { passive: true });
            window.addEventListener("blur", leave);
            interactionCleanups.push(() => {
              cursorBoundary.kill();
              vexilotLink.removeEventListener("pointermove", move);
              vexilotLink.removeEventListener("pointerenter", enter);
              vexilotLink.removeEventListener("pointerleave", leave);
              vexilotLink.removeEventListener("pointercancel", leave);
              window.removeEventListener("scroll", leave);
              window.removeEventListener("blur", leave);
            });
          }
        }
      }

      // ScrollTrigger is refreshed after animations via refreshScrollTrigger() above
    });

    // const target = window.location.hash ? document.getElementById(window.location.hash.slice(1)) : null;
    const refreshOnLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", refreshOnLoad);
    window.addEventListener("orientationchange", refreshOnLoad);

    const target = window.location.hash ? document.getElementById(window.location.hash.slice(1)) : null;
    if (target) {
      hashTimer = window.setTimeout(() => {
        if (lenis) lenis.scrollTo(target, { immediate: true });
        else target.scrollIntoView();
        ScrollTrigger.refresh();
      }, 120);
    }

    // return () => {
    //   context.revert();
    //   lenis?.destroy();
    //   cancelAnimationFrame(animationFrame);
    //   window.clearTimeout(hashTimer);
    //   window.clearTimeout(loaderFallback);
    //   document.body.style.overflow = "";
    //   interactionCleanups.forEach((cleanup) => cleanup());
    // };
    return () => {
      context.revert();
      lenis?.destroy();
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(hashTimer);
      window.clearTimeout(loaderFallback);
      window.removeEventListener("load", refreshOnLoad);
      window.removeEventListener("orientationchange", refreshOnLoad);
      unlockScroll();
      interactionCleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}
