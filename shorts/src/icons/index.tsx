// Original icons, drawn for this channel on a 48-unit grid. No logos, no
// mascots, no third-party icon sets. Two tones: `color` for line work and
// `accent` for the one filled detail.
import React from 'react';

type El = React.ReactElement;
type Draw = (a: string, c: string) => El[];

const P = (d: string, fill = 'none', key?: string | number, sw?: number) => <path key={key ?? d.slice(0, 18)} d={d} fill={fill} strokeWidth={sw} />;
const R = (x: number, y: number, w: number, h: number, rx = 0, fill = 'none') => <rect key={`r${x}-${y}-${w}`} x={x} y={y} width={w} height={h} rx={rx} fill={fill} />;
const C = (cx: number, cy: number, r: number, fill = 'none') => <circle key={`c${cx}-${cy}-${r}`} cx={cx} cy={cy} r={r} fill={fill} />;
const Ln = (x1: number, y1: number, x2: number, y2: number, sw?: number) => <line key={`l${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={sw} />;

const ICON: Record<string, Draw> = {
  cart: (a) => [P('M13 15h28l-5 15H16z', a), P('M4 8h6l6 22'), C(19, 38, 3), C(33, 38, 3)],
  card: (a) => [R(4, 10, 40, 28, 5), R(4, 17, 40, 6, 0, a), R(9, 28, 9, 5, 1.5)],
  coin: (a) => [C(24, 24, 19), C(24, 24, 12, a), Ln(19, 21, 29, 21), Ln(19, 27, 29, 27)],
  cash: (a) => [R(4, 13, 40, 22, 3), C(24, 24, 6.5, a), Ln(10, 19, 10, 29), Ln(38, 19, 38, 29)],
  warehouse: (a) => [P('M4 20L24 7l20 13'), P('M7 19v21h34V19'), R(16, 27, 16, 13, 0, a), Ln(16, 31.5, 32, 31.5), Ln(16, 36, 32, 36)],
  store: (a) => [P('M9 9h30l4 10a4.6 4.6 0 0 1-9.3 0 4.6 4.6 0 0 1-9.4 0 4.6 4.6 0 0 1-9.3 0A4.6 4.6 0 0 1 5 19z', a), P('M9 25v16h30V25'), R(20, 30, 8, 11)],
  burger: (a) => [P('M7 20a17 13 0 0 1 34 0z', a), R(5, 24, 38, 6, 3), P('M8 34h32v2a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6z')],
  fries: (a) => [Ln(16, 22, 14, 9, 4.5), Ln(22, 22, 21.5, 6, 4.5), Ln(27, 22, 28, 7, 4.5), Ln(32, 22, 35, 10, 4.5), P('M11 21h26l-3 22H14z', a)],
  house: (a) => [P('M5 23L24 7l19 16'), P('M10 20v21h28V20'), R(20, 28, 8, 13, 0, a)],
  key: (a) => [C(15, 24, 9, a), C(15, 24, 3), Ln(24, 24, 44, 24), Ln(37, 24, 37, 31), Ln(44, 24, 44, 30)],
  phone: (a) => [R(13, 4, 22, 40, 4.5), R(16.5, 9, 15, 25, 1.5, a), C(24, 39, 1.4)],
  search: (a) => [C(21, 21, 13, a), Ln(31, 31, 43, 43, 5.5)],
  cloud: (a) => [P('M14 37a9.5 9.5 0 0 1-1-18.9A12.5 12.5 0 0 1 37 21a8 8 0 0 1-1 16z', a)],
  server: (a) => [R(7, 6, 34, 10, 2.5), R(7, 19, 34, 10, 2.5), R(7, 32, 34, 10, 2.5), C(13, 11, 1.8, a), C(13, 24, 1.8, a), C(13, 37, 1.8, a), Ln(27, 11, 35, 11), Ln(27, 24, 35, 24), Ln(27, 37, 35, 37)],
  box: (a) => [P('M24 5l18 9v20l-18 9-18-9V14z'), P('M6 14l18 9 18-9'), Ln(24, 23, 24, 43), P('M15 9.5l18 9v7l-6 3v-7l-18-9z', a)],
  cup: (a) => [R(9, 7, 30, 6, 2.5), P('M11.5 13h25l-3 30h-19z'), P('M13 21h22l-1 10H14z', a)],
  gift: (a) => [R(7, 21, 34, 21, 2), R(5, 13, 38, 8, 2), R(20.5, 13, 7, 29, 0, a), P('M24 13c-6-10-15-5-10 0'), P('M24 13c6-10 15-5 10 0')],
  person: (a) => [C(24, 14, 8, a), P('M9 43c0-10 6.5-16 15-16s15 6 15 16')],
  people: (a) => [C(16, 16, 6), P('M4 41c0-8 5-13 12-13 3 0 5.6 1 7.6 2.8'), C(33, 16, 6, a), P('M21 41c0-8 5-13 12-13s11 5 11 13')],
  bank: (a) => [P('M5 18L24 6l19 12z', a), R(9.5, 21, 5, 16), R(21.5, 21, 5, 16), R(33.5, 21, 5, 16), R(5, 39, 38, 4.5)],
  tag: (a) => [P('M6 25L23 8h18v18L24 43z'), C(33, 16, 3.4, a)],
  receipt: (a) => [P('M11 5h26v38l-4.3-3-4.4 3-4.3-3-4.3 3-4.4-3-4.3 3z'), Ln(16.5, 14, 31.5, 14), Ln(16.5, 21, 31.5, 21), P('M16.5 28h9', a, 'rl', 4)],
  truck: (a) => [R(3, 12, 25, 21, 2), P('M28 19h8l8 8v6H28z'), C(12, 36, 4.5, a), C(36, 36, 4.5, a)],
  factory: (a) => [P('M5 42V23l11 7v-7l11 7V9h9v33z'), R(11, 34, 5, 4, 0, a), R(21, 34, 5, 4, 0, a), Ln(31.5, 15, 31.5, 15.1, 4)],
  globe: (a) => [C(24, 24, 19, a), P('M24 5c-11 12-11 26 0 38'), P('M24 5c11 12 11 26 0 38'), Ln(5, 24, 43, 24), Ln(8.5, 14, 39.5, 14), Ln(8.5, 34, 39.5, 34)],
  chart: (a) => [P('M7 6v36h36'), R(13, 27, 6, 11), R(23, 19, 6, 19), R(33, 10, 6, 28, 0, a)],
  percent: (a) => [C(14, 14, 6.5, a), C(34, 34, 6.5), Ln(38, 10, 10, 38, 4)],
  clock: (a) => [C(24, 24, 19, a), P('M24 12v12l8 5')],
  lock: (a) => [P('M15 21v-6a9 9 0 0 1 18 0v6'), R(9, 21, 30, 22, 4, a), C(24, 31, 2.6), Ln(24, 33, 24, 37)],
  bolt: (a) => [P('M27 4L9 27h13l-3 17 20-26H25z', a)],
  plane: (a) => [P('M24 4c2.4 0 3.5 2.4 3.5 5.5V18L43 28v4.5l-15.5-4.6v8.6l5 4V44l-8.5-2.4L15.500 44v-3.5l5-4v-8.600L5 32.5V28l15.500-10V9.500C20.500 6.400 21.600 4 24 4z', a)],
  car: (a) => [P('M5 31v-7l5-2 5-10h18l5 10 5 2v7z'), Ln(13, 22, 35, 22), C(14, 32, 4.6, a), C(34, 32, 4.6, a)],
  film: (a) => [R(5, 9, 38, 30, 3), Ln(12, 9, 12, 39), Ln(36, 9, 36, 39), Ln(5, 19, 12, 19), Ln(5, 29, 12, 29), Ln(36, 19, 43, 19), Ln(36, 29, 43, 29), P('M20 18l10 6-10 6z', a)],
  music: (a) => [P('M18 34V11l21-5v24'), C(12.500, 34, 5.500, a), C(33.500, 30, 5.500, a)],
  gamepad: (a) => [P('M13 15h22a10 10 0 0 1 10 10v2a8 8 0 0 1-14.6 4.500L29 30H19l-1.400 1.500A8 8 0 0 1 3 27v-2a10 10 0 0 1 10-10z'), Ln(13, 20, 13, 28), Ln(9, 24, 17, 24), C(32, 21.500, 2.300, a), C(37, 26.500, 2.300, a)],
  printer: (a) => [R(13, 5, 22, 11), R(5, 16, 38, 18, 3), R(13, 28, 22, 15, 0, a), Ln(17, 34, 31, 34), Ln(17, 38.500, 27, 38.500)],
  drop: (a) => [P('M24 5c8 10 13.500 16 13.500 24a13.500 13.500 0 0 1-27 0c0-8 5.500-14 13.500-24z', a)],
  ticket: (a) => [P('M5 13h38v7a4.500 4.500 0 0 0 0 9v7H5v-7a4.500 4.500 0 0 0 0-9z', a), Ln(30, 16, 30, 19), Ln(30, 22.500, 30, 25.500), Ln(30, 29, 30, 32)],
  crown: (a) => [P('M7 35L4 14l11 9 9-14 9 14 11-9-3 21z', a), R(7, 38, 34, 4.500, 1.500)],
  handshake: (a) => [P('M3 18l9-4 12 7-7 9a3.500 3.500 0 0 0 5 4.500l6-6', a), P('M45 18l-9-4-9 4'), P('M28 28.500l7 6.500a3 3 0 0 1-4 4.300l-3-2.600a3 3 0 0 1-4.500 3.800L18 36')],
  building: (a) => [R(11, 5, 26, 38, 1.500), R(16, 10, 5, 5, 0, a), R(27, 10, 5, 5), R(16, 19, 5, 5), R(27, 19, 5, 5, 0, a), R(16, 28, 5, 5, 0, a), R(27, 28, 5, 5), Ln(24, 38, 24, 43)],
  wallet: (a) => [R(4, 12, 38, 27, 5), Ln(4, 19, 34, 19), R(30, 22, 15, 10, 3.500, a), C(35.500, 27, 1.300)],
  safe: (a) => [R(6, 5, 36, 35, 4), C(24, 22.500, 8.500, a), C(24, 22.500, 2.400), Ln(24, 14, 24, 17), Ln(11, 40, 11, 44), Ln(37, 40, 37, 44)],
  megaphone: (a) => [P('M8 19v10l23 9V10z', a), P('M12 30.500V38a3 3 0 0 0 6 0v-5'), P('M37 17a9.500 9.500 0 0 1 0 14')],
  eye: (a) => [P('M3 24c6-10 13-14.500 21-14.500S39 14 45 24c-6 10-13 14.500-21 14.500S9 34 3 24z'), C(24, 24, 7.500, a), C(24, 24, 2.500)],
  bottle: (a) => [R(19.500, 4, 9, 8, 1.500), P('M20 12c0 5-7.500 6-7.500 13.500V40a3 3 0 0 0 3 3h17a3 3 0 0 0 3-3V25.500C35.500 18 28 17 28 12'), R(12.500, 26, 23, 9, 0, a)],
  shirt: (a) => [P('M16 6L4 13l5 9.500 5-3V43h20V19.500l5 3L44 13 32 6c-1 4-4 6-8 6s-7-2-8-6z', a)],
  pill: (a) => [<g key="pill" transform="rotate(-35 24 24)">{[R(5, 16, 38, 16, 8), <path key="half" d="M24 16h11a8 8 0 0 1 0 16H24z" fill={a} />]}</g>],
  wifi: (a) => [P('M5 19a27 27 0 0 1 38 0'), P('M11.500 26.500a17.500 17.500 0 0 1 25 0'), P('M18 33.500a8.500 8.500 0 0 1 12 0'), C(24, 39.500, 2.600, a)],
  star: (a) => [P('M24 4l6 13.200 14.400 1.600-10.800 9.700 3.100 14.100L24 35.300l-12.700 7.300 3.100-14.100L3.600 18.800 18 17.200z', a)],
};

export const hasIcon = (name: string) => name in ICON;

export const Icon: React.FC<{ name: string; size: number; color: string; accent: string; stroke?: number; style?: React.CSSProperties }> = ({ name, size, color, accent, stroke = 3, style }) => {
  const draw = ICON[name] ?? ICON.coin;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0, ...style }}>
      {draw(accent, color)}
    </svg>
  );
};

/** An icon on a round or square plate. */
export const IconTile: React.FC<{ name: string; size: number; plate: string; color: string; accent: string; radius: number; ring?: string }> = ({ name, size, plate, color, accent, radius, ring }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: Math.min(radius * 1.4, size / 2),
      background: plate,
      border: ring ? `4px solid ${ring}` : 'none',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <Icon name={name} size={size * 0.6} color={color} accent={accent} stroke={2.800} />
  </div>
);
