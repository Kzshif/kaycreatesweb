// The Paper Money style board: eight still frames, each built from the same kit the videos will
// use, with real figures from the three pilots. Rendered by pipeline/dev/board.mjs.
//   1 palette · 2 the three typefaces in use · 3 a product · 4 a coin-stack chart · 5 a stamp
//   6 a caption with its highlight · 7 a note cut by scissors · 8 the inverted version
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ACCENTS, BRIGHT, CREAM, INK, MANILA, tokens } from '../shared/paper.mjs';
import { CaptionStrip } from '../paper/Captions';
import { Camera, Clip, Cut, Desk, Headline, Label, Layer, Light, LookProvider, Materials, Numeral, Scraps, Slip, Tape, fit, headStyle, labelStyle, measure, sheet, useLook, wobble } from '../paper/kit';
import { Coin, CoinStack, Note, Scissors, stackBox, stackHeight } from '../paper/money';
import { Probe } from '../paper/Probe';
import { Arrow, FriesBox, InkPad, MemberCard, Offcuts, Pencil, Phone, PriceTag, Receipt, Specks, Stamp, StampTool } from '../paper/things';

export type BoardProps = { page: number; probe?: boolean };
type Caption = { words: string[]; active: number; progress?: number };

const Series: React.FC<{ no: string; name: string }> = ({ no, name }) => {
  const t = useLook();
  return (
    <div style={{ position: 'absolute', left: 78, top: 244, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 17, height: 17, background: t.accent, transform: 'rotate(-4deg)' }} />
      <Label size={25} color={t.type}>{`No. ${no} · ${name}`}</Label>
    </div>
  );
};

/** Everything a frame shares: materials, desk, drifting camera, light, series label, caption. */
const Shell: React.FC<{ accent: string; inverted?: boolean; seed: number; no?: string; name?: string; caption?: Caption; probe?: boolean; children: React.ReactNode }> = ({ accent, inverted = false, seed, no, name, caption, probe, children }) => (
  <Materials>
    <LookProvider value={tokens(accent, inverted)}>
      <AbsoluteFill id="short-root" style={{ overflow: 'hidden' }}>
        <Desk />
        <Camera seed={seed}>
          <Layer depth={0.35}>
            <Scraps seed={seed} />
          </Layer>
          {children}
        </Camera>
        <Light />
        {no && name ? <Series no={no} name={name} /> : null}
        {caption ? <CaptionStrip words={caption.words} active={caption.active} progress={caption.progress ?? 1} seed={seed} /> : null}
        {probe ? <Probe /> : null}
      </AbsoluteFill>
    </LookProvider>
  </Materials>
);

const Source: React.FC<{ text: string; seed?: number; top?: number }> = ({ text, seed = 7, top = 1438 }) => <Slip text={text} size={21} seed={seed} tape rot={-1.4} style={{ left: 86, top }} />;

