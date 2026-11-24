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
export async function* readLines(file, { chunkSize = 4 * 1024 * 1024, onBytes } = {}) {
  let offset = 0;
  let carry = "";
  // A file saved with Windows/old-Mac line endings is split on those too, and a
  // file that has no line break at all is handed on in pieces: holding it whole
  // in `carry` grew past the browser's string limit and the read failed outright.
  const MAX_LINE = 512 * 1024;

  while (offset < file.size) {
    const slice = file.slice(offset, Math.min(offset + chunkSize, file.size));
    let text;
    // One retry: a huge file on a slow or network drive can fail a single read
    // without the file itself being unreadable.
    try {
      text = await slice.text();
    } catch {
      text = await slice.text();
    }
    offset = Math.min(offset + chunkSize, file.size);
    onBytes?.(offset);

    const lines = (carry + text).replace(/\r\n?/g, "\n").split("\n");
    carry = lines.pop() ?? "";
    for (const line of lines) yield line;
    if (carry.length > MAX_LINE) {
      yield carry;
      carry = "";
    }
  }

  if (carry) yield carry;
}