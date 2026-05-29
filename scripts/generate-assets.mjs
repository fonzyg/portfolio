import fs from "node:fs/promises";
import zlib from "node:zlib";

const W = 1200;
const H = 675;
const OUT = new URL("../assets/", import.meta.url);

const FONT = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10011", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  0: ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  2: ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  3: ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  4: ["10010", "10010", "10010", "11111", "00010", "00010", "00010"],
  5: ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  6: ["01111", "10000", "10000", "11110", "10001", "10001", "01110"],
  7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  9: ["01110", "10001", "10001", "01111", "00001", "00001", "11110"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "$": ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
};

function color(hex, alpha = 1) {
  const clean = hex.replace("#", "");
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16),
    Math.round(alpha * 255),
  ];
}

function image(bg) {
  const pixels = Buffer.alloc(W * H * 4);
  const c = color(bg);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = c[0];
    pixels[i + 1] = c[1];
    pixels[i + 2] = c[2];
    pixels[i + 3] = 255;
  }
  return pixels;
}

function blend(pixels, x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (Math.floor(y) * W + Math.floor(x)) * 4;
  const a = c[3] / 255;
  pixels[i] = Math.round(c[0] * a + pixels[i] * (1 - a));
  pixels[i + 1] = Math.round(c[1] * a + pixels[i + 1] * (1 - a));
  pixels[i + 2] = Math.round(c[2] * a + pixels[i + 2] * (1 - a));
  pixels[i + 3] = 255;
}

function rect(pixels, x, y, w, h, c) {
  for (let yy = Math.max(0, y); yy < Math.min(H, y + h); yy += 1) {
    for (let xx = Math.max(0, x); xx < Math.min(W, x + w); xx += 1) {
      blend(pixels, xx, yy, c);
    }
  }
}

function stroke(pixels, x, y, w, h, c, t = 2) {
  rect(pixels, x, y, w, t, c);
  rect(pixels, x, y + h - t, w, t, c);
  rect(pixels, x, y, t, h, c);
  rect(pixels, x + w - t, y, t, h, c);
}

function line(pixels, x1, y1, x2, y2, c, t = 4) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i += 1) {
    const x = Math.round(x1 + ((x2 - x1) * i) / steps);
    const y = Math.round(y1 + ((y2 - y1) * i) / steps);
    rect(pixels, x - Math.floor(t / 2), y - Math.floor(t / 2), t, t, c);
  }
}

function text(pixels, value, x, y, scale, c) {
  let cursor = x;
  for (const raw of value.toUpperCase()) {
    if (raw === " ") {
      cursor += scale * 4;
      continue;
    }
    const glyph = FONT[raw] ?? FONT["-"];
    glyph.forEach((row, yy) => {
      [...row].forEach((cell, xx) => {
        if (cell === "1") rect(pixels, cursor + xx * scale, y + yy * scale, scale, scale, c);
      });
    });
    cursor += scale * 6;
  }
}

function grid(pixels, c = color("#18201c", 0.05)) {
  for (let x = 0; x < W; x += 52) rect(pixels, x, 0, 1, H, c);
  for (let y = 0; y < H; y += 52) rect(pixels, 0, y, W, 1, c);
}

function windowFrame(pixels, x, y, w, h, title, bg = "#ffffff") {
  rect(pixels, x, y, w, h, color(bg, 0.95));
  stroke(pixels, x, y, w, h, color("#18201c", 0.16), 2);
  rect(pixels, x, y, w, 62, color("#ffffff", 0.92));
  stroke(pixels, x, y + 61, w, 1, color("#18201c", 0.14), 1);
  text(pixels, title, x + 24, y + 22, 4, color("#18201c"));
  rect(pixels, x + w - 104, y + 25, 13, 13, color("#d9a441"));
  rect(pixels, x + w - 78, y + 25, 13, 13, color("#b75a42"));
  rect(pixels, x + w - 52, y + 25, 13, 13, color("#1e5b4f"));
}

function pill(pixels, x, y, w, label, bg, fg = "#18201c") {
  rect(pixels, x, y, w, 34, color(bg));
  text(pixels, label, x + 12, y + 10, 3, color(fg));
}

