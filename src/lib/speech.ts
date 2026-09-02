import type { VoiceConfig } from "@/lib/types";

let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve([]);
  }
  if (voicesReady) return voicesReady;
  voicesReady = new Promise((resolve) => {
    const read = () => speechSynthesis.getVoices();
    const now = read();
    if (now.length) {
      resolve(now);
      return;
    }
    const done = () => {
      speechSynthesis.removeEventListener("voiceschanged", done);
      resolve(read());
    };
    speechSynthesis.addEventListener("voiceschanged", done);
    window.setTimeout(() => resolve(read()), 1500);
  });
  return voicesReady;
}

export function warmVoices() {
  void loadVoices();
}

function pickVoice(
  voices: SpeechSynthesisVoice[],
  preferredNames: string[],
  lang: string,
): SpeechSynthesisVoice | null {
  for (const name of preferredNames) {
    const exact = voices.find((v) => v.name === name);
    if (exact) return exact;
    const partial = voices.find((v) => v.name.includes(name));
    if (partial) return partial;
  }
  const want = lang.replace("_", "-").toLowerCase();
  return (
    voices.find((v) => v.lang.replace("_", "-").toLowerCase() === want) ??
    voices.find((v) =>
      v.lang.replace("_", "-").toLowerCase().startsWith(want.slice(0, 2)),
    ) ??
    null
  );
}

export async function speakFromFile(text: string | undefined, voice: VoiceConfig) {
  const line = text?.trim();
  if (!line) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const voices = await loadVoices();
  const picked = pickVoice(voices, voice.preferredNames, voice.lang);
  const u = new SpeechSynthesisUtterance(line);
  if (picked) u.voice = picked;
  u.lang = picked?.lang || voice.lang;
  u.pitch = voice.pitch;
  u.rate = voice.rate;
  u.volume = voice.volume;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

export function hush() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
}

export function line(voice: VoiceConfig, key: string): string | undefined {
  return voice.script[key];
}
