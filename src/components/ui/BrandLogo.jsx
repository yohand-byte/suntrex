import { useState } from "react";

/**
 * BrandLogo — renders brand logos in marquee
 * No fixed container — each logo takes its natural width
 * Square logos get extra height so they don't appear tiny
 */
const LOGO_MAP = {
  huawei: { file: "huawei", h: 26 },
  jinko: { file: "jinko", h: 24 },
  trina: { file: "trina", h: 24 },
  longi: { file: "longi", h: 22 },
  sma: { file: "sma", h: 38 },
  sungrow: { file: "sungrow", h: 24 },
  solaredge: { file: "solaredge", h: 24 },
  goodwe: { file: "goodwe", h: 26 },
  risen: { file: "risen", h: 24 },
  byd: { file: "byd", h: 24 },
  enphase: { file: "enphase", h: 24 },
  dualsun: { file: "dualsun", h: 24 },
  esdec: { file: "esdec", h: 24 },
  k2systems: { file: "k2systems", h: 36 },
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
      loading="lazy"
      style={{
        height: entry.h,
        width: "auto",
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
