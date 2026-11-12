// On-device vault: the recovery phrase is encrypted with AES-GCM using a key
// derived from the user's password (PBKDF2-SHA256). It never leaves the device
// and is never written to the app's database.

const STORAGE_KEY = "helix.vault.v1";
const ITERATIONS = 310000;

function encodeBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(value) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function deriveKey(password, salt) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function readRecord() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function readVaultMeta() {
  const record = readRecord();
  if (!record) return null;
  return { createdAt: record.createdAt, wordCount: record.wordCount };
}

export async function saveVault({ mnemonic, wordCount, password }) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const createdAt = new Date().toISOString();
  const payload = JSON.stringify({ mnemonic, wordCount, createdAt });
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(payload));

  const record = {
    v: 1,
    createdAt,
    wordCount,
    iterations: ITERATIONS,
    salt: encodeBase64(salt),
    iv: encodeBase64(iv),
    data: encodeBase64(new Uint8Array(cipher)),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  return { mnemonic, wordCount, createdAt };
}

export async function openVault(password) {
  const record = readRecord();
  if (!record) throw new Error("No wallet was found on this device.");

  const key = await deriveKey(password, decodeBase64(record.salt));
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: decodeBase64(record.iv) },
      key,
      decodeBase64(record.data),
    );
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    throw new Error("Incorrect password. Try again.");
  }
}

export function clearVault() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}