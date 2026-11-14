import { useCallback, useEffect, useRef, useState } from "react";

// Voice for the home assistant: speech-to-text through the browser's own
// recogniser, and spoken replies through speechSynthesis. Both are optional —
// where they are missing the chat still works with typing.
export default function useSpeech({ onFinal } = {}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const recognition = useRef(null);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(Boolean(SpeechRecognition));
    if (!SpeechRecognition) return undefined;

    const instance = new SpeechRecognition();
    instance.interimResults = false;
    instance.maxAlternatives = 1;
    instance.lang = navigator.language || "en-US";
    instance.onresult = (event) => {
      const text = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(" ")
        .trim();
      if (text) onFinalRef.current?.(text);
    };
    instance.onend = () => setListening(false);
    instance.onerror = () => setListening(false);
    recognition.current = instance;

    return () => {
      try {
        instance.abort();
      } catch {
        // already stopped
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  const toggle = useCallback(() => {
    const instance = recognition.current;
    if (!instance) return;
    if (listening) {
      instance.stop();
      return;
    }
    try {
      instance.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [listening]);

  const speak = useCallback(
    (text) => {
      if (typeof window === "undefined" || !window.speechSynthesis || !voiceOn || !text) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[#*_`]/g, ""));
      utterance.lang = navigator.language || "en-US";
      window.speechSynthesis.speak(utterance);
    },
    [voiceOn],
  );

  return { supported, listening, voiceOn, setVoiceOn, toggle, speak };
}