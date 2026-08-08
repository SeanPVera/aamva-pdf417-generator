import React from "react";

/** Field codes worth reading aloud, in the order a clerk would say them. */
const READ_ORDER = [
  "DCS",
  "DAC",
  "DAD",
  "DBB",
  "DBA",
  "DBD",
  "DAG",
  "DAI",
  "DAJ",
  "DAK",
  "DAQ",
  "DCA"
] as const;

const LABELS: Record<string, string> = {
  DCS: "Family name",
  DAC: "First name",
  DAD: "Middle name",
  DBB: "Date of birth",
  DBA: "Expires",
  DBD: "Issued",
  DAG: "Street",
  DAI: "City",
  DAJ: "State",
  DAK: "Postal code",
  DAQ: "License number",
  DCA: "Class"
};

/** "01012029" → "oh one, oh one, twenty twenty-nine" territory, roughly. */
function speakDate(mmddyyyy: string): string {
  if (!/^\d{8}$/.test(mmddyyyy)) return mmddyyyy;
  const mm = mmddyyyy.slice(0, 2);
  const dd = mmddyyyy.slice(2, 4);
  const yyyy = mmddyyyy.slice(4, 8);
  return `${mm.split("").join(" ")}, ${dd.split("").join(" ")}, ${yyyy}`;
}

/** Builds the monotone script a clerk would read back at the window. */
export function buildReadback(json: Record<string, string>): string {
  const lines: string[] = [];
  for (const code of READ_ORDER) {
    const value = json[code];
    if (!value) continue;
    const label = LABELS[code] ?? code;
    const spoken = /^\d{8}$/.test(value) ? speakDate(value) : value;
    lines.push(`${label}. ${spoken}.`);
  }
  if (lines.length === 0) return "";
  lines.push("Next.");
  return lines.join(" ");
}

export interface ClerkVoice {
  supported: boolean;
  speaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
}

/**
 * Reads a payload back in a flat clerk monotone via the Web Speech API.
 * Everything stays on-device; nothing is uploaded. Genuinely useful for
 * proofreading a form you have been staring at for twenty minutes.
 */
export function useClerkVoice(): ClerkVoice {
  const [speaking, setSpeaking] = React.useState(false);
  const supported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance === "function";

  const stop = React.useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = React.useCallback(
    (text: string) => {
      if (!supported || !text) return;
      window.speechSynthesis.cancel();
      const utterance = new window.SpeechSynthesisUtterance(text);
      // Slow and low: the cadence of someone who has said this all morning.
      utterance.rate = 0.85;
      utterance.pitch = 0.7;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [supported]
  );

  // Never leave a voice running after the component goes away.
  React.useEffect(() => stop, [stop]);

  return { supported, speaking, speak, stop };
}
