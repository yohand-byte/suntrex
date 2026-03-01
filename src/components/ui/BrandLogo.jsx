import { useState } from "react";

// Best available logo file for each brand slug
const LOGO_FILES = {
  huawei: "huawei.svg",
  jinko: "jinko.svg",
  trina: "trinasolar.png",
  longi: "longi.svg",
  "ja-solar": "ja-solar.svg",
  "canadian-solar": "canadian-solar.svg",
  sma: "sma.svg",
  sungrow: "sungrow.png",
  solaredge: "solaredge.svg",
  goodwe: "goodwe.svg",
  growatt: "growatt.png",
  risen: "risen.svg",
  byd: "byd.svg",
  deye: "deye.png",
  enphase: "enphase.svg",
};

export default function BrandLogo({ brand }) {
  const [err, setErr] = useState(false);
  const file = LOGO_FILES[brand.f];

  if (err || !file) {
    return (
      <span style={{
        fontSize: brand.n.length > 12 ? 14 : 18,
        fontWeight: 700,
        color: brand.c,
        whiteSpace: "nowrap",
        minWidth: 100,
        textAlign: "center",
        fontFamily: "'Inter', 'DM Sans', sans-serif",
      }}>
        {brand.n}
      </span>
    );
  }

  return (
    <img
      src={`/logos/${file}`}
      alt={brand.n}
      style={{ height: 24, objectFit: "contain", maxWidth: 120, minWidth: 60, opacity: 0.7, transition: "opacity 0.2s ease" }}
      onError={() => setErr(true)}
      onMouseEnter={e => e.currentTarget.style.opacity = "1"}
      onMouseLeave={e => e.currentTarget.style.opacity = "0.7"}
    />
  );
}