// ------------------------------------------------------------ 1 palette
const Chip: React.FC<{ x: number; y: number; color: string; name: string; hex: string; seed: number; rot: number; dark?: boolean; backing?: boolean; accent?: string }> = ({ x, y, color, name, hex, seed, rot, dark, backing, accent }) => {
  const w = 384;
  const h = 232;
  const lw = Math.max(measure(name.toUpperCase(), 'label', 22), measure(hex, 'label', 22)) + 44;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, transform: `rotate(${rot}deg)` }}>
      {backing ? <Cut w={w + 34} h={h + 34} d={sheet(w + 34, h + 34, { seed: seed + 50, edges: 'tctc', rough: 3 }).d} core={sheet(w + 34, h + 34, { seed: seed + 50, edges: 'tctc', rough: 3 }).core} color={MANILA} seed={seed + 50} lift={0.12} style={{ left: -17, top: -17 }} /> : null}
      <Cut w={w} h={h} d={sheet(w, h, { seed }).d} color={color} dark={dark} seed={seed} lift={0.3} />
      <Tape seed={seed + 1} style={{ left: -34, top: -8, transform: 'rotate(-33deg)' }} />
      <Tape seed={seed + 2} style={{ left: w - 84, top: -10, transform: 'rotate(31deg)' }} />
      <Cut w={lw} h={84} d={sheet(lw, 84, { seed: seed + 9, m: 5 }).d} color={BRIGHT} seed={seed + 9} lift={0.14} style={{ left: 20, top: h - 104, transform: `rotate(${-rot * 0.6}deg)` }}>
        <div data-box style={{ position: 'absolute', inset: 0 }}>
          <div style={{ ...labelStyle(22, INK), position: 'absolute', left: 22, top: 13 }}>{name}</div>
          <div style={{ ...labelStyle(22, 'rgba(21, 19, 15, 0.62)'), position: 'absolute', left: 22, top: 42 }}>{hex}</div>
        </div>
      </Cut>
      {accent ? (
        <LookProvider value={tokens(accent, false)}>
          <Coin r={58} seed={seed + 20} lift={0.3} style={{ left: w - 144, top: 30, transform: `rotate(${rot * 6}deg)` }} />
        </LookProvider>
      ) : null}
    </div>
  );
};
const Palette: React.FC<{ probe?: boolean }> = ({ probe }) => (
  <Shell accent="green" seed={11} probe={probe}>
    <Layer depth={1}>
      <Headline lines={['Paper Money']} width={826} max={156} style={{ position: 'absolute', left: 76, top: 258 }} />
      <Label size={24} style={{ position: 'absolute', left: 82, top: 416 }}>
        Channel identity · colour
      </Label>
      <Chip x={84} y={492} color={CREAM} name="Paper cream" hex="#F4EBDD" seed={21} rot={-1.4} backing />
      <Chip x={500} y={486} color={INK} name="Ink" hex="#15130F" seed={22} rot={1.1} dark />
      <Chip x={80} y={776} color={ACCENTS.green.hex} name="Banknote green" hex="#1F6F54" seed={23} rot={1.2} accent="green" />
      <Chip x={496} y={770} color={ACCENTS.vermilion.hex} name="Vermilion" hex="#E8452C" seed={24} rot={-1.6} accent="vermilion" />
      <Chip x={86} y={1058} color={ACCENTS.cobalt.hex} name="Cobalt" hex="#2B4EFF" seed={25} rot={-0.9} accent="cobalt" />
      <Chip x={502} y={1052} color={ACCENTS.gold.hex} name="Gold" hex="#D9A441" seed={26} rot={1.5} accent="gold" />
      <Cut w={812} h={112} d={sheet(812, 112, { seed: 27, edges: 'ctct', m: 10, rough: 3 }).d} core={sheet(812, 112, { seed: 27, edges: 'ctct', m: 10, rough: 3 }).core} color={BRIGHT} seed={27} lift={0.3} style={{ left: 78, top: 1316, transform: 'rotate(-0.7deg)' }}>
        <div data-box style={{ position: 'absolute', inset: 0 }}>
          {['green', 'vermilion', 'cobalt', 'gold'].map((a, i) => {
            const x = [40, 196, 434, 620][i];
            const ww = measure(a, 'headline', 62);
            return (
              <div key={a} style={{ position: 'absolute', left: x, top: 22 }}>
                <svg width={ww + 24} height={70} style={{ position: 'absolute', left: -12, top: 0 }}>
                  <path d={`M0 12 L${ww + 22} 9 L${ww + 24} 62 L3 65 Z`} fill={tokens(a).hl} />
                </svg>
                <span style={{ ...headStyle(62, INK), position: 'relative', lineHeight: '68px' }}>{a}</span>
              </div>
            );
          })}
        </div>
      </Cut>
      <Label size={22} style={{ position: 'absolute', left: 84, top: 1444 }}>
        One accent per video, in rotation
      </Label>
      <Label size={22} style={{ position: 'absolute', left: 84, top: 1478 }}>
        Every tenth video: ink desk, cream type
      </Label>
    </Layer>
  </Shell>
);

