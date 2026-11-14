import { useState } from "react";
import { Check, Copy, Download, FileText, Trash2 } from "lucide-react";
import FileViewer from "@/components/files/FileViewer";
import { textBytes } from "@/lib/file-store";
import { formatBytes, formatDateTime } from "@/lib/format";
import { saveTextFile } from "@/lib/save-text";

/** One filed document: opens to read, and can be copied, downloaded or removed. */
export default function FileRow({ file, onDelete }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // A blocked clipboard leaves the viewer as the way to the text.
    }
  };

  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-border/70 bg-card px-3 py-2.5">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open ${file.name}`}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/25"
      >
        <FileText className="h-4 w-4" strokeWidth={1.8} />
      </button>

      <button type="button" onClick={() => setOpen(true)} className="min-w-0 flex-1 text-left">
        <p className="truncate text-[12.5px] font-medium">{file.name}</p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {file.place} · {formatBytes(textBytes(file.content))} · {formatDateTime(file.created)}
        </p>
      </button>

      <div className="flex shrink-0 items-center gap-0.5 text-muted-foreground">
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${file.name}`}
          className="rounded-lg p-1.5 transition-colors hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => saveTextFile(file.name, file.content)}
          aria-label={`Download ${file.name}`}
          className="rounded-lg p-1.5 transition-colors hover:text-foreground"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(file.id)}
          aria-label={`Delete ${file.name}`}
          className="rounded-lg p-1.5 transition-colors hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <FileViewer file={file} open={open} onOpenChange={setOpen} />
    </div>
  );
}