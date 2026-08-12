import { describe, it, expect } from "vitest";
import {
  CAR_LENGTH,
  CAR_WIDTH,
  CURB_Y,
  FREE_GEAR_CHANGES,
  MAX_SPEED,
  MAX_STEER,
  PASSING_SCORE,
  buildCourse,
  coneStruck,
  distanceToPolygon,
  inspect,
  polygonsOverlap,
  scoreAttempt,
  stepVehicle,
  vehicleCorners,
  type AttemptFacts,
  type Controls,
  type Vehicle
} from "../core/roadTest";

const AT_REST: Vehicle = { x: 0, y: 10, heading: 0, speed: 0, steer: 0 };
const COAST: Controls = { throttle: 0, steer: 0, brake: false };

function drive(vehicle: Vehicle, controls: Controls, seconds: number, dt = 1 / 60): Vehicle {
  let current = vehicle;
  for (let t = 0; t < seconds; t += dt) current = stepVehicle(current, controls, dt);
  return current;
}

describe("stepVehicle", () => {
  it("accelerates forward and rolls to a stop when you let off", () => {
    const moving = drive(AT_REST, { ...COAST, throttle: 1 }, 1);
    expect(moving.speed).toBeGreaterThan(1);
    expect(moving.x).toBeGreaterThan(AT_REST.x);

    const stopped = drive(moving, COAST, 5);
    expect(stopped.speed).toBe(0);
  });

  it("caps forward speed and holds reverse to half of it", () => {
    expect(drive(AT_REST, { ...COAST, throttle: 1 }, 10).speed).toBeCloseTo(MAX_SPEED, 5);
    expect(drive(AT_REST, { ...COAST, throttle: -1 }, 10).speed).toBeCloseTo(-MAX_SPEED / 2, 5);
  });

  it("brakes to a dead stop without reversing through zero", () => {
    const moving = drive(AT_REST, { ...COAST, throttle: 1 }, 1);
    expect(drive(moving, { ...COAST, brake: true }, 2).speed).toBe(0);
  });

  it("clamps the steering angle and lets the wheels self-centre", () => {
    const cranked = drive(AT_REST, { ...COAST, steer: 1 }, 5);
    expect(cranked.steer).toBeCloseTo(MAX_STEER, 5);
    expect(drive(cranked, COAST, 3).steer).toBe(0);
  });

  // Steering with no speed is how you look like you know what you're doing.
  it("only changes heading while the vehicle is moving", () => {
    const parked = drive(AT_REST, { ...COAST, steer: 1 }, 2);
    expect(parked.heading).toBeCloseTo(AT_REST.heading, 10);

    const turning = drive(
      { ...AT_REST, steer: MAX_STEER },
      { throttle: 1, steer: 1, brake: false },
      2
    );
    expect(Math.abs(turning.heading)).toBeGreaterThan(0.1);
  });

  it("reverses the turn direction when backing up, like a real car", () => {
    const held: Controls = { throttle: 0, steer: 1, brake: false };
    const base = { ...AT_REST, steer: MAX_STEER };
    const forward = stepVehicle({ ...base, speed: 2 }, held, 0.1);
    const backward = stepVehicle({ ...base, speed: -2 }, held, 0.1);
    expect(forward.heading).toBeGreaterThan(0);
    expect(backward.heading).toBeLessThan(0);
  });

  it("ignores an absurd time delta rather than teleporting", () => {
    const jumped = stepVehicle({ ...AT_REST, speed: MAX_SPEED }, COAST, 1000);
    expect(jumped.x - AT_REST.x).toBeLessThan(MAX_SPEED);
  });
});

describe("geometry", () => {
  it("puts the corners where an axis-aligned car's corners belong", () => {
    const corners = vehicleCorners({ ...AT_REST, x: 0, y: 0 });
    expect(Math.max(...corners.map((c) => c.x))).toBeCloseTo(CAR_LENGTH / 2, 6);
    expect(Math.max(...corners.map((c) => c.y))).toBeCloseTo(CAR_WIDTH / 2, 6);
  });

  it("detects overlap only when polygons actually intersect", () => {
    const a = vehicleCorners({ ...AT_REST, x: 0, y: 0 });
    expect(polygonsOverlap(a, vehicleCorners({ ...AT_REST, x: 2, y: 0 }))).toBe(true);
    expect(polygonsOverlap(a, vehicleCorners({ ...AT_REST, x: 40, y: 0 }))).toBe(false);
    // Rotated far enough that axis-aligned bounds would lie about it.
    expect(
      polygonsOverlap(a, vehicleCorners({ ...AT_REST, x: 12, y: 8, heading: Math.PI / 2 }))
    ).toBe(false);
  });

  it("measures distance to a polygon and reports zero inside it", () => {
    const poly = vehicleCorners({ ...AT_REST, x: 0, y: 0 });
    expect(distanceToPolygon({ x: 0, y: 0 }, poly)).toBe(0);
    expect(distanceToPolygon({ x: 20, y: 0 }, poly)).toBeCloseTo(20 - CAR_LENGTH / 2, 6);
  });

  it("counts a cone as struck only when the car reaches it", () => {
    const car = { ...AT_REST, x: 0, y: 0 };
    expect(coneStruck({ x: 8, y: 0 }, car)).toBe(true);
    expect(coneStruck({ x: 12, y: 0 }, car)).toBe(false);
  });
});

