// Saves the recovery phrases of wallets that hold a balance as a .txt file.
export function downloadFundedPhrases(funded) {
  const body = funded.map((slot) => slot.phrase).join("\n");
  const blob = new Blob([`${body}\n`], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);

  const link = document.createElement("a");
  link.href = url;
  link.download = `funded-phrases-${stamp}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}