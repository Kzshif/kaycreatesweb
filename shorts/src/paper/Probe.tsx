// The text probe. When a render is started with probe=true, every frame reports where all visible
// text is, so QA can fail a video with text under YouTube's buttons (top 11.5%, bottom 20%,
// right 15%), text spilling out of the paper it is printed on, or captions that are too small,
// too faint or outside the centre third.
import React, { useLayoutEffect } from 'react';
import { continueRender, delayRender, useCurrentFrame } from 'remotion';
import { FRAME, SAFE } from '../shared/paper.mjs';

type Box = { left: number; top: number; right: number; bottom: number };

const report = (frame: number) => {
  const root = document.getElementById('short-root');
  if (!root) return;
  const rr = root.getBoundingClientRect();
  const k = rr.width / FRAME.width;
  const toFrame = (b: Box): number[] => [(b.left - rr.left) / k, (b.top - rr.top) / k, (b.right - rr.left) / k, (b.bottom - rr.top) / k];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const hits: { t: string; zone: string; box: number[] }[] = [];
  const overflow: { t: string; by: number }[] = [];
  let n = 0;
  let area = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const text = node.nodeValue?.trim();
    if (!text) continue;
    let opacity = 1;
    let skip = false;
    let box: Element | null = null;
    for (let e: Element | null = node.parentElement; e && e !== root.parentElement; e = e.parentElement) {
      if (e.hasAttribute('data-noprobe')) {
        skip = true; // engraving and hatch shades: decoration, not information
        break;
      }
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden') {
        skip = true;
        break;
      }
      opacity *= parseFloat(cs.opacity || '1');
      if (!box && e.hasAttribute('data-box')) box = e;
    }
    if (skip || opacity < 0.08) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = Array.from(range.getClientRects()) as Box[];
    for (const r of rects) {
      if (r.right - r.left < 2 || r.bottom - r.top < 2) continue;
      const [x1, y1, x2, y2] = toFrame(r);
      if (x2 < 0 || y2 < 0 || x1 > FRAME.width || y1 > FRAME.height) continue; // off-frame: invisible
      n++;
      area += (x2 - x1) * (y2 - y1);
      const zone = x2 > SAFE.right + 1 ? 'right' : y2 > SAFE.bottom + 1 ? 'bottom' : y1 < SAFE.top - 1 ? 'top' : x1 < -1 ? 'cut' : null;
      if (zone) hits.push({ t: text.slice(0, 40), zone, box: [x1, y1, x2, y2].map(Math.round) });
      if (box) {
        const b = box.getBoundingClientRect();
        const by = Math.max(b.left - r.left, r.right - b.right, b.top - r.top, r.bottom - b.bottom) / k;
        if (by > 3) overflow.push({ t: text.slice(0, 40), by: Math.round(by) });
      }
    }
  }
  const captions = Array.from(root.querySelectorAll('[data-caption]')).map((el) => {
    const [left, top, right, bottom] = toFrame(el.getBoundingClientRect());
    let meta = {};
    try {
      meta = JSON.parse(el.getAttribute('data-caption') || '{}');
    } catch {
      /* reported as missing metrics */
    }
    return { left, top, right, bottom, highlight: !!el.querySelector('[data-highlight]'), ...meta };
  });
  // eslint-disable-next-line no-console
  console.log(`SAFEPROBE ${JSON.stringify({ frame, n, area: Math.round(area), hits, overflow, captions })}`);
};

export const Probe: React.FC = () => {
  const frame = useCurrentFrame();
  useLayoutEffect(() => {
    const handle = delayRender('text probe');
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
