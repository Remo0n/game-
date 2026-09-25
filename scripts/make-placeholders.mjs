import { deflateSync } from "node:zlib";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(width, height, paint) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = paint(x, y, width, height);
      const index = row + 1 + x * 4;
      raw[index] = r;
      raw[index + 1] = g;
      raw[index + 2] = b;
      raw[index + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function fill(color) {
  return () => color;
}

function circle(cx, cy, radius, color, base) {
  return (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= radius * radius ? color : base(x, y);
  };
}

const root = join(process.cwd(), "assets", "ui");
mkdirSync(root, { recursive: true });

const diorama = png(640, 360, (x, y, w, h) => {
  if (y < h * 0.42) return [168, 214, 232, 255];
  if (y < h * 0.62) return [126, 196, 214, 255];
  const nx = (x - w / 2) / (w * 0.34);
  const ny = (y - h * 0.7) / (h * 0.22);
  if (nx * nx + ny * ny < 1) return [196, 146, 90, 255];
  return [212, 164, 106, 255];
});

const avatar = png(128, 128, circle(64, 64, 58, [244, 196, 150, 255], fill([232, 196, 154, 255])));

const icons = {
  "icon-daily.png": [232, 120, 96],
  "icon-rewards.png": [242, 176, 64],
  "icon-skins.png": [242, 140, 116],
  "icon-trays.png": [196, 146, 90],
  "icon-worlds.png": [96, 168, 132],
  "icon-settings.png": [92, 74, 64],
};

function save(name, bytes) {
  const file = join(root, name);
  if (existsSync(file)) return;
  writeFileSync(file, bytes);
  console.log("wrote", file);
}

save("diorama.png", diorama);
save("avatar.png", avatar);
for (const [name, color] of Object.entries(icons)) {
  save(name, png(128, 128, circle(64, 64, 46, [...color, 255], fill([255, 248, 239, 255]))));
}

save("home-bg.png", png(480, 960, (_x, y, _w, h) => {
  const band = Math.floor(y / 18) % 2;
  const wood = band === 0 ? [214, 164, 106, 255] : [198, 146, 90, 255];
  if (y < h * 0.28) return [186, 214, 228, 255];
  return wood;
}));

save("icon-leaderboard.png", png(128, 128, circle(64, 64, 46, [232, 176, 64, 255], fill([255, 248, 239, 255]))));
save("icon-shop.png", png(128, 128, circle(64, 64, 46, [226, 112, 96, 255], fill([255, 248, 239, 255]))));
save("icon-coin.png", png(96, 96, circle(48, 48, 36, [242, 184, 48, 255], fill([0, 0, 0, 0]))));
save("icon-gem.png", png(96, 96, circle(48, 48, 36, [92, 168, 214, 255], fill([0, 0, 0, 0]))));
save("tabi.png", png(180, 220, (x, y) => {
  const dx = x - 90;
  const dy = y - 120;
  if (dx * dx + dy * dy < 70 * 70) return [244, 176, 96, 255];
  if ((x - 55) * (x - 55) + (y - 55) * (y - 55) < 22 * 22) return [244, 176, 96, 255];
  if ((x - 125) * (x - 125) + (y - 55) * (y - 55) < 22 * 22) return [244, 176, 96, 255];
  return [0, 0, 0, 0];
}));

const glyph = {
  B: ["11110", "10001", "11110", "10001", "11110"],
  E: ["11111", "10000", "11110", "10000", "11111"],
  N: ["10001", "11001", "10101", "10011", "10001"],
  T: ["11111", "00100", "00100", "00100", "00100"],
  O: ["01110", "10001", "10001", "10001", "01110"],
  L: ["10000", "10000", "10000", "10000", "11111"],
  C: ["01111", "10000", "10000", "10000", "01111"],
  K: ["10001", "10010", "11100", "10010", "10001"],
  S: ["01111", "10000", "01110", "00001", "11110"],
};
function paintWord(words) {
  const scale = 8;
  const width = 520;
  const height = 140;
  return png(width, height, (x, y) => {
    const line = y < 70 ? 0 : 1;
    const localY = line === 0 ? y : y - 74;
    const row = Math.floor(localY / scale);
    const word = words[line];
    const wordWidth = word.length * 6 * scale;
    const origin = Math.floor((width - wordWidth) / 2);
    const col = Math.floor((x - origin) / scale);
    const charIndex = Math.floor(col / 6);
    const bit = col % 6;
    const rows = glyph[word[charIndex]];
    if (!rows || row < 0 || row >= rows.length || bit >= 5) return [0, 0, 0, 0];
    return rows[row][bit] === "1" ? [246, 196, 69, 255] : [0, 0, 0, 0];
  });
}
save("logo.png", paintWord(["BENTO", "BLOCKS"]));

const playIcons = {
  "icon-pause.png": [92, 64, 48],
  "icon-cut.png": [242, 160, 48],
  "icon-move.png": [120, 96, 80],
  "icon-rotate.png": [120, 96, 80],
  "icon-undo.png": [120, 96, 80],
  "icon-reset.png": [120, 96, 80],
  "icon-hint.png": [232, 176, 64],
  "icon-laser.png": [226, 96, 88],
  "icon-split.png": [196, 146, 90],
  "icon-extra.png": [96, 168, 132],
};
for (const [name, color] of Object.entries(playIcons)) {
  save(name, png(128, 128, circle(64, 64, 40, [...color, 255], fill([255, 248, 239, 255]))));
}
save("play-bg.png", png(480, 960, (_x, y, _w, h) => {
  if (y < h * 0.22) return [186, 214, 228, 255];
  const band = Math.floor(y / 16) % 2;
  return band === 0 ? [214, 164, 106, 255] : [196, 146, 90, 255];
}));
save("play-board.png", png(640, 360, (x, y, w, h) => {
  const edge = x < 18 || y < 18 || x > w - 18 || y > h - 18;
  return edge ? [160, 106, 62, 255] : [214, 164, 106, 255];
}));
save("play-tabi.png", png(180, 180, (x, y) => {
  const dx = x - 90;
  const dy = y - 100;
  if (dx * dx + dy * dy < 62 * 62) return [244, 176, 96, 255];
  if ((x - 58) * (x - 58) + (y - 48) * (y - 48) < 20 * 20) return [244, 176, 96, 255];
  if ((x - 122) * (x - 122) + (y - 48) * (y - 48) < 20 * 20) return [244, 176, 96, 255];
  return [0, 0, 0, 0];
}));
