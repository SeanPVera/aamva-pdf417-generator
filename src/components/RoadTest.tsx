import React from "react";
import { Car, RotateCcw, X } from "lucide-react";
import { useModalShell } from "../hooks/useModalShell";
import {
  CAR_LENGTH,
  CAR_WIDTH,
  CONE_RADIUS,
  CURB_Y,
  FREE_GEAR_CHANGES,
  buildCourse,
  coneStruck,
  inspect,
  polygonsOverlap,
  scoreAttempt,
  stepVehicle,
  vehicleCorners,
  type Controls,
  type RoadTestResult,
  type Vehicle
} from "../core/roadTest";

/**
 * The Road Test.
 *
 * A complete parallel-parking examination bolted onto a barcode generator, for
 * no reason at all. Arrow keys (or the on-screen pad) drive; the examiner sits
 * in the passenger seat with a clipboard and says nothing until the end.
 *
 * The physics, the measurements, and the score sheet all live in core/roadTest
 * so they can be tested without a canvas. This file draws, listens to keys, and
 * runs the clock.
 */

interface RoadTestProps {
  open: boolean;
  onClose: () => void;
  onPassed?: (result: RoadTestResult) => void;
}

/** Screen pixels per foot. The whole course is about 90 feet of curb. */
const PX_PER_FT = 9;
const WORLD_WIDTH_FT = 96;
const WORLD_HEIGHT_FT = 34;
/** Below this speed the vehicle counts as stopped for scoring purposes. */
const STOPPED_SPEED = 0.05;
/** Hold still this long and the examiner writes it down. */
const SETTLE_SECONDS = 1.2;

/** buildCourse is deterministic — the same examination every time, for everyone. */
const COURSE = buildCourse();

type Phase = "briefing" | "driving" | "graded";

