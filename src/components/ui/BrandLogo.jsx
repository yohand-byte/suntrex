import { useState } from "react";

/**
 * BrandLogo — explicit width+height per logo (no width:auto)
 * Dimensions computed from each file's real aspect ratio
 * so browsers never need to guess width from SVG viewBox
 */
const LOGO_MAP = {
  huawei:     { file: "huawei",     w: 119, h: 26 },
  jinko:      { file: "jinko",      w: 75,  h: 24 },
  trina:      { file: "trina",      w: 108, h: 24 },
  longi:      { file: "longi",      w: 57,  h: 22 },
  sma:        { file: "sma",        w: 38,  h: 38 },
  sungrow:    { file: "sungrow",    w: 110, h: 24 },
  solaredge:  { file: "solaredge",  w: 118, h: 24 },
  goodwe:     { file: "goodwe",     w: 26,  h: 26 },
  risen:      { file: "risen",      w: 24,  h: 24 },
  byd:        { file: "byd",        w: 119, h: 24 },
  enphase:    { file: "enphase",    w: 133, h: 24 },
  dualsun:    { file: "dualsun",    w: 128, h: 24 },
  esdec:      { file: "esdec",      w: 170, h: 22 },
  k2systems:  { file: "k2systems",  w: 36,  h: 36 },
};

export default function BrandLogo({ brand }) {
  const entry = LOGO_MAP[brand?.f];
  const [ext, setExt] = useState("svg");
  const [hide, setHide] = useState(false);

  if (hide || !entry) return null;

  return (
    <img
      src={"/logos/" + entry.file + "." + ext}
      alt={brand?.n || "Brand"}
      draggable={false}
      width={entry.w}
      height={entry.h}
      style={{
        width: entry.w,
        height: entry.h,
        objectFit: "contain",
        flexShrink: 0,
        display: "block",
      }}
      onError={() => {
        if (ext === "svg") setExt("png");
        else setHide(true);
      }}
    />
  );
}
