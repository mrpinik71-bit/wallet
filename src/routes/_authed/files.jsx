import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";
import FileRow from "@/components/files/FileRow";
import PageHeader from "@/components/wallet/PageHeader";
import { deleteFile, listFiles, listPlaces } from "@/lib/file-store";

export const Route = createFileRoute("/_authed/files")({
  head: () => ({
    meta: [
      { title: "Files — Helix" },
      {
        name: "description",
        content: "Everything the assistant writes and uploads for you, filed in one place on this device.",
      },
    ],
  }),
  component: Files,
});

function Files() {
  const [files, setFiles] = useState([]);
  const [place, setPlace] = useState("all");

  // The list follows the agent: an upload made from any screen shows up here too.
  useEffect(() => {
    const sync = () => setFiles(listFiles());
    sync();
    window.addEventListener("helix:files", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("helix:files", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const places = useMemo(() => listPlaces(files), [files]);
  const shown = place === "all" ? files : files.filter((item) => item.place === place);

  return (
    <>
      <PageHeader
        eyebrow="Assistant"
        title="Files"
        description="Ask the agent to write anything — a note, a plan, code, a table — and name the place to file it. It uploads straight away, no questions asked."
      />

      {files.length ? (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {["all", ...places].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPlace(item)}
              className={`rounded-full border px-2.5 py-1 text-[10.5px] transition-colors ${
                place === item
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border/70 text-muted-foreground hover:text-foreground"
              }`}
            >
              {item === "all" ? "All files" : item}
            </button>
          ))}
        </div>
      ) : null}

      {shown.length ? (
        <div className="space-y-2">
          {shown.map((file) => (
            <FileRow key={file.id} file={file} onDelete={deleteFile} />
          ))}
        </div>
      ) : (
        <div className="panel flex flex-col items-center gap-2 px-5 py-12 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <FolderOpen className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <p className="text-sm font-medium">Nothing filed yet</p>
          <p className="max-w-xs text-[11.5px] leading-relaxed text-muted-foreground">
            Try: “Write a 20-line plan and upload it to Notes/plan.md”. It lands here seconds later.
          </p>
        </div>
      )}
    </>
  );
}