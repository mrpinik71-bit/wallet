import { useEffect, useRef, useState } from "react";
import { Activity, Gauge, Layers, Timer } from "lucide-react";

// Throughput history: the last few seconds of speed, drawn as small bars.
const BARS = 26;
const SAMPLE_MS = 400;
const STALL_MS = 2500;

const pad = (value) => String(value).padStart(2, "0");

function clock(seconds) {
  const total = Math.max(0, Math.round(seconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  return hours ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${pad(minutes)}:${pad(rest)}`;
}

function speed(value) {
  if (!value || value <= 0) return "—";
  if (value >= 1) return `${Math.round(value).toLocaleString("en-US")}/s`;
  return `${(value * 60).toFixed(1)}/min`;
}

const Metric = ({ icon: Icon, label, value, hint }) => (
  <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] px-2.5 py-2">
    <p className="flex items-center gap-1 text-[8px] font-medium uppercase tracking-[0.16em] text-muted-foreground/55">
      <Icon className="h-2.5 w-2.5" strokeWidth={2} />
      {label}
    </p>
    <p className="mt-1 truncate text-[12.5px] font-semibold num text-foreground">{value}</p>
    {hint ? <p className="mt-0.5 truncate text-[9px] num text-muted-foreground/50">{hint}</p> : null}
  </div>
);

export default function ScanLivePanel({ completed = 0, total = 0, started = 0, elapsed = 0, batch, finished }) {
  // Live speed: the processed counter is sampled as it moves, so the number on
  // screen is what the scan is doing right now, not an average since start.
  const [rate, setRate] = useState(0);
  const [history, setHistory] = useState([]);
  const lastRef = useRef(null);

  useEffect(() => {
    const now = Date.now();
    const last = lastRef.current;
    if (!last) {
      lastRef.current = { at: now, completed };
      return;
    }
    const span = (now - last.at) / 1000;
    if (span * 1000 < SAMPLE_MS) return;
    lastRef.current = { at: now, completed };
    const next = Math.max(0, (completed - last.completed) / span);
    setRate(next);
    setHistory((list) => [...list, next].slice(-BARS));
  }, [completed]);

  // A batch waiting on a busy node makes no progress: the speed drops to zero
  // instead of freezing on the last value it had.
  useEffect(() => {
    if (finished) return undefined;
    const id = setInterval(() => {
      const last = lastRef.current;
      if (last && Date.now() - last.at > STALL_MS) setRate(0);
    }, 1000);
    return () => clearInterval(id);
  }, [finished]);

  const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const average = elapsed > 0 ? completed / elapsed : 0;
  const shown = finished ? average : rate;
  const inflight = Math.max(0, started - completed);
  const remaining = total > 0 ? Math.max(0, total - completed) : 0;
  const eta = !finished && remaining && rate > 0 ? remaining / rate : 0;

  const batchTotal =
    batch && total > 0 ? Math.max(batch.number, Math.ceil(total / Math.max(1, batch.size))) : 0;
  const peak = Math.max(1, ...history);
  const bars = Array.from({ length: BARS }, (_, index) => {
    const value = history[index] ?? 0;
    return Math.max(3, Math.round((value / peak) * 100));
  });

  return (
    <section className="relative overflow-hidden rounded-[18px] border border-foreground/[0.08] bg-foreground/[0.025] p-3.5">
      <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-primary/10 blur-2xl" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground/70">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                finished ? "bg-muted-foreground/45" : "animate-pulse bg-primary"
              }`}
            />
            {finished ? "Scan complete" : "Live scan"}
          </span>
          <span className="rounded-full border border-foreground/[0.08] bg-foreground/[0.02] px-2 py-0.5 text-[9.5px] font-medium num text-muted-foreground/75">
            {clock(elapsed)}
          </span>
        </div>

        <div className="mt-2.5 flex items-end justify-between gap-3">
          <div>
            <p className="font-display text-[30px] leading-none num text-foreground">{speed(shown)}</p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-muted-foreground/55">
              {finished ? "average speed" : "wallets per second"}
            </p>
          </div>
          <div className="flex h-9 items-end gap-[3px]">
            {bars.map((height, index) => (
              <span
                key={index}
                className={`w-[3px] rounded-full ${
                  index === BARS - 1 && !finished ? "bg-primary" : "bg-primary/45"
                }`}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline justify-between text-[10px] num">
            <span className="font-medium text-foreground/85">
              {completed.toLocaleString("en-US")}
              <span className="text-muted-foreground/55">
                {" "}
                / {total ? total.toLocaleString("en-US") : "…"}
              </span>
            </span>
            <span className="font-medium text-primary/90">{total ? `${percent}%` : ""}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.07]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-[width] duration-300"
              style={{ width: `${total ? percent : finished ? 100 : 6}%` }}
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <Metric
            icon={Layers}
            label="Batch"
            value={batch ? `#${batch.number.toLocaleString("en-US")}` : "—"}
            hint={batchTotal ? `of ${batchTotal.toLocaleString("en-US")}` : "preparing"}
          />
          <Metric
            icon={Activity}
            label="Wallets in batch"
            value={batch ? `${batch.from.toLocaleString("en-US")}–${batch.to.toLocaleString("en-US")}` : "—"}
            hint={batch ? `${batch.size.toLocaleString("en-US")} wallets` : "no batch yet"}
          />
          <Metric
            icon={Gauge}
            label="Being checked"
            value={inflight.toLocaleString("en-US")}
            hint="in flight now"
          />
          <Metric
            icon={Timer}
            label={finished ? "Total time" : "Time left"}
            value={finished ? clock(elapsed) : eta ? clock(eta) : "—"}
            hint={finished ? "scan finished" : total ? `${remaining.toLocaleString("en-US")} to go` : "counting"}
          />
        </div>
      </div>
    </section>
  );
}