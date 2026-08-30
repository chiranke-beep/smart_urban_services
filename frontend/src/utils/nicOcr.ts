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

import { getApiBaseUrl } from "@/services/api";

/** Downscale large phone camera photos (12-48MP) to ~1200px before uploading.
 * Cuts network payload from 15MB down to ~80KB so uploads take ~0.5s even on 3G/weak mobile. */
function downscaleImageForOcr(imageSrc: string, maxDim = 1200): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(imageSrc);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxDim && height <= maxDim) {
        return resolve(imageSrc);
      }
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(imageSrc);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}

/** Call the backend OCR endpoint — runs Tesseract on EC2, fast on any device. */
async function scanNicServerSide(imageSrc: string): Promise<NicScanResult | null> {
  try {
    const apiBase = getApiBaseUrl(); // dynamically resolves to http://<ec2-ip>:5000/api
    const url = `${apiBase.replace(/\/+$/, "")}/ocr/nic`;

    // Downscale first so even a 15MB mobile camera photo transfers in ~0.5s
    const optimizedImage = await downscaleImageForOcr(imageSrc, 1200);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10s strict timeout

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: optimizedImage }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) return null;
    const json = await resp.json();
    if (json?.nicNumber) {
      return { nicNumber: json.nicNumber, rawText: json.rawText || "", confidence: json.confidence || 0 };
    }
    return null;
  } catch (err: any) {
    console.warn("[NIC OCR Server] Network fallback:", err?.message || err);
    return null;
  }
}

export async function scanNicFromImage(imageSource: string | File): Promise<NicScanResult> {
  try {
    // Convert source to data URL first (needed for both paths)
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

    // ── Step 1: Try server-side OCR (fast: 1-3s on EC2, works on any device) ──
    const serverResult = await scanNicServerSide(imageSrc);
    if (serverResult?.nicNumber) return serverResult;

    // ── Step 2: Browser fallback (fast single pass, 6s max timeout, never hangs) ──
    try {
      const Tesseract = await import("tesseract.js");

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.crossOrigin = "anonymous";
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = imageSrc;
      });

      const dataUrl = buildCanvasDataUrl(img, 0, "raw");
      const result = await recogniseWithTimeout(Tesseract, dataUrl, 6_000);
      if (result) {
        const found = extractNicFromText(result.text, result.confidence);
        if (found) return found;
      }
    } catch {
      // ignore browser OCR failures
    }

    return { nicNumber: null, rawText: "", confidence: 0 };
  } catch (err: any) {
    console.warn("[NIC OCR Scanner Notice]:", err.message);
    return { nicNumber: null, rawText: "", confidence: 0 };
  }
}
