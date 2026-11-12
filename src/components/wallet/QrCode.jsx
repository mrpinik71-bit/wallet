export default function QrCode({ value, size = 196 }) {
  if (!value) return null;
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&qzone=1&color=0a0b0d&bgcolor=ffffff&data=${encodeURIComponent(
    value,
  )}`;
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