// ------------------------------------------------- 2 the three typefaces
const TypeInUse: React.FC<{ probe?: boolean }> = ({ probe }) => {
  const frame = useCurrentFrame();
  const size = fit(['$5.3'], 'numeral', 700, 400);
  const numTop = 392;
  const headTop = numTop + size * 0.86 + 2;
  const wb = wobble(3, frame);
  return (
    <Shell accent="green" seed={12} no="001" name="Costco" probe={probe} caption={{ words: ['paid', '$5.3', 'billion'], active: 1 }}>
      <Layer depth={0.5}>
        <Cut w={560} h={470} d={sheet(560, 470, { seed: 31, edges: 'tttt', rough: 5, m: 12 }).d} core={sheet(560, 470, { seed: 31, edges: 'tttt', rough: 5, m: 12 }).core} color={tokens('green').card} seed={31} lift={0.1} style={{ left: 640, top: 130, transform: 'rotate(8deg)' }} />
      </Layer>
      <Layer depth={1}>
        <Slip text="Shoppers paid" size={26} seed={4} tape rot={-2} style={{ left: 86, top: 314 }} />
        <div style={{ position: 'absolute', left: 72, top: numTop }}>
          <Numeral text="$5.3" size={size} />
        </div>
        <Headline lines={['billion']} width={700} max={196} style={{ position: 'absolute', left: 80, top: headTop }} />
        <Headline lines={['just to walk in']} width={760} max={92} style={{ position: 'absolute', left: 84, top: headTop + 186 }} />
      </Layer>
      <Layer depth={1.5}>
        <Coin r={96} seed={41} lift={0.34} style={{ left: 826 + wb.x, top: 706 + wb.y, transform: `rotate(${18 + wb.r}deg)` }} />
        <Coin r={70} seed={42} lift={0.2} style={{ left: 930, top: 878, transform: 'rotate(-24deg)' }} />
        <Coin r={78} seed={43} lift={0.26} style={{ left: 742, top: 1316, transform: 'rotate(40deg)' }} />
        <Coin r={62} seed={44} lift={0.18} style={{ left: 888, top: 1402, transform: 'rotate(-12deg)' }} />
      </Layer>
      <Layer depth={1}>
        <Cut w={640} h={150} d={sheet(640, 150, { seed: 51, m: 6 }).d} color={BRIGHT} seed={51} lift={0.2} style={{ left: 84, top: 1306, transform: 'rotate(-1.2deg)' }}>
          <div data-box style={{ position: 'absolute', inset: 0 }}>
            {[
              ['Numbers', 'Fraunces 900, soft 100, wonk 1'],
              ['Headlines', 'Bricolage Grotesque 800'],
              ['Labels', 'DM Mono 500'],
            ].map(([role, face], i) => (
              <div key={role} style={{ position: 'absolute', left: 26, top: 22 + i * 37, display: 'flex', gap: 18 }}>
                <div style={{ ...labelStyle(19, 'rgba(21, 19, 15, 0.6)'), width: 142 }}>{role}</div>
                <div style={labelStyle(19, INK)}>{face}</div>
              </div>
            ))}
          </div>
        </Cut>
        <Tape seed={52} style={{ left: 52, top: 1296, transform: 'rotate(-30deg)' }} />
        <Source text="Source: Costco results, fiscal 2025" top={1470} />
      </Layer>
    </Shell>
  );
};

// ------------------------------------------------------------ 3 a product
const Product: React.FC<{ probe?: boolean }> = ({ probe }) => {
  const frame = useCurrentFrame();
  const wb = wobble(5, frame);
  return (
    <Shell accent="vermilion" seed={13} no="002" name="McDonald's" probe={probe} caption={{ words: ['keep', 'the', 'tenants', 'busy'], active: 2 }}>
      <Layer depth={0.55}>
        <Cut w={720} h={740} d={sheet(720, 740, { seed: 61, edges: 'tttt', rough: 5.5, m: 13 }).d} core={sheet(720, 740, { seed: 61, edges: 'tttt', rough: 5.5, m: 13 }).core} color={MANILA} seed={61} lift={0.12} style={{ left: 138, top: 300, transform: 'rotate(3.4deg)' }} />
      </Layer>
      <Layer depth={1}>
        <div style={{ position: 'absolute', left: 122 + wb.x, top: 344 + wb.y, transform: `rotate(${-4 + wb.r}deg)`, transformOrigin: '270px 640px' }}>
          <FriesBox scale={1.04} seed={7} />
        </div>
        <Slip text="What the tenants sell" size={25} seed={8} tape rot={-3} style={{ left: 84, top: 306 }} lift={0.3} />
      </Layer>
      <Layer depth={1.35}>
        <PriceTag label="Rent, 2025" price="$10.4bn" sub="a year" w={290} h={368} cord={92} swing={7} seed={9} style={{ left: 756, top: 318 }} />
      </Layer>
      <Layer depth={1.2}>
        <Offcuts seed={62} n={8} spread={[430, 170]} style={{ left: 430, top: 1320 }} />
        <Pencil length={500} style={{ left: 470, top: 1420, transform: 'rotate(-19deg)' }} />
      </Layer>
      <Layer depth={1}>
        <Source text="Source: McDonald's annual report, 2025" />
      </Layer>
    </Shell>
  );
};

