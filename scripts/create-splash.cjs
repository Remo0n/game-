// Vector-like launch mark rendered at 4x resolution for a crisp native splash.
const Jimp = require("jimp-compact");
const scale = 4;
const canvas = new Jimp(256 * scale, 256 * scale, 0x00000000);
function paint(test, color) {
  const rgba = Jimp.cssColorToHex(color);
  canvas.scan(0, 0, canvas.bitmap.width, canvas.bitmap.height, function (x, y) {
    if (test((x + 0.5) / scale, (y + 0.5) / scale))
      this.setPixelColor(rgba, x, y);
  });
}
function rect(x, y, w, h, r, color) {
  paint((a, b) => {
    const dx = Math.max(x + r - a, 0, a - (x + w - r));
    const dy = Math.max(y + r - b, 0, b - (y + h - r));
    return (
      a >= x && a <= x + w && b >= y && b <= y + h && dx * dx + dy * dy <= r * r
    );
  }, color);
}
function ellipse(x, y, rx, ry, color) {
  paint((a, b) => ((a - x) / rx) ** 2 + ((b - y) / ry) ** 2 <= 1, color);
}
rect(14, 18, 228, 224, 36, "#B9915C");
rect(14, 14, 228, 224, 36, "#D1AD79");
rect(26, 26, 204, 200, 26, "#EBD1A2");
rect(38, 38, 84, 84, 15, "#E4EDD5");
rect(134, 38, 84, 84, 15, "#F8DCA8");
rect(38, 134, 84, 80, 15, "#F8D5C0");
rect(134, 134, 84, 80, 15, "#F9E9A2");
// Maki roll.
ellipse(80, 82, 32, 30, "#304D3C");
ellipse(80, 78, 27, 25, "#FFFCEF");
ellipse(80, 78, 16, 15, "#E98D70");
rect(78, 68, 12, 19, 3, "#89AB69");
// Sandwich, with visible filling.
rect(145, 53, 62, 53, 13, "#C98547");
rect(145, 50, 62, 49, 13, "#FFF0BF");
rect(145, 77, 62, 14, 5, "#83A866");
rect(145, 85, 62, 8, 3, "#E89375");
rect(145, 92, 62, 12, 6, "#E5B46E");
// Salmon nigiri and tamago.
rect(47, 146, 66, 52, 15, "#FFF8E8");
rect(45, 141, 70, 43, 12, "#E88F70");
for (let x = 55; x <= 100; x += 15) rect(x, 143, 4, 39, 2, "#F8C6AA");
rect(147, 148, 60, 49, 13, "#FFFCED");
rect(145, 142, 64, 43, 11, "#E9C653");
rect(170, 141, 15, 55, 3, "#436346");
async function writeAssets() {
  const fs = require("node:fs");
  fs.mkdirSync("public/icons", { recursive: true });
  await canvas
    .clone()
    .resize(512, 512, Jimp.RESIZE_BICUBIC)
    .writeAsync("assets/bento-splash.png");
  const icon = new Jimp(1024, 1024, "#F7F5EC");
  icon.composite(canvas.clone().resize(820, 820, Jimp.RESIZE_BICUBIC), 102, 96);
  await icon.writeAsync("assets/icon.png");
  await icon
    .clone()
    .resize(64, 64, Jimp.RESIZE_BICUBIC)
    .writeAsync("assets/favicon.png");
  for (const size of [192, 512])
    await icon
      .clone()
      .resize(size, size, Jimp.RESIZE_BICUBIC)
      .writeAsync(`public/icons/icon-${size}.png`);
  const foreground = new Jimp(1024, 1024, 0x00000000);
  foreground.composite(
    canvas.clone().resize(650, 650, Jimp.RESIZE_BICUBIC),
    187,
    180,
  );
  await foreground.writeAsync("assets/android-icon-foreground.png");
  // A legible one-color tray for Android themed launcher icons.
  canvas.scan(0, 0, canvas.bitmap.width, canvas.bitmap.height, function (x, y) {
    this.setPixelColor(0, x, y);
  });
  rect(48, 48, 160, 160, 25, "#FFFFFF");
  rect(60, 60, 136, 136, 14, "#00000000");
  rect(72, 72, 50, 50, 8, "#FFFFFF");
  rect(134, 72, 50, 50, 8, "#FFFFFF");
  rect(72, 134, 50, 50, 8, "#FFFFFF");
  rect(134, 134, 50, 50, 8, "#FFFFFF");
  await canvas.writeAsync("assets/android-icon-monochrome.png");
}
writeAssets().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
