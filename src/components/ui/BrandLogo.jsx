import { useState } from "react";

/**
 * BrandLogo — renders real SVG brand logos
 * Pattern: same as sun.store (height:30px, max-width:135px, object-fit:contain)
 */

const LOGO_MAP = {
  huawei: "huawei.svg",
  jinko: "jinko.svg",
  trina: "trina.svg",
  longi: "longi.svg",
  sma: "sma.svg",
  sungrow: "sungrow.svg",
  solaredge: "solaredge.svg",
  goodwe: "goodwe.svg",
  risen: "risen.svg",
  byd: "byd.svg",
  enphase: "enphase.svg",
  dualsun: "dualsun.svg",
  esdec: "esdec.svg",
  k2systems: "k2systems.svg",
};

export default function BrandLogo({ brand }) {
  const [err, setErr] = useState(false);
  const file = LOGO_MAP[brand.f];

  if (err || !file) {
    // Fallback: clean text, no image
    return null;
  }

  return (
    <img
      src={`/logos/${file}`}
      alt={brand.n}
      loading="lazy"
      style={{
        display: "flex",
        height: 30,
        maxWidth: 135,
        objectFit: "contain",
        width: "100%",
      }}
      onError={() => setErr(true)}
    />
  );
}
