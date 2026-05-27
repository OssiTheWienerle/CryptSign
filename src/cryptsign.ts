/**
 * CryptSign Core Steganography Engine (100% Client-Side & Offline)
 * 
 * Implements:
 * 1. Scaling to exactly 1920x1080 pixels
 * 2. Static map of exactly 10,340 coordinates (with first 10 hardcoded)
 * 3. Character limit verification (3,877 characters), emoji validation
 * 4. Embedding text into LSB bits of RGB channels with zero-padding
 * 5. Extraction of text with zero-byte hard stop check
 */

// FIRST 10 HARDCODED COORDINATES AS SPECIFIED BY DESIGN
const FIRST_10_COORDINATES = [
  { x: 12, y: 4 },
  { x: 173, y: 512 },
  { x: 450, y: 820 },
  { x: 921, y: 110 },
  { x: 1340, y: 950 },
  { x: 1512, y: 400 },
  { x: 789, y: 723 },
  { x: 112, y: 999 },
  { x: 1801, y: 35 },
  { x: 620, y: 642 }
];

/**
 * Generiert die feste, universelle Koordinaten-Liste (UNIVERSAL_PIXEL_MAP) mit exakt 10.340 Paaren.
 * Der Generator ist 100% deterministisch (über einen festen Seed), so dass die Koordinaten sich
 * niemals ändern und auf Sender- und Empfängerseite absolut statisch sind.
 */
export function getUniversalPixelMap(): { x: number; y: number }[] {
  const map: { x: number; y: number }[] = [...FIRST_10_COORDINATES];
  const seen = new Set<string>();

  for (const coord of map) {
    seen.add(`${coord.x},${coord.y}`);
  }

  // ==========================================
  // HIER SIND DIE RESTLICHEN 10.330 PAARE PLATZIERT:
  // Für absolute Integrität und geringen Code-Overhead generieren wir die verbleibenden
  // 10.330 Koordinaten über einen absolut deterministischen LCG-Algorithmus mit festem Seed.
  // Das stellt sicher, dass die Liste statisch, eindeutig und zwischen Aufrufen identisch ist.
  // ==========================================
  let seed = 19201080; // Fester Seed für deterministische Generierung
  const nextRandom = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  while (map.length < 10340) {
    const x = Math.floor(nextRandom() * 1920);
    const y = Math.floor(nextRandom() * 1080);
    const key = `${x},${y}`;

    if (!seen.has(key)) {
      seen.add(key);
      map.push({ x, y });
    }
  }

  return map;
}

/**
 * checks if text contains emojis
 */
export function containsEmoji(text: string): boolean {
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
  return emojiRegex.test(text);
}

/**
 * Validiert die Eingabe und gibt eine Fehlermeldung zurück, wenn ungültig.
 * Sonst null.
 */
export function validateMessage(text: string): string | null {
  if (text.length > 3877) {
    return "FEHLER: TEXT ZU LANG";
  }
  if (containsEmoji(text)) {
    return "FEHLER: EMOJIS SIND VERBOTEN";
  }
  return null;
}

/**
 * Draw template 1: Amazon Rainforest River
 */
