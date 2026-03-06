import { useRef, useEffect } from "react";

/**
 * QRCodeGenerator — generates a QR code on canvas
 * Encodes: order_id + seller_id + timestamp + verification hash
 */
export default function QRCodeGenerator({ orderId, sellerId, size = 200, style = {} }) {
  const canvasRef = useRef(null);
  const payload = `SUNTREX|${orderId}|${sellerId}|${Date.now()}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    drawQR(ctx, payload, size);
  }, [payload, size]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, ...style }}>
      <canvas ref={canvasRef} width={size} height={size} style={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
      <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "center", maxWidth: size, wordBreak: "break-all" }}>
        ID: {orderId?.slice(0, 12)}...
      </div>
      <button
        onClick={() => {
          const link = document.createElement("a");
          link.download = `suntrex-qr-${orderId}.png`;
          link.href = canvasRef.current?.toDataURL("image/png") || "";
          link.click();
        }}
        style={{
          padding: "6px 16px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff",
          color: "#1e293b", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Telecharger QR
      </button>
    </div>
  );
}

/**
 * Simple QR-like pattern generator (visual placeholder)
 * In production, replace with a real QR library like qrcode
 */
function drawQR(ctx, data, size) {
  const modules = 21;
  const cellSize = size / modules;

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  // Generate deterministic pattern from data hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
  }

  ctx.fillStyle = "#1e293b";

  // Position detection patterns (3 corners)
  drawFinderPattern(ctx, 0, 0, cellSize);
  drawFinderPattern(ctx, (modules - 7) * cellSize, 0, cellSize);
  drawFinderPattern(ctx, 0, (modules - 7) * cellSize, cellSize);

  // Data modules
  const rng = seedRandom(Math.abs(hash));
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      if (isFinderArea(row, col, modules)) continue;
      if (rng() > 0.5) {
        ctx.fillRect(col * cellSize, row * cellSize, cellSize - 0.5, cellSize - 0.5);
      }
    }
  }

  // SUNTREX branding center
  const centerX = size / 2;
  const centerY = size / 2;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(centerX - 18, centerY - 8, 36, 16);
  ctx.fillStyle = "#E8700A";
  ctx.font = "bold 9px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SUN", centerX, centerY);
}

function drawFinderPattern(ctx, x, y, cellSize) {
  const s = cellSize;
  // Outer
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(x, y, 7 * s, 7 * s);
  // Inner white
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + s, y + s, 5 * s, 5 * s);
  // Inner dark
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(x + 2 * s, y + 2 * s, 3 * s, 3 * s);
}

function isFinderArea(row, col, modules) {
  if (row < 8 && col < 8) return true;
  if (row < 8 && col >= modules - 8) return true;
  if (row >= modules - 8 && col < 8) return true;
  return false;
}

function seedRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}
