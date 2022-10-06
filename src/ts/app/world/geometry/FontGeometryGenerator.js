const createIndices = require('quad-indices');

export function getIndices() {
  return createIndices(...arguments);
}

export function getPages(glyphs) {
  const pages = new Float32Array(glyphs.length * 4 * 1);
  let i = 0;
  glyphs.forEach(function(glyph) {
    const id = glyph.data.page || 0;
    pages[i++] = id;
    pages[i++] = id;
    pages[i++] = id;
    pages[i++] = id;
  });
  return pages;
}

export function getUvs (glyphs, texWidth, texHeight, flipY) {
  const uvs = new Float32Array(glyphs.length * 4 * 2);
  let i = 0;
  glyphs.forEach(function(glyph) {
    const bitmap = glyph.data;
    const bw = (bitmap.x + bitmap.width);
    const bh = (bitmap.y + bitmap.height);

    // top left position
    const u0 = bitmap.x / texWidth;
    let v1 = bitmap.y / texHeight;
    const u1 = bw / texWidth;
    let v0 = bh / texHeight;

    if (flipY) {
      v1 = (texHeight - bitmap.y) / texHeight;
      v0 = (texHeight - bh) / texHeight;
    }

    // BL
    uvs[i++] = u0;
    uvs[i++] = v1;
    // TL
    uvs[i++] = u0;
    uvs[i++] = v0;
    // TR
    uvs[i++] = u1;
    uvs[i++] = v0;
    // BR
    uvs[i++] = u1;
    uvs[i++] = v1;
  });
  return uvs;
}

export function getPositions(glyphs) {
  const positions = new Float32Array(glyphs.length * 4 * 2);
  let i = 0;
  glyphs.forEach(function(glyph) {
    const bitmap = glyph.data;

    // bottom left position
    const x = glyph.position[0] + bitmap.xoffset;
    const y = glyph.position[1] + bitmap.yoffset;

    // quad size
    const w = bitmap.width;
    const h = bitmap.height;

    // BL
    positions[i++] = x;
    positions[i++] = y;
    // TL
    positions[i++] = x;
    positions[i++] = y + h;
    // TR
    positions[i++] = x + w;
    positions[i++] = y + h;
    // BR
    positions[i++] = x + w;
    positions[i++] = y;
  });
  return positions;
}