export function drawRainforestTemplate(ctx: CanvasRenderingContext2D) {
  // Deep lush green base
  const forestGrad = ctx.createLinearGradient(0, 0, 1920, 1080);
  forestGrad.addColorStop(0, "#064e3b"); // Emerald 900
  forestGrad.addColorStop(0.5, "#022c22"); // Emerald 950
  forestGrad.addColorStop(1, "#14532d"); // Green 900
  ctx.fillStyle = forestGrad;
  ctx.fillRect(0, 0, 1920, 1080);

  // Organic jungle foliage / textures
  ctx.fillStyle = "rgba(4, 120, 87, 0.15)";
  for (let i = 0; i < 50; i++) {
    ctx.beginPath();
    ctx.arc(
      (i * 137.5) % 1920,
      (i * 350.3) % 1080,
      120 + (i % 5) * 40,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Winding river
  ctx.beginPath();
  ctx.moveTo(0, 200);
  ctx.bezierCurveTo(400, 100, 800, 1000, 1200, 800);
  ctx.bezierCurveTo(1400, 700, 1700, 300, 1920, 400);
  ctx.lineWidth = 120;
  
  const riverGrad = ctx.createLinearGradient(0, 0, 1920, 1080);
  riverGrad.addColorStop(0, "#0284c7"); // Sky 600
  riverGrad.addColorStop(0.5, "#0369a1"); // Sky 700
  riverGrad.addColorStop(1, "#075985"); // Sky 800
  ctx.strokeStyle = riverGrad;
  ctx.lineCap = "round";
  ctx.stroke();

  // Highlight along the river
  ctx.beginPath();
  ctx.moveTo(0, 200);
  ctx.bezierCurveTo(400, 100, 800, 1000, 1200, 800);
  ctx.bezierCurveTo(1400, 700, 1700, 300, 1920, 400);
  ctx.lineWidth = 20;
  ctx.strokeStyle = "rgba(14, 165, 233, 0.4)";
  ctx.stroke();

  // Dynamic light filters
  const lightGrad = ctx.createRadialGradient(960, 540, 100, 960, 540, 1200);
  lightGrad.addColorStop(0, "rgba(252, 211, 77, 0.1)"); // Warm sunlight
  lightGrad.addColorStop(1, "rgba(0, 0, 0, 0.4)");
  ctx.fillStyle = lightGrad;
  ctx.fillRect(0, 0, 1920, 1080);
}

/**
 * Draw template 2: Albertina Museum (Vienna)
 */
export function drawAlbertinaTemplate(ctx: CanvasRenderingContext2D) {
  // Brilliant azure blue sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 1080);
  skyGrad.addColorStop(0, "#0284c7");
  skyGrad.addColorStop(0.4, "#38bdf8");
  skyGrad.addColorStop(1, "#bae6fd");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 1920, 1080);

  // Classical plaster facade rendering (right side)
  ctx.fillStyle = "#fafaf9"; // Stone white
  ctx.beginPath();
  ctx.moveTo(900, 1080);
  ctx.lineTo(1920, 1080);
  ctx.lineTo(1920, 0);
  ctx.lineTo(1200, 0);
  ctx.closePath();
  ctx.fill();

  // Columns & architectural shadows
  ctx.fillStyle = "#e7e5e4"; // Shadow stone
  ctx.fillRect(1250, 0, 80, 1080);
  ctx.fillRect(1450, 0, 80, 1080);
  ctx.fillRect(1650, 0, 80, 1080);
  ctx.fillRect(1850, 0, 80, 1080);

  // Golden architectural trim / Albertina lettering panel (left side)
  const museumGrey = ctx.createLinearGradient(0, 1080, 800, 0);
  museumGrey.addColorStop(0, "#3f3f46"); // Modern structure base
  museumGrey.addColorStop(1, "#71717a");
  ctx.fillStyle = museumGrey;
  ctx.beginPath();
  ctx.moveTo(0, 1080);
  ctx.lineTo(950, 1080);
  ctx.lineTo(800, 300);
  ctx.lineTo(0, 100);
  ctx.closePath();
  ctx.fill();

  // Golden lettering panel highlight
  ctx.strokeStyle = "#d97706"; // Amber 600
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(50, 950);
  ctx.lineTo(800, 950);
  ctx.stroke();

  // Draw some mock pillars/windows to give architectural scale
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(1350, 200, 60, 300);
  ctx.fillRect(1550, 200, 60, 300);
  ctx.fillRect(1750, 200, 60, 300);

  // Glass museum wing overhang
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.beginPath();
  ctx.moveTo(0, 300);
  ctx.lineTo(900, 450);
  ctx.lineTo(800, 100);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw template 3: Paris Night
 */
export function drawParisTemplate(ctx: CanvasRenderingContext2D) {
  // Deep indigo night
  const nightGrad = ctx.createLinearGradient(0, 0, 1920, 1080);
  nightGrad.addColorStop(0, "#09090b");
  nightGrad.addColorStop(0.5, "#0b0f19");
  nightGrad.addColorStop(1, "#181825");
  ctx.fillStyle = nightGrad;
  ctx.fillRect(0, 0, 1920, 1080);

  // Stellar constellation / particles
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  for (let i = 0; i < 150; i++) {
    const x = (i * 283.7) % 1920;
    const y = (i * 471.1) % 1080;
    const r = (i % 3) === 0 ? 1.5 : 0.8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eiffel Tower silhouette & warm golden searchlight
  const towerX = 960;
  const towerY = 1080;

  // Searchlight beam
  const lightBeam = ctx.createRadialGradient(towerX, 300, 10, towerX - 300, 0, 800);
  lightBeam.addColorStop(0, "rgba(253, 224, 71, 0.6)");
  lightBeam.addColorStop(1, "rgba(253, 224, 71, 0)");
  ctx.fillStyle = lightBeam;
  ctx.beginPath();
  ctx.moveTo(towerX, 300);
  ctx.lineTo(towerX - 600, 0);
  ctx.lineTo(towerX - 400, 0);
  ctx.lineTo(towerX, 300);
  ctx.closePath();
  ctx.fill();

  // Eiffel Tower lines
  ctx.strokeStyle = "#b45309"; // Warm bronze
  ctx.lineWidth = 4;
  
  // Base pillars
  ctx.beginPath();
  ctx.moveTo(towerX - 120, towerY);
  ctx.quadraticCurveTo(towerX - 80, towerY - 200, towerX - 60, towerY - 400);
  ctx.moveTo(towerX + 120, towerY);
  ctx.quadraticCurveTo(towerX + 80, towerY - 200, towerX + 60, towerY - 400);
  
  // Center trunk
  ctx.lineTo(towerX + 20, towerY - 750);
  ctx.lineTo(towerX - 20, towerY - 750);
  ctx.closePath();
  ctx.stroke();

  // Platforms
  ctx.fillStyle = "#fbbf24"; // Bright amber highlights
  ctx.fillRect(towerX - 100, towerY - 150, 200, 10);
  ctx.fillRect(towerX - 70, towerY - 400, 140, 10);
  ctx.fillRect(towerX - 40, towerY - 750, 80, 12);

  // Spire beacon
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(towerX, towerY - 760, 8, 0, Math.PI * 2);
  ctx.fill();

  // City landscape silhouette at bottom
  ctx.fillStyle = "#0c0a09"; // Stone 950
  ctx.fillRect(0, 1020, 1920, 60);
  for (let i = 0; i < 40; i++) {
    const w = 40 + (i % 3) * 30;
    const h = 50 + (i % 4) * 40;
    ctx.fillRect(i * 50, 1080 - h, w, h);
  }
}

/**
 * Wandelt einen Text in ein Array von 31.020 Bits um.
 * Wenn der Text kürzer als der Maximalwert ist, werden alle restlichen
 * Bits auf 0 gesetzt (Maskierungs-Bits / Null-Auffüllung).
 */
export function textToBits(text: string): number[] {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  
  const bits: number[] = [];
  
  // Byte-Array zu Binär-Array konvertieren (MSB bis LSB)
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    for (let bitIdx = 7; bitIdx >= 0; bitIdx--) {
      bits.push((b >> bitIdx) & 1);
    }
  }

  // Wir füllen den Rest des 31.020-Bit-Arrays stur mit Nullen auf
  // (10.340 Pixel * 3 RGB-Kanäle = 31.020 Bits)
  const totalRequiredBits = 10340 * 3;
  while (bits.length < totalRequiredBits) {
    bits.push(0);
  }

  return bits;
}

/**
 * Einbettungs-Funktion (Sender):
 * Erhält ein Quell-Bild (HTMLImageElement oder Canvas/ImageData), skaliert es auf 1920x1080,
 * validiert den Text, bettet ihn in die LSBs der RGB-Kanäle entlang der Map ein,
 * und liefert ein Daten-URL-PNG zurück.
 */
export function embedTextInImage(
  sourceImage: HTMLImageElement | HTMLCanvasElement,
  text: string
): { success: boolean; dataUrl?: string; error?: string } {
  // 1. Validierung
  const validationError = validateMessage(text);
  if (validationError) {
    return { success: false, error: validationError };
  }

  // 2. Offscreen Canvas erstellen und das Bild auf exakt 1920x1080 skalieren
  const canvas = document.createElement("canvas");
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { success: false, error: "Canvas 2D-Kontext konnte nicht erstellt werden." };
  }

  // Draw & scale to exact size
  ctx.drawImage(sourceImage, 0, 0, 1920, 1080);

  // 3. Pixel-Daten abrufen
  const imgData = ctx.getImageData(0, 0, 1920, 1080);
  const data = imgData.data;

  // 4. Text in Bits wandeln
  const bits = textToBits(text);

  // 5. Pixel-LSBs überschreiben
  const coordMap = getUniversalPixelMap();
  for (let i = 0; i < coordMap.length; i++) {
    const coord = coordMap[i];
    const pxIdx = (coord.y * 1920 + coord.x) * 4;

    // R-Kanal überschreiben
    data[pxIdx] = (data[pxIdx] & ~1) | bits[i * 3];
    // G-Kanal überschreiben
    data[pxIdx + 1] = (data[pxIdx + 1] & ~1) | bits[i * 3 + 1];
    // B-Kanal überschreiben
    data[pxIdx + 2] = (data[pxIdx + 2] & ~1) | bits[i * 3 + 2];
  }

  // 6. Zurück ins Canvas schreiben
  ctx.putImageData(imgData, 0, 0);

  // 7. Verlustfreies PNG exportieren
  const dataUrl = canvas.toDataURL("image/png");
  return { success: true, dataUrl };
}

/**
 * Auslese-Funktion (Empfänger):
 * Liest die LSB-Bits entlang der 10.340 Pixel der Map aus, baut sie zu 8-Bit-Blöcken zusammen,
 * und bricht sofort beim ersten Null-Byte (00000000) ab.
 */
export function extractTextFromImage(
  sourceImage: HTMLImageElement | HTMLCanvasElement
): { success: boolean; result?: string; error?: string } {
  // Offscreen Canvas erstellen und das Bild auf 1920x1080 bringen
  const canvas = document.createElement("canvas");
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { success: false, error: "Canvas konnte nicht erstellt werden." };
  }

  ctx.drawImage(sourceImage, 0, 0, 1920, 1080);
  const imgData = ctx.getImageData(0, 0, 1920, 1080);
  const data = imgData.data;

  // 1. Alle LSB-Bits auslesen
  const coordMap = getUniversalPixelMap();
  const bits: number[] = [];
  for (let i = 0; i < coordMap.length; i++) {
    const coord = coordMap[i];
    const pxIdx = (coord.y * 1920 + coord.x) * 4;

    bits.push(data[pxIdx] & 1);
    bits.push(data[pxIdx + 1] & 1);
    bits.push(data[pxIdx + 2] & 1);
  }

  // 2. Zu 8-Bit Blöcken zusammenfügen mit Null-Stopp check
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    if (i + 8 > bits.length) break;

    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bits[i + b];
    }

    // HARTER STOPP-SIGNAL-CHECK: Sobald ein vollständiger 8-Bit-Block nur aus Nullen (00000000) besteht, stop!
    if (byteVal === 0) {
      break;
    }

    bytes.push(byteVal);
  }

  // 3. Bytes als UTF-8 String dekodieren
  try {
    const decoder = new TextDecoder();
    const result = decoder.decode(new Uint8Array(bytes));
    return { success: true, result };
  } catch (err: any) {
    return { success: false, error: "Fehler beim Dekodieren: " + err.message };
  }
}
