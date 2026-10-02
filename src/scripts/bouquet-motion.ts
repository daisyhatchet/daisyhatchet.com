// Motion for the Bespoke Bouquet preview. Every change gets anticipation, a lively
// main action, and follow-through, so the bouquet feels alive. Reduced-motion
// visitors see the same final states with no movement.
import {KNOT, stemPath} from '@/lib/bouquet-geometry';

const calm = matchMedia('(prefers-reduced-motion: reduce)');
export const moving = () => !calm.matches;

const SPRING = 'cubic-bezier(.34,1.56,.64,1)';
const SETTLE = 'cubic-bezier(.2,.8,.2,1)';
const GATHER = 'cubic-bezier(.55,0,.75,.2)';
const BLANK = '#e3d8cd';

// One chosen color becomes three tones of itself: the petals, a softer inner ring, and a deep heart.
const mix = (hex: string, toward: string, amount: number) => '#' + [1, 3, 5].map(i => {
  const a = parseInt(hex.slice(i, i + 2), 16), b = parseInt(toward.slice(i, i + 2), 16);
  return Math.round(a + (b - a) * amount).toString(16).padStart(2, '0');
}).join('');
export function tones(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const pale = .2126 * r + .7152 * g + .0722 * b > .78;
  return {base: hex, light: pale ? mix(hex, '#b08a5a', .22) : mix(hex, '#fffaf0', .5), deep: mix(hex, '#2a1420', pale ? .45 : .35)};
}

const play = (el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) =>
  moving() ? el.animate(keyframes, {fill: 'backwards', ...options}) : null;
const stopAll = (root: Element) => root.querySelectorAll('*').forEach(el => el.getAnimations().forEach(a => a.cancel()));
const arrangementsFor = (id: string) => [...document.querySelectorAll<SVGGElement>(`[data-arrangement="${id}"]`)];

// Squash and stretch for anything pressed.
export function squish(el: Element | null, big = 1.14) {
  if (!el) return;
  play(el, [
    {transform: 'scale(1)'},
    {transform: 'scale(1.12,.82)', offset: .22, easing: 'ease-out'},
    {transform: `scale(.92,${big})`, offset: .5, easing: 'ease-in-out'},
    {transform: 'scale(1.03,.97)', offset: .75},
    {transform: 'scale(1)'},
  ], {duration: 460});
}

// A small "no" for when there is no room for another color.
export function shake(el: Element | null) {
  if (!el) return;
  play(el, [0, -9, 7, -5, 3, -1, 0].map(x => ({transform: `translateX(${x}px) rotate(${x * -.8}deg)`})), {duration: 460, easing: 'ease-out'});
}

// Reveals a value with a quick dip and lift.
export function bump(el: Element | null) {
  if (!el) return;
  play(el, [{transform: 'translateY(0)'}, {transform: 'translateY(3px) scale(.94)', offset: .3}, {transform: 'translateY(-3px) scale(1.06)', offset: .65}, {transform: 'none'}], {duration: 380, easing: 'ease-in-out'});
}

// Counts a price up or down instead of snapping.
export function tweenPrice(el: HTMLElement, to: number) {
  const from = Number(el.dataset.price ?? to);
  el.dataset.price = String(to);
  if (!moving() || from === to) { el.textContent = `$${to}`; return; }
  const start = performance.now(), duration = 520;
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration), eased = 1 - (1 - t) ** 3;
    el.textContent = `$${Math.round(from + (to - from) * eased)}`;
    if (t < 1 && el.dataset.price === String(to)) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  bump(el);
}

// Stems are springs. Blooms sprout from the ribbon in a tight bunch, and every
// new sprout nudges the bunch outward until it settles into the full bouquet.
// Each stalk bends against its own motion and the bloom tilts with it.
type Spring = {value: number, velocity: number, target: number};
type Stalk = {stem: SVGPathElement, head: SVGGElement, x: number, y: number, r: number, s: number, tie: number, end: {x: number, y: number}, sprout: Spring, spread: Spring, at: number, px: number, py: number, vx: number, vy: number};
type Growth = {stalks: Stalk[], anchor: {x: number, y: number}, gathering: boolean, done?: () => void};
const BUNCH = .38;
const growths = new Map<SVGGElement, Growth>();
let frame = 0, lastTick = 0;
const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));
const settled = (spring: Spring) => Math.abs(spring.target - spring.value) < .002 && Math.abs(spring.velocity) < .02;

