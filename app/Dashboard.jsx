import { useState, useEffect } from "react";

/* ─── Constants ─── */
const FIXED_SETUP = 50;
const FIXED_MONTHLY = 60;
const FIXED_MONTHS = 12;
const DEFAULT_PER_TICKET_RATE = 0.3;
const DEFAULT_GMV_SHARE_RATE = 3; // stored as %, displayed as %

/* ─── Country Segmentation Config ─── */
const COUNTRY_SEGMENTS = {
  Thailand: {
    flag: "🇹🇭",
    tiers: [
      { name: "High", min: 10000 },
      { name: "Mid-high", min: 5000 },
      { name: "Mid-low", min: 3000 },
      { name: "Low", min: 0 },
    ],
  },
  Indonesia: { flag: "🇮🇩", inherits: "Thailand" },
  Vietnam: { flag: "🇻🇳", inherits: "Thailand" },
  Cambodia: { flag: "🇰🇭", inherits: "Thailand" },
  Laos: {
    flag: "🇱🇦",
    tiers: [
      { name: "High", min: 3000 },
      { name: "Medium", min: 2000 },
      { name: "Low", min: 0 },
    ],
  },
  Philippines: {
    flag: "🇵🇭",
    tiers: [
      { name: "High", min: 5000 },
      { name: "Mid-high", min: 2500 },
      { name: "Mid-low", min: 1500 },
      { name: "Low", min: 0 },
    ],
  },
  EMEA: { flag: "🌍", inherits: "Laos" },
};

function resolveTiers(country) {
  const cfg = COUNTRY_SEGMENTS[country];
  if (!cfg) return [];
  if (cfg.inherits) return COUNTRY_SEGMENTS[cfg.inherits].tiers;
  return cfg.tiers;
}

const TIER_STYLES = {
  High: { color: "#0E6245", bg: "#E6F5EE", border: "#9DD4B8" },
  "Mid-high": { color: "#1A5E9A", bg: "#E6F0FA", border: "#8FC1E8" },
  "Mid-low": { color: "#8A6512", bg: "#FFF8E6", border: "#E4D07A" },
  Medium: { color: "#1A5E9A", bg: "#E6F0FA", border: "#8FC1E8" },
  Low: { color: "#A13333", bg: "#FDF0F0", border: "#E6AAAA" },
};

function getSegment(totalDealValue, isMarquee, country) {
  const tiers = resolveTiers(country);
  if (!tiers.length) return null;
  if (isMarquee) {
    return {
      name: "High",
      ...TIER_STYLES["High"],
      reason: "Marquee brand override — automatically assigned High regardless of deal value or country",
    };
  }
  for (const tier of tiers) {
    if (totalDealValue >= tier.min) {
      const style = TIER_STYLES[tier.name] || TIER_STYLES["Low"];
      const reason =
        tier.min > 0
          ? `Deal value $${fmt(totalDealValue)} meets the $${fmt(tier.min)} threshold for ${country}`
          : `Deal value $${fmt(totalDealValue)} is below the minimum tier threshold for ${country}`;
      return { name: tier.name, ...style, reason };
    }
  }
  return null;
}

function fmt(n) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ─── UI Components ─── */
function NumberInput({ label, value, onChange, prefix, suffix, help, highlighted }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={styles.inputLabel}>{label}</label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: `1.5px solid ${highlighted ? "#E8920D" : focused ? "#3A6FD8" : "#D4D8DE"}`,
          borderRadius: 8,
          background: highlighted ? "#FFFBF2" : "#fff",
          transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
          boxShadow: focused ? "0 0 0 3px rgba(58,111,216,0.08)" : "none",
          overflow: "hidden",
        }}
      >
        {prefix && <span style={styles.inputAffix}>{prefix}</span>}
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="0"
          style={{ ...styles.inputField, paddingLeft: prefix ? 4 : 14 }}
        />
        {suffix && (
          <span style={{ ...styles.inputAffix, paddingRight: 14, paddingLeft: 0, fontSize: 12 }}>{suffix}</span>
        )}
      </div>
      {help && <div style={styles.helpText}>{help}</div>}
    </div>
  );
}

