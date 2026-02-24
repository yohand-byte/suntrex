import { useState } from "react";

const DOMAINS = {
  huawei: "huawei.com",
  jinko: "jinkosolar.com",
  trina: "trinasolar.com",
  longi: "longi.com",
  "ja-solar": "jasolar.com",
  "canadian-solar": "canadiansolar.com",
  sma: "sma.de",
  sungrow: "sungrowpower.com",
  solaredge: "solaredge.com",
  goodwe: "goodwe.com",
  growatt: "growatt.com",
  risen: "risenenergy.com",
  byd: "byd.com",
  deye: "dfrienergy.com",
  enphase: "enphase.com",
};

function logoUrl(domain, attempt) {
  if (attempt === 0) return `https://logo.clearbit.com/${domain}`;
  if (attempt === 1) return `https://img.logo.dev/${domain}?token=pk_a8sMM1skRJOBaEyOkIHVcA&size=120&format=png`;
  return null;
}

export default function BrandLogo({ brand }) {
  const [attempt, setAttempt] = useState(0);
  const d = DOMAINS[brand.f];
  const url = d ? logoUrl(d, attempt) : null;

  if (url) {
    return (
      <img
        src={url}
        alt={brand.n}
        style={{ height: 36, maxWidth: 140, objectFit: "contain" }}
        onError={() => setAttempt(a => a + 1)}
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
