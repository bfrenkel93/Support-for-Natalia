/**
 * Dependency-free JPEG metadata stripping.
 *
 * Removes EXIF (including GPS location), XMP, IPTC/Photoshop, and comment
 * segments from a JPEG buffer while preserving the image data and the basic
 * JFIF header. This covers the most privacy-sensitive case — phone photos that
 * embed GPS coordinates. Non-JPEG buffers are returned unchanged (we strip
 * "where feasible" without pulling in heavy native image libraries).
 */
export function stripJpegMetadata(input: Buffer): Buffer {
  // JPEG must start with SOI marker FF D8.
  if (input.length < 4 || input[0] !== 0xff || input[1] !== 0xd8) {
    return input;
  }

  const out: Buffer[] = [Buffer.from([0xff, 0xd8])];
  let i = 2;

  while (i < input.length) {
    // Every marker starts with 0xFF. If we lose alignment, keep the rest as-is.
    if (input[i] !== 0xff) {
      out.push(input.subarray(i));
      break;
    }

    const marker = input[i + 1];

    // Start of Scan or End of Image: the remainder is entropy-coded data.
    if (marker === 0xda || marker === 0xd9) {
      out.push(input.subarray(i));
      break;
    }

    // Standalone markers (RSTn, TEM) have no length payload.
    if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      out.push(input.subarray(i, i + 2));
      i += 2;
      continue;
    }

    if (i + 4 > input.length) {
      out.push(input.subarray(i));
      break;
    }

    const len = input.readUInt16BE(i + 2);
    const segEnd = i + 2 + len;
    if (len < 2 || segEnd > input.length) {
      // Malformed length — stop stripping and keep the rest verbatim.
      out.push(input.subarray(i));
      break;
    }

    const isExifOrXmp = marker === 0xe1; // APP1
    const isOtherAppN = marker >= 0xe2 && marker <= 0xef; // APP2..APP15
    const isComment = marker === 0xfe; // COM

    if (!(isExifOrXmp || isOtherAppN || isComment)) {
      out.push(input.subarray(i, segEnd));
    }
    // else: drop this metadata segment

    i = segEnd;
  }

  return Buffer.concat(out);
}
