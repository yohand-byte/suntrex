import { useState } from "react";

const DOMAINS = {
  huawei: "huawei.com",
  jinko: "jinkosolar.com",
  trina: "trinasolar.com",
  longi: "longi.com",
  "ja-solar": "jasolar.com",
  "canadian-solar": "canadiansolar.com",
  sma: "sma.de",
  sungrow: "en.sungrowpower.com",
  solaredge: "solaredge.com",
  goodwe: "goodwe.com",
  growatt: "growatt.com",
  risen: "risenenergy.com",
  byd: "byd.com",
  deye: "deye.com",
  enphase: "enphase.com",
};

export default function BrandLogo({ brand }) {
  const [failed, setFailed] = useState(false);
  const d = DOMAINS[brand.f];
  if (!failed && d) {
    return (
      <img
        src={`https://logo.clearbit.com/${d}`}
        alt={brand.n}
        style={{ height: 30, maxWidth: 130, objectFit: "contain" }}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span style={{
      fontSize: brand.n.length > 10 ? 16 : 20,
      fontWeight: 800,
      color: brand.c,
      whiteSpace: "nowrap",
      fontFamily: "'Inter', 'DM Sans', sans-serif",
    }}>
      {brand.n}
    </span>
  );
}