describe("inspect", () => {
  const course = buildCourse();
  const centreX = (course.spaceStartX + course.spaceEndX) / 2;

  it("passes a textbook park", () => {
    const result = inspect(
      { x: centreX, y: CURB_Y + CAR_WIDTH / 2 + 0.5, heading: 0, speed: 0, steer: 0 },
      course
    );
    expect(result.insideSpace).toBe(true);
    expect(result.curbDistanceFt).toBeCloseTo(0.5, 5);
    expect(result.headingErrorDeg).toBeCloseTo(0, 5);
    expect(result.onCurb).toBe(false);
  });

  it("notices a car hanging out of the space", () => {
    const result = inspect(
      { x: course.spaceEndX, y: CURB_Y + CAR_WIDTH / 2 + 0.5, heading: 0, speed: 0, steer: 0 },
      course
    );
    expect(result.insideSpace).toBe(false);
  });

  it("notices a car up on the curb", () => {
    const result = inspect({ x: centreX, y: 1, heading: 0, speed: 0, steer: 0 }, course);
    expect(result.onCurb).toBe(true);
    expect(result.curbDistanceFt).toBe(0);
  });

  // Parked facing the other way is still parallel; the examiner measures angle,
  // not opinion.
  it("folds the heading so pointing backwards still reads as parallel", () => {
    const result = inspect(
      { x: centreX, y: CURB_Y + CAR_WIDTH / 2 + 0.5, heading: Math.PI, speed: 0, steer: 0 },
      course
    );
    expect(result.headingErrorDeg).toBeCloseTo(0, 5);
  });

  it("reports how far off parallel a crooked park is", () => {
    const result = inspect(
      { x: centreX, y: CURB_Y + CAR_WIDTH, heading: Math.PI / 6, speed: 0, steer: 0 },
      course
    );
    expect(result.headingErrorDeg).toBeCloseTo(30, 3);
  });
});

describe("scoreAttempt", () => {
  const perfect: AttemptFacts = {
    inspection: {
      curbDistanceFt: 0.6,
      headingErrorDeg: 2,
      insideSpace: true,
      onCurb: false
    },
    conesStruck: 0,
    carsBumped: 0,
    gearChanges: 2,
    elapsedSeconds: 40,
    timeLimitSeconds: 150,
    signalled: true,
    struckExaminer: false
  };

  it("awards a clean run full marks", () => {
    const result = scoreAttempt(perfect);
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.grade).toBe("A");
    expect(result.deductions).toEqual([]);
  });

  it("deducts for each fault and still passes a merely mediocre park", () => {
    const result = scoreAttempt({ ...perfect, gearChanges: 5, signalled: false });
    expect(result.score).toBe(85);
    expect(result.passed).toBe(true);
    expect(result.deductions.map((d) => d.id).sort()).toEqual(["gear-changes", "signal"]);
  });

  it("charges for distance from the curb in half-foot steps", () => {
    expect(
      scoreAttempt({ ...perfect, inspection: { ...perfect.inspection, curbDistanceFt: 1.4 } }).score
    ).toBe(95);
    expect(
      scoreAttempt({ ...perfect, inspection: { ...perfect.inspection, curbDistanceFt: 2.0 } }).score
    ).toBe(90);
    // The distance penalty is capped so it can't outweigh actual contact.
    expect(
      scoreAttempt({ ...perfect, inspection: { ...perfect.inspection, curbDistanceFt: 40 } }).score
    ).toBe(80);
  });

  it("charges more for a badly angled park", () => {
    expect(
      scoreAttempt({ ...perfect, inspection: { ...perfect.inspection, headingErrorDeg: 15 } }).score
    ).toBe(90);
    expect(
      scoreAttempt({ ...perfect, inspection: { ...perfect.inspection, headingErrorDeg: 40 } }).score
    ).toBe(80);
  });

  it("fails a run that never made it into the space", () => {
    const result = scoreAttempt({
      ...perfect,
      inspection: { ...perfect.inspection, insideSpace: false }
    });
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.grade).toBe("F");
    expect(result.deductions.some((d) => d.points === null)).toBe(true);
  });

  it("fails on the clock", () => {
    expect(scoreAttempt({ ...perfect, elapsedSeconds: 151 }).passed).toBe(false);
  });

  it("fails, immediately and permanently, on contact with the examiner", () => {
    const result = scoreAttempt({ ...perfect, struckExaminer: true });
    expect(result.passed).toBe(false);
    expect(result.deductions[0]?.label).toMatch(/examiner/i);
  });

  it("puts cone and vehicle contact beyond saving", () => {
    const result = scoreAttempt({ ...perfect, conesStruck: 2, carsBumped: 1 });
    expect(result.score).toBe(100 - 30 - 25);
    expect(result.passed).toBe(false);
    expect(result.score).toBeLessThan(PASSING_SCORE);
  });

  it("allows a few direction changes before it starts counting", () => {
    expect(scoreAttempt({ ...perfect, gearChanges: FREE_GEAR_CHANGES }).score).toBe(100);
    expect(scoreAttempt({ ...perfect, gearChanges: FREE_GEAR_CHANGES + 1 }).score).toBe(95);
  });

  it("always has something to say", () => {
    expect(scoreAttempt(perfect).remark.length).toBeGreaterThan(0);
    expect(scoreAttempt({ ...perfect, conesStruck: 4 }).remark.length).toBeGreaterThan(0);
  });
});

describe("buildCourse", () => {
  it("leaves a space the car can actually fit in, and not much more", () => {
    const course = buildCourse();
    const space = course.spaceEndX - course.spaceStartX;
    expect(space).toBeGreaterThan(CAR_LENGTH);
    expect(space).toBeLessThan(CAR_LENGTH * 1.75);
  });

  it("starts the candidate outside the space, alongside traffic", () => {
    const course = buildCourse();
    expect(inspect(course.start, course).insideSpace).toBe(false);
    for (const parked of course.parked) {
      expect(polygonsOverlap(vehicleCorners(course.start), vehicleCorners(parked))).toBe(false);
    }
  });

  it("is the same examination every time", () => {
    expect(buildCourse()).toEqual(buildCourse());
  });
});