function stalksOf(group: SVGGElement): Stalk[] {
  const prior = growths.get(group)?.stalks;
  return [...group.querySelectorAll<SVGPathElement>('.stem')].map((stem, i) => {
    const head = group.querySelector<SVGGElement>(`.head[data-stalk="${stem.dataset.stalk}"]`)!;
    const at = (key: string) => Number(head.dataset[key]);
    const from = prior?.[i];
    return {stem, head, x: at('x'), y: at('y'), r: at('r'), s: at('s'), tie: Number(stem.dataset.tie), end: {x: Number(stem.dataset.endX), y: Number(stem.dataset.endY)},
      sprout: from ? {...from.sprout} : {value: 1, velocity: 0, target: 1}, spread: from ? {...from.spread} : {value: 1, velocity: 0, target: 1},
      at: 0, px: from?.px ?? at('x'), py: from?.py ?? at('y'), vx: 0, vy: 0};
  });
}
function place(stalk: Stalk, x: number, y: number, bend = {x: 0, y: 0}, tilt = 0) {
  stalk.head.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(stalk.r + tilt).toFixed(1)}) scale(${stalk.s})`);
  stalk.stem.setAttribute('d', stemPath(x, y, stalk.tie, stalk.end, bend));
}
// Puts a bouquet back exactly as drawn.
function settle(group: SVGGElement) {
  growths.delete(group);
  stopAll(group);
  stalksOf(group).forEach(stalk => place(stalk, stalk.x, stalk.y));
}
function tick(now: number) {
  const dt = Math.min(.05, (now - lastTick) / 1000) || 1 / 60;
  lastTick = now;
  for (const [group, growth] of growths) {
    const {stalks, anchor, gathering} = growth;
    const sprouted = stalks.filter(stalk => now >= stalk.at).length;
    // Growing springs overshoot; gathering springs snap shut without bouncing.
    const [sproutK, sproutC, spreadK, spreadC] = gathering ? [600, 49, 600, 49] : [300, 18, 150, 12.5];
    let busy = false;
    for (const stalk of stalks) {
      if (now >= stalk.at) stalk.sprout.target = gathering ? 0 : 1;
      stalk.spread.target = gathering ? BUNCH : BUNCH + (1 - BUNCH) * sprouted / stalks.length;
      const steps = Math.ceil(dt * 240), h = dt / steps;
      for (let i = 0; i < steps; i++) {
        stalk.sprout.velocity += (sproutK * (stalk.sprout.target - stalk.sprout.value) - sproutC * stalk.sprout.velocity) * h;
        stalk.sprout.value += stalk.sprout.velocity * h;
        stalk.spread.velocity += (spreadK * (stalk.spread.target - stalk.spread.value) - spreadC * stalk.spread.velocity) * h;
        stalk.spread.value += stalk.spread.velocity * h;
      }
      const reach = Math.max(0, stalk.sprout.value), spread = stalk.spread.value;
      const x = KNOT.x + (anchor.x + (stalk.x - anchor.x) * spread - KNOT.x) * reach;
      const y = KNOT.y + (anchor.y + (stalk.y - anchor.y) * spread - KNOT.y) * reach;
      stalk.vx += ((x - stalk.px) / dt - stalk.vx) * .4;
      stalk.vy += ((y - stalk.py) / dt - stalk.vy) * .4;
      stalk.px = x; stalk.py = y;
      place(stalk, x, y, {x: clamp(-stalk.vx * .06, 40), y: clamp(-stalk.vy * .03, 24)}, clamp(stalk.vx * .05, 20));
      if (now < stalk.at || !settled(stalk.sprout) || !settled(stalk.spread)) busy = true;
    }
    if (!busy) {
      growths.delete(group);
      if (!gathering) stalks.forEach(stalk => place(stalk, stalk.x, stalk.y));
      growth.done?.();
    }
  }
  frame = growths.size ? requestAnimationFrame(tick) : 0;
}
function run(group: SVGGElement, growth: Growth) {
  growths.set(group, growth);
  if (!frame) { lastTick = performance.now(); frame = requestAnimationFrame(tick); }
}
const bunchCenter = (stalks: Stalk[]) => ({x: KNOT.x, y: stalks.reduce((sum, stalk) => sum + stalk.y, 0) / stalks.length});

// Grows an arrangement out of the ribbon, overlapping every stage: leaves unfurl
// while the first stems shoot up, and each bud opens as its stem arrives.
function grow(group: SVGGElement, wait = 0) {
  if (!moving()) return;
  const stalks = stalksOf(group);
  const start = performance.now() + wait, gap = Math.min(80, 480 / stalks.length);
  const fresh = !growths.has(group);
  stalks.forEach((stalk, i) => {
    stalk.at = start + i * gap;
    if (!fresh) return;
    // A fresh bouquet starts folded into the ribbon.
    stalk.sprout = {value: 0, velocity: 0, target: 0};
    stalk.spread = {value: BUNCH, velocity: 0, target: BUNCH};
    stalk.px = KNOT.x; stalk.py = KNOT.y;
  });
  group.querySelectorAll('.leaf').forEach((leaf, i) => play(leaf, [
    {transform: 'scale(0) rotate(-30deg)'}, {transform: 'scale(1.12) rotate(6deg)', offset: .6}, {transform: 'none'},
  ], {duration: 440, delay: wait + 40 + i * 40, easing: SETTLE}));
  stalks.forEach((stalk, i) => {
    const at = wait + i * gap + 90;
    const bloom = stalk.head.querySelector('.bloom');
    if (!bloom) {
      stalk.head.querySelectorAll('.berry').forEach((berry, j) => play(berry, [{transform: 'scale(0)'}, {transform: 'scale(1.3)', offset: .6}, {transform: 'none'}], {duration: 360, delay: at + 60 + j * 35, easing: 'ease-out'}));
      return;
    }
    play(bloom, [{transform: 'rotate(-75deg)'}, {transform: 'rotate(8deg)', offset: .65}, {transform: 'none'}], {duration: 600, delay: at, easing: SETTLE});
    bloom.querySelectorAll('.bloom-eye').forEach((eye, j) => play(eye, [{transform: 'scale(0)'}, {transform: 'scale(1.35)', offset: .6}, {transform: 'none'}], {duration: 320, delay: at + j * 30, easing: 'ease-out'}));
    const petals = bloom.querySelectorAll('.petal');
    petals.forEach((petal, j) => play(petal, [
      {transform: 'scale(0)'}, {transform: 'scale(1.16)', offset: .6}, {transform: 'scale(.97)', offset: .82}, {transform: 'none'},
    ], {duration: 460, delay: at + 50 + j * 220 / petals.length, easing: 'ease-out'}));
  });
  run(group, {stalks, anchor: bunchCenter(stalks), gathering: false});
}

// Pulls an arrangement back into the ribbon: blooms close, the bunch tightens,
// and the stems snap down, front flowers first.
function gather(group: SVGGElement, done: () => void) {
  const stalks = stalksOf(group), now = performance.now();
  stalks.forEach((stalk, i) => {
    const order = stalks.length - 1 - i;
    stalk.at = now + 60 + order * 16;
    const bloom = stalk.head.querySelector('.bloom');
    if (bloom) play(bloom, [{transform: 'none'}, {transform: 'scale(1.1) rotate(-10deg)', offset: .25}, {transform: 'scale(0) rotate(120deg)'}], {duration: 260, delay: order * 16, easing: GATHER, fill: 'forwards'});
  });
  group.querySelectorAll('.leaf,.berry').forEach(leaf => play(leaf, [{transform: 'none'}, {transform: 'scale(0) rotate(-30deg)'}], {duration: 220, delay: 40, easing: GATHER, fill: 'forwards'}));
  run(group, {stalks, anchor: bunchCenter(stalks), gathering: true, done});
}

function tug(svg: Element) {
  play(svg.querySelector('.bow')!, [{transform: 'none'}, {transform: 'scale(1.2,.82)', offset: .3}, {transform: 'scale(.92,1.08)', offset: .65}, {transform: 'none'}], {duration: 520, easing: 'ease-in-out'});
}

let swapToken = 0;
export function swapArrangement(from: string, to: string) {
  const token = ++swapToken;
  const groups = [...document.querySelectorAll<SVGGElement>('[data-arrangement]')];
  if (!moving()) {
    groups.forEach(g => { settle(g); g.setAttribute('display', g.dataset.arrangement === to ? 'inline' : 'none'); });
    return;
  }
  // Anything still leaving from an earlier change finishes at once.
  groups.filter(g => g.dataset.arrangement !== from && g.dataset.arrangement !== to).forEach(g => { settle(g); g.setAttribute('display', 'none'); });
  arrangementsFor(from).forEach(g => {
    tug(g.ownerSVGElement!);
    gather(g, () => { if (token === swapToken) { settle(g); g.setAttribute('display', 'none'); } });
  });
  // The new bouquet starts sprouting while the old one is still folding away.
  setTimeout(() => {
    if (token !== swapToken) return;
    arrangementsFor(to).forEach(g => { stopAll(g); g.setAttribute('display', 'inline'); grow(g); });
  }, 120);
}

export function entrance(svg: SVGSVGElement) {
  const group = svg.querySelector<SVGGElement>('[data-arrangement]:not([display="none"])');
  if (group) grow(group, 120);
}

// Paints each bloom. Changed blooms pull in, swap color at their smallest, and
// spring back while their petals unfurl one after another.
export function paintBlooms(colorFor: (bloom: SVGGElement) => string | undefined, {delay = 0, origin = [205, 180]}: {delay?: number, origin?: [number, number]} = {}) {
  document.querySelectorAll<SVGGElement>('[data-arrangement]').forEach(group => {
    const live = group.getAttribute('display') !== 'none';
    group.querySelectorAll<SVGGElement>('.bloom').forEach(bloom => {
      const nextHex = colorFor(bloom) ?? BLANK;
      const previousHex = bloom.dataset.hex || BLANK;
      if (previousHex === nextHex) return;
      bloom.dataset.hex = nextHex;
      const previous = tones(previousHex), next = tones(nextHex);
      bloom.style.setProperty('--base', next.base);
      bloom.style.setProperty('--light', next.light);
      bloom.style.setProperty('--deep', next.deep);
      if (!live || !moving()) return;
      const distance = Math.hypot(Number(bloom.dataset.x) - origin[0], Number(bloom.dataset.y) - origin[1]);
      const at = delay + distance * 1;
      bloom.getAnimations().forEach(a => a.cancel());
      bloom.querySelectorAll('.petal,.bloom-eye').forEach(el => el.getAnimations().forEach(a => a.cancel()));
      const duration = 620;
      play(bloom, [
        {transform: 'none'},
        {transform: 'scale(.74) rotate(-20deg)', offset: .3, easing: 'ease-out'},
        {transform: 'scale(1.14) rotate(12deg)', offset: .62, easing: 'ease-in-out'},
        {transform: 'scale(.97) rotate(-3deg)', offset: .82},
        {transform: 'none'},
      ], {duration, delay: at});
      const paint = (t: typeof next) => ({'--base': t.base, '--light': t.light, '--deep': t.deep});
      play(bloom, [paint(previous), {...paint(previous), offset: .26}, {...paint(next), offset: .42}, paint(next)], {duration, delay: at});
      bloom.querySelectorAll('.bloom-eye').forEach((eye, j) => play(eye, [{transform: 'none'}, {transform: 'none', offset: .3}, {transform: 'scale(1.4)', offset: .5}, {transform: 'none'}], {duration: 480, delay: at + j * 40, easing: 'ease-out'}));
      const petals = bloom.querySelectorAll('.petal');
      petals.forEach((petal, j) => play(petal, [
        {transform: 'none'}, {transform: 'scale(.55)', offset: .35}, {transform: 'scale(1.14)', offset: .7}, {transform: 'none'},
      ], {duration: 520, delay: at + 70 + j * 200 / petals.length, easing: 'ease-in-out'}));
    });
  });
}

// A happy hop for the whole bouquet when the palette is ready, plus a few loose petals.
export function celebrate(svg: SVGSVGElement, colors: string[]) {
  if (!moving()) return;
  play(svg.querySelector('.bouquet')!, [
    {transform: 'none'},
    {transform: 'translateY(4px) scale(1.05,.93)', offset: .16, easing: 'ease-out'},
    {transform: 'translateY(-18px) scale(.96,1.05)', offset: .45, easing: 'ease-in'},
    {transform: 'translateY(3px) scale(1.04,.95)', offset: .68, easing: 'ease-out'},
    {transform: 'translateY(-4px)', offset: .84, easing: 'ease-in-out'},
    {transform: 'none'},
  ], {duration: 820});
  const center = pointIn(svg, 205, 170);
  const size = svg.getBoundingClientRect().width / 22;
  for (let i = 0; i < 12; i++) {
    const petal = document.createElement('span');
    const color = colors[i % colors.length];
    Object.assign(petal.style, {position: 'fixed', left: `${center.x}px`, top: `${center.y}px`, width: `${size}px`, height: `${size * 1.4}px`, margin: `${-size * .7}px 0 0 ${-size / 2}px`, background: color, border: '1px solid #4a303855', borderRadius: '50% 50% 50% 50% / 62% 62% 38% 38%', pointerEvents: 'none', zIndex: '60'});
    document.body.append(petal);
    const angle = -Math.PI / 2 + (i / 11 - .5) * 2.6 + (Math.random() - .5) * .4;
    const reach = size * (5 + Math.random() * 4);
    const dx = Math.cos(angle) * reach, dy = Math.sin(angle) * reach;
    const spin = (Math.random() > .5 ? 1 : -1) * (240 + Math.random() * 300);
    petal.animate([
      {transform: 'translate(0,0) rotate(0) scale(.2)', opacity: 1},
      {transform: `translate(${dx}px,${dy}px) rotate(${spin * .5}deg) scale(1)`, opacity: 1, offset: .4, easing: 'ease-in'},
      {transform: `translate(${dx * 1.3}px,${dy + size * 9}px) rotate(${spin}deg) scale(.8)`, opacity: 0},
    ], {duration: 1200 + Math.random() * 450, delay: 200 + i * 10, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'backwards'}).finished.then(() => petal.remove());
  }
}

export function pointIn(svg: SVGSVGElement, x: number, y: number) {
  return new DOMPoint(x, y).matrixTransform(svg.getScreenCTM()!);
}

// Throws a drop of paint along a gravity arc, stretching with speed and
// splatting on arrival. Returns how long the flight takes.
export function throwPaint(from: DOMRect | {x: number, y: number, width: number}, to: {x: number, y: number}, color: string, onLand?: () => void) {
  if (!moving()) { onLand?.(); return 0; }
  const start = {x: from.x + from.width / 2, y: 'height' in from ? from.y + from.height / 2 : from.y};
  const distance = Math.hypot(to.x - start.x, to.y - start.y);
  const duration = Math.min(560, 300 + distance * .28);
  const lift = Math.max(70, distance * .4);
  const apex = Math.max(30, Math.min(lift, Math.min(start.y, to.y) - 12));
  const drop = document.createElement('span');
  const dot = 22, startScale = Math.max(1, from.width / dot);
  Object.assign(drop.style, {position: 'fixed', left: '0', top: '0', width: `${dot}px`, height: `${dot}px`, margin: `${-dot / 2}px 0 0 ${-dot / 2}px`, borderRadius: '50%', background: color, boxShadow: 'inset -3px -3px 0 #0000001c, 0 4px 10px #29151f22', pointerEvents: 'none', zIndex: '60', willChange: 'transform'});
  document.body.append(drop);
  const at = (t: number) => ({
    x: start.x + (to.x - start.x) * t,
    y: start.y + (to.y - start.y) * t - apex * 4 * t * (1 - t),
  });
  const frames: Keyframe[] = [];
  for (let i = 0; i <= 24; i++) {
    const s = i / 24, t = s < .5 ? 2 * s * s : 1 - (-2 * s + 2) ** 2 / 2;
    const here = at(t), ahead = at(Math.min(1, t + .02)), behind = at(Math.max(0, t - .02));
    const angle = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180 / Math.PI;
    const speed = Math.min(.55, Math.hypot(ahead.x - behind.x, ahead.y - behind.y) / 60) * Math.sin(Math.PI * s);
    const grow = s < .2 ? startScale + (1 - startScale) * (s / .2) : 1;
    frames.push({transform: `translate(${here.x}px,${here.y}px) rotate(${angle}deg) scale(${grow * (1 + speed)},${grow * (1 - speed * .55)})`});
  }
  drop.animate(frames, {duration}).finished.then(() => {
    onLand?.();
    drop.animate([
      {transform: `translate(${to.x}px,${to.y}px) scale(1)`, opacity: 1},
      {transform: `translate(${to.x}px,${to.y}px) scale(1.9,.45)`, opacity: .9, offset: .35},
      {transform: `translate(${to.x}px,${to.y}px) scale(2.6,.2)`, opacity: 0},
    ], {duration: 300, easing: 'ease-out', fill: 'forwards'}).finished.then(() => drop.remove());
    const ring = document.createElement('span');
    Object.assign(ring.style, {position: 'fixed', left: `${to.x}px`, top: `${to.y}px`, width: '20px', height: '20px', margin: '-10px 0 0 -10px', borderRadius: '50%', border: `2px solid ${color}`, pointerEvents: 'none', zIndex: '60'});
    document.body.append(ring);
    ring.animate([{transform: 'scale(.4)', opacity: 1}, {transform: 'scale(5)', opacity: 0}], {duration: 600, easing: 'cubic-bezier(.1,.6,.3,1)'}).finished.then(() => ring.remove());
  });
  return duration;
}

// Keeps a row of colored items in sync: new items pop in, removed items shrink
// away, and the rest glide to their new spots.
export function syncList<T>(container: HTMLElement, items: T[], key: (item: T) => string, create: (item: T) => HTMLElement, update?: (el: HTMLElement, item: T) => void) {
  const box = container.getBoundingClientRect();
  const current = new Map<string, HTMLElement>();
  const before = new Map<string, DOMRect>();
  for (const el of container.children as HTMLCollectionOf<HTMLElement>) {
    if (!el.dataset.key || el.dataset.leaving) continue;
    current.set(el.dataset.key, el);
    before.set(el.dataset.key, el.getBoundingClientRect());
  }
  const next = items.map(item => {
    const k = key(item);
    const el = current.get(k) ?? create(item);
    el.dataset.key = k;
    update?.(el, item);
    current.delete(k);
    return el;
  });
  const leaving = [...current.values()];
  const lingering = [...container.querySelectorAll<HTMLElement>('[data-leaving]')];
  if (!moving()) { container.replaceChildren(...next); return; }
  leaving.forEach(el => {
    const r = before.get(el.dataset.key!)!;
    el.dataset.leaving = 'true';
    Object.assign(el.style, {position: 'absolute', left: `${r.left - box.left}px`, top: `${r.top - box.top}px`, width: `${r.width}px`, height: `${r.height}px`, margin: '0', pointerEvents: 'none'});
  });
  container.replaceChildren(...next, ...lingering, ...leaving);
  leaving.forEach(el => el.animate([{transform: 'none', opacity: 1}, {transform: 'scale(1.1) translateY(-2px)', opacity: 1, offset: .3}, {transform: 'scale(0) translateY(6px)', opacity: 0}], {duration: 300, easing: 'ease-in', fill: 'forwards'}).finished.then(() => el.remove()));
  next.forEach((el, i) => {
    const old = before.get(el.dataset.key!);
    if (!old) {
      el.animate([{transform: 'scale(0) rotate(-12deg)', opacity: 0}, {transform: 'scale(1.18) rotate(4deg)', opacity: 1, offset: .6}, {transform: 'none', opacity: 1}], {duration: 420, delay: i * 25, easing: 'ease-out', fill: 'backwards'});
      return;
    }
    const now = el.getBoundingClientRect();
    const dx = old.left - now.left, dy = old.top - now.top;
    if (dx || dy) el.animate([{transform: `translate(${dx}px,${dy}px)`}, {transform: 'none'}], {duration: 420, easing: SPRING});
  });
}
