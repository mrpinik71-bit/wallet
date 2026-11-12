import { useEffect, useState } from "react";
import QRCode from "qrcode";

// Renders the QR locally so an address is never sent to a third-party service.
export default function QrCode({ value, size = 196 }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let active = true;
    if (!value) {
      setSrc(null);
      return undefined;
    }
    QRCode.toDataURL(value, {
      margin: 1,
      width: size * 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0a0b0d", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => {
        if (active) setSrc(null);
      });
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!src) {
    return <div style={{ width: size, height: size }} className="animate-pulse rounded-2xl bg-white/10" />;
  }

  return (
    <img
      src={src}
      alt="Wallet address QR code"
      width={size}
      height={size}
      className="rounded-2xl bg-white p-2.5"
    />
  );
}