// ----------------------------------------------------- 4 coin-stack chart
const CoinChart: React.FC<{ probe?: boolean }> = ({ probe }) => {
  const frame = useCurrentFrame();
  const wb = wobble(6, frame);
  const cw = 226;
  const th = 24;
  const base = 968;
  // one coin = $0.5 billion, rounded to whole coins: rent $10.442bn -> 21, royalties $6.018bn -> 12
  const stacks = [
    { label: 'Rent', value: '$10.4bn', count: 21, cx: 292, seed: 71, falling: false },
    { label: 'Royalties', value: '$6.0bn', count: 12, cx: 664, seed: 72, falling: true },
  ];
  const t = tokens('vermilion');
  return (
    <Shell accent="vermilion" seed={14} no="002" name="McDonald's" probe={probe} caption={{ words: ['came', 'to', '$6', 'billion'], active: 2 }}>
      <Layer depth={0.5}>
        <Cut w={900} h={96} d={sheet(900, 96, { seed: 73, edges: 'ctct', rough: 4, m: 10 }).d} core={sheet(900, 96, { seed: 73, edges: 'ctct', rough: 4, m: 10 }).core} color={t.card} seed={73} lift={0.1} style={{ left: 40, top: base - 34, transform: 'rotate(-0.6deg)' }} />
      </Layer>
      <Layer depth={1}>
        {stacks.map((s) => {
          const box = stackBox(s.count, cw, th);
          const top = base - stackHeight(s.count, cw, th);
          const size = 96;
          const nw = measure(s.value, 'numeral', size);
          return (
            <React.Fragment key={s.label}>
              <CoinStack
                count={s.count}
                w={cw}
                th={th}
                seed={s.seed}
                fall={s.falling ? (i) => (i === s.count - 1 ? { dy: 64 + wb.y * 2, rot: -9 + wb.r * 3, dx: 10 } : {}) : undefined}
                style={{ left: s.cx - box.W / 2, top: base - box.foot }}
              />
              <div style={{ position: 'absolute', left: s.cx - nw / 2, top: top - size * 0.86 - (s.falling ? 108 : 28) }}>
                <Numeral text={s.value} size={size} />
              </div>
              <Label size={26} color={t.type} style={{ position: 'absolute', left: s.cx - measure(s.label.toUpperCase(), 'label', 26) / 2, top: base + 12 }}>
                {s.label}
              </Label>
            </React.Fragment>
          );
        })}
        <Slip text="1 coin = $500 million" size={22} seed={74} rot={1.6} style={{ left: 92, top: 1326 }} />
        <Source text="Source: McDonald's annual report, 2025" />
      </Layer>
      <Layer depth={1.2}>
        <Pencil length={470} style={{ left: 480, top: 1380, transform: 'rotate(14deg)' }} />
        <Offcuts seed={75} n={6} spread={[300, 150]} style={{ left: 560, top: 1250 }} />
      </Layer>
    </Shell>
  );
};

