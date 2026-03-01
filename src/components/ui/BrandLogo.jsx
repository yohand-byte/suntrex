import { useState } from "react";

/**
 * BrandLogo — renders brand logos with uniform spacing
 * Each logo sits in a fixed-width container for even marquee spacing
 * Fallback: SVG -> PNG -> hide
 */
const LOGO_MAP = {
  huawei: "huawei",
  jinko: "jinko",
  trina: "trina",
  longi: "longi",
  sma: "sma",
  sungrow: "sungrow",
  solaredge: "solaredge",
  goodwe: "goodwe",
  risen: "risen",
  byd: "byd",
  enphase: "enphase",
  dualsun: "dualsun",
  esdec: "esdec",
  k2systems: "k2systems",
};

export default function BrandLogo({ brand }) {
  const base = LOGO_MAP[brand?.f];
  const [ext, setExt] = useState("svg");
  const [hide, setHide] = useState(false);

  if (hide || !base) return null;

  return (
    <div
      style={{
        width: 110,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <img
        src={"/logos/" + base + "." + ext}
        alt={brand?.n || "Brand"}
        loading="lazy"
        style={{
          maxHeight: 28,
          maxWidth: 100,
          width: "auto",
          height: "auto",
          objectFit: "contain",
          display: "block",
        }}
        onError={() => {
          if (ext === "svg") setExt("png");
          else setHide(true);
        }}
      />
    </div>
  );
}