function hero() {
  const p = image("#fbfaf5");
  grid(p);
  windowFrame(p, 54, 54, 1092, 567, "ALFONSO AVILA / SWE PORTFOLIO");
  rect(p, 92, 150, 500, 420, color("#ffffff"));
  stroke(p, 92, 150, 500, 420, color("#dfe5de"), 2);
  text(p, "FULL STACK", 126, 220, 8, color("#143c35"));
  text(p, "PRODUCT", 126, 310, 8, color("#143c35"));
  text(p, "BUILDS", 126, 400, 8, color("#143c35"));
  text(p, "SECURITY AI DATA", 126, 520, 3, color("#58645d"));
  const cards = [
    ["OAKVAULT", "#143c35", 638, 150],
    ["CRM", "#b75a42", 890, 150],
    ["STORE", "#315d8a", 638, 365],
    ["TRADING", "#735b1d", 890, 365],
  ];
  for (const [label, bg, x, y] of cards) {
    rect(p, x, y, 218, 190, color(bg));
    text(p, label, x + 22, y + 28, 4, color("#ffffff"));
    rect(p, x + 22, y + 92, 150, 12, color("#ffffff", 0.46));
    rect(p, x + 22, y + 120, 112, 12, color("#ffffff", 0.46));
    rect(p, x + 22, y + 148, 174, 12, color("#ffffff", 0.46));
  }
  return p;
}

function oakvault() {
  const p = image("#111916");
  grid(p, color("#ffffff", 0.04));
  windowFrame(p, 46, 46, 1108, 583, "OAKVAULT DEFENDER DASHBOARD", "#17231f");
  rect(p, 84, 132, 280, 455, color("#ffffff", 0.05));
  stroke(p, 84, 132, 280, 455, color("#ffffff", 0.1), 2);
  text(p, "DECOY VAULTS", 110, 164, 3, color("#ffffff"));
  for (let i = 0; i < 3; i += 1) {
    const y = 214 + i * 112;
    rect(p, 110, y, 228, 78, color("#d9a441", 0.16));
    stroke(p, 110, y, 228, 78, color("#d9a441", 0.4), 2);
    text(p, ["FINANCE", "CLIENTS", "ADMIN"][i], 130, y + 22, 4, color("#ffffff"));
    text(p, ["LAYER 2", "LURE ON", "FLOOD"][i], 130, y + 52, 3, color("#d9a441"));
  }
  rect(p, 392, 132, 430, 455, color("#ffffff", 0.05));
  stroke(p, 392, 132, 430, 455, color("#ffffff", 0.1), 2);
  text(p, "INCIDENT STORY", 424, 164, 4, color("#ffffff"));
  ["DISCOVERED", "DESCENDED", "WRONG GUESSES", "FLOOD LOCKOUT"].forEach((label, i) => {
    const y = 218 + i * 82;
    rect(p, 424, y, 42, 42, color("#d9a441"));
    text(p, `0${i + 1}`, 433, y + 13, 3, color("#18201c"));
    text(p, label, 486, y + 8, 4, color("#ffffff"));
    rect(p, 486, y + 46, 250, 8, color("#ffffff", 0.16));
  });
  rect(p, 850, 132, 260, 455, color("#ffffff", 0.05));
  stroke(p, 850, 132, 260, 455, color("#ffffff", 0.1), 2);
  text(p, "SIGNAL", 878, 164, 5, color("#ffffff"));
  [80, 122, 98, 170, 230].forEach((h, i) => {
    rect(p, 884 + i * 40, 520 - h, 24, h, color("#4aa08f"));
  });
  text(p, "SIEM + PDF", 878, 548, 3, color("#d9a441"));
  return p;
}

function aaaitservice() {
  const p = image("#f6f1e6");
  grid(p, color("#18201c", 0.04));
  windowFrame(p, 46, 46, 1108, 583, "AAAITSERVICE ADMIN CRM");
  const stats = [
    ["CLIENTS", "42"],
    ["SESSIONS", "18"],
    ["REVENUE", "$2.7K"],
    ["UPCOMING", "9"],
  ];
  stats.forEach(([label, value], i) => {
    const x = 84 + (i % 2) * 235;
    const y = 132 + Math.floor(i / 2) * 150;
    rect(p, x, y, 210, 124, color("#ffffff"));
    stroke(p, x, y, 210, 124, color("#dfe5de"), 2);
    text(p, label, x + 20, y + 22, 3, color("#58645d"));
    text(p, value, x + 20, y + 58, 6, color("#143c35"));
  });
  rect(p, 556, 132, 554, 455, color("#ffffff"));
  stroke(p, 556, 132, 554, 455, color("#dfe5de"), 2);
  text(p, "UPCOMING BOOKINGS", 586, 168, 5, color("#143c35"));
  ["MARIA R. / CLAUDE", "JAMES T. / AI SAFETY", "LINDA A. / TRAVEL", "ROBERT M. / EMAIL"].forEach((row, i) => {
    const y = 226 + i * 72;
    rect(p, 586, y, 470, 52, color("#fbfaf5"));
    stroke(p, 586, y, 470, 52, color("#dfe5de"), 1);
    text(p, row, 606, y + 18, 3, color("#18201c"));
    pill(p, 928, y + 9, 104, i === 1 ? "REQUEST" : "CONFIRM", "#e9f1eb", "#143c35");
  });
  pill(p, 84, 462, 310, "PDF CHEAT SHEETS", "#d9a441", "#18201c");
  return p;
}

