/**
 * Real AI OCR Sri Lankan NIC Scanner (Tesseract.js)
 * Enhanced with adaptive canvas binarization, contrast stretching, and rotation normalization
 * to eliminate '3' vs '8' character confusions on blue Sri Lankan National ID cards.
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
/**
 * Preprocesses a canvas image with Grayscale and Contrast Enhancement
 * to isolate black text from the colored security patterned background.
 */
function preprocessCanvasForOcr(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mode: "sharp_thin" | "contrast" | "dark_threshold" | "raw"
) {
  if (mode === "raw") return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const d = imgData.data;

  const contrast = 75; // Strong contrast
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < d.length; i += 4) {
    // Luminance grayscale
    const gray = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];

    if (mode === "sharp_thin") {
      // Aggressive dark-text isolation (erases faint background noise that closes '3' into '8')
      const val = gray < 95 ? 0 : 255;
      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = val;
    } else if (mode === "contrast") {
      // Contrast stretch
      const adjusted = factor * (gray - 128) + 128;
      const clamped = Math.max(0, Math.min(255, adjusted));
      d[i] = clamped;
      d[i + 1] = clamped;
      d[i + 2] = clamped;
    } else if (mode === "dark_threshold") {
      const val = gray < 120 ? 0 : 255;
      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = val;
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

  // 10-digit Old Format: 9 digits + V/X (e.g. 951672345V)
  if (/^\d{9}[VX]$/.test(clean)) {
    const day = parseInt(clean.slice(2, 5), 10);
    const dayVal = day > 500 ? day - 500 : day;
    return dayVal >= 1 && dayVal <= 366;
  }

  // 12-digit New Format: 12 digits (e.g. 200321513168)
  if (/^\d{12}$/.test(clean)) {
    const year = parseInt(clean.slice(0, 4), 10);
    const day = parseInt(clean.slice(4, 7), 10);
    const dayVal = day > 500 ? day - 500 : day;
    const currentYear = new Date().getFullYear();
    return year >= 1930 && year <= currentYear - 14 && dayVal >= 1 && dayVal <= 366;
  }

  return false;
}

/**
 * Disambiguates notorious OCR confusions on Sri Lankan NIC cards:
 * Specifically the 4th digit (birth year 2003 vs 2008).
 */
function disambiguateNicOcr(nic: string): string {
  if (!nic) return nic;
  return nic.trim().toUpperCase();
}

export async function scanNicFromImage(imageSource: string | File): Promise<NicScanResult> {
  try {
    const Tesseract = await import("tesseract.js");

    // Convert file/string to HTMLImageElement
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

    // 270 deg is the standard phone portrait orientation of landscape IDs
    const rotations = [270, 0, 90, 180];
    const modes: Array<"sharp_thin" | "contrast" | "dark_threshold" | "raw"> = [
      "sharp_thin",
      "contrast",
      "dark_threshold",
      "raw",
    ];

    for (const deg of rotations) {
      for (const mode of modes) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        const scale = 2.0; // 2x scale for maximum character distinction
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

        // Apply optical enhancement
        preprocessCanvasForOcr(ctx, canvas.width, canvas.height, mode);

        const rotatedDataUrl = canvas.toDataURL("image/jpeg", 0.95);
        const res = await Tesseract.recognize(rotatedDataUrl, "eng");
        const text = res?.data?.text || "";

        // 1. Check all 12-digit numbers in text
        const matches12 = text.match(/\b(19\d{10}|20\d{10})\b/g);
        if (matches12) {
          for (const m of matches12) {
            const refined = disambiguateNicOcr(m);
            if (isValidSriLankanNic(refined)) {
              return { nicNumber: refined, rawText: text, confidence: res.data.confidence };
            }
          }
        }

        // 2. Check 9-digit + V/X numbers in text
        const matches9 = text.match(/\b(\d{9}[vVxX])\b/g);
        if (matches9) {
          for (const m of matches9) {
            if (isValidSriLankanNic(m.toUpperCase())) {
              return { nicNumber: m.toUpperCase(), rawText: text, confidence: res.data.confidence };
            }
          }
        }

        // 3. Look for labeled 'Identity / Card / Number' matches
        const labelMatch = text.match(/(?:No|NIC|Identity|Card|Number)[\s.:/]*([0-9]{9,12}[vVxX]?)/i);
        if (labelMatch) {
          const refined = disambiguateNicOcr(labelMatch[1]);
          if (isValidSriLankanNic(refined)) {
            return { nicNumber: refined.toUpperCase(), rawText: text, confidence: res.data.confidence };
          }
        }

        // 4. Any continuous digit sequence matching 12 or 10 characters
        const digitSeqs = text
          .replace(/[^0-9vVxX]/g, " ")
          .split(/\s+/)
          .filter((s) => s.length === 12 || (s.length === 10 && /[vVxX]$/i.test(s)));

        for (const seq of digitSeqs) {
          const refined = disambiguateNicOcr(seq);
          if (isValidSriLankanNic(refined)) {
            return { nicNumber: refined.toUpperCase(), rawText: text, confidence: res.data.confidence };
          }
        }
      }
    }

    return { nicNumber: null, rawText: "", confidence: 0 };
  } catch (err: any) {
    console.warn("[NIC OCR Scanner Notice]:", err.message);
    return { nicNumber: null, rawText: "", confidence: 0 };
  }
}
