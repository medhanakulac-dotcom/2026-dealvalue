import { useState, useMemo, useEffect } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────
const REGIONS = {
  Thailand: "A",
  Indonesia: "A",
  Vietnam: "A",
  Cambodia: "A",
  Philippines: "C",
  Laos: "B",
  EMEA: "B",
  "Rest of World": "B",
};

const DEAL_VALUE_TIERS = {
  A: [
    { max: 1199, score: 0 },
    { max: 2900, score: 1 },
    { max: 4999, score: 2 },
    { max: 9999, score: 3 },
    { max: Infinity, score: 5 },
  ],
  B: [
    { max: 1000, score: 1 },
    { max: 4999, score: 3 },
    { max: Infinity, score: 5 },
  ],
  C: [
    { max: 1000, score: 1 },
    { max: 4999, score: 3 },
    { max: Infinity, score: 5 },
  ],
};

const TICKET_VOLUME_TIERS = {
  A: [
    { max: 3000, score: 0 },
    { max: 10000, score: 2 },
    { max: Infinity, score: 3 },
  ],
  B: [
    { max: 500, score: 0 },
    { max: 5000, score: 1 },
    { max: Infinity, score: 3 },
  ],
  C: [
    { max: 500, score: 0 },
    { max: 5000, score: 1 },
    { max: Infinity, score: 3 },
  ],
};

const OPERATOR_SCORES = { Operator: 2, Agency: 0 };

const DEFAULTS = {
  ticketFee: 0.3,
  revenueShare: 3,
  implementationFee: 150,
  monthlyFee: 60,
};

// Country-specific fee overrides (takes precedence over DEFAULTS)
const COUNTRY_OVERRIDES = {
  Philippines: { monthlyFee: 30 },
};

// ─── HELPERS ─────────────────────────────────────────────────────
const fmt = (n) =>
  n != null && !isNaN(n)
    ? Number(n).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
    : "0";

const fmtUSD = (n) => `${fmt(n)} USD`;

const safe = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : Math.max(0, n);
};

const getTierScore = (tiers, value) => {
  for (const t of tiers) if (value <= t.max) return t.score;
  return tiers[tiers.length - 1].score;
};

const segmentColor = (s) =>
  s === "High" ? "#16a34a" : s === "Mid-High" ? "#0d9488" : s === "Medium" ? "#ea8c00" : "#e11d48";

const segmentBg = (s) =>
  s === "High"
    ? "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)"
    : s === "Mid-High"
    ? "linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)"
    : s === "Medium"
    ? "linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)"
    : "linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)";

// ─── ANIMATED NUMBER ─────────────────────────────────────────────
function AnimNum({ value, prefix = "", suffix = "" }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    let start = display;
    const end = value;
    if (start === end) return;
    const diff = end - start;
    const steps = 18;
    let step = 0;
    const iv = setInterval(() => {
      step++;
      setDisplay(start + diff * (step / steps));
      if (step >= steps) {
        setDisplay(end);
        clearInterval(iv);
      }
    }, 16);
    return () => clearInterval(iv);
  }, [value]);
  return (
    <span>
      {prefix}
      {fmt(display)}
      {suffix}
    </span>
  );
}

