// Shared bouquet geometry, used to draw the stems and to move them while they spring.
export const KNOT = {x: 211, y: 321};

const n = (value: number) => Number(value.toFixed(1));

// Where each stem tucks into the ribbon, and where its cut end sits below the bow.
export function stemTie(i: number, count: number) {
  const spread = (i - (count - 1) / 2) / Math.max(1, count - 1);
  return {tie: n(KNOT.x + spread * 6), end: {x: n(KNOT.x + spread * 26), y: n(KNOT.y + 46 - Math.abs(spread) * 6)}};
}

// A stem curves from its bloom down into the ribbon. `bend` pushes the middle of
// the curve sideways, the way a stalk lags behind a bloom that is moving.
export function stemPath(x: number, y: number, tie: number, end: {x: number, y: number}, bend = {x: 0, y: 0}) {
  const rise = Math.max(0, KNOT.y - y);
  const c1 = {x: x + (tie - x) * .35 + bend.x, y: y + rise * .45 + bend.y};
  const c2 = KNOT.y - Math.min(30, rise * .5);
  return `M${n(x)} ${n(y)} C${n(c1.x)} ${n(c1.y)} ${tie} ${n(c2)} ${tie} ${KNOT.y} L${end.x} ${end.y}`;
}
