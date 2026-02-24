import { useMemo } from "react";

const S = {
  row: { display: "flex", alignItems: "center", gap: 8 },
  input: {
    width: 80,
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid #ddd",
    fontSize: 13,
    fontFamily: "inherit",
    color: "#333",
    textAlign: "center",
    outline: "none",
  },
  bar: {
    height: 4,
    borderRadius: 2,
    background: "#eee",
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    top: 0,
    height: "100%",
    borderRadius: 2,
    background: "#E8700A",
  },
  label: { fontSize: 11, color: "#999", flexShrink: 0 },
};

export default function RangeFilter({
  min,
  max,
  valueMin,
  valueMax,
  onChangeMin,
  onChangeMax,
  step = 1,
  unit = "",
}) {
  const range = max - min || 1;
  const leftPct = useMemo(
    () => ((valueMin != null ? valueMin - min : 0) / range) * 100,
    [valueMin, min, range]
  );
  const rightPct = useMemo(
    () => ((valueMax != null ? max - valueMax : 0) / range) * 100,
    [valueMax, max, range]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={S.row}>
        <span style={S.label}>Min</span>
        <input
          type="number"
          style={S.input}
          placeholder={min}
          value={valueMin ?? ""}
          min={min}
          max={valueMax ?? max}
          step={step}
          onChange={(e) => {
            const v = e.target.value === "" ? null : Number(e.target.value);
            if (v === null || (v >= min && v <= (valueMax ?? max))) onChangeMin(v);
          }}
        />
        <span style={S.label}>—</span>
        <span style={S.label}>Max</span>
        <input
          type="number"
          style={S.input}
          placeholder={max}
          value={valueMax ?? ""}
          min={valueMin ?? min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = e.target.value === "" ? null : Number(e.target.value);
            if (v === null || (v >= (valueMin ?? min) && v <= max)) onChangeMax(v);
          }}
        />
        {unit && <span style={S.label}>{unit}</span>}
      </div>
      <div style={S.bar}>
        <div
          style={{
            ...S.fill,
            left: `${Math.max(0, leftPct)}%`,
            right: `${Math.max(0, rightPct)}%`,
          }}
        />
      </div>
    </div>
  );
}