export const RoadTest: React.FC<RoadTestProps> = ({ open, onClose, onPassed }) => {
  const dialogRef = useModalShell<HTMLDivElement>({ open, onClose });
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const [phase, setPhase] = React.useState<Phase>("briefing");
  const [result, setResult] = React.useState<RoadTestResult | null>(null);
  const [attempt, setAttempt] = React.useState(1);
  const [hud, setHud] = React.useState({ elapsed: 0, cones: 0, bumps: 0, changes: 0 });

  // Everything the loop mutates lives in refs: re-rendering React at 60 Hz to
  // move a rectangle would be its own kind of examination failure.
  const vehicleRef = React.useRef<Vehicle>({ ...COURSE.start });
  const keysRef = React.useRef(new Set<string>());
  const touchRef = React.useRef<Controls>({ throttle: 0, steer: 0, brake: false });
  const factsRef = React.useRef({
    cones: new Set<number>(),
    bumps: 0,
    gearChanges: 0,
    elapsed: 0,
    signalled: false,
    lastDirection: 0,
    stoppedFor: 0,
    inContact: false
  });

  const resetRun = React.useCallback(() => {
    vehicleRef.current = { ...COURSE.start };
    factsRef.current = {
      cones: new Set<number>(),
      bumps: 0,
      gearChanges: 0,
      elapsed: 0,
      signalled: false,
      lastDirection: 0,
      stoppedFor: 0,
      inContact: false
    };
    keysRef.current.clear();
    touchRef.current = { throttle: 0, steer: 0, brake: false };
    setHud({ elapsed: 0, cones: 0, bumps: 0, changes: 0 });
    setResult(null);
  }, []);

  const finish = React.useCallback(() => {
    const facts = factsRef.current;
    const graded = scoreAttempt({
      inspection: inspect(vehicleRef.current, COURSE),
      conesStruck: facts.cones.size,
      carsBumped: facts.bumps,
      gearChanges: facts.gearChanges,
      elapsedSeconds: facts.elapsed,
      timeLimitSeconds: COURSE.timeLimitSeconds,
      signalled: facts.signalled,
      struckExaminer: false
    });
    setResult(graded);
    setPhase("graded");
    if (graded.passed) onPassed?.(graded);
  }, [onPassed]);

  // Keyboard. Arrow keys and WASD drive — S is reverse, which parallel parking
  // is mostly made of. Space is the brake. L works the turn signal, which the
  // examiner is noting whether you use.
  React.useEffect(() => {
    if (!open || phase !== "driving") return;
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "w", "a", "s", "d", "l"].includes(
          key
        )
      ) {
        e.preventDefault();
      }
      if (key === "l") factsRef.current.signalled = true;
      keysRef.current.add(key);
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [open, phase]);

  // The loop: physics, contact, then paint.
  React.useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();

    const readControls = (): Controls => {
      const keys = keysRef.current;
      const touch = touchRef.current;
      const held = (...names: string[]) => names.some((n) => keys.has(n));
      const throttle = held("arrowup", "w") ? 1 : held("arrowdown", "s") ? -1 : touch.throttle;
      const steer = held("arrowleft", "a") ? -1 : held("arrowright", "d") ? 1 : touch.steer;
      return {
        throttle: throttle as Controls["throttle"],
        steer: steer as Controls["steer"],
        brake: keys.has(" ") || touch.brake
      };
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      {
        const facts = factsRef.current;
        const controls = readControls();
        const previous = vehicleRef.current;
        const next = stepVehicle(previous, controls, dt);

        // Contact with a parked car stops the vehicle where it touched, rather
        // than letting it drive through. Scored on the rising edge only: a
        // driver leaning on the throttle against a bumper is one contact, not
        // one every time a timer lapses.
        const nextCorners = vehicleCorners(next);
        let blocked = false;
        for (const parked of COURSE.parked) {
          if (polygonsOverlap(nextCorners, vehicleCorners(parked))) {
            blocked = true;
            break;
          }
        }
        if (blocked) {
          if (!facts.inContact) {
            facts.bumps += 1;
            facts.inContact = true;
          }
          vehicleRef.current = { ...previous, speed: 0 };
        } else {
          facts.inContact = false;
          vehicleRef.current = next;
        }

        // Cones are scored once each, then stay flattened.
        COURSE.cones.forEach((cone, index) => {
          if (!facts.cones.has(index) && coneStruck(cone, vehicleRef.current)) {
            facts.cones.add(index);
          }
        });

        const direction = Math.sign(vehicleRef.current.speed);
        if (direction !== 0 && direction !== facts.lastDirection) {
          if (facts.lastDirection !== 0) facts.gearChanges += 1;
          facts.lastDirection = direction;
        }

        facts.elapsed += dt;
        facts.stoppedFor =
          Math.abs(vehicleRef.current.speed) < STOPPED_SPEED ? facts.stoppedFor + dt : 0;

        // The examination ends when the vehicle is stopped inside the space, or
        // when the clock runs out. Sitting still in the road is not a result.
        const parked = inspect(vehicleRef.current, COURSE);
        if (
          (facts.stoppedFor > SETTLE_SECONDS && parked.insideSpace && facts.elapsed > 3) ||
          facts.elapsed > COURSE.timeLimitSeconds
        ) {
          finish();
        }
      }

      draw(ctx, canvas, vehicleRef.current, factsRef.current.cones);
      raf = requestAnimationFrame(frame);
    };

    // The briefing and the score sheet are static. Painting them at 60 Hz
    // forever burns a core for nothing, which on a phone is a battery bill for
    // a picture that is not changing.
    if (phase !== "driving") {
      draw(ctx, canvas, vehicleRef.current, factsRef.current.cones);
      return;
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [open, phase, finish]);

  // HUD ticks once a second; the canvas does not wait for React.
  React.useEffect(() => {
    if (!open || phase !== "driving") return;
    const id = window.setInterval(() => {
      const facts = factsRef.current;
      setHud({
        elapsed: Math.floor(facts.elapsed),
        cones: facts.cones.size,
        bumps: facts.bumps,
        changes: facts.gearChanges
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [open, phase]);

  if (!open) return null;

  const startAttempt = () => {
    resetRun();
    setPhase("driving");
  };

  const retry = () => {
    setAttempt((n) => n + 1);
    startAttempt();
  };

  const remaining = Math.max(0, COURSE.timeLimitSeconds - hud.elapsed);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="road-test-title"
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl dark:border-dark-border dark:bg-dark-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-dark-border">
          <h2
            id="road-test-title"
            className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-100"
          >
            <Car size={16} />
            Behind-the-Wheel Examination
            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-normal text-gray-500 dark:bg-dark-surface2 dark:text-gray-400">
              Form BTW-{String(attempt).padStart(2, "0")}
            </span>
          </h2>
          <button
            data-autofocus
            type="button"
            onClick={onClose}
            aria-label="Leave the examination"
            className="rounded p-1 text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-gray-300 dark:hover:bg-dark-surface2"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative overflow-hidden rounded-md border border-gray-200 bg-[#3d4348] dark:border-dark-border">
            <canvas
              ref={canvasRef}
              width={WORLD_WIDTH_FT * PX_PER_FT}
              height={WORLD_HEIGHT_FT * PX_PER_FT}
              className="block w-full"
              role="img"
              aria-label="Parallel parking course: a curb, two parked cars, and four cones"
            />

            {phase === "driving" && (
              <div className="pointer-events-none absolute left-2 top-2 flex gap-2 font-mono text-[11px] text-white/90">
                <span className="rounded bg-black/50 px-1.5 py-0.5">{remaining}s</span>
                <span className="rounded bg-black/50 px-1.5 py-0.5">cones {hud.cones}</span>
                <span className="rounded bg-black/50 px-1.5 py-0.5">contact {hud.bumps}</span>
                <span className="rounded bg-black/50 px-1.5 py-0.5">
                  shifts {hud.changes}/{FREE_GEAR_CHANGES}
                </span>
              </div>
            )}

            {phase === "briefing" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/65 p-6 text-center">
                <p className="max-w-md text-sm text-white/90">
                  Park the vehicle fully between the two parked cars, within one foot of the curb,
                  parallel to it, and come to a complete stop. You have {COURSE.timeLimitSeconds}{" "}
                  seconds and {FREE_GEAR_CHANGES} direction changes.
                </p>
                <p className="text-[11px] text-white/60">
                  Arrow keys or WASD to drive (S reverses) · Space to brake · L to signal
                </p>
                <button
                  type="button"
                  onClick={startAttempt}
                  className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                >
                  Begin examination
                </button>
              </div>
            )}
          </div>

          {/* Below the canvas rather than over it: the sheet is taller than the
              course on a phone, and an overlay would clip the deductions. */}
          {phase === "graded" && result && <ScoreSheet result={result} />}

          {/* Touch pad — the same controls, for anyone taking the test on a
              phone, which is a thing that can now happen. */}
          {phase === "driving" && (
            <div className="mt-3 grid grid-cols-4 gap-2 lg:hidden">
              {(
                [
                  ["Left", () => ({ steer: -1 as const })],
                  ["Fwd", () => ({ throttle: 1 as const })],
                  ["Rev", () => ({ throttle: -1 as const })],
                  ["Right", () => ({ steer: 1 as const })]
                ] as const
              ).map(([label, patch]) => (
                <button
                  key={label}
                  type="button"
                  aria-label={label}
                  onPointerDown={() => {
                    touchRef.current = { ...touchRef.current, ...patch() };
                  }}
                  onPointerUp={() => {
                    touchRef.current = { throttle: 0, steer: 0, brake: false };
                  }}
                  onPointerLeave={() => {
                    touchRef.current = { throttle: 0, steer: 0, brake: false };
                  }}
                  className="select-none rounded-md bg-gray-100 py-3 text-sm font-semibold text-gray-800 active:bg-gray-300 dark:bg-dark-surface2 dark:text-gray-100"
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Decorative. Passing does not alter the barcode, the payload, or your standing with any
              jurisdiction.
            </p>
            <div className="flex gap-2">
              {phase !== "briefing" && (
                <button
                  type="button"
                  onClick={retry}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-dark-border dark:bg-dark-surface2 dark:text-gray-200 dark:hover:bg-[#383838]"
                >
                  <RotateCcw size={12} />
                  Another attempt
                </button>
              )}
              {phase === "driving" && (
                <button
                  type="button"
                  onClick={finish}
                  className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  I&apos;m parked
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function ScoreSheet({ result }: { result: RoadTestResult }) {
  return (
    <div className="mt-3">
      <div className="mx-auto max-w-sm rounded-md border border-gray-300 bg-[#fdfcf5] p-4 text-gray-900 shadow">
        <div className="flex items-baseline justify-between border-b border-dashed border-gray-400 pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            Examiner&apos;s score sheet
          </span>
          <span className="font-mono text-2xl font-bold">{result.grade}</span>
        </div>
        <p
          className={`mt-2 text-sm font-bold ${result.passed ? "text-green-700" : "text-red-700"}`}
          role="status"
        >
          {result.passed ? "PASS" : "FAIL"} · {result.score}/100
        </p>
        <ul className="mt-2 space-y-1 text-xs">
          {result.deductions.length === 0 ? (
            <li className="text-gray-600">No deductions recorded.</li>
          ) : (
            result.deductions.map((d) => (
              <li key={d.id} className="flex justify-between gap-3 border-b border-gray-200 pb-1">
                <span className="text-gray-700">{d.label}</span>
                <span className="shrink-0 font-mono font-semibold text-red-700">
                  {d.points === null ? "AUTO FAIL" : `-${d.points}`}
                </span>
              </li>
            ))
          )}
        </ul>
        <p className="mt-3 border-t border-dashed border-gray-400 pt-2 text-xs italic text-gray-600">
          &ldquo;{result.remark}&rdquo;
        </p>
      </div>
    </div>
  );
}

/** Paints the course. Purely presentational — reads state, changes nothing. */
function draw(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  vehicle: Vehicle,
  flattened: Set<number>
) {
  const toX = (ft: number) => ft * PX_PER_FT;
  // World Y grows away from the curb; screen Y grows downward, so the curb sits
  // at the bottom of the canvas.
  const toY = (ft: number) => canvas.height - ft * PX_PER_FT;

  ctx.fillStyle = "#3d4348";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Sidewalk below the curb line.
  ctx.fillStyle = "#8d9499";
  ctx.fillRect(0, toY(CURB_Y), canvas.width, canvas.height - toY(CURB_Y));
  ctx.strokeStyle = "#e8e4d9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, toY(CURB_Y));
  ctx.lineTo(canvas.width, toY(CURB_Y));
  ctx.stroke();

  // Lane marking.
  ctx.setLineDash([18, 14]);
  ctx.strokeStyle = "#d9c25a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, toY(WORLD_HEIGHT_FT - 6));
  ctx.lineTo(canvas.width, toY(WORLD_HEIGHT_FT - 6));
  ctx.stroke();
  ctx.setLineDash([]);

  // The target space.
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.strokeRect(
    toX(COURSE.spaceStartX),
    toY(CAR_WIDTH + 1),
    toX(COURSE.spaceEndX) - toX(COURSE.spaceStartX),
    CAR_WIDTH * PX_PER_FT + PX_PER_FT
  );
  ctx.setLineDash([]);

  for (const parked of COURSE.parked) drawCar(ctx, parked, "#6b7280", toX, toY);

  COURSE.cones.forEach((cone, index) => {
    ctx.fillStyle = flattened.has(index) ? "#7a3b18" : "#f9711f";
    ctx.beginPath();
    ctx.arc(toX(cone.x), toY(cone.y), CONE_RADIUS * PX_PER_FT, 0, Math.PI * 2);
    ctx.fill();
  });

  drawCar(ctx, vehicle, "#2f6fdb", toX, toY);
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  vehicle: Vehicle,
  color: string,
  toX: (ft: number) => number,
  toY: (ft: number) => number
) {
  const corners = vehicleCorners(vehicle);
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(0,0,0,0.45)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  corners.forEach((corner, index) => {
    const x = toX(corner.x);
    const y = toY(corner.y);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Windscreen, so "which way am I pointing" is answerable at a glance.
  const nose = {
    x: vehicle.x + Math.cos(vehicle.heading) * (CAR_LENGTH / 2 - 2),
    y: vehicle.y + Math.sin(vehicle.heading) * (CAR_LENGTH / 2 - 2)
  };
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.beginPath();
  ctx.arc(toX(nose.x), toY(nose.y), PX_PER_FT * 1.1, 0, Math.PI * 2);
  ctx.fill();
}
