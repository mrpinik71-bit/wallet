// Timers that only count while the page is on screen.
//
// A locked phone or an app that was switched away from slows timers down to a
// crawl, and they all fire at once the moment the page comes back — which used
// to write off reads that were still waiting their turn and turn a run left in
// the background into a page of failed chains. The scan's clocks now stop while
// the page is hidden and pick up where they left off when it returns, so a run
// keeps its full patience while the user is somewhere else.

const timers = new Set();
let watching = false;

export const pageHidden = () =>
  typeof document !== "undefined" && document.visibilityState === "hidden";

function onVisibility() {
  const hidden = pageHidden();
  for (const timer of Array.from(timers)) {
    if (hidden) timer.pause();
    else timer.resume();
  }
}

function watch() {
  if (watching || typeof document === "undefined") return;
  watching = true;
  document.addEventListener("visibilitychange", onVisibility);
}

/**
 * A timeout that pauses while the page is hidden. Returns a handle with stop()
 * so a read that already settled never fires its timeout later.
 */
export function visibleTimeout(fn, ms) {
  let left = Math.max(0, ms);
  let startedAt = 0;
  let handle = null;
  let finished = false;

  const timer = {
    resume() {
      if (finished || handle !== null) return;
      startedAt = Date.now();
      handle = setTimeout(() => {
        handle = null;
        finished = true;
        timers.delete(timer);
        fn();
      }, left);
    },
    pause() {
      if (finished || handle === null) return;
      clearTimeout(handle);
      handle = null;
      left = Math.max(0, left - (Date.now() - startedAt));
    },
    stop() {
      finished = true;
      if (handle !== null) clearTimeout(handle);
      handle = null;
      timers.delete(timer);
    },
  };

  watch();
  timers.add(timer);
  if (!pageHidden()) timer.resume();
  return timer;
}