// -------------------------------------------------------------- 5 a stamp
const Stamped: React.FC<{ probe?: boolean }> = ({ probe }) => {
  const size = fit(['51%'], 'numeral', 690, 400);
  return (
    <Shell accent="green" seed={15} no="001" name="Costco" probe={probe} caption={{ words: ['about', 'half', 'of'], active: 1 }}>
      <Layer depth={0.5}>
        <Cut w={640} h={520} d={sheet(640, 520, { seed: 81, edges: 'tttt', rough: 5, m: 12 }).d} core={sheet(640, 520, { seed: 81, edges: 'tttt', rough: 5, m: 12 }).core} color={tokens('green').card} seed={81} lift={0.1} style={{ left: -60, top: 520, transform: 'rotate(-5deg)' }} />
      </Layer>
      <Layer depth={1}>
        <Slip text="Membership fees as a share of profit" size={22} seed={82} tape rot={-1.5} style={{ left: 86, top: 316 }} />
        <div style={{ position: 'absolute', left: 70, top: 392 }}>
          <Numeral text="51%" size={size} />
        </div>
        <Headline lines={['of what Costco earned']} width={800} max={84} style={{ position: 'absolute', left: 84, top: 856 }} />
        <Specks seed={83} n={16} spread={[560, 250]} style={{ left: 300, top: 600 }} />
        <Stamp lines={['About half']} sub="Costco · fiscal 2025" width={540} rot={-9} seed={84} style={{ left: 318, top: 624 }} />
      </Layer>
      <Layer depth={1.6}>
        <StampTool size={270} lift={1} style={{ left: 792, top: 300, transform: 'rotate(15deg)' }} />
      </Layer>
      <Layer depth={1.25}>
        <InkPad w={330} seed={85} style={{ left: 548, top: 1296, transform: 'rotate(7deg)' }} />
      </Layer>
      <Layer depth={1}>
        <Source text="Source: Costco results, fiscal 2025" />
      </Layer>
    </Shell>
  );
};

// ------------------------------------------- 6 a caption with its highlight
const Captioned: React.FC<{ probe?: boolean }> = ({ probe }) => {
  const frame = useCurrentFrame();
  const wb = wobble(8, frame);
  return (
    <Shell accent="cobalt" seed={16} no="003" name="Google and Apple" probe={probe} caption={{ words: ['It', 'is', 'the', 'default'], active: 3, progress: 0.66 }}>
      <Layer depth={0.5}>
        <Cut w={560} h={560} d={sheet(560, 560, { seed: 91, edges: 'tttt', rough: 5, m: 12 }).d} core={sheet(560, 560, { seed: 91, edges: 'tttt', rough: 5, m: 12 }).core} color={MANILA} seed={91} lift={0.1} style={{ left: 30, top: 380, transform: 'rotate(-7deg)' }} />
      </Layer>
      <Layer depth={1}>
        <Phone w={336} seed={92} style={{ left: 112 + wb.x, top: 306 + wb.y, transform: `rotate(${-5 + wb.r}deg)` }} />
        <Headline lines={['One', 'setting']} width={372} max={130} style={{ position: 'absolute', left: 520, top: 400 }} />
        <Slip text="Set before you buy it" size={22} seed={93} rot={2} style={{ left: 508, top: 640 }} />
        <Arrow from={[560, 742]} to={[446, 602]} bend={-46} />
      </Layer>
      <Layer depth={1.5}>
        <Coin r={84} seed={94} lift={0.3} style={{ left: 96, top: 1352, transform: 'rotate(-14deg)' }} />
        <Coin r={66} seed={95} lift={0.2} style={{ left: 250, top: 1426, transform: 'rotate(22deg)' }} />
        <Coin r={74} seed={96} lift={0.24} style={{ left: 760, top: 880, transform: 'rotate(8deg)' }} />
        <Pencil length={480} style={{ left: 430, top: 1400, transform: 'rotate(-11deg)' }} />
      </Layer>
    </Shell>
  );
};

