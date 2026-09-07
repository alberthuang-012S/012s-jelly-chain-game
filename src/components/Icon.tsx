import type { CSSProperties } from 'react';
const paths = {
  flask: 'M9 3h6M10 3v7l-5 8a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-8V3M8 15h8',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  gift: 'M4 10h16v11H4zM3 6h18v4H3zM12 6v15M12 6C6 6 5 1 8 1c3 0 4 5 4 5Zm0 0s1-5 4-5c3 0 2 5-4 5Z',
  sound: 'M11 4 5 9H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  mute: 'M11 4 5 9H2v6h3l6 5V4Zm5 5 6 6m0-6-6 6',
  bolt: 'm13 2-9 12h7l-1 8 10-13h-8z',
  help: 'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 4h.01M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0Z',
  close: 'm6 6 12 12M6 18 18 6',
  star: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z',
  lock: 'M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4',
  check: 'm5 12 4 4L19 6',
} as const;
export function Icon({
  name,
  size = 20,
  style,
}: {
  name: keyof typeof paths;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
