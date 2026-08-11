// The Road Test.
//
// Nothing in this file has anything to do with generating a PDF417 barcode.
// It is a complete parallel-parking examination: a kinematic bicycle-model
// vehicle, a curb, two parked cars, four traffic cones, and an examiner with a
// clipboard who deducts points in the itemised, joyless fashion of the real
// thing. It exists because a DMV app without a road test is just a form.
//
// Everything here is pure and frame-rate independent so it can be unit tested
// without a canvas: `stepVehicle` advances physics by a time delta, `inspect`
// measures the parked result, and `scoreAttempt` turns those measurements into
// a score sheet. The component only draws what these functions decide.

/** All distances are in feet, all angles in radians, all times in seconds. */
export interface Vehicle {
  /** Geometric centre of the vehicle. */
  x: number;
  y: number;
  /** 0 points along +X (down the road); positive rotates toward +Y. */
  heading: number;
  /** Signed — negative is reverse, which is how parallel parking works. */
  speed: number;
  /** Front-wheel angle, clamped to MAX_STEER. */
  steer: number;
}

export interface Controls {
  /** -1 reverse, 0 coast, 1 forward. */
  throttle: -1 | 0 | 1;
  /** -1 left, 0 centre, 1 right. */
  steer: -1 | 0 | 1;
  brake: boolean;
}

export interface Point {
  x: number;
  y: number;
}

/** A 1990s municipal sedan. Handles like a sofa, which is the point. */
export const CAR_LENGTH = 16;
export const CAR_WIDTH = 6.5;
export const WHEELBASE = 9.4;

export const MAX_STEER = 0.58;
export const STEER_RATE = 1.9;
export const STEER_RETURN = 2.6;
export const MAX_SPEED = 7;
export const ACCELERATION = 5.5;
export const BRAKE_DECEL = 12;
export const ROLLING_DRAG = 2.2;

/** Curb sits at y = 0; the roadway is +Y. Mount it and the examiner notices. */
export const CURB_Y = 0;

/** Space between the two parked cars — generous, then it stops feeling generous. */
export const SPACE_LENGTH = 24;

export interface Course {
  /** The two cars you are parking between. */
  parked: Vehicle[];
  /** Cones, as centre points; each has CONE_RADIUS. */
  cones: Point[];
  /** X range of the legal space, measured along the curb. */
  spaceStartX: number;
  spaceEndX: number;
  /** Where the candidate's vehicle starts. */
  start: Vehicle;
  /** Total examination time before the examiner gives up on you. */
  timeLimitSeconds: number;
}

export const CONE_RADIUS = 0.7;

/** Builds the standard course. Deterministic — the exam is the same every time. */
export function buildCourse(): Course {
  const laneY = CAR_WIDTH / 2 + 0.5;
  const spaceStartX = 24;
  const spaceEndX = spaceStartX + SPACE_LENGTH;

  return {
    parked: [
      {
        x: spaceStartX - CAR_LENGTH / 2 - 0.5,
        y: laneY,
        heading: 0,
        speed: 0,
        steer: 0
      },
      {
        x: spaceEndX + CAR_LENGTH / 2 + 0.5,
        y: laneY,
        heading: 0,
        speed: 0,
        steer: 0
      }
    ],
    cones: [
      { x: spaceStartX, y: laneY + CAR_WIDTH / 2 + 2.2 },
      { x: spaceEndX, y: laneY + CAR_WIDTH / 2 + 2.2 },
      { x: spaceStartX - 9, y: laneY + CAR_WIDTH + 4.5 },
      { x: spaceEndX + 9, y: laneY + CAR_WIDTH + 4.5 }
    ],
    spaceStartX,
    spaceEndX,
    start: {
      x: spaceEndX + CAR_LENGTH / 2 + 2,
      y: laneY + CAR_WIDTH + 1.5,
      heading: Math.PI,
      speed: 0,
      steer: 0
    },
    timeLimitSeconds: 150
  };
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Advances the vehicle by `dt` seconds using a kinematic bicycle model: the
 * rear axle follows the heading, the front wheel steers, and the turn radius
 * falls out of the wheelbase. Slow and deliberate, exactly like the real thing.
 */
export function stepVehicle(vehicle: Vehicle, controls: Controls, dt: number): Vehicle {
  const step = clamp(dt, 0, 0.1);

  let steer = vehicle.steer;
  if (controls.steer === 0) {
    // Wheels self-centre when you let go, at a rate that makes you work for it.
    const decay = STEER_RETURN * step;
    steer = Math.abs(steer) <= decay ? 0 : steer - Math.sign(steer) * decay;
  } else {
    steer = clamp(steer + controls.steer * STEER_RATE * step, -MAX_STEER, MAX_STEER);
  }

  let speed = vehicle.speed;
  if (controls.brake) {
    const decel = BRAKE_DECEL * step;
    speed = Math.abs(speed) <= decel ? 0 : speed - Math.sign(speed) * decel;
  } else if (controls.throttle !== 0) {
    speed = clamp(speed + controls.throttle * ACCELERATION * step, -MAX_SPEED / 2, MAX_SPEED);
  } else {
    const drag = ROLLING_DRAG * step;
    speed = Math.abs(speed) <= drag ? 0 : speed - Math.sign(speed) * drag;
  }

  const heading = vehicle.heading + (speed / WHEELBASE) * Math.tan(steer) * step;

  return {
    x: vehicle.x + speed * Math.cos(heading) * step,
    y: vehicle.y + speed * Math.sin(heading) * step,
    heading,
    speed,
    steer
  };
}

/** The four corners of a vehicle's footprint, counter-clockwise. */
export function vehicleCorners(vehicle: Vehicle, length = CAR_LENGTH, width = CAR_WIDTH): Point[] {
  const cos = Math.cos(vehicle.heading);
  const sin = Math.sin(vehicle.heading);
  const halfL = length / 2;
  const halfW = width / 2;
  return [
    [halfL, halfW],
    [-halfL, halfW],
    [-halfL, -halfW],
    [halfL, -halfW]
  ].map(([dx, dy]) => ({
    x: vehicle.x + (dx as number) * cos - (dy as number) * sin,
    y: vehicle.y + (dx as number) * sin + (dy as number) * cos
  }));
}

function projectionRange(points: Point[], axis: Point): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const p of points) {
    const dot = p.x * axis.x + p.y * axis.y;
    if (dot < min) min = dot;
    if (dot > max) max = dot;
  }
  return [min, max];
}