function moms() {
  const p = image("#f6f8fa");
  grid(p, color("#18201c", 0.035));
  windowFrame(p, 46, 46, 1108, 583, "MOMS CLOTHING BIZ ARCHITECTURE");
  text(p, "FULL STACK E-COMMERCE FLOW", 96, 136, 6, color("#315d8a"));
  const boxes = [
    ["REACT", "TYPE SCRIPT UI", 96, 220, "#315d8a"],
    ["FASTAPI", "PYTHON REST", 366, 220, "#1e5b4f"],
    ["SQLITE", "EXPLICIT SQL", 636, 220, "#735b1d"],
    ["CHECKOUT", "TX ORDERS", 366, 420, "#b75a42"],
    ["FASHN API", "AI MODEL SHOTS", 636, 420, "#315d8a"],
    ["CI DOCKER", "TESTS + BUILDS", 906, 320, "#143c35"],
  ];
  for (const [title, subtitle, x, y, bg] of boxes) {
    rect(p, x, y, 210, 112, color(bg, 0.92));
    text(p, title, x + 22, y + 24, 4, color("#ffffff"));
    text(p, subtitle, x + 22, y + 72, 2, color("#ffffff", 0.82));
  }
  line(p, 306, 276, 366, 276, color("#18201c", 0.32), 8);
  line(p, 576, 276, 636, 276, color("#18201c", 0.32), 8);
  line(p, 471, 332, 471, 420, color("#18201c", 0.32), 8);
  line(p, 741, 332, 741, 420, color("#18201c", 0.32), 8);
  line(p, 846, 476, 906, 376, color("#18201c", 0.32), 8);
  pill(p, 96, 550, 360, "ARCHITECTURE VISUAL", "#edf2f8", "#315d8a");
  return p;
}

function trading() {
  const p = image("#18201c");
  grid(p, color("#ffffff", 0.04));
  windowFrame(p, 46, 46, 1108, 583, "CRUDE OIL STRATEGY ARCHITECTURE", "#202d28");
  text(p, "TRADING ENGINE MODULES", 96, 136, 6, color("#ffffff"));
  const boxes = [
    ["YAHOO", "PRICE FEED", 96, 238, "#315d8a"],
    ["STRATEGY", "MA CROSSOVER", 326, 238, "#1e5b4f"],
    ["RISK", "5+ CONTROLS", 556, 238, "#735b1d"],
    ["BROKER", "SAFE ADAPTER", 786, 238, "#b75a42"],
    ["LOGS", "JSON TRADES", 326, 444, "#315d8a"],
    ["DASHBOARD", "LIVE PNL", 556, 444, "#1e5b4f"],
  ];
  for (const [title, subtitle, x, y, bg] of boxes) {
    rect(p, x, y, 190, 104, color(bg, 0.88));
    text(p, title, x + 18, y + 22, 4, color("#ffffff"));
    text(p, subtitle, x + 18, y + 68, 2, color("#ffffff", 0.82));
  }
  line(p, 286, 290, 326, 290, color("#d9a441", 0.88), 8);
  line(p, 516, 290, 556, 290, color("#d9a441", 0.88), 8);
  line(p, 746, 290, 786, 290, color("#d9a441", 0.88), 8);
  line(p, 421, 342, 421, 444, color("#d9a441", 0.88), 8);
  line(p, 651, 342, 651, 444, color("#d9a441", 0.88), 8);
  pill(p, 96, 550, 360, "ARCHITECTURE VISUAL", "#d9a441", "#18201c");
  return p;
}

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data = Buffer.alloc(0)) {
  const name = Buffer.from(type);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  name.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return out;
}

function png(pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y += 1) {
    raw[y * (W * 4 + 1)] = 0;
    pixels.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND"),
  ]);
}

const renders = {
  "hero-lab.png": hero,
  "oakvault-preview.png": oakvault,
  "aaaitservice-preview.png": aaaitservice,
  "moms-preview.png": moms,
  "trading-preview.png": trading,
};

await fs.mkdir(OUT, { recursive: true });
for (const [name, render] of Object.entries(renders)) {
  await fs.writeFile(new URL(name, OUT), png(render()));
}
