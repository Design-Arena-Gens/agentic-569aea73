"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type GameState = "idle" | "playing" | "won" | "lost";

type Position = {
  x: number;
  y: number;
};

const randomPosition = (): Position => ({
  x: 10 + Math.random() * 80,
  y: 10 + Math.random() * 80,
});

export default function Home() {
  const [state, setState] = useState<GameState>("idle");
  const [position, setPosition] = useState<Position>(() => randomPosition());
  const [timeLeft, setTimeLeft] = useState(12);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [lastTime, setLastTime] = useState<number | null>(null);

  const startTimeRef = useRef<number | null>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const [arenaScale, setArenaScale] = useState(1);

  const mouseSpeedInterval = useMemo(() => {
    if (state !== "playing") {
      return null;
    }

    const baseSpeed = 220;
    return Math.max(75, baseSpeed / arenaScale);
  }, [arenaScale, state]);

  const resetGame = useCallback(() => {
    setState("playing");
    setTimeLeft(12);
    startTimeRef.current = Date.now();
    setPosition(randomPosition());
  }, []);

  useEffect(() => {
    if (state !== "playing") {
      return;
    }

    const interval = setInterval(() => {
      setPosition(randomPosition());
    }, mouseSpeedInterval ?? 180);

    return () => {
      clearInterval(interval);
    };
  }, [state, mouseSpeedInterval]);

  useEffect(() => {
    if (state !== "playing") {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setState("lost");
          setPosition(randomPosition());
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [state]);

  const handleCatch = useCallback(() => {
    if (state !== "playing" || !startTimeRef.current) {
      return;
    }

    const elapsed = Date.now() - startTimeRef.current;
    setLastTime(elapsed);
    setBestTime((previous) => {
      if (previous === null || elapsed < previous) {
        return elapsed;
      }
      return previous;
    });

    setState("won");
  }, [state]);

  const handlePlayClick = useCallback(() => {
    if (state === "idle") {
      resetGame();
      return;
    }

    if (state === "lost" || state === "won") {
      resetGame();
    }
  }, [resetGame, state]);

  const statusMessage = useMemo(() => {
    switch (state) {
      case "idle":
        return "The mouse is quick. Click start and catch it before time runs out.";
      case "playing":
        return `Time left: ${timeLeft}s`;
      case "won":
        return "You got it! Play again and try to beat your time.";
      case "lost":
        return "Too slow! The mouse escaped. Try again.";
      default:
        return "";
    }
  }, [state, timeLeft]);

  useEffect(() => {
    if (state === "won" || state === "lost") {
      startTimeRef.current = null;
    }
  }, [state]);

  useEffect(() => {
    const updateMetrics = () => {
      const arena = arenaRef.current;
      if (!arena) {
        return;
      }

      const rect = arena.getBoundingClientRect();
      const scale = Math.min(
        Math.max((rect.width * rect.height) / (320 * 480), 0.85),
        1.8,
      );
      setArenaScale(scale);
      setPosition((previous) => ({
        x: Math.min(Math.max(previous.x, 8), 92),
        y: Math.min(Math.max(previous.y, 8), 92),
      }));
    };

    updateMetrics();

    const resizeHandler = () => updateMetrics();
    window.addEventListener("resize", resizeHandler);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => updateMetrics());
      if (arenaRef.current) {
        resizeObserver.observe(arenaRef.current);
      }
    }

    return () => {
      window.removeEventListener("resize", resizeHandler);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-gradient-to-br from-slate-900 via-slate-950 to-black px-6 py-12 text-zinc-50">
      <header className="max-w-3xl text-center sm:text-left">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Catch The Mouse
        </h1>
        <p className="mt-4 text-lg text-zinc-300">
          The mouse darts across the room. Only quick reflexes and steady clicks
          will win.
        </p>
      </header>

      <main className="mt-10 flex w-full max-w-3xl flex-1 flex-col gap-8">
        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-sm uppercase tracking-[0.3rem] text-zinc-400">
                Status
              </p>
              <p className="mt-1 text-xl font-semibold text-white">
                {statusMessage}
              </p>
            </div>
            <div className="flex items-center gap-6 text-right">
              <div>
                <p className="text-sm uppercase tracking-[0.3rem] text-zinc-400">
                  Best Time
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {bestTime !== null
                    ? `${(bestTime / 1000).toFixed(2)}s`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3rem] text-zinc-400">
                  Last Catch
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {lastTime !== null ? `${(lastTime / 1000).toFixed(2)}s` : "—"}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handlePlayClick}
            className="inline-flex items-center justify-center self-start rounded-full bg-white px-5 py-2 text-sm font-semibold uppercase tracking-widest text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {state === "playing" ? "Reset" : "Start"}
          </button>
        </section>

        <section
          ref={arenaRef}
          className="relative h-[460px] w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-lg shadow-slate-900/60"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_55%)]" />
          {(state === "playing" || state === "won" || state === "lost") && (
            <button
              type="button"
              onClick={handleCatch}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-amber-400 px-5 py-4 text-base font-bold uppercase tracking-widest text-slate-900 shadow-lg shadow-black/30 transition-transform duration-75 ease-out hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
              }}
            >
              Mouse
            </button>
          )}

          {state === "idle" && (
            <div className="flex h-full items-center justify-center text-center">
              <p className="max-w-md text-base text-zinc-300">
                Press start to unleash the mouse. The target will bounce to a
                new spot every fraction of a second. Snag it before the clock
                burns out.
              </p>
            </div>
          )}

          {state === "won" && (
            <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center text-center text-base font-semibold text-emerald-300">
              Victory! The mouse never saw it coming.
            </div>
          )}

          {state === "lost" && (
            <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center text-center text-base font-semibold text-rose-300">
              The mouse escaped. Reset and hunt again.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
