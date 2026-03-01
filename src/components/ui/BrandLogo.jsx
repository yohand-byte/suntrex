import { useState } from "react";

// Map brand slug → logo file (prefer SVG, fallback to PNG)
const LOGO_FILES = {
  huawei: "huawei.svg",
  jinko: "jinko.svg",
  trina: "trina.svg",
  longi: "longi.svg",
  "ja-solar": "ja-solar.svg",
  "canadian-solar": "canadian-solar.svg",
  sma: "sma.svg",
  sungrow: "sungrow.svg",
  solaredge: "solaredge.svg",
  goodwe: "goodwe.svg",
  growatt: "growatt.svg",
  risen: "risen.svg",
  byd: "byd.svg",
  deye: "deye.svg",
  enphase: "enphase.svg",
  hoymiles: "hoymiles.svg",
};

export default function BrandLogo({ brand }) {
  const [err, setErr] = useState(false);
  const file = LOGO_FILES[brand.f];

  if (err || !file) {
    return (
      <span style={{
        fontSize: brand.n.length > 12 ? 13 : 16,
        fontWeight: 700,
        color: brand.c,
        whiteSpace: "nowrap",
        minWidth: 80,
        textAlign: "center",
        fontFamily: "'DM Sans', 'Inter', sans-serif",
        letterSpacing: "0.5px",
      }}>
        {brand.n}
      </span>
    );
  }

  return (
    <img
      src={`/logos/${file}`}
      alt={brand.n}
      style={{
        height: 28,
        objectFit: "contain",
        maxWidth: 140,
        minWidth: 60,
      }}
      onError={() => setErr(true)}
    />
  );
}
