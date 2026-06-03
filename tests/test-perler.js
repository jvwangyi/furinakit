const sharp = require('sharp');
const path = require('path');

// MARD 色板
const PALETTE = [
  { id: 'M01', hex: '#FFFFFF' }, { id: 'M02', hex: '#000000' },
  { id: 'M03', hex: '#FF0000' }, { id: 'M04', hex: '#FF8C00' },
  { id: 'M05', hex: '#FFD700' }, { id: 'M06', hex: '#00AA00' },
  { id: 'M07', hex: '#0066CC' }, { id: 'M08', hex: '#8B00FF' },
  { id: 'M09', hex: '#FF69B4' }, { id: 'M10', hex: '#8B4513' },
  { id: 'M11', hex: '#808080' }, { id: 'M12', hex: '#87CEEB' },
  { id: 'M13', hex: '#006400' }, { id: 'M14', hex: '#8B0000' },
  { id: 'M15', hex: '#DAA520' }, { id: 'M16', hex: '#00CED1' },
  { id: 'M17', hex: '#FF7F50' }, { id: 'M18', hex: '#4B0082' },
  { id: 'M19', hex: '#98FF98' }, { id: 'M20', hex: '#F5F5DC' },
];

// Oklab 色彩空间
function srgbToLinear(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function rgbToOklab(r, g, b) {
  const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
  const l_ = 0.4122214708*lr + 0.5363325363*lg + 0.0514459929*lb;
  const m_ = 0.2119034982*lr + 0.6806995451*lg + 0.1073969566*lb;
  const s_ = 0.0883024619*lr + 0.2817188376*lg + 0.6299787005*lb;
  const lR = Math.cbrt(l_), mR = Math.cbrt(m_), sR = Math.cbrt(s_);
  return { L: 0.2104542553*lR+0.7936177850*mR-0.0040720468*sR, a: 1.9779984951*lR-2.4285922050*mR+0.4505937099*sR, b: 0.0259040371*lR+0.7827717662*mR-0.8086757660*sR };
}

function hexToRgb(hex) { return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]; }

const paletteOklab = PALETTE.map(c => { const [r,g,b] = hexToRgb(c.hex); return { ...c, r, g, b, oklab: rgbToOklab(r,g,b) }; });

function findClosest(r, g, b) {
  const lab = rgbToOklab(r, g, b);
  let minD = Infinity, best = paletteOklab[0];
  for (const p of paletteOklab) {
    const dL = lab.L - p.oklab.L, da = lab.a - p.oklab.a, db = lab.b - p.oklab.b;
    const d = Math.sqrt(dL*dL + da*da + db*db) * 100;
    if (d < minD) { minD = d; best = p; }
  }
  return best;
}

async function main() {
  const gridSize = 29;
  const inputPath = 'C:/Users/26601/.openclaw/media/inbound/b5ad0e50-e0bc-41f0-93c7-a65a22b9005e.jpg';
  const outputPath = 'C:/Users/26601/.openclaw/workspace/perler-output.png';

  // 缩放到网格大小
  const { data, info } = await sharp(inputPath)
    .resize(gridSize, gridSize, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 映射颜色
  const grid = [];
  for (let y = 0; y < gridSize; y++) {
    const row = [];
    for (let x = 0; x < gridSize; x++) {
      const i = (y * gridSize + x) * 3;
      const color = findClosest(data[i], data[i+1], data[i+2]);
      row.push(color);
    }
    grid.push(row);
  }

  // 生成图纸
  const cellSize = 24;
  const padding = 30;
  const outputSize = gridSize * cellSize + padding * 2;
  const channels = 4;
  const outBuf = Buffer.alloc(outputSize * outputSize * channels, 255);

  // 白色背景已填充
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const color = grid[y][x];
      const px = padding + x * cellSize;
      const py = padding + y * cellSize;

      // 填充颜色
      for (let dy = 0; dy < cellSize; dy++) {
        for (let dx = 0; dx < cellSize; dx++) {
          const oi = ((py + dy) * outputSize + (px + dx)) * channels;
          outBuf[oi] = color.r;
          outBuf[oi+1] = color.g;
          outBuf[oi+2] = color.b;
          outBuf[oi+3] = 255;
        }
      }

      // 网格线
      for (let d = 0; d < cellSize; d++) {
        // 右边线
        const ri = ((py + d) * outputSize + (px + cellSize - 1)) * channels;
        outBuf[ri] = 200; outBuf[ri+1] = 200; outBuf[ri+2] = 200;
        // 下边线
        const bi = ((py + cellSize - 1) * outputSize + (px + d)) * channels;
        outBuf[bi] = 200; outBuf[bi+1] = 200; outBuf[bi+2] = 200;
      }
    }
  }

  await sharp(outBuf, { raw: { width: outputSize, height: outputSize, channels } })
    .png()
    .toFile(outputPath);

  console.log('Done! Output:', outputPath);

  // 统计颜色用量
  const stats = {};
  for (const row of grid) {
    for (const c of row) {
      stats[c.id] = (stats[c.id] || 0) + 1;
    }
  }
  console.log('\nColor usage:');
  Object.entries(stats).sort((a,b) => b[1]-a[1]).forEach(([id, count]) => {
    const c = PALETTE.find(p => p.id === id);
    console.log(`  ${id} (${c.hex}): ${count} beads`);
  });
}

main().catch(console.error);
