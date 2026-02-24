import { useState } from "react";

export default function BrandLogo({ brand }) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <img
        src={`/logos/${brand.f}.svg`}
        alt={brand.n}
        style={{ height: 36, maxWidth: 140, objectFit: "contain" }}
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
