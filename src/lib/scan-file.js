// Reads a very large text file in chunks so a 100 MB+ list never has to be
// loaded into memory in one piece. Each chunk is handed to the caller whole
// lines only, so a phrase is never split across two callbacks.
export async function readChunks(file, onChunk, { chunkSize = 4 * 1024 * 1024 } = {}) {
  let offset = 0;
  let carry = "";

  while (offset < file.size) {
    const text = await file.slice(offset, Math.min(offset + chunkSize, file.size)).text();
    offset += chunkSize;

    const combined = carry + text;
    const cut = combined.lastIndexOf("\n");
    if (cut === -1) {
      carry = combined;
      continue;
    }
    onChunk(combined.slice(0, cut));
    carry = combined.slice(cut + 1);
  }

  if (carry.trim()) onChunk(carry);
}

// Same chunked read, handed out line by line as a stream: the scanner can start
// working on the first phrase while the rest of a multi-gigabyte file is still
// being read, and only one chunk is ever held in memory.
export async function* readLines(file, { chunkSize = 4 * 1024 * 1024 } = {}) {
  let offset = 0;
  let carry = "";

  while (offset < file.size) {
    const text = await file.slice(offset, Math.min(offset + chunkSize, file.size)).text();
    offset += chunkSize;

    const lines = (carry + text).split("\n");
    carry = lines.pop() ?? "";
    for (const line of lines) yield line;
  }

  if (carry) yield carry;
}