/** Separating-axis test for two convex polygons. */
export function polygonsOverlap(a: Point[], b: Point[]): boolean {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const current = poly[i]!;
      const next = poly[(i + 1) % poly.length]!;
      const axis = { x: -(next.y - current.y), y: next.x - current.x };
      const length = Math.hypot(axis.x, axis.y);
      if (length === 0) continue;
      axis.x /= length;
      axis.y /= length;
      const [minA, maxA] = projectionRange(a, axis);
      const [minB, maxB] = projectionRange(b, axis);
      if (maxA < minB || maxB < minA) return false;
    }
  }
  return true;
}

/** Closest distance from a point to a convex polygon; 0 when inside. */
export function distanceToPolygon(point: Point, polygon: Point[]): number {
  let inside = true;
  let best = Infinity;

  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % polygon.length]!;
    const edgeX = b.x - a.x;
    const edgeY = b.y - a.y;
    const cross = edgeX * (point.y - a.y) - edgeY * (point.x - a.x);
    if (cross < 0) inside = false;

    const lengthSq = edgeX * edgeX + edgeY * edgeY;
    const t =
      lengthSq === 0
        ? 0
        : clamp(((point.x - a.x) * edgeX + (point.y - a.y) * edgeY) / lengthSq, 0, 1);
    const dx = point.x - (a.x + t * edgeX);
    const dy = point.y - (a.y + t * edgeY);
    best = Math.min(best, Math.hypot(dx, dy));
  }

  return inside ? 0 : best;
}

/** True when a cone's circle touches the vehicle's footprint. */
export function coneStruck(cone: Point, vehicle: Vehicle): boolean {
  return distanceToPolygon(cone, vehicleCorners(vehicle)) <= CONE_RADIUS;
}

export interface ParkInspection {
  /** Distance from the curb to the nearest point of the vehicle. */
  curbDistanceFt: number;
  /** How far off parallel, in degrees, 0–90. */
  headingErrorDeg: number;
  /** Both bumpers between the parked cars. */
  insideSpace: boolean;
  /** Any part of the vehicle over the curb line. */
  onCurb: boolean;
}

/** Measures a stopped vehicle against the course, the way an examiner would. */
export function inspect(vehicle: Vehicle, course: Course): ParkInspection {
  const corners = vehicleCorners(vehicle);
  const minY = Math.min(...corners.map((c) => c.y));
  const minX = Math.min(...corners.map((c) => c.x));
  const maxX = Math.max(...corners.map((c) => c.x));

  // Heading folded into [0, 90] — parked backwards is still parallel.
  const normalized = Math.abs(((vehicle.heading % Math.PI) + Math.PI) % Math.PI);
  const headingErrorDeg = (Math.min(normalized, Math.PI - normalized) * 180) / Math.PI;

  return {
    curbDistanceFt: Math.max(0, minY - CURB_Y),
    headingErrorDeg,
    insideSpace: minX >= course.spaceStartX - 0.25 && maxX <= course.spaceEndX + 0.25,
    onCurb: minY < CURB_Y
  };
}

