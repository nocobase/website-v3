// Minimal PNG decode/encode (8-bit RGB/RGBA, non-interlaced) for the renderer's motion blur: several sub-frame
// screenshots are decoded, averaged and re-encoded as one frame. No dependencies beyond node:zlib.
import zlib from 'node:zlib';

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function decode(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('not a PNG');
  let off = 8, w = 0, h = 0, ct = 0, bd = 0, il = 0; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString('latin1', off + 4, off + 8), data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bd = data[8]; ct = data[9]; il = data[12]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (bd !== 8 || il !== 0 || (ct !== 2 && ct !== 6)) throw new Error(`unsupported PNG: depth ${bd}, colour type ${ct}, interlace ${il}`);
  const bpp = ct === 6 ? 4 : 3, stride = w * bpp, raw = zlib.inflateSync(Buffer.concat(idat));
  const out = Buffer.allocUnsafe(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride, prev = dst - stride;
    for (let x = 0; x < stride; x++) {
      const r = raw[src + x], a = x >= bpp ? out[dst + x - bpp] : 0, b = y ? out[prev + x] : 0, c = x >= bpp && y ? out[prev + x - bpp] : 0;
      let v;
      if (f === 0) v = r; else if (f === 1) v = r + a; else if (f === 2) v = r + b; else if (f === 3) v = r + ((a + b) >> 1);
      else { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = r + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      out[dst + x] = v & 255;
    }
  }
  return { w, h, bpp, data: out };
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32 ? zlib.crc32(td) >>> 0 : crc32(td));
  return Buffer.concat([len, td, crc]);
}
let TABLE = null;
function crc32(b) {
  if (!TABLE) { TABLE = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; TABLE[n] = c >>> 0; } }
  let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = TABLE[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0;
}

// fast encode: filter "sub" on every row, deflate level 1
export function encode({ w, h, bpp, data }) {
  const stride = w * bpp, raw = Buffer.allocUnsafe(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    const o = y * (stride + 1), s = y * stride; raw[o] = 1;
    for (let x = 0; x < stride; x++) raw[o + 1 + x] = (data[s + x] - (x >= bpp ? data[s + x - bpp] : 0)) & 255;
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = bpp === 4 ? 6 : 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 1 })), chunk('IEND', Buffer.alloc(0))]);
}

// average several decoded frames of the same size (a box shutter)
export function average(frames) {
  const n = frames.length, a = frames[0], out = Buffer.allocUnsafe(a.data.length), half = n >> 1;
  for (let i = 0; i < out.length; i++) { let s = half; for (let k = 0; k < n; k++) s += frames[k].data[i]; out[i] = (s / n) | 0; }
  return { w: a.w, h: a.h, bpp: a.bpp, data: out };
}