function Toggle({ label, value, onChange, description }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        background: value ? "#EFF5FF" : "#F8F9FA",
        borderRadius: 10,
        border: `1.5px solid ${value ? "#3A6FD8" : "#E5E7EB"}`,
        cursor: "pointer",
        transition: "all 0.2s",
        marginBottom: 6,
      }}
      onClick={() => onChange(!value)}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: value ? "#2A54A0" : "#4B5563", fontFamily: "'DM Sans', sans-serif" }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
          {description}
        </div>
      </div>
      <div
        style={{
          width: 42, height: 24, borderRadius: 12,
          background: value ? "#3A6FD8" : "#CDD1D8",
          position: "relative", transition: "background 0.25s",
          flexShrink: 0, marginLeft: 16,
        }}
      >
        <div
          style={{
            width: 18, height: 18, borderRadius: 9, background: "#fff",
            position: "absolute", top: 3, left: value ? 21 : 3,
            transition: "left 0.25s cubic-bezier(.4,0,.2,1)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
          }}
        />
      </div>
    </div>
  );
}

function DiscountToggle({ value, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        background: value ? "#FFF7ED" : "#F8F9FA",
        borderRadius: 10,
        border: `1.5px solid ${value ? "#E8920D" : "#E5E7EB"}`,
        cursor: "pointer",
        transition: "all 0.2s",
        marginBottom: 6,
      }}
      onClick={() => onChange(!value)}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: value ? "#A0620A" : "#4B5563", fontFamily: "'DM Sans', sans-serif" }}>
          Custom Discount
        </div>
        <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
          {value ? "Override default rate with a discounted rate" : "Using standard pricing rates"}
        </div>
      </div>
      <div
        style={{
          width: 42, height: 24, borderRadius: 12,
          background: value ? "#E8920D" : "#CDD1D8",
          position: "relative", transition: "background 0.25s",
          flexShrink: 0, marginLeft: 16,
        }}
      >
        <div
          style={{
            width: 18, height: 18, borderRadius: 9, background: "#fff",
            position: "absolute", top: 3, left: value ? 21 : 3,
            transition: "left 0.25s cubic-bezier(.4,0,.2,1)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
          }}
        />
      </div>
    </div>
  );
}

