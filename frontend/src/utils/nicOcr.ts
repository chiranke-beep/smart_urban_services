/**
 * Real AI OCR Sri Lankan NIC Scanner (Tesseract.js)
 * Optimised: tries 270° first (standard phone capture), max 3 attempts total.
 * Hard 20 s timeout per attempt to prevent infinite loading.
 */

export interface NicScanResult {
  nicNumber: string | null;
  rawText: string;
  confidence: number;
}

/**
 * Preprocesses a canvas image with Grayscale and Contrast Enhancement
 * to isolate black text from the colored security patterned background.
 */
function preprocessCanvasForOcr(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mode: "sharp_thin" | "contrast" | "raw"
) {
  if (mode === "raw") return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const d = imgData.data;

  const contrast = 75;
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];

    if (mode === "sharp_thin") {
      const val = gray < 115 ? 0 : 255;
      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = val;
    } else if (mode === "contrast") {
      const adjusted = factor * (gray - 128) + 128;
      const clamped = Math.max(0, Math.min(255, adjusted));
      d[i] = clamped;
      d[i + 1] = clamped;
      d[i + 2] = clamped;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Validates whether a candidate string is a plausible Sri Lankan NIC number.
 */
function isValidSriLankanNic(nic: string): boolean {
  if (!nic) return false;
  const clean = nic.trim().toUpperCase();

  // 10-digit Old Format: 9 digits + V/X
  if (/^\d{9}[VX]$/.test(clean)) {
    const day = parseInt(clean.slice(2, 5), 10);
    const dayVal = day > 500 ? day - 500 : day;
    return dayVal >= 1 && dayVal <= 366;
  }

  // 12-digit New Format
  if (/^\d{12}$/.test(clean)) {
    const year = parseInt(clean.slice(0, 4), 10);
    const day = parseInt(clean.slice(4, 7), 10);
    const dayVal = day > 500 ? day - 500 : day;
    const currentYear = new Date().getFullYear();
    return year >= 1930 && year <= currentYear - 14 && dayVal >= 1 && dayVal <= 366;
  }

  return false;
}

/** Extract a NIC number from raw OCR text. Returns null if none found. */
function extractNicFromText(text: string, confidence: number): NicScanResult | null {
  // 1. 12-digit sequence starting with 19xx or 20xx
  const matches12 = text.match(/\b(19\d{10}|20\d{10})\b/g);
  if (matches12) {
    for (const m of matches12) {
      if (isValidSriLankanNic(m)) {
        return { nicNumber: m, rawText: text, confidence };
      }
    }
  }

  // 2. 9-digit + V/X
  const matches9 = text.match(/\b(\d{9}[vVxX])\b/g);
  if (matches9) {
    for (const m of matches9) {
      if (isValidSriLankanNic(m.toUpperCase())) {
        return { nicNumber: m.toUpperCase(), rawText: text, confidence };
      }
    }
  }

  // 3. Label-based match
  const labelMatch = text.match(/(?:No|NIC|Identity|Card|Number)[\s.:/]*([0-9]{9,12}[vVxX]?)/i);
  if (labelMatch) {
    const candidate = labelMatch[1].toUpperCase();
    if (isValidSriLankanNic(candidate)) {
      return { nicNumber: candidate, rawText: text, confidence };
    }
  }

  // 4. Any continuous sequence of correct length
  const digitSeqs = text
    .replace(/[^0-9vVxX]/g, " ")
    .split(/\s+/)
    .filter((s) => s.length === 12 || (s.length === 10 && /[vVxX]$/i.test(s)));

  for (const seq of digitSeqs) {
    if (isValidSriLankanNic(seq)) {
      return { nicNumber: seq.toUpperCase(), rawText: text, confidence };
    }
  }

  return null;
}

/** Run a single Tesseract pass with a hard timeout (ms). */
async function recogniseWithTimeout(
  Tesseract: any,
  dataUrl: string,
  timeoutMs: number
): Promise<{ text: string; confidence: number } | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    Tesseract.recognize(dataUrl, "eng", { logger: () => {} })
      .then((res: any) => {
        clearTimeout(timer);
        resolve({ text: res?.data?.text || "", confidence: res?.data?.confidence || 0 });
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(null);
      });
  });
}

/** Draw image onto canvas at given rotation, return data URL. */
function buildCanvasDataUrl(
  img: HTMLImageElement,
  deg: number,
  mode: "sharp_thin" | "contrast" | "raw"
): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const scale = 2.0;

  if (deg === 90 || deg === 270) {
    canvas.width = img.height * scale;
    canvas.height = img.width * scale;
  } else {
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
  }

  ctx.save();
  ctx.scale(scale, scale);
  if (deg === 90) {
    ctx.translate(img.height, 0);
    ctx.rotate((90 * Math.PI) / 180);
  } else if (deg === 180) {
    ctx.translate(img.width, img.height);
    ctx.rotate((180 * Math.PI) / 180);
  } else if (deg === 270) {
    ctx.translate(0, img.width);
    ctx.rotate((270 * Math.PI) / 180);
  }
  ctx.drawImage(img, 0, 0);
  ctx.restore();

  preprocessCanvasForOcr(ctx, canvas.width, canvas.height, mode);
  return canvas.toDataURL("image/jpeg", 0.92);
}

export async function scanNicFromImage(imageSource: string | File): Promise<NicScanResult> {
  try {
    const Tesseract = await import("tesseract.js");

    // Convert source to data URL
    let imageSrc = "";
    if (typeof imageSource === "string") {
      imageSrc = imageSource;
    } else {
      imageSrc = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(imageSource);
      });
    }

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = imageSrc;
    });

    /**
     * Attempt order — stops as soon as a valid NIC is found:
     *   Priority 1: raw (no pixel destruction) at all 4 orientations
     *   Priority 2: sharp_thin (binarise) at 270° & 0°
     *   Priority 3: contrast stretch at 270° & 0°
     * Each attempt has a 20 s hard timeout.
     */
    const attempts: Array<[number, "sharp_thin" | "contrast" | "raw"]> = [
      [0,   "raw"],        // already correctly oriented — try raw first
      [270, "raw"],        // phone portrait of landscape card — raw
      [90,  "raw"],        // rotated the other way — raw
      [180, "raw"],        // upside down — raw
      [0,   "sharp_thin"], // binarise fallbacks
      [270, "sharp_thin"],
      [0,   "contrast"],
      [270, "contrast"],
    ];

    for (const [deg, mode] of attempts) {
      const dataUrl = buildCanvasDataUrl(img, deg, mode);
      const result = await recogniseWithTimeout(Tesseract, dataUrl, 20_000);
      if (!result) continue; // timed out or errored

      const found = extractNicFromText(result.text, result.confidence);
      if (found) return found;
    }

    return { nicNumber: null, rawText: "", confidence: 0 };
  } catch (err: any) {
    console.warn("[NIC OCR Scanner Notice]:", err.message);
    return { nicNumber: null, rawText: "", confidence: 0 };
  }
}
