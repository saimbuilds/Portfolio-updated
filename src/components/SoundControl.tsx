"use client";

import { useEffect, useRef, useState } from "react";

type Cue = "unlock" | "portal" | "resolve" | "tick";

export function SoundControl() {
  const [enabled, setEnabled] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);

  function tone(frequency: number, duration: number, volume: number, delay = 0, endFrequency = frequency) {
    const context = contextRef.current;
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime + delay);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, context.currentTime + delay + duration);
    filter.type = "lowpass";
    filter.frequency.value = 540;
    gain.gain.setValueAtTime(0.0001, context.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + delay + Math.min(.025, duration / 3));
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + duration);
    oscillator.connect(filter).connect(gain).connect(context.destination);
    oscillator.start(context.currentTime + delay);
    oscillator.stop(context.currentTime + delay + duration + 0.05);
  }

  function noise(duration: number, volume: number, fromFrequency: number, toFrequency: number, delay = 0) {
    const context = contextRef.current;
    if (!context) return;
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    filter.type = "lowpass";
    filter.Q.value = .7;
    filter.frequency.setValueAtTime(fromFrequency, context.currentTime + delay);
    filter.frequency.exponentialRampToValueAtTime(toFrequency, context.currentTime + delay + duration);
    gain.gain.setValueAtTime(0.0001, context.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + delay + Math.min(.035, duration / 3));
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + duration);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start(context.currentTime + delay);
  }

  function play(cue: Cue) {
    if (cue === "unlock") {
      noise(.075, .032, 2400, 520);
      tone(155, .18, .025, .015, 105);
    }
    if (cue === "portal") {
      noise(1.1, .027, 140, 1450);
      tone(67, .82, .038, .04, 54);
    }
    if (cue === "resolve") {
      noise(.24, .018, 750, 180);
      tone(96, .34, .026, 0, 72);
    }
    if (cue === "tick") noise(.045, .018, 2600, 900);
  }

  useEffect(() => {
    const handleCue = (event: Event) => {
      if (!enabled) return;
      play((event as CustomEvent<Cue>).detail);
    };
    document.addEventListener("saim:sound", handleCue);
    return () => document.removeEventListener("saim:sound", handleCue);
  }, [enabled]);

  async function toggle() {
    if (!contextRef.current) contextRef.current = new window.AudioContext();
    if (contextRef.current.state !== "running") await contextRef.current.resume();
    const next = !enabled;
    setEnabled(next);
    if (next) play("unlock");
  }

  return <button className={`sound-control ${enabled ? "is-on" : ""}`} onClick={toggle} type="button" aria-pressed={enabled} title={enabled ? "Mute website sound" : "Enable website sound"}><i />SOUND {enabled ? "ON" : "OFF"}</button>;
}
