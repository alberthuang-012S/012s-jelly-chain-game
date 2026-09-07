import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Non-destructive crops of the supplied 2048 × 1365 design board.
// Preserve accessories and white interiors; only remove edge-connected near-white background.
const source = 'reference/jellyfish-3d-style-board.png';
const bytes = await readFile(source);
const regions = {
  wild: [64, 172, 435, 454],
  bonus: [548, 156, 464, 470],
  green: [1030, 194, 455, 432],
  blue: [1530, 177, 477, 449],
  pink: [28, 799, 475, 448],
  aqua: [563, 799, 465, 448],
  purple: [1059, 793, 472, 454],
  fire: [1576, 770, 453, 477],
};
await mkdir('src/assets/jellies', { recursive: true });
for (const [name, [left, top, width, height]] of Object.entries(regions)) {
  const { data, info } = await sharp(bytes)
    .extract({ left, top, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const visited = new Uint8Array(width * height);
  const queue = [];
  const offer = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    visited[p] = 1;
    const i = p * 4;
    if (Math.min(data[i], data[i + 1], data[i + 2]) < 242) return;
    queue.push(p);
  };
  for (let x = 0; x < width; x++) {
    offer(x, 0);
    offer(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    offer(0, y);
    offer(width - 1, y);
  }
  for (let n = 0; n < queue.length; n++) {
    const p = queue[n],
      x = p % width,
      y = Math.floor(p / width);
    data[p * 4 + 3] = 0;
    offer(x - 1, y);
    offer(x + 1, y);
    offer(x, y - 1);
    offer(x, y + 1);
  }
  await sharp(data, { raw: info })
    .resize(256, 256, { fit: 'contain', background: '#00000000' })
    .webp({ quality: 90 })
    .toFile(`src/assets/jellies/${name}.webp`);
}
await writeFile(
  'src/assets/jellies/provenance.json',
  JSON.stringify(
    {
      source,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      output: '256x256 WebP, edge-connected background removed',
      regions,
    },
    null,
    2,
  ) + '\n',
);
console.log('Derived eight independent 256×256 WebP assets. Source unchanged.');