function CountrySelector({ value, onChange }) {
  const countries = Object.keys(COUNTRY_SEGMENTS);
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={styles.inputLabel}>Country / Region</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {countries.map((c) => {
          const active = value === c;
          const cfg = COUNTRY_SEGMENTS[c];
          return (
            <button
              key={c}
              onClick={() => onChange(c)}
              style={{
                padding: "8px 14px", borderRadius: 8,
                border: `1.5px solid ${active ? "#3A6FD8" : "#E0E3E8"}`,
                background: active ? "#EFF5FF" : "#fff",
                color: active ? "#2A54A0" : "#4B5563",
                fontWeight: active ? 700 : 500, fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: 16 }}>{cfg.flag}</span>
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FormulaLine({ label, formula, result, highlight, discounted }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "8px 0",
        borderBottom: highlight ? "none" : "1px solid #F0F1F3",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: highlight ? 700 : 500,
            color: highlight ? "#1A1F26" : "#5A6370",
            fontFamily: "'DM Sans', sans-serif",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          {label}
          {discounted && (
            <span style={{
              fontSize: 9, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.06em", color: "#A0620A",
              background: "#FFF3E0", padding: "2px 7px", borderRadius: 4,
            }}>
              Discounted
            </span>
          )}
        </span>
        {formula && (
          <span
            style={{
              fontSize: 11, color: "#9CA3AF",
              fontFamily: "'DM Mono', monospace",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}
          >
            {formula}
          </span>
        )}
      </div>
      <span
        style={{
          fontSize: highlight ? 18 : 14,
          fontWeight: highlight ? 800 : 600,
          color: highlight ? "#1A1F26" : "#374151",
          fontFamily: "'DM Mono', monospace",
          marginLeft: 16, whiteSpace: "nowrap",
        }}
      >
        ${fmt(result)}
      </span>
    </div>
  );
}

function SegmentBadge({ segment }) {
  return (
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "7px 18px", borderRadius: 20,
        background: segment.bg, border: `1.5px solid ${segment.border}`,
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: 4, background: segment.color }} />
      <span style={{ fontWeight: 700, fontSize: 14, color: segment.color, fontFamily: "'DM Sans', sans-serif" }}>
        {segment.name}
      </span>
    </div>
  );
}

function ThresholdsReference({ country }) {
  const tiers = resolveTiers(country);
  const cfg = COUNTRY_SEGMENTS[country];
  const inheritsFrom = cfg?.inherits;
  return (
    <div style={{ ...styles.card, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
      <div style={{ ...styles.sectionLabel, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <span>Thresholds for {country}</span>
        {inheritsFrom && (
          <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500, fontStyle: "italic" }}>
            (same as {inheritsFrom})
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {tiers.map((t, i) => {
          const st = TIER_STYLES[t.name] || TIER_STYLES["Low"];
          const nextMin = i > 0 ? tiers[i - 1].min - 1 : null;
          const rangeLabel =
            t.min > 0 && nextMin !== null
              ? `$${fmt(t.min)} – $${fmt(nextMin)}`
              : t.min > 0
              ? `≥ $${fmt(t.min)}`
              : nextMin !== null
              ? `< $${fmt(nextMin + 1)}`
              : "—";
          return (
            <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
              <div style={{ width: 7, height: 7, borderRadius: 4, background: st.color, flexShrink: 0 }} />
              <span style={{ fontWeight: 600, color: st.color, width: 62, fontFamily: "'DM Sans', sans-serif" }}>
                {t.name}
              </span>
              <span style={{ color: "#8B95A5", fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{rangeLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function DealSegmentationDashboard() {
  const [model, setModel] = useState("ticket");
  const [country, setCountry] = useState("Thailand");
  const [ticketVolume, setTicketVolume] = useState("");
  const [revenue, setRevenue] = useState("");
  const [gmv, setGmv] = useState("");
  const [marquee, setMarquee] = useState(false);
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [customTicketRate, setCustomTicketRate] = useState("");
  const [customGmvRate, setCustomGmvRate] = useState("");

  const ticketNum = parseFloat(ticketVolume) || 0;
  const revenueNum = parseFloat(revenue) || 0;
  const gmvNum = parseFloat(gmv) || 0;
  const fixedFees = FIXED_SETUP + FIXED_MONTHLY * FIXED_MONTHS;

  // Resolve effective rates
  const effectiveTicketRate =
    discountEnabled && customTicketRate !== ""
      ? parseFloat(customTicketRate) || 0
      : DEFAULT_PER_TICKET_RATE;
  const effectiveGmvRate =
    discountEnabled && customGmvRate !== ""
      ? (parseFloat(customGmvRate) || 0) / 100
      : DEFAULT_GMV_SHARE_RATE / 100;

  const isDiscountedTicket = discountEnabled && customTicketRate !== "" && effectiveTicketRate !== DEFAULT_PER_TICKET_RATE;
  const isDiscountedGmv = discountEnabled && customGmvRate !== "" && effectiveGmvRate !== DEFAULT_GMV_SHARE_RATE / 100;

  let variableRevenue, totalDealValue, revenueShareBase;
  if (model === "ticket") {
    variableRevenue = ticketNum * effectiveTicketRate;
    totalDealValue = variableRevenue + fixedFees;
  } else {
    revenueShareBase = gmvNum - revenueNum;
    variableRevenue = revenueShareBase * effectiveGmvRate;
    totalDealValue = variableRevenue + fixedFees;
  }

  const segment = getSegment(totalDealValue, marquee, country);
  const hasInput = model === "ticket" ? ticketNum > 0 : gmvNum > 0;

  const errors = [];
  if (model === "ticket" && ticketVolume && ticketNum < 0) errors.push("Ticket volume cannot be negative.");
  if (model === "gmv") {
    if (gmv && gmvNum < 0) errors.push("GMV cannot be negative.");
    if (revenue && revenueNum < 0) errors.push("Revenue cannot be negative.");
    if (gmvNum > 0 && revenueNum > gmvNum) errors.push("Revenue cannot exceed GMV.");
  }
  if (discountEnabled) {
    if (model === "ticket" && customTicketRate !== "" && parseFloat(customTicketRate) < 0)
      errors.push("Discounted fee per ticket cannot be negative.");
    if (model === "ticket" && customTicketRate !== "" && parseFloat(customTicketRate) > DEFAULT_PER_TICKET_RATE)
      errors.push(`Discounted rate ($${customTicketRate}) exceeds standard rate ($${DEFAULT_PER_TICKET_RATE}).`);
    if (model === "gmv" && customGmvRate !== "" && parseFloat(customGmvRate) < 0)
      errors.push("Discounted GMV rate cannot be negative.");
    if (model === "gmv" && customGmvRate !== "" && parseFloat(customGmvRate) > DEFAULT_GMV_SHARE_RATE)
      errors.push(`Discounted rate (${customGmvRate}%) exceeds standard rate (${DEFAULT_GMV_SHARE_RATE}%).`);
  }

  const showResult = hasInput && errors.length === 0;

  useEffect(() => {
    setTicketVolume("");
    setRevenue("");
    setGmv("");
    setMarquee(false);
    setDiscountEnabled(false);
    setCustomTicketRate("");
    setCustomGmvRate("");
  }, [model]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(168deg, #F5F7FB 0%, #EDEEF4 50%, #F3F1ED 100%)",
        fontFamily: "'DM Sans', sans-serif",
        padding: "28px 16px",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&family=Fraunces:opsz,wght@9..144,700;9..144,800;9..144,900&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div style={{ maxWidth: 540, margin: "0 auto 24px", textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "#fff", padding: "5px 14px", borderRadius: 18,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)", marginBottom: 14,
            fontSize: 11, fontWeight: 600, color: "#7B8290",
            letterSpacing: "0.05em", textTransform: "uppercase",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 3, background: "#3A6FD8" }} />
          Deal Calculator
        </div>
        <h1
          style={{
            fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 28,
            color: "#1A1F26", margin: 0, lineHeight: 1.2, letterSpacing: "-0.02em",
          }}
        >
          Deal Segmentation
        </h1>
        <p style={{ color: "#8B95A5", fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
          Calculate deal value per pricing model and auto-assign country-specific segments.
        </p>
      </div>

      <div style={{ maxWidth: 540, margin: "0 auto" }}>
        {/* Model Toggle */}
        <div
          style={{
            background: "#fff", borderRadius: 12, padding: 4,
            display: "flex", gap: 4, marginBottom: 20,
            boxShadow: "0 1px 5px rgba(0,0,0,0.04)",
          }}
        >
          {[
            { id: "ticket", label: "Per Ticket" },
            { id: "gmv", label: "Commission Percentage" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setModel(m.id)}
              style={{
                flex: 1, padding: "10px 16px", borderRadius: 9, border: "none",
                fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                fontWeight: model === m.id ? 700 : 500,
                color: model === m.id ? "#fff" : "#7B8290",
                background: model === m.id ? "#1A1F26" : "transparent",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Input Card */}
        <div style={{ ...styles.card, padding: "24px 22px", marginBottom: 16 }}>
          <div style={{ ...styles.sectionLabel, marginBottom: 18 }}>
            {model === "ticket" ? "Per Ticket Inputs" : "Commission Percentage Inputs"}
          </div>

          <CountrySelector value={country} onChange={setCountry} />

          {model === "ticket" ? (
            <NumberInput
              label="Online Ticket Volume"
              value={ticketVolume}
              onChange={setTicketVolume}
              suffix="tickets"
              help="Total number of tickets sold online"
            />
          ) : (
            <>
              <NumberInput label="GMV" value={gmv} onChange={setGmv} prefix="$" help="Gross Merchandise Value" />
              <NumberInput
                label="Revenue"
                value={revenue}
                onChange={setRevenue}
                prefix="$"
                help="Direct revenue (must not exceed GMV)"
              />
            </>
          )}

          <Toggle
            label="Marquee Brand"
            value={marquee}
            onChange={setMarquee}
            description={marquee ? "Overrides to High segment regardless of deal value" : "Segment determined by deal value and country"}
          />

          <div style={{ height: 8 }} />

          <DiscountToggle value={discountEnabled} onChange={setDiscountEnabled} />

          {/* Discount override inputs */}
          {discountEnabled && (
            <div
              style={{
                marginTop: 12,
                padding: "16px 18px",
                background: "#FFFBF2",
                border: "1px solid #F5DEB3",
                borderRadius: 10,
              }}
            >
              <div style={{ ...styles.sectionLabel, color: "#A0620A", marginBottom: 12 }}>
                Discount Override
              </div>

              {model === "ticket" ? (
                <NumberInput
                  label="Discounted Fee per Ticket"
                  value={customTicketRate}
                  onChange={setCustomTicketRate}
                  prefix="$"
                  suffix={`std: $${DEFAULT_PER_TICKET_RATE}`}
                  help={`Standard rate is $${DEFAULT_PER_TICKET_RATE} per ticket. Enter a lower rate to apply a discount.`}
                  highlighted
                />
              ) : (
                <NumberInput
                  label="Discounted Revenue Share Rate"
                  value={customGmvRate}
                  onChange={setCustomGmvRate}
                  suffix={`%  ·  std: ${DEFAULT_GMV_SHARE_RATE}%`}
                  help={`Standard rate is ${DEFAULT_GMV_SHARE_RATE}%. Enter a lower rate to apply a discount.`}
                  highlighted
                />
              )}

              {/* Discount summary */}
              {((model === "ticket" && customTicketRate !== "" && parseFloat(customTicketRate) >= 0 && parseFloat(customTicketRate) <= DEFAULT_PER_TICKET_RATE) ||
                (model === "gmv" && customGmvRate !== "" && parseFloat(customGmvRate) >= 0 && parseFloat(customGmvRate) <= DEFAULT_GMV_SHARE_RATE)) && (
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px", background: "#FFF3E0",
                    borderRadius: 6, fontSize: 12, color: "#A0620A",
                    fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <span style={{ fontSize: 14 }}>🏷</span>
                  {model === "ticket"
                    ? `${(((DEFAULT_PER_TICKET_RATE - effectiveTicketRate) / DEFAULT_PER_TICKET_RATE) * 100).toFixed(1)}% discount applied ($${DEFAULT_PER_TICKET_RATE} → $${effectiveTicketRate.toFixed(2)})`
                    : `${(((DEFAULT_GMV_SHARE_RATE / 100 - effectiveGmvRate) / (DEFAULT_GMV_SHARE_RATE / 100)) * 100).toFixed(1)}% discount applied (${DEFAULT_GMV_SHARE_RATE}% → ${(effectiveGmvRate * 100).toFixed(2)}%)`}
                </div>
              )}
            </div>
          )}

          {errors.length > 0 && (
            <div
              style={{
                background: "#FEF2F2", border: "1px solid #FECACA",
                borderRadius: 8, padding: "10px 14px", marginTop: 12,
              }}
            >
              {errors.map((e, i) => (
                <div key={i} style={{ fontSize: 12, color: "#DC2626", fontWeight: 500 }}>⚠ {e}</div>
              ))}
            </div>
          )}
        </div>

        {/* Result Card */}
        <div
          style={{
            ...styles.card,
            padding: showResult ? "24px 22px" : "18px 22px",
            boxShadow: showResult ? "0 4px 18px rgba(0,0,0,0.06)" : "0 1px 5px rgba(0,0,0,0.03)",
            opacity: showResult ? 1 : 0.45,
            transition: "all 0.3s",
            marginBottom: 16,
          }}
        >
          {!showResult ? (
            <div style={{ textAlign: "center", color: "#9CA3AF", fontSize: 13, padding: "8px 0" }}>
              Enter values above to see the calculation breakdown
            </div>
          ) : (
            <>
              <div style={{ ...styles.sectionLabel, marginBottom: 12 }}>Calculation Breakdown</div>

              {model === "gmv" && (
                <FormulaLine
                  label="Revenue Share Base"
                  formula={`$${fmt(gmvNum)} − $${fmt(revenueNum)}`}
                  result={revenueShareBase}
                />
              )}
              <FormulaLine
                label="Variable Revenue"
                formula={
                  model === "ticket"
                    ? `${fmt(ticketNum)} × $${effectiveTicketRate.toFixed(2)}`
                    : `$${fmt(revenueShareBase)} × ${(effectiveGmvRate * 100).toFixed(2)}%`
                }
                result={variableRevenue}
                discounted={model === "ticket" ? isDiscountedTicket : isDiscountedGmv}
              />
              <FormulaLine
                label="Fixed Fees"
                formula={`$${FIXED_SETUP} setup + ($${FIXED_MONTHLY} × ${FIXED_MONTHS} mo)`}
                result={fixedFees}
              />
              <div style={{ height: 1, background: "#E5E7EB", margin: "4px 0" }} />
              <FormulaLine
                label="Total Deal Value"
                formula={`$${fmt(variableRevenue)} + $${fmt(fixedFees)}`}
                result={totalDealValue}
                highlight
              />
            </>
          )}
        </div>

        {/* Segment Result */}
        {showResult && segment && (
          <div
            style={{
              background: segment.bg, border: `1.5px solid ${segment.border}`,
              borderRadius: 14, padding: 22,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
              animation: "fadeUp 0.3s ease-out", marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.08em", color: segment.color, opacity: 0.65,
              }}
            >
              Assigned Segment — {COUNTRY_SEGMENTS[country].flag} {country}
            </div>
            <SegmentBadge segment={segment} />
            <div
              style={{
                fontSize: 12, color: segment.color, opacity: 0.8,
                textAlign: "center", fontWeight: 500, lineHeight: 1.5, maxWidth: 360,
              }}
            >
              {segment.reason}
            </div>
          </div>
        )}

        {/* Thresholds Reference */}
        <ThresholdsReference country={country} />

        <div style={{ height: 28 }} />
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        input::placeholder { color: #C5CAD1; }
      `}</style>
    </div>
  );
}

/* ─── Shared Styles ─── */
const styles = {
  card: {
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  },
  sectionLabel: {
    fontSize: 10, fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.08em", color: "#9CA3AF",
    fontFamily: "'DM Sans', sans-serif",
  },
  inputLabel: {
    display: "block", fontSize: 12, fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "0.05em",
    color: "#5A6370", marginBottom: 6,
    fontFamily: "'DM Sans', sans-serif",
  },
  inputAffix: {
    padding: "10px 0 10px 14px", color: "#8B95A5",
    fontWeight: 500, fontSize: 14,
    fontFamily: "'DM Mono', monospace", userSelect: "none",
  },
  inputField: {
    flex: 1, border: "none", outline: "none",
    padding: "10px 14px", fontSize: 15,
    fontFamily: "'DM Mono', monospace", color: "#1A1F26",
    background: "transparent", width: "100%",
  },
  helpText: {
    fontSize: 11, color: "#9CA3AF", marginTop: 4,
    fontFamily: "'DM Sans', sans-serif",
  },
};
