import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format";
import { saveTextFile } from "@/lib/save-text";

/** The full text of one filed document, ready to read, copy or download. */
export default function FileViewer({ file, open, onOpenChange }) {
  const [copied, setCopied] = useState(false);
  if (!file) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // A blocked clipboard leaves the text on screen to select by hand.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86dvh] max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="truncate font-display text-[20px] leading-tight">{file.name}</DialogTitle>
          <DialogDescription className="text-[11px]">
            {file.place} · {formatDateTime(file.created)}
          </DialogDescription>
        </DialogHeader>

        <pre className="max-h-[52dvh] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border/70 bg-secondary/40 p-3 font-mono text-[11px] leading-relaxed">
          {file.content}
        </pre>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 px-3 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={() => saveTextFile(file.name, file.content)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}