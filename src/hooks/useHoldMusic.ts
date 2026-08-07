import React from "react";

// A tinny hold-music loop, synthesized rather than shipped as an asset — same
// approach as useClickClack, so the app stays offline-capable and adds nothing
// to the bundle. Purely decorative.

/** A short, deeply mediocre phrase in A minor. [semitone offset, beats]. */
const PHRASE: Array<[number, number]> = [
  [0, 1],
  [3, 1],
  [7, 1],
  [3, 1],
  [5, 1],
  [3, 1],
  [0, 2]
];

const BASE_HZ = 220; // A3
const BEAT_MS = 260;

export const HOLD_CAPTIONS = [
  "Your barcode is important to us. Please remain in the queue.",
  "Did you know? Most forms can be completed online.",
  "An agent will be with you shortly.",
  "Please have your document discriminator ready.",
  "Your estimated wait time is… less than this sentence."
];

export interface HoldMusic {
  start: () => void;
  stop: () => void;
  caption: string;
}

/**
 * Plays a looping hold-music phrase while a long job runs, with a rotating
 * caption. Cuts off mid-phrase on stop, exactly like the real thing.
 */
export function useHoldMusic(enabled: boolean): HoldMusic {
  const ctxRef = React.useRef<AudioContext | null>(null);
  const timerRef = React.useRef<number | undefined>(undefined);
  const captionTimerRef = React.useRef<number | undefined>(undefined);
  const [caption, setCaption] = React.useState(HOLD_CAPTIONS[0]!);

  const stop = React.useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (captionTimerRef.current) window.clearInterval(captionTimerRef.current);
    timerRef.current = undefined;
    captionTimerRef.current = undefined;
    const ctx = ctxRef.current;
    if (ctx && ctx.state !== "closed") {
      void ctx.close();
    }
    ctxRef.current = null;
  }, []);

  const start = React.useCallback(() => {
    if (!enabled) return;
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      stop();
      const ctx = new Ctor();
      ctxRef.current = ctx;

      let index = 0;
      const playNext = () => {
        const current = ctxRef.current;
        if (!current || current.state === "closed") return;
        const step = PHRASE[index % PHRASE.length]!;
        const [semitone, beats] = step;
        const now = current.currentTime;
        const durationS = (beats * BEAT_MS) / 1000;

        const osc = current.createOscillator();
        const gain = current.createGain();
        // Square wave through a low-pass: the sound of a speaker the size of a
        // postage stamp.
        osc.type = "square";
        osc.frequency.setValueAtTime(BASE_HZ * Math.pow(2, semitone / 12), now);
        const filter = current.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(900, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.03, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + durationS * 0.9);
        osc.connect(filter).connect(gain).connect(current.destination);
        osc.start(now);
        osc.stop(now + durationS);

        index++;
        timerRef.current = window.setTimeout(playNext, beats * BEAT_MS);
      };
      playNext();

      captionTimerRef.current = window.setInterval(() => {
        setCaption((c) => {
          const next = (HOLD_CAPTIONS.indexOf(c) + 1) % HOLD_CAPTIONS.length;
          return HOLD_CAPTIONS[next]!;
        });
      }, 4000);
    } catch {
      // Audio unavailable in this context — the job still runs.
    }
  }, [enabled, stop]);

  React.useEffect(() => stop, [stop]);

  return { start, stop, caption };
}
