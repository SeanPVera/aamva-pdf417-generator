// Flavor text for "Gus", the whimsical pixel DMV-clerk mascot. Entirely
// decorative. Quips are bucketed by the mascot's mood so the line matches what
// the form is doing.

export type ClerkMood = "idle" | "happy" | "error" | "asleep" | "break";

const QUIPS: Record<ClerkMood, string[]> = {
  idle: [
    "Now serving… you! Take your time.",
    "Pro tip: the DCS field never forgets a face.",
    "I've seen a thousand barcodes. None as promising as yours.",
    "Fun fact: PDF417 has 417 in the name. Bet you can guess why.",
    "No line today. A DMV miracle."
  ],
  happy: [
    "Stamped, sealed, scannable. Beautiful work.",
    "That barcode is cleaner than my coffee mug.",
    "Approved! Tell your friends about the short line.",
    "Chef's kiss. Or should I say… clerk's kiss.",
    "Ten out of ten. No appointment needed."
  ],
  error: [
    "Hmm. That field's giving me paperwork flashbacks.",
    "Close! A couple of fields need another look.",
    "I can't stamp that yet — check the red squiggles.",
    "Even the best of us mis-key a date. Try again.",
    "The form gods demand one more required field."
  ],
  asleep: [
    "Zzz… wake me when there's a barcode…",
    "Five more minutes… the queue can wait…",
    "Dreaming of a paperless DMV…",
    "Zzz… next… zzz…"
  ],
  break: [
    "Window closed. Back in fifteen. Possibly twenty.",
    "On break. The other window is also on break.",
    "Stepped out. The sign is load-bearing.",
    "…fine. You can be my last one today."
  ]
};

/**
 * Returns a deterministic quip for a mood given a numeric seed (so the line
 * only changes when the caller wants it to, not on every render).
 */
export function getClerkQuip(mood: ClerkMood, seed = 0): string {
  const list = QUIPS[mood];
  const idx = Math.abs(Math.trunc(seed)) % list.length;
  return list[idx] ?? list[0]!;
}

export function clerkQuipCount(mood: ClerkMood): number {
  return QUIPS[mood].length;
}