export interface AttemptFacts {
  inspection: ParkInspection;
  conesStruck: number;
  carsBumped: number;
  gearChanges: number;
  elapsedSeconds: number;
  timeLimitSeconds: number;
  /** Signalling before pulling out of traffic. Nobody remembers. */
  signalled: boolean;
  /** Reserved for the one outcome that ends the examination immediately. */
  struckExaminer: boolean;
}

export interface Deduction {
  id: string;
  label: string;
  /** Points removed. `null` means automatic failure. */
  points: number | null;
}

export interface RoadTestResult {
  score: number;
  passed: boolean;
  deductions: Deduction[];
  /** Letter grade for the certificate. */
  grade: string;
  /** The examiner's one-line remark. Delivered flatly. */
  remark: string;
}

export const PASSING_SCORE = 70;

/** Maximum permitted forward/reverse changes before it stops being parking. */
export const FREE_GEAR_CHANGES = 3;

/** Curb distance the examination actually asks for. */
export const MAX_CURB_DISTANCE_FT = 1;

const PASS_REMARKS = [
  "Adequate. The state thanks you for your restraint.",
  "Parked. Not beautifully, but parked.",
  "Acceptable. Please pull forward and do not celebrate.",
  "That will do. Next window, please."
];

const FAIL_REMARKS = [
  "Please schedule another appointment. The next opening is in March.",
  "The vehicle is technically parked. The space is not.",
  "I have seen worse. I have also seen a cone survive.",
  "Take the written test again. It cannot hurt."
];

/**
 * Turns a completed attempt into a score sheet. Deterministic: the same facts
 * always produce the same deductions, which is more than can be said for the
 * real examination.
 */
export function scoreAttempt(facts: AttemptFacts): RoadTestResult {
  const deductions: Deduction[] = [];
  let automaticFail = false;

  if (facts.struckExaminer) {
    deductions.push({ id: "examiner", label: "Struck the examiner", points: null });
    automaticFail = true;
  }

  if (!facts.inspection.insideSpace) {
    deductions.push({
      id: "outside-space",
      label: "Vehicle not within the designated space",
      points: null
    });
    automaticFail = true;
  }

  if (facts.elapsedSeconds > facts.timeLimitSeconds) {
    deductions.push({ id: "time", label: "Exceeded the time allowed", points: null });
    automaticFail = true;
  }

  if (facts.inspection.onCurb) {
    deductions.push({ id: "curb", label: "Mounted the curb", points: 20 });
  }

  const over = facts.inspection.curbDistanceFt - MAX_CURB_DISTANCE_FT;
  if (over > 0) {
    // 5 points per additional half-foot from the curb, capped at 20 so a bad
    // distance doesn't out-weigh actually hitting something.
    const points = Math.min(20, Math.ceil(over / 0.5) * 5);
    deductions.push({
      id: "curb-distance",
      label: `${facts.inspection.curbDistanceFt.toFixed(1)} ft from the curb (limit ${MAX_CURB_DISTANCE_FT})`,
      points
    });
  }

  if (facts.inspection.headingErrorDeg > 10) {
    deductions.push({
      id: "angle",
      label: `Parked ${Math.round(facts.inspection.headingErrorDeg)}° off parallel`,
      points: facts.inspection.headingErrorDeg > 25 ? 20 : 10
    });
  }

  if (facts.conesStruck > 0) {
    deductions.push({
      id: "cones",
      label: `Struck ${facts.conesStruck} cone${facts.conesStruck === 1 ? "" : "s"}`,
      points: facts.conesStruck * 15
    });
  }

  if (facts.carsBumped > 0) {
    deductions.push({
      id: "contact",
      label: `Contact with ${facts.carsBumped} parked vehicle${facts.carsBumped === 1 ? "" : "s"}`,
      points: facts.carsBumped * 25
    });
  }

  const extraChanges = Math.max(0, facts.gearChanges - FREE_GEAR_CHANGES);
  if (extraChanges > 0) {
    deductions.push({
      id: "gear-changes",
      label: `${facts.gearChanges} direction changes (${FREE_GEAR_CHANGES} allowed)`,
      points: extraChanges * 5
    });
  }

  if (!facts.signalled) {
    deductions.push({ id: "signal", label: "Failed to signal before manoeuvring", points: 5 });
  }

  const lost = deductions.reduce((sum, d) => sum + (d.points ?? 0), 0);
  const score = automaticFail ? 0 : Math.max(0, 100 - lost);
  const passed = !automaticFail && score >= PASSING_SCORE;

  // Deterministic remark selection — same sheet, same deadpan.
  const pool = passed ? PASS_REMARKS : FAIL_REMARKS;
  const remark = pool[(score + deductions.length) % pool.length]!;

  return { score, passed, deductions, grade: gradeFor(score, passed), remark };
}

function gradeFor(score: number, passed: boolean): string {
  if (!passed) return "F";
  if (score >= 95) return "A";
  if (score >= 85) return "B";
  if (score >= 75) return "C";
  return "D";
}