// ----------------------------------------------- 7 a note cut by scissors
const NoteCut: React.FC<{ probe?: boolean }> = ({ probe }) => {
  const frame = useCurrentFrame();
  const wb = wobble(9, frame);
  const w = 776;
  const h = 346;
  const share = 0.36; // Apple's share of the search ad money earned through Safari
  const size = 176;
  return (
    <Shell accent="cobalt" seed={17} no="003" name="Google and Apple" probe={probe} caption={{ words: ['Apple', 'got', '36%'], active: 2 }}>
      <Layer depth={1}>
        <Headline lines={["Apple's cut"]} width={800} max={150} style={{ position: 'absolute', left: 80, top: 300 }} />
        <Note w={w} h={h} from={0} to={1 - share} seed={101} title="Safari search ads" serial="No 003" lift={0.22} style={{ left: 78, top: 498, transform: 'rotate(-2deg)', transformOrigin: '0 0' }} />
      </Layer>
      <Layer depth={1.4}>
        <Note w={w} h={h} from={1 - share} to={1} seed={101} title="Safari search ads" serial="No 003" lift={0.75} style={{ left: 78 + w * (1 - share) + 42 + wb.x, top: 524 + wb.y, transform: `rotate(${8 + wb.r}deg)`, transformOrigin: '0 0' }} />
      </Layer>
      <Layer depth={1.7}>
        <Scissors size={300} open={30} style={{ left: 566, top: 800, transform: 'rotate(-36deg)', transformOrigin: '110px 190px' }} />
      </Layer>
      <Layer depth={1}>
        <Label size={25} style={{ position: 'absolute', left: 88, top: 862 }}>
          Apple&apos;s share
        </Label>
        <div style={{ position: 'absolute', left: 74, top: 894 }}>
          <Numeral text="36%" size={size} />
        </div>
        <Source text="Source: court testimony, November 2023" />
      </Layer>
      <Layer depth={1.2}>
        <Offcuts seed={102} n={9} spread={[420, 190]} style={{ left: 470, top: 1300 }} />
      </Layer>
    </Shell>
  );
};

// --------------------------------------------------- 8 the inverted version
const Inverted: React.FC<{ probe?: boolean }> = ({ probe }) => {
  const frame = useCurrentFrame();
  const wb = wobble(10, frame);
  return (
    <Shell accent="gold" inverted seed={18} no="001" name="Costco" probe={probe} caption={{ words: ['comes', 'from', 'the', 'card'], active: 3 }}>
      <Layer depth={1}>
        <Headline lines={['The money comes', 'from the card']} width={800} max={112} style={{ position: 'absolute', left: 80, top: 304 }} />
        <Receipt
          w={416}
          title="Costco · fiscal 2025"
          rows={[
            { label: 'Net sales', value: '$269.9bn' },
            { label: 'Membership fees', value: '$5.3bn', mark: true },
            { label: 'Operating income', value: '$10.4bn' },
          ]}
          seed={111}
          style={{ left: 82, top: 548, transform: 'rotate(-3deg)' }}
        />
        <Clip size={96} style={{ left: 118, top: 516, transform: 'rotate(-6deg)' }} />
      </Layer>
      <Layer depth={1.4}>
        <MemberCard w={376} price="$65" sub="a year" seed={112} lift={0.6} style={{ left: 516 + wb.x, top: 584 + wb.y, transform: `rotate(${7 + wb.r}deg)` }} />
        <Coin r={70} seed={113} lift={0.3} style={{ left: 566, top: 848, transform: 'rotate(-18deg)' }} />
        <Coin r={56} seed={114} lift={0.2} style={{ left: 706, top: 902, transform: 'rotate(26deg)' }} />
        <Coin r={84} seed={115} lift={0.36} style={{ left: 824, top: 828, transform: 'rotate(10deg)' }} />
      </Layer>
      <Layer depth={1.3}>
        <Coin r={76} seed={116} lift={0.3} style={{ left: 700, top: 1330, transform: 'rotate(15deg)' }} />
        <Coin r={58} seed={117} lift={0.2} style={{ left: 850, top: 1420, transform: 'rotate(-20deg)' }} />
        <Offcuts seed={118} n={6} spread={[300, 150]} style={{ left: 420, top: 1330 }} />
      </Layer>
      <Layer depth={1}>
        <Source text="Source: Costco results, fiscal 2025" />
      </Layer>
    </Shell>
  );
};

const PAGES = [Palette, TypeInUse, Product, CoinChart, Stamped, Captioned, NoteCut, Inverted];
export const BOARD_PAGES = ['palette', 'type', 'product', 'coin-stack-chart', 'stamp', 'caption-highlight', 'note-cut', 'inverted'];

export const Board: React.FC<BoardProps> = ({ page, probe }) => {
  const Page = PAGES[Math.max(0, Math.min(PAGES.length - 1, page - 1))];
  return <Page probe={probe} />;
};
