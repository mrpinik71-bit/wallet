import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { X } from "lucide-react";

// Camera QR reader. Reports the first decoded payload and stops the stream.
export default function QrScanner({ open, onClose, onResult }) {
  const videoRef = useRef(null);
  const resultRef = useRef(onResult);
  const [error, setError] = useState("");

  resultRef.current = onResult;

  useEffect(() => {
    if (!open) return undefined;
    let stream = null;
    let frame = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    const scan = () => {
      if (stopped) return;
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(image.data, image.width, image.height, { inversionAttempts: "dontInvert" });
        if (code?.data) {
          stopped = true;
          resultRef.current(code.data);
          return;
        }
      }
      frame = requestAnimationFrame(scan);
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (stopped) return;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        scan();
      } catch {
        setError("Camera access was blocked. Allow the camera or paste the address instead.");
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-5 pt-5">
        <p className="text-[13px] font-medium text-white">Scan address</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close scanner"
          className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-6">
        <div className="relative aspect-square w-full max-w-[320px] overflow-hidden rounded-3xl bg-black ring-1 ring-white/15">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-primary/80" />
        </div>
      </div>

      <p className="px-8 pb-10 text-center text-[12px] leading-relaxed text-white/60">
        {error || "Point the camera at a wallet QR code. The address fills in automatically."}
      </p>
    </div>
  );
}