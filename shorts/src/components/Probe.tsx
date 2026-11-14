// Safe-zone probe. When a render is started with probe=true, every frame
// reports the position of all visible text. QA fails the video if any text
// sits where YouTube draws its buttons (bottom 20%, right 15%).
import React, { useLayoutEffect } from 'react';
import { continueRender, delayRender, useCurrentFrame } from 'remotion';
import { FRAME, SAFE } from '../shared/spec.mjs';

type Box = { left: number; top: number; right: number; bottom: number };

const insetClip = (el: Element, clipPath: string): Box | null => {
  const m = clipPath.match(/inset\(([^)]+)\)/);
  if (!m) return null;
  const r = el.getBoundingClientRect();
  const v = m[1].split(/\s+/).map((x) => x.trim());
  const px = (s: string, base: number) => (s.endsWith('%') ? (parseFloat(s) / 100) * base : parseFloat(s) || 0);
  const [t, ri = t, b = t, l = ri] = v;
  return { left: r.left + px(l, r.width), top: r.top + px(t, r.height), right: r.right - px(ri, r.width), bottom: r.bottom - px(b, r.height) };
};

const report = (frame: number) => {
  const root = document.getElementById('short-root');
  if (!root) return;
  const rr = root.getBoundingClientRect();
  const k = rr.width / FRAME.width;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const hits: { t: string; zone: string; box: number[] }[] = [];
  let n = 0;
  let area = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const text = node.nodeValue?.trim();
    if (!text) continue;
    let opacity = 1;
    let hidden = false;
    const clips: Box[] = [];
    for (let e: Element | null = node.parentElement; e && e !== root.parentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden') {
        hidden = true;
        break;
      }
      opacity *= parseFloat(cs.opacity || '1');
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') clips.push(e.getBoundingClientRect());
      if (cs.clipPath && cs.clipPath !== 'none') {
        const c = insetClip(e, cs.clipPath);
        if (c) clips.push(c);
      }
    }
    if (hidden || opacity < 0.08) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    let rects: Box[] = Array.from(range.getClientRects());
    if (!rects.length && node.parentElement) rects = [node.parentElement.getBoundingClientRect()];
    for (const r of rects) {
      let { left, top, right, bottom } = r;
      for (const c of clips) {
        left = Math.max(left, c.left);
        top = Math.max(top, c.top);
        right = Math.min(right, c.right);
        bottom = Math.min(bottom, c.bottom);
      }
      if (right - left < 2 || bottom - top < 2) continue;
      const x1 = (left - rr.left) / k;
      const y1 = (top - rr.top) / k;
      const x2 = (right - rr.left) / k;
      const y2 = (bottom - rr.top) / k;
      if (x2 < 0 || y2 < 0 || x1 > FRAME.width || y1 > FRAME.height) continue; // fully off-frame: invisible
      n++;
      area += (x2 - x1) * (y2 - y1);
      const zone = x2 > SAFE.right + 1 ? 'right' : y2 > SAFE.bottom + 1 ? 'bottom' : y1 < SAFE.top - 1 ? 'top' : null;
      if (zone) hits.push({ t: text.slice(0, 40), zone, box: [x1, y1, x2, y2].map(Math.round) });
    }
  }
  // eslint-disable-next-line no-console
  console.log(`SAFEPROBE ${JSON.stringify({ frame, n, area: Math.round(area), hits })}`);
};

export const Probe: React.FC = () => {
  const frame = useCurrentFrame();
  useLayoutEffect(() => {
    const handle = delayRender('safe-zone probe');
    requestAnimationFrame(() => {
      try {
        report(frame);
      } finally {
        continueRender(handle);
      }
    });
  }, [frame]);
  return null;
};