// ─── FLOATING SHAPES ─────────────────────────────────────────────
function Shapes() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {[
        {
          w: 320,
          h: 320,
          bg: "radial-gradient(circle, rgba(251,146,60,0.12) 0%, transparent 70%)",
          top: -60,
          right: -80,
        },
        {
          w: 240,
          h: 240,
          bg: "radial-gradient(circle, rgba(168,85,247,0.09) 0%, transparent 70%)",
          bottom: 80,
          left: -60,
        },
        {
          w: 180,
          h: 180,
          bg: "radial-gradient(circle, rgba(20,184,166,0.10) 0%, transparent 70%)",
          top: "40%",
          right: 40,
        },
        {
          w: 140,
          h: 140,
          bg: "radial-gradient(circle, rgba(251,146,60,0.07) 0%, transparent 70%)",
          bottom: -30,
          right: "30%",
        },
      ].map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: s.w,
            height: s.h,
            borderRadius: "50%",
            background: s.bg,
            top: s.top,
            left: s.left,
            right: s.right,
            bottom: s.bottom,
            animation: `seatFloat ${6 + i * 2}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

// ─── CARD ────────────────────────────────────────────────────────
function Card({ children, style, accent, className = "" }) {
  return (
    <div
      className={className}
      style={{
        background: "#fff",
        borderRadius: 20,
        padding: "28px 32px",
        boxShadow: "0 2px 24px rgba(0,0,0,0.05), 0 0.5px 2px rgba(0,0,0,0.06)",
        position: "relative",
        overflow: "hidden",
        transition: "box-shadow 0.3s, transform 0.25s",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          "0 8px 40px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.07)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow =
          "0 2px 24px rgba(0,0,0,0.05), 0 0.5px 2px rgba(0,0,0,0.06)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {accent && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: accent,
            borderRadius: "20px 20px 0 0",
          }}
        />
      )}
      {children}
    </div>
  );
}

// ─── PILL / BADGE ────────────────────────────────────────────────
function Pill({ children, color = "#f97316", style }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 14px",
        borderRadius: 100,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.4,
        color,
        background: color + "16",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ─── TOGGLE ──────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: checked
            ? "linear-gradient(135deg, #f97316, #fb923c)"
            : "#d4d4d8",
          position: "relative",
          transition: "background 0.25s",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            position: "absolute",
            top: 3,
            left: checked ? 23 : 3,
            transition: "left 0.25s",
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          }}
        />
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color: "#52525b" }}>
        {label}
      </span>
    </label>
  );
}

// ─── WAIVER TOGGLE ───────────────────────────────────────────────
function WaiverToggle({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        userSelect: "none",
        padding: "5px 12px",
        borderRadius: 100,
        background: checked
          ? "linear-gradient(135deg, #e11d48, #f43f5e)"
          : "#f4f4f5",
        transition: "all 0.25s",
        border: `1.5px solid ${checked ? "#e11d48" : "#d4d4d8"}`,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: checked ? "#fff" : "#71717a",
          letterSpacing: 0.3,
        }}
      >
        {checked ? "WAIVED" : "Waive"}
      </span>
    </div>
  );
}

// ─── SELECT ──────────────────────────────────────────────────────
function Select({ value, onChange, options, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#a1a1aa", letterSpacing: 0.8, textTransform: "uppercase" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "10px 14px",
          borderRadius: 12,
          border: "1.5px solid #e4e4e7",
          fontSize: 14,
          fontWeight: 500,
          color: "#3f3f46",
          background: "#fafaf9",
          outline: "none",
          cursor: "pointer",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#f97316")}
        onBlur={(e) => (e.target.style.borderColor = "#e4e4e7")}
      >
        {options.map((o) => (
          <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
            {typeof o === "string" ? o : o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── INPUT ───────────────────────────────────────────────────────
function Input({ value, onChange, label, prefix, suffix, placeholder, error }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#a1a1aa", letterSpacing: 0.8, textTransform: "uppercase" }}>
        {label}
      </label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {prefix && (
          <span
            style={{
              position: "absolute",
              left: 14,
              fontSize: 13,
              fontWeight: 600,
              color: "#a1a1aa",
            }}
          >
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "0"}
          style={{
            width: "100%",
            padding: `10px ${suffix ? 44 : 14}px 10px ${prefix ? 34 : 14}px`,
            borderRadius: 12,
            border: `1.5px solid ${error ? "#e11d48" : "#e4e4e7"}`,
            fontSize: 14,
            fontWeight: 500,
            color: "#3f3f46",
            background: "#fafaf9",
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) =>
            (e.target.style.borderColor = error ? "#e11d48" : "#f97316")
          }
          onBlur={(e) =>
            (e.target.style.borderColor = error ? "#e11d48" : "#e4e4e7")
          }
        />
        {suffix && (
          <span
            style={{
              position: "absolute",
              right: 14,
              fontSize: 13,
              fontWeight: 600,
              color: "#a1a1aa",
            }}
          >
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <span style={{ fontSize: 11, color: "#e11d48", fontWeight: 500 }}>
          {error}
        </span>
      )}
    </div>
  );
}

// ─── SCORE CARD ──────────────────────────────────────────────────
function ScoreCard({ label, score, max, detail, color = "#f97316" }) {
  return (
    <Card accent={color}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#a1a1aa", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 36, fontWeight: 800, color }}>{score}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#a1a1aa" }}>
          / {max}
        </span>
      </div>
      <div style={{ fontSize: 12, color: "#71717a", marginTop: 6, lineHeight: 1.5 }}>
        {detail}
      </div>
    </Card>
  );
}

// ═════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═════════════════════════════════════════════════════════════════
export default function App() {
  // State
  const [model, setModel] = useState("ticket");
  const [country, setCountry] = useState("Thailand");
  const [operatorType, setOperatorType] = useState("Operator");
  const [marqueeBrand, setMarqueeBrand] = useState(false);
  const [customPricing, setCustomPricing] = useState(false);

  const [ticketVolume, setTicketVolume] = useState("");
  const [gmv, setGmv] = useState("");
  const [revenue, setRevenue] = useState("");
  const [ticketFeeInput, setTicketFeeInput] = useState("0.3");
  const [revShareInput, setRevShareInput] = useState("3");
  const [implFeeInput, setImplFeeInput] = useState("150");
  const [monthlyFeeInput, setMonthlyFeeInput] = useState("60");
  const [waiveImpl, setWaiveImpl] = useState(false);
  const [waiveMonths, setWaiveMonths] = useState(0); // 0-12 months waived
  const [waiveVariable, setWaiveVariable] = useState(false);
  const [topRoute, setTopRoute] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Derived
  const countryOverride = COUNTRY_OVERRIDES[country] || {};
  const defaultMonthlyFee = countryOverride.monthlyFee ?? DEFAULTS.monthlyFee;
  const isMonthlyFixed = countryOverride.monthlyFee != null;

  // Sync monthlyFeeInput to country default when country changes
  useEffect(() => {
    const override = COUNTRY_OVERRIDES[country];
    setMonthlyFeeInput(String(override?.monthlyFee ?? DEFAULTS.monthlyFee));
  }, [country]);

  const ticketFee = waiveVariable ? 0 : (customPricing ? safe(ticketFeeInput) : DEFAULTS.ticketFee);
  const revShare = waiveVariable ? 0 : (customPricing
    ? Math.min(100, Math.max(0, safe(revShareInput)))
    : DEFAULTS.revenueShare);
  const implFee = waiveImpl ? 0 : (customPricing ? safe(implFeeInput) : DEFAULTS.implementationFee);
  const monthlyFeeRate = customPricing ? safe(monthlyFeeInput) : (isMonthlyFixed ? defaultMonthlyFee : DEFAULTS.monthlyFee);
  const paidMonths = 12 - waiveMonths;
  const monthlyTotal = monthlyFeeRate * paidMonths;
  const fixedFee = implFee + monthlyTotal;
  const hasAnyWaiver = waiveImpl || waiveMonths > 0 || waiveVariable;

  const gmvError =
    safe(gmv) > 0 && safe(revenue) > safe(gmv)
      ? "Revenue cannot exceed GMV"
      : "";

  const calc = useMemo(() => {
    const vol = safe(ticketVolume);
    if (model === "ticket") {
      const variable = vol * ticketFee;
      return { variable, fixed: fixedFee, deal: variable + fixedFee, vol, implFee, monthlyFeeRate, paidMonths, waiveMonths, monthlyTotal };
    } else {
      const g = safe(gmv);
      const r = Math.min(safe(revenue), g);
      const variable = (g - r) * (revShare / 100);
      return { variable, fixed: fixedFee, deal: variable + fixedFee, vol, g, r, implFee, monthlyFeeRate, paidMonths, waiveMonths, monthlyTotal };
    }
  }, [model, ticketVolume, gmv, revenue, ticketFee, revShare, fixedFee, implFee, monthlyFeeRate, paidMonths, waiveMonths, monthlyTotal]);

  const scores = useMemo(() => {
    const vol = calc.vol;
    const group = REGIONS[country];
    const ticketScore = getTierScore(TICKET_VOLUME_TIERS[group], vol);
    const dealScore = getTierScore(DEAL_VALUE_TIERS[group], calc.deal);
    const opScore = OPERATOR_SCORES[operatorType];
    const routeBonus = (country !== "Thailand" && topRoute) ? 1 : 0;
    const total = ticketScore + dealScore + opScore + routeBonus;
    const rawSegment =
      total >= 7 ? "High" : total >= 4 ? "Medium" : "Low";
    // Mid-High override: Operator scoring Medium with deal value > 5,000
    const isMidHighOverride = rawSegment === "Medium" && operatorType === "Operator" && calc.deal > 5000;
    const segment = marqueeBrand ? "High" : isMidHighOverride ? "Mid-High" : rawSegment;
    const override = marqueeBrand && rawSegment !== "High";
    const midHighOverride = isMidHighOverride && !marqueeBrand;
    return { ticketScore, dealScore, opScore, routeBonus, total, segment, override, midHighOverride, rawSegment };
  }, [calc, country, operatorType, marqueeBrand, topRoute]);

  // ─── FORMULA STRING ────────────────────────────────────────────
  const formula = useMemo(() => {
    const monthlyLabel = waiveMonths > 0
      ? `Monthly Fee (${fmt(monthlyFeeRate)} × ${paidMonths} mo, ${waiveMonths} waived)`
      : `Monthly Fee (${fmt(monthlyFeeRate)} × 12)`;
    const monthlyWaived = waiveMonths >= 12;

    if (model === "ticket") {
      const vol = safe(ticketVolume);
      return {
        varLabel: "Convenience Fee",
        varLine: waiveVariable ? "WAIVED" : `${fmt(vol)} tickets × ${ticketFee} USD`,
        varResult: calc.variable,
        varWaived: waiveVariable,
        fixedLines: [
          { label: "Implementation Fee", value: implFee, waived: waiveImpl },
          { label: monthlyLabel, value: monthlyTotal, waived: monthlyWaived, partialWaive: waiveMonths > 0 && waiveMonths < 12 },
        ],
        total: calc.deal,
      };
    } else {
      const g = safe(gmv);
      const r = Math.min(safe(revenue), g);
      return {
        varLabel: "Revenue Share",
        varLine: waiveVariable ? "WAIVED" : `(${fmt(g)} − ${fmt(r)}) × ${revShare}%`,
        varResult: calc.variable,
        varWaived: waiveVariable,
        fixedLines: [
          { label: "Implementation Fee", value: implFee, waived: waiveImpl },
          { label: monthlyLabel, value: monthlyTotal, waived: monthlyWaived, partialWaive: waiveMonths > 0 && waiveMonths < 12 },
        ],
        total: calc.deal,
      };
    }
  }, [model, ticketVolume, gmv, revenue, ticketFee, revShare, calc, implFee, monthlyFeeRate, monthlyTotal, paidMonths, waiveMonths, waiveImpl, waiveVariable]);

  // Comparison (default vs custom/waived)
  const comparison = useMemo(() => {
    if (!customPricing && !hasAnyWaiver) return null;
    const defFixed = DEFAULTS.implementationFee + (DEFAULTS.monthlyFee * 12);
    const custFixed = fixedFee;
    if (model === "ticket") {
      const defVar = safe(ticketVolume) * DEFAULTS.ticketFee;
      const custVar = safe(ticketVolume) * ticketFee;
      return {
        default: defVar + defFixed,
        custom: custVar + custFixed,
        diff: (custVar + custFixed) - (defVar + defFixed),
      };
    } else {
      const g = safe(gmv);
      const r = Math.min(safe(revenue), g);
      const defVar = (g - r) * (DEFAULTS.revenueShare / 100);
      const custVar = (g - r) * (revShare / 100);
      return {
        default: defVar + defFixed,
        custom: custVar + custFixed,
        diff: (custVar + custFixed) - (defVar + defFixed),
      };
    }
  }, [customPricing, hasAnyWaiver, model, ticketVolume, gmv, revenue, ticketFee, revShare, fixedFee]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
        @keyframes seatFloat { 0%{transform:translateY(0) scale(1)} 100%{transform:translateY(-18px) scale(1.04)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; margin:0; padding:0; }
        body { background: #f5f0eb; }
      `}</style>

      <Shapes />

      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          minHeight: "100vh",
          background: "linear-gradient(160deg, #f5f0eb 0%, #ede7df 40%, #f0ebe4 100%)",
          color: "#27272a",
          position: "relative",
          zIndex: 1,
          padding: "0 16px 60px",
        }}
      >
        {/* ─── HEADER ──────────────────────────────────────────── */}
        <header
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "36px 0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            animation: "fadeUp 0.5s ease-out",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img
              src="https://res.cloudinary.com/dkwj2iikl/image/upload/v1773201660/216db52f-36bd-4673-ade2-725c4beba594_thumb_zt4ub4.jpg"
              alt="SeatOS"
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                objectFit: "cover",
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              }}
            />
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>
                SeatOS
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#a1a1aa", letterSpacing: 1, textTransform: "uppercase" }}>
                BD Deal Calculator
              </div>
            </div>
          </div>
          <Pill color="#a855f7">Business Development</Pill>
        </header>

        {/* ─── MAIN GRID ──────────────────────────────────────── */}
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: 24,
            animation: "fadeUp 0.6s ease-out",
          }}
        >
          {/* ─── LEFT COLUMN ────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* DEAL VALUE CARD */}
            <Card accent="linear-gradient(90deg, #f97316, #fb923c)">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 22,
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>
                    Deal Value Calculator
                  </div>
                  <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
                    Estimate deal value based on pricing model
                  </div>
                </div>
                <Pill color={hasAnyWaiver ? "#e11d48" : customPricing ? "#ea580c" : "#16a34a"}>
                  {hasAnyWaiver ? "Waiver Applied" : customPricing ? "Custom Pricing" : "Default Pricing"}
                </Pill>
              </div>

              {/* Model + Country row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 18,
                }}
              >
                <Select
                  label="Pricing Model"
                  value={model}
                  onChange={setModel}
                  options={[
                    { value: "ticket", label: "Per Ticket (0.3 USD)" },
                    { value: "gmv", label: "GMV Revenue Share" },
                  ]}
                />
                <Select
                  label="Country / Region"
                  value={country}
                  onChange={setCountry}
                  options={Object.keys(REGIONS)}
                />
              </div>

              {/* Inputs */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    model === "ticket" ? "1fr" : "1fr 1fr 1fr",
                  gap: 16,
                  marginBottom: 18,
                }}
              >
                {model === "ticket" ? (
                  <Input
                    label="Online Ticket Volume"
                    value={ticketVolume}
                    onChange={setTicketVolume}
                    placeholder="e.g. 50000"
                  />
                ) : (
                  <>
                    <Input
                      label="GMV (USD)"
                      value={gmv}
                      onChange={setGmv}
                      prefix="$"
                    />
                    <Input
                      label="Revenue (USD)"
                      value={revenue}
                      onChange={setRevenue}
                      prefix="$"
                      error={gmvError}
                    />
                    <Input
                      label="Online Ticket Volume"
                      value={ticketVolume}
                      onChange={setTicketVolume}
                      placeholder="e.g. 50000"
                    />
                  </>
                )}
              </div>

              {/* Custom pricing & Waivers */}
              <div
                style={{
                  padding: "14px 18px",
                  background: "#fafaf9",
                  borderRadius: 14,
                  marginBottom: 18,
                }}
              >
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  <Toggle
                    checked={customPricing}
                    onChange={setCustomPricing}
                    label="Use Custom Pricing"
                  />
                </div>

                {/* Fee rows with waiver toggles */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                  {/* Implementation Fee row */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: customPricing ? "1fr auto" : "1fr auto",
                    gap: 12,
                    alignItems: "end",
                    padding: "10px 14px",
                    background: waiveImpl ? "#fef2f2" : "#fff",
                    borderRadius: 10,
                    border: `1px solid ${waiveImpl ? "#fecdd3" : "#e4e4e7"}`,
                    transition: "all 0.2s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {customPricing && !waiveImpl ? (
                        <Input
                          label="Implementation Fee"
                          value={implFeeInput}
                          onChange={setImplFeeInput}
                          prefix="$"
                          placeholder="150"
                        />
                      ) : (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#a1a1aa", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>Implementation Fee</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: waiveImpl ? "#e11d48" : "#3f3f46", textDecoration: waiveImpl ? "line-through" : "none" }}>
                            {fmtUSD(DEFAULTS.implementationFee)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ paddingBottom: 2 }}>
                      <WaiverToggle checked={waiveImpl} onChange={setWaiveImpl} />
                    </div>
                  </div>

                  {/* Monthly Fee row */}
                  <div style={{
                    padding: "10px 14px",
                    background: waiveMonths > 0 ? (waiveMonths >= 12 ? "#fef2f2" : "#fffbeb") : (isMonthlyFixed && !customPricing) ? "#f0f9ff" : "#fff",
                    borderRadius: 10,
                    border: `1px solid ${waiveMonths >= 12 ? "#fecdd3" : waiveMonths > 0 ? "#fde68a" : (isMonthlyFixed && !customPricing) ? "#bae6fd" : "#e4e4e7"}`,
                    transition: "all 0.2s",
                  }}>
                    {/* Top: label + value */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: waiveMonths > 0 || true ? 10 : 0 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#a1a1aa", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>Monthly Fee</div>
                        </div>
                        {customPricing ? (
                          <div style={{ marginTop: 2 }}>
                            <Input
                              label=""
                              value={monthlyFeeInput}
                              onChange={setMonthlyFeeInput}
                              prefix="$"
                              suffix="/mo"
                              placeholder={isMonthlyFixed ? String(defaultMonthlyFee) : "60"}
                            />
                          </div>
                        ) : (
                          <div style={{ fontSize: 16, fontWeight: 700, color: waiveMonths >= 12 ? "#e11d48" : "#3f3f46", textDecoration: waiveMonths >= 12 ? "line-through" : "none" }}>
                            {fmtUSD(monthlyFeeRate)}<span style={{ fontSize: 12, fontWeight: 500, color: "#a1a1aa" }}> /mo</span>
                          </div>
                        )}
                      </div>
                      {/* Summary pill */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#a1a1aa", marginBottom: 4 }}>12-month total</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: waiveMonths >= 12 ? "#e11d48" : waiveMonths > 0 ? "#d97706" : "#3f3f46" }}>
                          {fmtUSD(monthlyTotal)}
                        </div>
                        {waiveMonths > 0 && waiveMonths < 12 && (
                          <div style={{ fontSize: 11, color: "#d97706", fontWeight: 600, marginTop: 2 }}>
                            saved {fmtUSD(monthlyFeeRate * waiveMonths)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Waive months selector */}
                    <div style={{
                      background: waiveMonths > 0 ? (waiveMonths >= 12 ? "#fef2f2" : "#fffbeb") : "#f4f4f5",
                      borderRadius: 8,
                      padding: "8px 10px",
                      transition: "background 0.2s",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: waiveMonths > 0 ? (waiveMonths >= 12 ? "#e11d48" : "#d97706") : "#71717a", letterSpacing: 0.3 }}>
                          {waiveMonths === 0 ? "Waive months" : waiveMonths >= 12 ? `All 12 months waived` : `${waiveMonths} month${waiveMonths > 1 ? "s" : ""} waived`}
                        </span>
                        {waiveMonths > 0 && (
                          <span
                            onClick={() => setWaiveMonths(0)}
                            style={{ fontSize: 10, fontWeight: 700, color: "#71717a", cursor: "pointer", padding: "2px 8px", borderRadius: 100, background: "#e4e4e7" }}
                          >
                            Reset
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 3 }}>
                        {Array.from({ length: 13 }, (_, i) => (
                          <div
                            key={i}
                            onClick={() => setWaiveMonths(i)}
                            style={{
                              flex: 1,
                              height: 28,
                              borderRadius: 6,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 10,
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s",
                              background: i === waiveMonths
                                ? (i === 0 ? "#3f3f46" : i >= 12 ? "#e11d48" : "#d97706")
                                : i <= waiveMonths ? (i >= 12 ? "#fecdd3" : "#fde68a") : "#e4e4e7",
                              color: i === waiveMonths ? "#fff" : i <= waiveMonths && i > 0 ? (i >= 12 ? "#e11d48" : "#92400e") : "#71717a",
                              border: `1.5px solid ${i === waiveMonths ? "transparent" : "transparent"}`,
                            }}
                          >
                            {i}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        <span style={{ fontSize: 9, color: "#a1a1aa" }}>No waiver</span>
                        <span style={{ fontSize: 9, color: "#a1a1aa" }}>Full waiver</span>
                      </div>
                    </div>
                  </div>

                  {/* Variable Fee row (Convenience Fee or Revenue Share) */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: customPricing ? "1fr auto" : "1fr auto",
                    gap: 12,
                    alignItems: "end",
                    padding: "10px 14px",
                    background: waiveVariable ? "#fef2f2" : "#fff",
                    borderRadius: 10,
                    border: `1px solid ${waiveVariable ? "#fecdd3" : "#e4e4e7"}`,
                    transition: "all 0.2s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {customPricing && !waiveVariable ? (
                        model === "ticket" ? (
                          <Input
                            label="Convenience Fee"
                            value={ticketFeeInput}
                            onChange={setTicketFeeInput}
                            prefix="$"
                            suffix="/tkt"
                          />
                        ) : (
                          <Input
                            label="Revenue Share"
                            value={revShareInput}
                            onChange={setRevShareInput}
                            suffix="%"
                          />
                        )
                      ) : (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#a1a1aa", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>
                            {model === "ticket" ? "Convenience Fee" : "Revenue Share"}
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: waiveVariable ? "#e11d48" : "#3f3f46", textDecoration: waiveVariable ? "line-through" : "none" }}>
                            {model === "ticket" ? `${DEFAULTS.ticketFee} USD /ticket` : `${DEFAULTS.revenueShare}%`}
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ paddingBottom: 2 }}>
                      <WaiverToggle checked={waiveVariable} onChange={setWaiveVariable} />
                    </div>
                  </div>
                </div>

                {hasAnyWaiver && (
                  <div style={{ marginTop: 12, padding: "8px 12px", background: "#fef2f2", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#e11d48", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>⚠</span>
                    Waived: {[
                      waiveImpl && "Implementation Fee",
                      waiveMonths > 0 && (waiveMonths >= 12 ? "Monthly Fee (all 12 mo)" : `Monthly Fee (${waiveMonths} mo)`),
                      waiveVariable && (model === "ticket" ? "Convenience Fee" : "Revenue Share")
                    ].filter(Boolean).join(", ")}
                  </div>
                )}
              </div>

              {/* Formula */}
              <div
                style={{
                  background: "linear-gradient(135deg, #1c1917 0%, #292524 100%)",
                  borderRadius: 14,
                  padding: "20px 24px",
                  color: "#fafaf9",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#a1a1aa", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>
                  Calculation Breakdown
                </div>
                {/* Fee table */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: formula.varWaived ? 0.5 : 1 }}>
                    <span style={{ fontSize: 13, color: "#a8a29e", textDecoration: formula.varWaived ? "line-through" : "none" }}>{formula.varLabel}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, textDecoration: formula.varWaived ? "line-through" : "none" }}>
                      {formula.varLine}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 12 }}>
                    <span style={{ fontSize: 12, color: "#78716c" }}></span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: formula.varWaived ? "#78716c" : "#fb923c" }}>= {formula.varWaived ? "0 USD (waived)" : fmtUSD(formula.varResult)}</span>
                  </div>
                  <div style={{ height: 1, background: "#3f3f46", margin: "4px 0" }} />
                  {formula.fixedLines.map((fl, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: fl.waived ? 0.5 : 1 }}>
                      <span style={{ fontSize: 13, color: fl.partialWaive ? "#fbbf24" : "#a8a29e", textDecoration: fl.waived ? "line-through" : "none" }}>{fl.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: fl.partialWaive ? "#fbbf24" : "inherit", textDecoration: fl.waived ? "line-through" : "none" }}>{fl.waived ? "0 USD (waived)" : fmtUSD(fl.value)}</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: "#3f3f46", margin: "4px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#a8a29e" }}>Fixed Fees Subtotal</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{fmtUSD(fixedFee)}</span>
                  </div>
                </div>
                {/* Total */}
                <div style={{ background: "#1a1a1a", borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fafaf9" }}>Deal Value</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: "#fb923c" }}>{fmtUSD(formula.total)}</span>
                </div>
              </div>

              {/* Comparison */}
              {comparison && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                    marginTop: 16,
                  }}
                >
                  <div
                    style={{
                      background: "#fafaf9",
                      borderRadius: 12,
                      padding: "14px 18px",
                      border: "1.5px solid #e4e4e7",
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#a1a1aa", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 4 }}>
                      Default Pricing
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#52525b" }}>
                      {fmtUSD(comparison.default)}
                    </div>
                  </div>
                  <div
                    style={{
                      background:
                        comparison.diff >= 0
                          ? "linear-gradient(135deg, #f0fdf4, #dcfce7)"
                          : "linear-gradient(135deg, #fff1f2, #ffe4e6)",
                      borderRadius: 12,
                      padding: "14px 18px",
                      border: `1.5px solid ${comparison.diff >= 0 ? "#bbf7d0" : "#fecdd3"}`,
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#a1a1aa", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 4 }}>
                      Custom Pricing ({comparison.diff >= 0 ? "+" : ""}
                      {fmt(comparison.diff)})
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        color: comparison.diff >= 0 ? "#16a34a" : "#e11d48",
                      }}
                    >
                      {fmtUSD(comparison.custom)}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* SCORING CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: country !== "Thailand" ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr", gap: 16 }}>
              <ScoreCard
                label="Ticket Volume"
                score={scores.ticketScore}
                max={3}
                detail={`${fmt(calc.vol)} tickets → ${scores.ticketScore} pts`}
                color="#a855f7"
              />
              <ScoreCard
                label="Deal Value"
                score={scores.dealScore}
                max={5}
                detail={`${fmtUSD(calc.deal)} in Group ${REGIONS[country]} → ${scores.dealScore} pts`}
                color="#14b8a6"
              />
              <ScoreCard
                label="Operator Type"
                score={scores.opScore}
                max={2}
                detail={`${operatorType} → ${scores.opScore} pts`}
                color="#f97316"
              />
              {country !== "Thailand" && (
                <ScoreCard
                  label="Top Route Bonus"
                  score={scores.routeBonus}
                  max={1}
                  detail={topRoute ? "Top 10 route → +1 pt" : "Not on top 10 routes"}
                  color="#7c3aed"
                />
              )}
            </div>
          </div>

          {/* ─── RIGHT COLUMN ───────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* SEGMENT INPUTS */}
            <Card accent="linear-gradient(90deg, #a855f7, #7c3aed)">
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 18 }}>
                Segment Inputs
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Select
                  label="Operator Type"
                  value={operatorType}
                  onChange={setOperatorType}
                  options={["Operator", "Agency"]}
                />
                <div>
                  <Toggle
                    checked={marqueeBrand}
                    onChange={setMarqueeBrand}
                    label="Marquee Brand"
                  />
                  {marqueeBrand && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#16a34a",
                        fontWeight: 600,
                        marginTop: 6,
                        marginLeft: 54,
                      }}
                    >
                      Overrides segment to High
                    </div>
                  )}
                </div>
                {country !== "Thailand" && (
                  <div>
                    <Toggle
                      checked={topRoute}
                      onChange={setTopRoute}
                      label="Top 10 Best Selling Route on Travelier"
                    />
                    {topRoute && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#7c3aed",
                          fontWeight: 600,
                          marginTop: 6,
                          marginLeft: 54,
                        }}
                      >
                        +1 bonus point
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* TOTAL SCORE */}
            <Card style={{ textAlign: "center" }} accent="linear-gradient(90deg, #14b8a6, #0d9488)">
              <div style={{ fontSize: 11, fontWeight: 700, color: "#a1a1aa", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>
                Total Score
              </div>
              <div style={{ fontSize: 52, fontWeight: 800, color: "#27272a", lineHeight: 1 }}>
                <AnimNum value={scores.total} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#a1a1aa", marginTop: 4 }}>
                out of {country !== "Thailand" ? 11 : 10}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 6,
                  marginTop: 14,
                }}
              >
                {[
                  { score: scores.ticketScore, color: "#a855f7" },
                  { score: scores.dealScore, color: "#14b8a6" },
                  { score: scores.opScore, color: "#f97316" },
                  ...(country !== "Thailand" ? [{ score: scores.routeBonus, color: "#7c3aed" }] : []),
                ].map((s, i) => (
                    <div
                      key={i}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 14,
                        color: "#fff",
                        background: s.color,
                      }}
                    >
                      {s.score}
                    </div>
                  )
                )}
              </div>
            </Card>

            {/* FINAL SEGMENT */}
            <Card
              style={{
                background: segmentBg(scores.segment),
                textAlign: "center",
                padding: "36px 32px",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#71717a", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
                Final Segment
              </div>
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 800,
                  color: segmentColor(scores.segment),
                  lineHeight: 1,
                  letterSpacing: -1,
                }}
              >
                {scores.segment}
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#52525b",
                  lineHeight: 1.6,
                }}
              >
                {scores.override
                  ? "Assigned High due to Marquee Brand override"
                  : scores.midHighOverride
                  ? `Upgraded to Mid-High — Operator with Medium score (${scores.total}) and deal value > 5,000 USD`
                  : `Assigned ${scores.segment} because total score is ${scores.total}`}
              </div>
              <div
                style={{
                  marginTop: 16,
                  display: "inline-flex",
                  padding: "6px 16px",
                  borderRadius: 100,
                  background: segmentColor(scores.segment) + "18",
                  fontSize: 12,
                  fontWeight: 700,
                  color: segmentColor(scores.segment),
                }}
              >
                {scores.segment === "High"
                  ? "≥ 7 points"
                  : scores.segment === "Mid-High"
                  ? "Medium + Deal > 5K"
                  : scores.segment === "Medium"
                  ? "4–6 points"
                  : "< 4 points"}
                {scores.override && " (overridden)"}
              </div>
            </Card>

            {/* DEAL SUMMARY */}
            <Card
              accent="linear-gradient(90deg, #f97316, #ea580c)"
              style={{ textAlign: "center" }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#a1a1aa", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>
                Deal Value
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: "#ea580c",
                  lineHeight: 1,
                }}
              >
                <AnimNum value={calc.deal} suffix=" USD" />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginTop: 14,
                  fontSize: 12,
                  color: "#71717a",
                  textAlign: "left",
                }}
              >
                {[
                  { label: model === "ticket" ? "Convenience Fee" : "Revenue Share", value: calc.variable, waived: waiveVariable },
                  { label: "Implementation Fee", value: calc.implFee, waived: waiveImpl },
                  {
                    label: waiveMonths > 0 && waiveMonths < 12
                      ? `Monthly Fee (${fmt(calc.monthlyFeeRate)} × ${calc.paidMonths} mo)`
                      : `Monthly Fee (${fmt(calc.monthlyFeeRate)} × 12)`,
                    value: calc.monthlyTotal,
                    waived: waiveMonths >= 12,
                    partialWaive: waiveMonths > 0 && waiveMonths < 12,
                  },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", background: row.waived ? "#fef2f2" : row.partialWaive ? "#fffbeb" : i % 2 === 0 ? "#fafaf9" : "transparent", borderRadius: 6, opacity: row.waived ? 0.6 : 1 }}>
                    <span style={{ textDecoration: row.waived ? "line-through" : "none" }}>
                      {row.label}
                      {row.partialWaive && <span style={{ color: "#d97706", fontSize: 10, fontWeight: 700 }}> ({waiveMonths} mo waived)</span>}
                    </span>
                    <strong style={{ color: row.waived ? "#e11d48" : row.partialWaive ? "#d97706" : "#3f3f46" }}>{row.waived ? "Waived" : fmtUSD(row.value)}</strong>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* ─── RESPONSIVE OVERRIDE (stack on narrow) ─────── */}
        <style>{`
          @media (max-width: 860px) {
            div[style*="gridTemplateColumns: 1fr 380px"] {
              grid-template-columns: 1fr !important;
            }
            div[style*="gridTemplateColumns: 1fr 1fr 1fr"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* INSTRUCTIONS & LOGIC REFERENCE (Collapsible)              */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div style={{ maxWidth: 1120, margin: "48px auto 0" }}>

          {/* Toggle Button */}
          <div
            onClick={() => setShowInstructions(!showInstructions)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "16px 28px",
              borderRadius: showInstructions ? "16px 16px 0 0" : 16,
              background: showInstructions ? "linear-gradient(135deg, #1c1917, #292524)" : "#fff",
              color: showInstructions ? "#fafaf9" : "#27272a",
              cursor: "pointer",
              userSelect: "none",
              boxShadow: "0 2px 24px rgba(0,0,0,0.05), 0 0.5px 2px rgba(0,0,0,0.06)",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              if (!showInstructions) {
                e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,0,0,0.09)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!showInstructions) {
                e.currentTarget.style.boxShadow = "0 2px 24px rgba(0,0,0,0.05), 0 0.5px 2px rgba(0,0,0,0.06)";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.3 }}>Instructions & Scoring Logic</span>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: "transform 0.3s", transform: showInstructions ? "rotate(180deg)" : "rotate(0)" }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>

          {/* Collapsible Content */}
          <div style={{
            maxHeight: showInstructions ? 5000 : 0,
            overflow: "hidden",
            transition: "max-height 0.5s ease-in-out",
          }}>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
              padding: "28px 0 0",
              background: "transparent",
            }}>

          {/* ─── DEAL VALUE ─────────────────────────────────── */}
          <Card accent="linear-gradient(90deg, #f97316, #fb923c)">
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>1. Deal Value Calculation</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Model 1 */}
              <div style={{ background: "#fafaf9", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f97316", marginBottom: 8 }}>Model 1: Per Ticket</div>
                <div style={{ fontSize: 12, color: "#52525b", lineHeight: 1.8 }}>
                  <div><strong>Variable Value</strong> = Online Ticket Volume × Convenience Fee</div>
                  <div><strong>Fixed Fees</strong> = Implementation Fee + (Monthly Fee × 12)</div>
                  <div style={{ marginTop: 6, padding: "6px 10px", background: "#fff7ed", borderRadius: 8, fontWeight: 600, color: "#ea580c" }}>
                    Deal Value = Variable Value + Fixed Fees
                  </div>
                </div>
              </div>
              {/* Model 2 */}
              <div style={{ background: "#fafaf9", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f97316", marginBottom: 8 }}>Model 2: GMV Revenue Share</div>
                <div style={{ fontSize: 12, color: "#52525b", lineHeight: 1.8 }}>
                  <div><strong>Variable Value</strong> = (GMV − Revenue) × Revenue Share %</div>
                  <div><strong>Fixed Fees</strong> = Implementation Fee + (Monthly Fee × 12)</div>
                  <div style={{ marginTop: 6, padding: "6px 10px", background: "#fff7ed", borderRadius: 8, fontWeight: 600, color: "#ea580c" }}>
                    Deal Value = Variable Value + Fixed Fees
                  </div>
                </div>
              </div>
            </div>

            {/* Fee Defaults */}
            <div style={{ marginTop: 16, padding: "14px 18px", background: "#f4f4f5", borderRadius: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#71717a", marginBottom: 8 }}>Default Fee Structure</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { label: "Implementation Fee", value: "150 USD", note: "One-time" },
                  { label: "Monthly Fee", value: "60 USD/mo", note: "× 12 months = 720 USD" },
                  { label: "Convenience Fee", value: "0.3 USD/ticket", note: "Or 3% Rev Share" },
                ].map((f, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 0.5 }}>{f.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#27272a", marginTop: 2 }}>{f.value}</div>
                    <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>{f.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Flexibility */}
            <div style={{ marginTop: 16, padding: "14px 18px", background: "#fef2f2", borderRadius: 12, border: "1px solid #fecdd3" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e11d48", marginBottom: 6 }}>Pricing Flexibility & Waivers</div>
              <div style={{ fontSize: 12, color: "#52525b", lineHeight: 1.8 }}>
                <div>• <strong>Custom Pricing</strong> — Toggle on to override any fee component (Implementation, Monthly, Convenience/Revenue Share)</div>
                <div>• <strong>Waive Implementation Fee</strong> — Fully waive the one-time implementation fee</div>
                <div>• <strong>Waive Monthly Fee</strong> — Select 0–12 months to waive (partial or full waiver)</div>
                <div>• <strong>Waive Convenience Fee / Revenue Share</strong> — Fully waive the variable fee component</div>
                <div style={{ marginTop: 4, fontStyle: "italic", color: "#71717a" }}>Philippines: Monthly Fee is fixed at 30 USD/mo</div>
              </div>
            </div>
          </Card>

          {/* ─── SCORING: TICKET VOLUME ─────────────────────── */}
          <Card accent="#a855f7">
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>2. Online Ticket Volume Score</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Group A */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#a855f7", marginBottom: 10 }}>Group A — Thailand, Indonesia, Vietnam, Cambodia</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e4e4e7" }}>
                      <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, color: "#71717a", fontSize: 11, textTransform: "uppercase" }}>Ticket Volume</th>
                      <th style={{ textAlign: "center", padding: "6px 8px", fontWeight: 700, color: "#71717a", fontSize: 11, textTransform: "uppercase" }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["≤ 3,000", "0"],
                      ["3,001 – 10,000", "2"],
                      ["> 10,000", "3"],
                    ].map(([range, score], i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f4f4f5" }}>
                        <td style={{ padding: "8px" }}>{range}</td>
                        <td style={{ padding: "8px", textAlign: "center", fontWeight: 700, color: "#a855f7" }}>{score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Group B */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#a855f7", marginBottom: 10 }}>Group B — Philippines, Laos, EMEA, Rest of World</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e4e4e7" }}>
                      <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, color: "#71717a", fontSize: 11, textTransform: "uppercase" }}>Ticket Volume</th>
                      <th style={{ textAlign: "center", padding: "6px 8px", fontWeight: 700, color: "#71717a", fontSize: 11, textTransform: "uppercase" }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["≤ 500", "0"],
                      ["501 – 5,000", "1"],
                      ["> 5,000", "3"],
                    ].map(([range, score], i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f4f4f5" }}>
                        <td style={{ padding: "8px" }}>{range}</td>
                        <td style={{ padding: "8px", textAlign: "center", fontWeight: 700, color: "#a855f7" }}>{score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* ─── SCORING: DEAL VALUE ────────────────────────── */}
          <Card accent="#14b8a6">
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>3. Deal Value Score</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Group A */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#14b8a6", marginBottom: 10 }}>Group A — Thailand, Indonesia, Vietnam, Cambodia</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e4e4e7" }}>
                      <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, color: "#71717a", fontSize: 11, textTransform: "uppercase" }}>Deal Value (USD)</th>
                      <th style={{ textAlign: "center", padding: "6px 8px", fontWeight: 700, color: "#71717a", fontSize: 11, textTransform: "uppercase" }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["< 1,200", "0"],
                      ["1,200 – 2,900", "1"],
                      ["2,901 – 4,999", "2"],
                      ["5,000 – 9,999", "3"],
                      ["≥ 10,000", "5"],
                    ].map(([range, score], i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f4f4f5" }}>
                        <td style={{ padding: "8px" }}>{range}</td>
                        <td style={{ padding: "8px", textAlign: "center", fontWeight: 700, color: "#14b8a6" }}>{score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Group B */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#14b8a6", marginBottom: 10 }}>Group B — Philippines, Laos, EMEA, Rest of World</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e4e4e7" }}>
                      <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, color: "#71717a", fontSize: 11, textTransform: "uppercase" }}>Deal Value (USD)</th>
                      <th style={{ textAlign: "center", padding: "6px 8px", fontWeight: 700, color: "#71717a", fontSize: 11, textTransform: "uppercase" }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["≤ 1,000", "1"],
                      ["1,001 – 4,999", "3"],
                      ["≥ 5,000", "5"],
                    ].map(([range, score], i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f4f4f5" }}>
                        <td style={{ padding: "8px" }}>{range}</td>
                        <td style={{ padding: "8px", textAlign: "center", fontWeight: 700, color: "#14b8a6" }}>{score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* ─── SCORING: OPERATOR TYPE & BONUS ─────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <Card accent="#f97316">
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>4. Operator Type Score</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e4e4e7" }}>
                    <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, color: "#71717a", fontSize: 11, textTransform: "uppercase" }}>Type</th>
                    <th style={{ textAlign: "center", padding: "6px 8px", fontWeight: 700, color: "#71717a", fontSize: 11, textTransform: "uppercase" }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Operator", "2"],
                    ["Agency", "0"],
                  ].map(([type, score], i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f4f4f5" }}>
                      <td style={{ padding: "8px" }}>{type}</td>
                      <td style={{ padding: "8px", textAlign: "center", fontWeight: 700, color: "#f97316" }}>{score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card accent="#7c3aed">
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>5. Top Route Bonus</div>
              <div style={{ fontSize: 12, color: "#52525b", lineHeight: 1.8, marginBottom: 12 }}>
                <div style={{ padding: "8px 12px", background: "#f5f3ff", borderRadius: 8, marginBottom: 8 }}>
                  <strong style={{ color: "#7c3aed" }}>+1 point</strong> if the operator runs a route in the <strong>Top 10 Best Selling Routes on Travelier</strong>
                </div>
                <div style={{ padding: "8px 12px", background: "#fef2f2", borderRadius: 8, border: "1px solid #fecdd3" }}>
                  <strong style={{ color: "#e11d48" }}>Not applicable for Thailand</strong> — this bonus is available for all other markets only
                </div>
              </div>
            </Card>
          </div>

          {/* ─── FINAL SEGMENT LOGIC ────────────────────────── */}
          <Card accent="linear-gradient(90deg, #16a34a, #22c55e)">
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>6. Final Segment Calculation</div>

            {/* Formula */}
            <div style={{ padding: "14px 18px", background: "#f0fdf4", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#16a34a", marginBottom: 8 }}>Total Score Formula</div>
              <div style={{ fontSize: 13, color: "#27272a", fontWeight: 600, lineHeight: 1.8 }}>
                <div>Total Score = Ticket Volume Score + Deal Value Score + Operator Type Score + Top Route Bonus*</div>
                <div style={{ fontSize: 11, color: "#71717a", fontStyle: "italic" }}>* Top Route Bonus applies to all markets except Thailand</div>
              </div>
            </div>

            {/* Segment thresholds */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
              {[
                { segment: "High", rule: "≥ 7 points", color: "#16a34a", bg: "#dcfce7" },
                { segment: "Mid-High", rule: "Medium + Deal > 5K", color: "#0d9488", bg: "#ccfbf1" },
                { segment: "Medium", rule: "4 – 6 points", color: "#d97706", bg: "#fef9c3" },
                { segment: "Low", rule: "< 4 points", color: "#e11d48", bg: "#ffe4e6" },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, borderRadius: 12, padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.segment}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: s.color, marginTop: 4 }}>{s.rule}</div>
                </div>
              ))}
            </div>

            {/* Overrides */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div style={{ padding: "14px 18px", background: "#f0fdf4", borderRadius: 12, border: "1.5px solid #bbf7d0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", marginBottom: 6 }}>Marquee Brand Override</div>
                <div style={{ fontSize: 12, color: "#52525b", lineHeight: 1.7 }}>
                  If <strong>Marquee Brand = Yes</strong>, segment is automatically set to <strong style={{ color: "#16a34a" }}>High</strong> regardless of total score.
                </div>
              </div>
              <div style={{ padding: "14px 18px", background: "#ecfdf5", borderRadius: 12, border: "1.5px solid #99f6e4" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0d9488", marginBottom: 6 }}>Mid-High Override</div>
                <div style={{ fontSize: 12, color: "#52525b", lineHeight: 1.7 }}>
                  If an <strong>Operator</strong> scores <strong>Medium</strong> (4–6 pts) but has <strong>Deal Value {'>'} 5,000 USD</strong>, segment upgrades to <strong style={{ color: "#0d9488" }}>Mid-High</strong>.
                </div>
              </div>
              <div style={{ padding: "14px 18px", background: "#fafaf9", borderRadius: 12, border: "1.5px solid #e4e4e7" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 6 }}>Score Range</div>
                <div style={{ fontSize: 12, color: "#52525b", lineHeight: 1.7 }}>
                  <div>Thailand: <strong>0 – 10 points</strong> (no route bonus)</div>
                  <div>Other markets: <strong>0 – 11 points</strong> (with route bonus)</div>
                </div>
              </div>
            </div>
          </Card>

          {/* ─── QUICK REFERENCE EXAMPLE ────────────────────── */}
          <Card accent="linear-gradient(90deg, #3b82f6, #60a5fa)">
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>7. Quick Examples</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div style={{ background: "#eff6ff", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6", marginBottom: 10 }}>Scenario: Thai Operator</div>
                <div style={{ fontSize: 12, color: "#52525b", lineHeight: 2 }}>
                  <div>Country: <strong>Thailand</strong> (Group A)</div>
                  <div>Ticket Volume: <strong>15,000</strong> → <strong style={{ color: "#a855f7" }}>3 pts</strong></div>
                  <div>Deal Value: <strong>5,270 USD</strong> → <strong style={{ color: "#14b8a6" }}>3 pts</strong></div>
                  <div>Operator Type: <strong>Operator</strong> → <strong style={{ color: "#f97316" }}>2 pts</strong></div>
                  <div>Top Route Bonus: <strong>N/A</strong></div>
                  <div style={{ marginTop: 6, padding: "6px 10px", background: "#dcfce7", borderRadius: 8, fontWeight: 700, color: "#16a34a" }}>
                    Total = 8 → Segment: High
                  </div>
                </div>
              </div>
              <div style={{ background: "#eff6ff", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6", marginBottom: 10 }}>Scenario: Mid-High Upgrade</div>
                <div style={{ fontSize: 12, color: "#52525b", lineHeight: 2 }}>
                  <div>Country: <strong>Indonesia</strong> (Group A)</div>
                  <div>Ticket Volume: <strong>8,000</strong> → <strong style={{ color: "#a855f7" }}>2 pts</strong></div>
                  <div>Deal Value: <strong>6,200 USD</strong> → <strong style={{ color: "#14b8a6" }}>3 pts</strong></div>
                  <div>Operator Type: <strong>Operator</strong> → <strong style={{ color: "#f97316" }}>2 pts</strong></div>
                  <div>Score = 7 → High? No wait...</div>
                  <div style={{ marginTop: 6, padding: "6px 10px", background: "#dcfce7", borderRadius: 8, fontWeight: 700, color: "#16a34a" }}>
                    Total = 7 → Segment: High
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: "#71717a", fontStyle: "italic" }}>
                    But if ticket volume was 2,000 (0 pts) → Total = 5 → Medium → Deal {'>'} 5K → <strong style={{ color: "#0d9488" }}>Mid-High</strong>
                  </div>
                </div>
              </div>
              <div style={{ background: "#eff6ff", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6", marginBottom: 10 }}>Scenario: Vietnam Agency</div>
                <div style={{ fontSize: 12, color: "#52525b", lineHeight: 2 }}>
                  <div>Country: <strong>Vietnam</strong> (Group A)</div>
                  <div>Ticket Volume: <strong>2,000</strong> → <strong style={{ color: "#a855f7" }}>0 pts</strong></div>
                  <div>Deal Value: <strong>3,500 USD</strong> → <strong style={{ color: "#14b8a6" }}>2 pts</strong></div>
                  <div>Operator Type: <strong>Agency</strong> → <strong style={{ color: "#f97316" }}>0 pts</strong></div>
                  <div>Top Route Bonus: <strong>Yes</strong> → <strong style={{ color: "#7c3aed" }}>1 pt</strong></div>
                  <div style={{ marginTop: 6, padding: "6px 10px", background: "#ffe4e6", borderRadius: 8, fontWeight: 700, color: "#e11d48" }}>
                    Total = 3 → Segment: Low
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: "#71717a", fontStyle: "italic" }}>
                    Agency with deal {'>'} 5K stays Medium (Mid-High is Operator only)
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Footer */}
          <div style={{ textAlign: "center", padding: "20px 0 10px", fontSize: 11, color: "#a1a1aa" }}>
            SeatOS BD Deal Calculator — Internal Tool for Business Development Team
          </div>
            </div>
          </div>
        </div>

        {/* ─── RESPONSIVE OVERRIDE (stack on narrow) ─────── */}
        <style>{`
          @media (max-width: 860px) {
            div[style*="gridTemplateColumns: 1fr 380px"] {
              grid-template-columns: 1fr !important;
            }
            div[style*="gridTemplateColumns: 1fr 1fr 1fr"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}
