import { useState, useMemo, useEffect, useRef } from "react";

// ─── Lead capture config ──────────────────────────────────────────────────────
// Replace LEAD_WEBHOOK_URL with your Zapier / Make.com / HubSpot webhook endpoint.
// Replace BOOKING_URL with your Calendly or Microsoft Bookings link.
const LEAD_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwcb3ONLg6Gr356ilKKnkBgwhNdKNmrKqEH7nsawHZQTJOX6hGXM4xctmXsjyGW12-X/exec";
const BOOKING_URL      = "https://calendly.com/indiaide-scheduling/30min";

// ─── Brand ────────────────────────────────────────────────────────────────────
const BRAND       = "#7a02b2";
const BRAND_LIGHT = "#F3E8FF";
const BRAND_BG    = "#FAF5FF";
const GREEN       = "#059669";
const GREEN_LIGHT = "#ECFDF5";
const AMBER       = "#D97706";
const AMBER_LIGHT = "#FFFBEB";
const BLUE        = "#0284C7";
const BLUE_LIGHT  = "#E0F2FE";
const SLATE       = "#475569";

// ─── All 51 states — Medicare rates (2026 CMS PFS NonFac) ─────────────────────
// Dual-coverage states also carry m* Medicaid rates (Q3 2026 verified fee schedules)
// m79=null → 98979 not separately covered under that state's Medicaid
const ALL_STATES = {
  "AK":{ name:"Alaska",             r75:22.78, r77:54.61, r79:32.43, r80:66.12, r81:52.46 },
  "AL":{ name:"Alabama",            r75:18.79, r77:44.90, r79:24.28, r80:49.62, r81:38.48 },
  "AR":{ name:"Arkansas",           r75:18.42, r77:44.07, r79:24.01, r80:49.06, r81:38.11 },
  "AZ":{ name:"Arizona",             r75:20.96, r77:49.81, r79:25.85, r80:52.96, r81:40.65,  m75:20.57, m77:45.33, m79:27.20, m80:53.00, m81:41.49 },
  "CA":{ name:"California",         r75:23.42, r77:56.19, r79:27.91, r80:57.11, r81:43.22 },
  "CO":{ name:"Colorado",           r75:22.91, r77:54.63, r79:27.44, r80:56.21, r81:42.72,  m75:16.89, m77:48.93, m79:0.66,  m80:42.98, m81:34.69 },
  "CT":{ name:"Connecticut",        r75:23.47, r77:55.44, r79:27.87, r80:57.23, r81:43.58 },
  "DC":{ name:"Washington D.C.",    r75:25.53, r77:60.57, r79:29.78, r80:61.11, r81:46.20,  m75:null,  m77:null,  m79:23.82, m80:null,  m81:null  },
  "DE":{ name:"Delaware",           r75:21.39, r77:50.79, r79:26.22, r80:53.72, r81:41.18,  m75:20.96, m77:38.78, m79:null,  m80:52.65, m81:40.36 },
  "FL":{ name:"Florida",            r75:21.12, r77:49.36, r79:25.86, r80:53.19, r81:41.04 },
  "GA":{ name:"Georgia",             r75:19.57, r77:45.98, r79:24.76, r80:50.80, r81:39.45,  m75:15.84, m77:45.67, m79:22.63, m80:41.09, m81:33.39 },
  "HI":{ name:"Hawaii",              r75:24.31, r77:58.30, r79:28.40, r80:58.13, r81:43.74,  m75:22.29, m77:49.24, m79:11.31, m80:30.07, m81:29.38 },
  "IA":{ name:"Iowa",               r75:19.52, r77:46.89, r79:24.85, r80:50.75, r81:39.11,  m75:20.05, m77:58.57, m79:null,  m80:54.47, m81:44.38 },
  "ID":{ name:"Idaho",              r75:19.68, r77:47.17, r79:24.95, r80:50.99, r81:39.29,  m75:null,  m77:null,  m79:null,  m80:37.00, m81:29.09 },
  "IL":{ name:"Illinois",           r75:20.70, r77:47.69, r79:25.47, r80:52.53, r81:40.83 },
  "IN":{ name:"Indiana",            r75:19.83, r77:47.54, r79:25.07, r80:51.23, r81:39.44,  m75:17.91, m77:39.52, m79:null,  m80:47.23, m81:37.06 },
  "KS":{ name:"Kansas",             r75:19.36, r77:46.37, r79:24.71, r80:50.50, r81:39.00 },
  "KY":{ name:"Kentucky",           r75:19.32, r77:45.74, r79:24.62, r80:50.43, r81:39.11,  m75:14.41, m77:31.66, m79:21.87, m80:34.74, m81:34.74 },
  "LA":{ name:"Louisiana",          r75:20.56, r77:48.47, r79:25.51, r80:52.33, r81:40.37 },
  "MA":{ name:"Massachusetts",      r75:25.72, r77:61.31, r79:29.82, r80:61.13, r81:46.03,  m75:15.13, m77:39.57, m79:null,  m80:37.41, m81:29.66 },
  "MD":{ name:"Maryland",           r75:21.91, r77:52.02, r79:26.65, r80:54.62, r81:41.78 },
  "ME":{ name:"Maine",              r75:19.77, r77:47.22, r79:25.00, r80:51.14, r81:39.44,  m75:14.31, m77:34.19, m79:18.10, m80:37.03, m81:28.55 },
  "MI":{ name:"Michigan",           r75:19.97, r77:47.03, r79:25.06, r80:51.42, r81:39.80,  m75:13.85, m77:32.80, m79:16.83, m80:34.51, m81:26.41 },
  "MN":{ name:"Minnesota",          r75:21.85, r77:52.68, r79:26.61, r80:54.34, r81:41.29,  m75:16.72, m77:40.39, m79:20.32, m80:41.68, m81:31.64 },
  "MO":{ name:"Missouri",           r75:18.79, r77:44.38, r79:24.21, r80:49.61, r81:38.63 },
  "MS":{ name:"Mississippi",        r75:18.61, r77:44.25, r79:24.12, r80:49.34, r81:38.37,  m75:16.75, m77:31.02, m79:21.71, m80:44.41, m81:34.53 },
  "MT":{ name:"Montana",            r75:21.71, r77:51.44, r79:26.39, r80:54.11, r81:41.42,  m75:27.70, m77:60.40, m79:35.87, m80:70.34, m81:54.90 },
  "NC":{ name:"North Carolina",     r75:20.06, r77:47.89, r79:25.21, r80:51.58, r81:39.71,  m75:15.40, m77:44.43, m79:null,  m80:41.25, m81:33.73 },
  "ND":{ name:"North Dakota",       r75:21.31, r77:51.24, r79:26.19, r80:53.51, r81:40.82 },
  "NE":{ name:"Nebraska",           r75:19.67, r77:47.29, r79:24.97, r80:50.99, r81:39.25,  m75:42.76, m77:null,  m79:null,  m80:null,  m81:null  },
  "NH":{ name:"New Hampshire",      r75:22.49, r77:53.49, r79:26.99, r80:55.31, r81:42.11,  m75:19.03, m77:53.30, m79:null,  m80:48.54, m81:39.30 },
  "NJ":{ name:"New Jersey",         r75:23.71, r77:56.17, r79:28.28, r80:58.02, r81:44.17,  m75:10.36, m77:22.60, m79:5.64,  m80:25.71, m81:19.94 },
  "NM":{ name:"New Mexico",         r75:20.10, r77:47.26, r79:25.15, r80:51.62, r81:39.96,  m75:27.02, m77:63.46, m79:null,  m80:71.11, m81:56.79 },
  "NV":{ name:"Nevada",             r75:21.62, r77:51.43, r79:26.35, r80:53.97, r81:41.27 },
  "NY":{ name:"New York",           r75:25.51, r77:59.91, r79:29.79, r80:61.27, r81:46.55 },
  "OH":{ name:"Ohio",               r75:19.89, r77:46.99, r79:25.02, r80:51.30, r81:39.68,  m75:13.84, m77:39.56, m79:null,  m80:37.22, m81:30.62 },
  "OK":{ name:"Oklahoma",           r75:19.31, r77:45.89, r79:24.63, r80:50.42, r81:39.05 },
  "OR":{ name:"Oregon",             r75:23.88, r77:57.02, r79:28.21, r80:57.78, r81:43.71,  m75:null,  m77:null,  m79:21.35, m80:null,  m81:null  },
  "PA":{ name:"Pennsylvania",       r75:22.70, r77:53.60, r79:27.28, r80:56.00, r81:42.80 },
  "RI":{ name:"Rhode Island",       r75:22.33, r77:53.09, r79:27.07, r80:55.46, r81:42.36,  m75:11.56, m77:33.23, m79:7.02,  m80:29.93, m81:24.36 },
  "SC":{ name:"South Carolina",     r75:20.01, r77:47.50, r79:25.14, r80:51.50, r81:39.74 },
  "SD":{ name:"South Dakota",       r75:21.27, r77:51.22, r79:26.16, r80:53.44, r81:40.75 },
  "TN":{ name:"Tennessee",          r75:19.49, r77:46.63, r79:24.80, r80:50.70, r81:39.13 },
  "TX":{ name:"Texas",              r75:22.85, r77:54.36, r79:27.28, r80:55.92, r81:42.51 },
  "UT":{ name:"Utah",               r75:20.38, r77:48.34, r79:25.41, r80:52.06, r81:40.11,  m75:null,  m77:null,  m79:null,  m80:40.87, m81:31.49 },
  "VA":{ name:"Virginia",           r75:21.16, r77:50.47, r79:26.02, r80:53.26, r81:40.78,  m75:18.81, m77:44.56, m79:null,  m80:46.88, m81:35.88 },
  "VT":{ name:"Vermont",            r75:21.17, r77:50.76, r79:26.06, r80:53.29, r81:40.72 },
  "WA":{ name:"Washington",         r75:26.37, r77:62.98, r79:30.41, r80:62.32, r81:46.80 },
  "WI":{ name:"Wisconsin",          r75:20.36, r77:49.06, r79:25.50, r80:52.06, r81:39.88 },
  "WV":{ name:"West Virginia",      r75:19.24, r77:44.89, r79:24.47, r80:50.30, r81:39.22 },
  "WY":{ name:"Wyoming",            r75:21.54, r77:51.35, r79:26.30, r80:53.85, r81:41.16 },
};

const isDualState = s => s.m77 !== undefined;

// Sorted lists for dropdown optgroups
const DUAL_LIST   = Object.entries(ALL_STATES).filter(([,d]) => isDualState(d)).map(([c,d]) => [c, d.name]).sort((a,b) => a[1].localeCompare(b[1]));
const SINGLE_LIST = Object.entries(ALL_STATES).filter(([,d]) => !isDualState(d)).map(([c,d]) => [c, d.name]).sort((a,b) => a[1].localeCompare(b[1]));

// ─── IndiAide pricing — edit here when prices change ──────────────────────────
const PRICING = {
  clinicianMonthly:  29,   // $ per clinician per month (monthly plan)
  clinicianAnnual:   290,  // $ per clinician per year, prepaid (12 months for the price of 10)
  rtmPatientMonthly: 20,   // $ per RTM patient per month with 2+ active days
  customProposalAt:  10,   // clinicians at or above this get a custom proposal, not a price
};

// ─── Default RTM assumptions — % of the practice's Medicare/Medicaid patients ──
// All are editable on the results screen. Code % values are capped at the
// engaged % in the math, since a patient must be engaged in RTM to bill any code.
const DEFAULTS = {
  engagedPct:   50,  // patients with 2+ active days a month → IndiAide $20 fee applies
  setupPct:     50,  // 98975 setup & education (one-time per episode of care)
  devicePct:    25,  // 98985 / 98977 device supply
  clinicianPct: 50,  // clinician time codes (98979 / 98980 / 98981)
  minutes:      20,  // clinician minutes per patient per month
};

const has = v => v !== null && v !== undefined;

// Which clinician-time codes a given number of minutes per month supports.
// 10–19 → 98979 · 20–39 → 98980 · 40+ → 98980 + 98981 per additional 20 min.
function clinicianCodesFor(minutes) {
  if (minutes >= 40) return { tier:"high", units81: Math.floor((minutes - 20) / 20) };
  if (minutes >= 20) return { tier:"mid",  units81: 0 };
  if (minutes >= 10) return { tier:"low",  units81: 0 };
  return null;
}

function codeStrFor(c) {
  if (!c) return "None";
  if (c.tier === "low") return "98979";
  if (c.tier === "mid") return "98980";
  return c.units81 > 1 ? `98980 + 98981 ×${c.units81}` : "98980 + 98981";
}

// Resolves the clinician-time codes billable for a payer ("r" = Medicare, "m" = Medicaid).
// Falls back to a LOWER code only — you can bill for less time than spent, never more.
// Returns null when nothing is billable at or below the minutes entered.
function resolveClinician(minutes, s, p) {
  const want = clinicianCodesFor(minutes);
  if (!want) return null;
  const c79 = s[`${p}79`], c80 = s[`${p}80`], c81 = s[`${p}81`];
  if (want.tier === "high" && has(c80) && has(c81)) {
    return { tier:"high", units81:want.units81, rate:c80 + want.units81 * c81, codeStr:codeStrFor(want), fallback:false };
  }
  if ((want.tier === "high" || want.tier === "mid") && has(c80)) {
    return { tier:"mid", units81:0, rate:c80, codeStr:"98980", fallback: want.tier !== "mid" };
  }
  if (has(c79)) {
    return { tier:"low", units81:0, rate:c79, codeStr:"98979", fallback: want.tier !== "low" };
  }
  return null;
}

// ─── Billing detail copy ──────────────────────────────────────────────────────
const BILLING_INFO = {
  setup:{
    title:"When is 98975 billed?",
    items:[
      { label:"What",       text:"Initial setup and patient education on using the IndiAide app." },
      { label:"Frequency",  text:"Once per episode of care. Shown here as a one-time amount, counted in Year 1." },
    ],
  },
  device:{
    title:"When is device supply billed?",
    items:[
      { label:"Trigger",    text:"Patient has 2–30 active days on the IndiAide app in a 30-day period." },
      { label:"Which code", text:"98985 for 2–15 days · 98977 for 16–30 days. Only one per 30-day period. 2026 Medicare pays both at the same rate." },
      { label:"Tracked by", text:"\"Active Days\" column in the IndiAide dashboard — updated automatically." },
      { label:"Note",       text:"IndiAide qualifies as Software as a Medical Device (SaMD). No physical device or DME required." },
    ],
  },
  clinician_low:{
    title:"When is 98979 billed?",
    items:[
      { label:"Trigger",    text:"10–19 minutes of clinician time in IndiAide + at least 1 interactive communication (verbal) in the calendar month." },
      { label:"Tracked by", text:"\"Clinician Time\" column in IndiAide. Phone/conversation time tracked by clinician outside the platform." },
      { label:"Frequency",  text:"Once per calendar month, billed for 10–19 min total." },
    ],
  },
  clinician_mid:{
    title:"When is 98980 billed?",
    items:[
      { label:"Trigger",    text:"20–39 minutes of clinician time in IndiAide + at least 1 interactive communication in the calendar month." },
      { label:"Tracked by", text:"\"Clinician Time\" column in IndiAide. Interactive communication tracked outside the platform." },
      { label:"Frequency",  text:"Once per calendar month, billed for 20–39 min total." },
    ],
  },
  clinician_high:{
    title:"When are 98980 + 98981 billed?",
    items:[
      { label:"Trigger",    text:"40+ minutes of management time in IndiAide + at least 1 interactive communication. 98981 is always billed in addition to 98980." },
      { label:"Stacking",   text:"40–59 min = 98981 ×1 · 60–79 min = 98981 ×2 · 80–99 min = 98981 ×3. Each additional 20-min block adds another 98981." },
      { label:"Tracked by", text:"\"Clinician Time\" column in IndiAide. Units here follow the minutes you enter." },
    ],
  },
};

// ─── Formatters — negatives are shown, never clamped to $0 ────────────────────
const usd0 = new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0});
const usd2 = new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2});
const fmt  = n => { const v = Math.round(n); return (v < 0 ? "−" : "") + usd0.format(Math.abs(v)); };
const fmtC = n => usd2.format(n);   // rates, with cents
const fmtK = n => Math.abs(n) >= 100000 ? `${n < 0 ? "−" : ""}$${(Math.abs(n)/1000).toFixed(0)}K` : fmt(n);
const fmtN = n => Math.round(n).toLocaleString();
const RED  = "#DC2626";
const netColor = n => (Math.round(n) < 0 ? RED : GREEN);

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toggle({ options, value, onChange, activeColor = BRAND }) {
  return (
    <div style={{display:"flex",gap:2,background:"#F1F5F9",borderRadius:10,padding:3}}>
      {options.map(o => {
        const on = value === o.key;
        return (
          <button key={o.key} onClick={() => onChange(o.key)} style={{
            flex:1, padding:"8px 6px", border:"none", cursor:"pointer", borderRadius:7,
            background:on?activeColor:"transparent", color:on?"#fff":SLATE,
            fontWeight:on?700:500, fontSize:13, lineHeight:1.2, transition:"all 0.15s",
          }}>
            <div>{o.label}</div>
            {o.desc && <div style={{fontSize:10,fontWeight:400,opacity:on?0.88:0.62,marginTop:1}}>{o.desc}</div>}
          </button>
        );
      })}
    </div>
  );
}

function KpiCard({ label, value, sub, color, inverted }) {
  return (
    <div style={{
      borderRadius:12, padding:"16px 12px", textAlign:"center",
      background:inverted?color:"#fff",
      border:`1.5px solid ${inverted?color:color+"33"}`,
      boxShadow:inverted?`0 4px 20px ${color}28`:"0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6,
        color:inverted?"rgba(255,255,255,0.72)":"#6B7280"}}>{label}</div>
      <div style={{fontSize:24,fontWeight:800,lineHeight:1,color:inverted?"#fff":color}}>{value}</div>
      {sub && <div style={{fontSize:10,marginTop:5,color:inverted?"rgba(255,255,255,0.6)":"#9CA3AF"}}>{sub}</div>}
    </div>
  );
}

// Bigger-type KPI tile for the conference compact view — readable from a few feet away
function BigKpi({ label, value, color, inverted }) {
  return (
    <div style={{
      borderRadius:14, padding:"20px 14px", textAlign:"center",
      background:inverted?color:"#fff",
      border:`1.5px solid ${inverted?color:color+"33"}`,
      boxShadow:inverted?`0 4px 20px ${color}28`:"0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <div style={{fontSize:"clamp(10px,2vw,12px)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8,
        color:inverted?"rgba(255,255,255,0.72)":"#6B7280"}}>{label}</div>
      <div style={{fontSize:"clamp(28px,7vw,42px)",fontWeight:800,lineHeight:1,color:inverted?"#fff":color}}>{value}</div>
    </div>
  );
}

// Inline Calendly widget, prefilled with the lead's name and email.
// Loads the Calendly script once (or reuses it if already present) and initializes
// the widget imperatively via Calendly.initInlineWidget so it works reliably inside
// a React SPA, rather than relying on the script's own DOM auto-scan on page load.
// If the script is blocked (ad blockers, network filters — real risk on venue wifi)
// or errors out, falls back to a plain "Book a time" button after 4s instead of
// leaving a silent blank box.
function CalendlyInline({ name, email, height = 620 }) {
  const containerRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const url = `${BOOKING_URL}?name=${encodeURIComponent(name || "")}&email=${encodeURIComponent(email || "")}`;

    function init() {
      if (cancelled) return;
      if (window.Calendly && containerRef.current) {
        try {
          containerRef.current.innerHTML = "";
          window.Calendly.initInlineWidget({ url, parentElement: containerRef.current });
        } catch (err) {
          console.error("Calendly init error:", err);
          setFailed(true);
        }
      } else {
        setFailed(true);
      }
    }

    const timeoutId = setTimeout(() => { if (!window.Calendly) setFailed(true); }, 4000);

    if (window.Calendly) {
      init();
    } else {
      const existing = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
      if (existing) {
        existing.addEventListener("load", init);
        existing.addEventListener("error", () => setFailed(true));
      } else {
        const script = document.createElement("script");
        script.src = "https://assets.calendly.com/assets/external/widget.js";
        script.async = true;
        script.onload = init;
        script.onerror = () => setFailed(true);
        document.body.appendChild(script);
      }
    }

    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [name, email]);

  if (failed) {
    return (
      <div style={{minWidth:0, minHeight:120, width:"100%", boxSizing:"border-box", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", gap:10, padding:20, textAlign:"center"}}>
        <div style={{fontSize:13, color:"#64748B"}}>Scheduling widget couldn't load — often an ad blocker or network filter.</div>
        <button onClick={() => window.open(`${BOOKING_URL}?name=${encodeURIComponent(name || "")}&email=${encodeURIComponent(email || "")}`, "_blank")} style={{background:BRAND, color:"#fff", border:"none",
          borderRadius:10, padding:"10px 20px", fontSize:14, fontWeight:700, cursor:"pointer"}}>
          Book a time →
        </button>
      </div>
    );
  }

  return <div ref={containerRef} style={{minWidth:0, height, width:"100%"}} />;
}

function CodeBadge({ code, color, bg }) {
  return (
    <span style={{
      fontSize:10,fontWeight:700,fontFamily:"monospace",
      background:bg||BRAND_BG, border:`1px solid ${color}33`,
      borderRadius:4, padding:"1px 6px", color, marginRight:6,
    }}>{code}</span>
  );
}

function BillingDetail({ id, open, onToggle, info }) {
  return (
    <div style={{marginTop:5}}>
      <button onClick={() => onToggle(open===id?null:id)} style={{
        background:"none",border:"none",cursor:"pointer",padding:0,
        fontSize:11,color:open===id?BRAND:"#94A3B8",fontWeight:600,
        display:"flex",alignItems:"center",gap:4,
      }}>
        <span style={{fontSize:9,display:"inline-block",transform:open===id?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.15s"}}>▼</span>
        {open===id?"Hide billing details":"When is this billed?"}
      </button>
      {open===id && (
        <div style={{marginTop:8,padding:"11px 13px",background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8}}>
          <div style={{fontSize:11,fontWeight:700,color:SLATE,marginBottom:7}}>{info.title}</div>
          {info.items.map((item,i) => (
            <div key={i} style={{display:"flex",gap:8,marginBottom:i<info.items.length-1?6:0}}>
              <div style={{fontSize:10,fontWeight:700,color:BRAND,whiteSpace:"nowrap",paddingTop:1,minWidth:72}}>{item.label}</div>
              <div style={{fontSize:11,color:"#475569",lineHeight:1.5}}>{item.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuoteCard({ figure, text, source }) {
  return (
    <div style={{background:"#fff",borderRadius:12,border:"1px solid #E2E8F0",padding:"14px 16px"}}>
      <div style={{fontSize:22,fontWeight:800,color:BRAND,letterSpacing:"-0.5px"}}>{figure}</div>
      <div style={{fontSize:12,color:"#334155",marginTop:3,lineHeight:1.45}}>{text}</div>
      <div style={{fontSize:11,color:"#94A3B8",marginTop:8}}>— {source}</div>
    </div>
  );
}

// Fee-schedule scope callout — shown on BOTH the palooza/table compact view and the
// regular full-breakdown view, right under the header, before any dollar figures.
// Important because partial/non-covered Medicaid states can show $0 or negative
// numbers in the breakdown below, which this note explains up front.
function FeeScheduleNote() {
  return (
    <div style={{margin:"0 0 18px",padding:"12px 14px",background:AMBER_LIGHT,borderRadius:8,border:`1px solid ${AMBER}33`,textAlign:"left"}}>
      <p style={{margin:0,fontSize:11,color:"#92400E",lineHeight:1.6}}>
        <strong>NOTE:</strong> These results are specific to publicly available Physician Fee Schedules for Medicare and
        Medicaid only. Commercial payers often reimburse within a few dollars higher or lower than Medicare. If your state
        doesn't reimburse for Medicaid, adjust the Medicare numbers below as a reference point, then check your commercial
        contract fee schedules for their rates. The code range to search for is <strong>98975-98986</strong>.
      </p>
    </div>
  );
}

// ─── Gate screen — shown before the calculator ────────────────────────────────
const ROLES = [
  "Speech-Language Pathologist (SLP)",
  "Occupational Therapist (OT)",
  "Physical Therapist (PT)",
  "Practice Owner / Administrator",
  "Billing Specialist",
  "Other",
];

function GateScreen({ onSubmit, source }) {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [practice, setPractice] = useState("");
  const [state,    setState]    = useState("");
  const [role,     setRole]     = useState("");
  const [adultPatients,     setAdultPatients]     = useState("");
  const [pediatricPatients, setPediatricPatients] = useState("");
  const [disciplines,     setDisciplines]     = useState([]);
  const [clinicianCount,  setClinicianCount]  = useState("");
  const [privatePayShare, setPrivatePayShare] = useState("");
  const [fixFirst,        setFixFirst]        = useState("");
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);

  const inputStyle = (field) => ({
    width:"100%", padding:"10px 12px", boxSizing:"border-box",
    border:`1.5px solid ${errors[field] ? "#EF4444" : "#E2E8F0"}`,
    borderRadius:8, fontSize:14, color:"#0F172A", background:"#fff",
    outline:"none", colorScheme:"light",
  });

  function validate() {
    const e = {};
    if (!firstName.trim()) e.firstName = "Required";
    if (!lastName.trim())  e.lastName  = "Required";
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = "Valid email required";
    if (!phone.trim())     e.phone     = "Required";
    if (!practice.trim()) e.practice = "Required";
    if (!state)           e.state    = "Required";
    if (!role)            e.role     = "Required";
    if (!disciplines.length)    e.disciplines    = "Select at least one";
    if (!(parseInt(clinicianCount, 10) >= 1)) e.clinicianCount = "Enter a number (1 or more)";
    if (!privatePayShare)       e.privatePayShare = "Required";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    const payload = {
      firstName:firstName.trim(), lastName:lastName.trim(), email:email.trim(), phone:phone.trim(), practice:practice.trim(), state, role,
      adultPatients: adultPatients.trim(), pediatricPatients: pediatricPatients.trim(),
      source, disciplines: disciplines.join(", "), clinicianCount: String(parseInt(clinicianCount, 10)), privatePayShare, fixFirst: fixFirst.trim(),
      submittedAt: new Date().toISOString(),
    };
    // Vercel preview deployments (any *.vercel.app host other than production) skip the
    // webhook, so test submissions on a preview link don't land in the live Sheet → Zapier →
    // Systeme.io pipeline and trigger follow-up emails. Production and custom domains are unaffected.
    const host = window.location.hostname;
    const isPreview = host.endsWith(".vercel.app") && host !== "indiaide-calculator.vercel.app";
    if (LEAD_WEBHOOK_URL && !isPreview) {
      try {
        const params = new URLSearchParams(payload).toString();
        new Image().src = `${LEAD_WEBHOOK_URL}?${params}`;
      } catch(err) { console.error("Webhook error:", err); }
    }
    setLoading(false);
    onSubmit(payload);
  }

  const fieldLabel = (txt, field) => (
    <label style={{display:"block",fontSize:12,fontWeight:600,color:errors[field]?"#EF4444":SLATE,marginBottom:5}}>{txt}</label>
  );

  return (
    <div style={{fontFamily:"'Inter',sans-serif",background:"#fff",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px",colorScheme:"light"}}>

      {/* Brand */}
      <div style={{textAlign:"center",marginBottom:28}}>
        <a href="https://calendly.com/indiaide-scheduling/30min" target="_blank" rel="noopener noreferrer">
          <img src="/indiaide-animation.svg" alt="IndiAide" style={{width:320,marginBottom:12,cursor:"pointer"}} />
        </a>
        <div style={{fontSize:22,fontWeight:800,color:BRAND,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:10}}>
          RTM ROI Calculator
        </div>
        <h1 style={{margin:0,fontSize:26,fontWeight:800,color:"#0F172A",lineHeight:1.25,maxWidth:400}}>
          See your estimated RTM return
        </h1>
        <p style={{margin:"10px 0 0",fontSize:13,color:"#64748B",lineHeight:1.6,maxWidth:380}}>
          Based on 2026 Medicare CMS rates for your state — and Medicaid where it applies.
          Takes 60 seconds to calculate.
        </p>
      </div>

      {/* Form card */}
      <div style={{background:"#fff",borderRadius:20,border:"1px solid #E2E8F0",padding:"32px 28px",width:"100%",maxWidth:440,boxShadow:"0 8px 32px rgba(0,0,0,0.07)"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div>
            {fieldLabel("First Name", "firstName")}
            <input value={firstName} onChange={e => { setFirstName(e.target.value); setErrors(p=>({...p,firstName:""})); }}
              placeholder="Jane" style={inputStyle("firstName")} />
            {errors.firstName && <div style={{fontSize:10,color:"#EF4444",marginTop:3}}>{errors.firstName}</div>}
          </div>
          <div>
            {fieldLabel("Last Name", "lastName")}
            <input value={lastName} onChange={e => { setLastName(e.target.value); setErrors(p=>({...p,lastName:""})); }}
              placeholder="Smith" style={inputStyle("lastName")} />
            {errors.lastName && <div style={{fontSize:10,color:"#EF4444",marginTop:3}}>{errors.lastName}</div>}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div>
            {fieldLabel("Work Email", "email")}
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(p=>({...p,email:""})); }}
              placeholder="jane@clinicname.com" style={inputStyle("email")} />
            {errors.email && <div style={{fontSize:10,color:"#EF4444",marginTop:3}}>{errors.email}</div>}
          </div>
          <div>
            {fieldLabel("Phone Number", "phone")}
            <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setErrors(p=>({...p,phone:""})); }}
              placeholder="(555) 000-0000" style={inputStyle("phone")} />
            {errors.phone && <div style={{fontSize:10,color:"#EF4444",marginTop:3}}>{errors.phone}</div>}
          </div>
        </div>

        <div style={{marginBottom:14}}>
          <div>
            {fieldLabel("Practice / Clinic Name", "practice")}
            <input value={practice} onChange={e => { setPractice(e.target.value); setErrors(p=>({...p,practice:""})); }}
              placeholder="Sunrise Therapy Group" style={inputStyle("practice")} />
            {errors.practice && <div style={{fontSize:10,color:"#EF4444",marginTop:3}}>{errors.practice}</div>}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:4}}>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:SLATE,marginBottom:5}}>
              Adult Patients / Month <span style={{fontWeight:400,color:"#94A3B8"}}>(optional)</span>
            </label>
            <input type="number" min={0} value={adultPatients} onChange={e => setAdultPatients(e.target.value)}
              placeholder="e.g. 80" style={inputStyle("adultPatients")} />
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:SLATE,marginBottom:5}}>
              Pediatric Patients / Month <span style={{fontWeight:400,color:"#94A3B8"}}>(optional)</span>
            </label>
            <input type="number" min={0} value={pediatricPatients} onChange={e => setPediatricPatients(e.target.value)}
              placeholder="e.g. 40" style={inputStyle("pediatricPatients")} />
          </div>
        </div>
        <p style={{margin:"0 0 18px",fontSize:10,color:"#94A3B8",lineHeight:1.5}}>
          Estimated average <strong>individual patients seen</strong> per month — not total sessions or visits.
          We'll use this to pre-fill your Medicare/Medicaid estimate below (you can adjust it there).
        </p>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:24}}>
          <div>
            {fieldLabel("State of Practice", "state")}
            <select value={state} onChange={e => { setState(e.target.value); setErrors(p=>({...p,state:""})); }}
              style={{...inputStyle("state"),color:state?"#0F172A":"#94A3B8"}}>
              <option value="" disabled>Select state</option>
              <optgroup label="✅ Medicare + Medicaid RTM">
                {DUAL_LIST.map(([c,n]) => <option key={c} value={c}>{n}</option>)}
              </optgroup>
              <optgroup label="Medicare RTM Only">
                {SINGLE_LIST.map(([c,n]) => <option key={c} value={c}>{n}</option>)}
              </optgroup>
            </select>
            {errors.state && <div style={{fontSize:10,color:"#EF4444",marginTop:3}}>{errors.state}</div>}
          </div>
          <div>
            {fieldLabel("Your Role", "role")}
            <select value={role} onChange={e => { setRole(e.target.value); setErrors(p=>({...p,role:""})); }}
              style={{...inputStyle("role"),color:role?"#0F172A":"#94A3B8"}}>
              <option value="" disabled>Select role</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {errors.role && <div style={{fontSize:10,color:"#EF4444",marginTop:3}}>{errors.role}</div>}
          </div>
        </div>

        <div style={{marginBottom:14}}>
          {fieldLabel("Disciplines on Your Team", "disciplines")}
          <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
            {["SLP","OT","PT","Other"].map(d => (
              <label key={d} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#334155",
                border:`1.5px solid ${disciplines.includes(d)?BRAND:"#E2E8F0"}`,borderRadius:8,padding:"7px 12px",
                cursor:"pointer",background:disciplines.includes(d)?BRAND_LIGHT:"#fff"}}>
                <input type="checkbox" checked={disciplines.includes(d)}
                  onChange={() => {
                    setDisciplines(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev,d]);
                    setErrors(p=>({...p,disciplines:""}));
                  }}
                  style={{margin:0}} />
                {d}
              </label>
            ))}
          </div>
          {errors.disciplines && <div style={{fontSize:10,color:"#EF4444",marginTop:3}}>{errors.disciplines}</div>}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div>
            {fieldLabel("Number of Clinicians", "clinicianCount")}
            <input type="number" inputMode="numeric" min={1} max={999} value={clinicianCount}
              onChange={e => { setClinicianCount(e.target.value); setErrors(p=>({...p,clinicianCount:""})); }}
              placeholder="e.g. 4" style={inputStyle("clinicianCount")} />
            {errors.clinicianCount && <div style={{fontSize:10,color:"#EF4444",marginTop:3}}>{errors.clinicianCount}</div>}
          </div>
          <div>
            {fieldLabel("Private Pay Share of Caseload", "privatePayShare")}
            <select value={privatePayShare} onChange={e => { setPrivatePayShare(e.target.value); setErrors(p=>({...p,privatePayShare:""})); }}
              style={{...inputStyle("privatePayShare"),color:privatePayShare?"#0F172A":"#94A3B8"}}>
              <option value="" disabled>Select</option>
              {["Under 20%","20-50%","Over 50%","Private pay only"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {errors.privatePayShare && <div style={{fontSize:10,color:"#EF4444",marginTop:3}}>{errors.privatePayShare}</div>}
          </div>
        </div>

        <div style={{marginBottom:18}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:SLATE,marginBottom:5}}>
            What Would You Most Want RTM to Fix or Support First? <span style={{fontWeight:400,color:"#94A3B8"}}>(optional)</span>
          </label>
          <input value={fixFirst} onChange={e => setFixFirst(e.target.value)}
            placeholder="Knowing whether the home program got done" style={inputStyle("fixFirst")} />
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{
          width:"100%", padding:"14px", borderRadius:10, border:"none",
          background:loading?"#9333EA":BRAND, color:"#fff",
          fontSize:15, fontWeight:700, cursor:loading?"wait":"pointer",
          boxShadow:`0 4px 16px ${BRAND}44`, transition:"background 0.15s",
        }}>
          {loading ? "Calculating…" : "Calculate my estimate"}
        </button>

        <p style={{margin:"14px 0 0",fontSize:11,color:"#94A3B8",textAlign:"center",lineHeight:1.6}}>
          We'll use this to personalize your estimate and may follow up with resources specific to your state and discipline. No spam, ever.
        </p>
        <p style={{margin:"8px 0 0",fontSize:10,color:"#94A3B8",textAlign:"center",lineHeight:1.6}}>
          Estimate uses publicly available 2026 Medicare and Medicaid fee schedules. Commercial rates vary by contract.
          Estimates only; reimbursement is not guaranteed.
        </p>
      </div>

      <div style={{marginTop:18,fontSize:11,color:"#94A3B8"}}>
        Powered by IndiAide · 2026 Medicare CMS PFS + Medicaid data
      </div>
    </div>
  );
}

// Small % input used in the assumptions panel. 16px font stops iOS from zooming on focus.
function PctInput({ value, onChange, label }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:4,justifyContent:"flex-end"}}>
      <input type="number" inputMode="numeric" min={0} max={100} step={5} value={value} aria-label={label}
        onChange={e => onChange(Math.max(0, Math.min(100, parseInt(e.target.value,10) || 0)))}
        style={{width:68,padding:"7px 8px",border:"1.5px solid #E2E8F0",borderRadius:8,fontSize:16,fontWeight:700,
          color:"#0F172A",textAlign:"right",boxSizing:"border-box",background:"#fff",colorScheme:"light"}} />
      <span style={{fontSize:13,color:SLATE}}>%</span>
    </div>
  );
}

const sectionTitle = { fontSize:15, fontWeight:700, color:"#0F172A", margin:0 };
const sectionSub   = { fontSize:12, color:"#64748B", marginTop:3, lineHeight:1.5 };
const numInput     = { width:"100%", padding:"10px 12px", borderRadius:8, fontSize:16, fontWeight:700, color:"#0F172A",
                       boxSizing:"border-box", background:"#fff", colorScheme:"light" };

// One payer's per-code breakdown (Medicare or Medicaid), stacked so it reads well on mobile.
function PayerBreakdown({ label, color, bg, P, stateName, expandedCode, setExpandedCode, idPrefix }) {
  const row = (key, badge, name, detail, amount, sub, note, info) => (
    <div key={key} style={{padding:"11px 0",borderBottom:"1px solid #F1F5F9"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",marginBottom:3}}>
            <CodeBadge code={badge} color={color} bg={bg} />
            <span style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{name}</span>
          </div>
          {note
            ? <div style={{fontSize:11,color:"#94A3B8",fontStyle:"italic",lineHeight:1.4}}>{note}</div>
            : <div style={{fontSize:11,color:"#94A3B8"}}>{detail}</div>}
          {P.clinFallbackNote && key === "clin" && !note && (
            <div style={{fontSize:10,color:AMBER,fontStyle:"italic",marginTop:3,lineHeight:1.3}}>{P.clinFallbackNote}</div>
          )}
          {info && <BillingDetail id={`${idPrefix}-${key}`} open={expandedCode} onToggle={setExpandedCode} info={info} />}
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:15,fontWeight:800,color: note ? "#CBD5E1" : color}}>{fmt(amount)}</div>
          <div style={{fontSize:10,color:"#94A3B8"}}>{sub}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{marginBottom:18}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:6,background:bg,borderRadius:6,padding:"3px 10px",marginBottom:4}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:color}} />
        <span style={{fontSize:12,fontWeight:700,color}}>{label}</span>
        <span style={{fontSize:11,color,opacity:0.75}}>{fmtN(P.count)} patients · {fmtN(P.engagedPts)} engaged</span>
      </div>

      {row("dev", "98985 / 98977", "Device supply",
        `${fmtN(P.devPts)} patients × ${fmtC(P.devRate || 0)}`, P.devRev, "per month",
        P.devCovered ? null : `98985/98977 not reimbursed under ${stateName} ${label}.`, BILLING_INFO.device)}

      {row("clin", P.clin ? P.clin.codeStr : (P.wantStr === "None" ? "98979–98981" : P.wantStr), "Clinician time",
        `${fmtN(P.clinPts)} patients × ${fmtC(P.clin ? P.clin.rate : 0)}`, P.clinRev, "per month",
        P.clin ? null : (P.wantStr === "None"
          ? "Under 10 minutes a month doesn't meet any clinician-time code."
          : `${P.wantStr} not reimbursed under ${stateName} ${label}.`),
        P.clin ? BILLING_INFO[`clinician_${P.clin.tier}`] : null)}

      <div style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #F1F5F9"}}>
        <span style={{fontSize:12,fontWeight:600,color:"#334155"}}>{label} monthly</span>
        <span style={{fontSize:14,fontWeight:800,color}}>{fmt(P.monthly)}</span>
      </div>

      {row("setup", "98975", "Setup & education",
        `${fmtN(P.setupPts)} patients × ${fmtC(P.setupRate || 0)}`, P.setupRev, "one-time",
        P.setupCovered ? null : `98975 not reimbursed under ${stateName} ${label}.`, BILLING_INFO.setup)}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ROICalculator() {
  const [lead,         setLead]         = useState(null);   // null = not yet submitted
  const [mcCount,      setMcCount]      = useState(200);
  const [mdCount,      setMdCount]      = useState(50);
  const [stateCode,    setStateCode]    = useState("TX");
  const [expandedCode, setExpandedCode] = useState(null);

  // Editable RTM assumptions (see DEFAULTS)
  const [engagedPct,   setEngagedPct]   = useState(DEFAULTS.engagedPct);
  const [setupPct,     setSetupPct]     = useState(DEFAULTS.setupPct);
  const [devicePct,    setDevicePct]    = useState(DEFAULTS.devicePct);
  const [clinicianPct, setClinicianPct] = useState(DEFAULTS.clinicianPct);
  const [minutes,      setMinutes]      = useState(DEFAULTS.minutes);

  // IndiAide software inputs
  const [clinicians, setClinicians] = useState(1);
  const [plan,       setPlan]       = useState("monthly");  // "monthly" | "annual"

  // Raw monthly patient counts from the gate form (0 if left blank there)
  const [adultPatients,     setAdultPatients]     = useState(0);
  const [pediatricPatients, setPediatricPatients] = useState(0);

  // Payer-mix % used to derive the Medicare/Medicaid boxes from the raw counts.
  // NOTE: these three defaults are placeholders, not real market data. They only
  // affect the pre-fill; the Medicare/Medicaid boxes remain freely editable.
  const [adultsMcPct, setAdultsMcPct] = useState(50);  // % of adult patients on Medicare
  const [adultsMdPct, setAdultsMdPct] = useState(20);  // % of adult patients on Medicaid
  const [pedsMdPct,   setPedsMdPct]   = useState(55);  // % of pediatric patients on Medicaid

  // Conference/embed routing — read once from the URL. source defaults to "website";
  // mode=table triggers the compact laptop/tablet view used at the conference table.
  const source      = useMemo(() => new URLSearchParams(window.location.search).get("source") || "website", []);
  const isTableMode = useMemo(() => new URLSearchParams(window.location.search).get("mode") === "table", []);
  const [expanded, setExpanded] = useState(false); // "See full breakdown" toggle in compact view

  const s    = ALL_STATES[stateCode] || ALL_STATES["TX"];
  const dual = isDualState(s);

  // Medicaid coverage footnote for any partial-coverage pattern.
  const mdCoverageNote = useMemo(() => {
    if (!dual) return null;
    const codeLabels = { "75":"98975", "77":"98977/98985", "79":"98979", "80":"98980", "81":"98981" };
    const uncovered = Object.entries(codeLabels).filter(([k]) => s[`m${k}`] === null).map(([,v]) => v);
    if (uncovered.length === 0) return null;
    const covered = Object.entries(codeLabels).filter(([k]) => s[`m${k}`] !== null).map(([,v]) => v);
    const coveredStr = covered.length
      ? ` ${covered.join(", ")} ${covered.length === 1 ? "remains" : "remain"} billable.`
      : " No RTM codes are separately reimbursed by Medicaid in this state.";
    return ` ${s.name} Medicaid does not separately reimburse ${uncovered.join(", ")}.${coveredStr}`;
  }, [dual, s]);

  const C = useMemo(() => {
    const engaged = Math.max(0, Math.min(100, engagedPct)) / 100;
    // A code can't be billed for more patients than are engaged in RTM
    const eff = v => Math.min(Math.max(0, Math.min(100, v)) / 100, engaged);
    const want = clinicianCodesFor(minutes);
    const wantStr = codeStrFor(want);

    const payer = (count, p, active) => {
      if (!active) {
        return { count:0, engagedPts:0, devPts:0, clinPts:0, setupPts:0, devRev:0, clinRev:0, setupRev:0,
                 monthly:0, devCovered:false, setupCovered:false, clin:null, wantStr, clinFallbackNote:null };
      }
      const engagedPts = Math.round(count * engaged);
      const devPts     = Math.round(count * eff(devicePct));
      const clinPts    = Math.round(count * eff(clinicianPct));
      const setupPts   = Math.round(count * eff(setupPct));
      // 2026 Medicare pays 98985 and 98977 at the same rate, so the 98977 rate is used for both.
      const devRate    = s[`${p}77`];
      const setupRate  = s[`${p}75`];
      const devCovered   = has(devRate);
      const setupCovered = has(setupRate);
      const clin       = resolveClinician(minutes, s, p);
      const devRev     = devCovered ? devPts * devRate : 0;
      const clinRev    = clin ? clinPts * clin.rate : 0;
      const setupRev   = setupCovered ? setupPts * setupRate : 0;
      const clinFallbackNote = clin && clin.fallback
        ? `Billed as ${clin.codeStr} — ${s.name} ${p === "m" ? "Medicaid" : "Medicare"} doesn't reimburse ${wantStr}.`
        : null;
      return { count, engagedPts, devPts, clinPts, setupPts, devRate, setupRate, devCovered, setupCovered,
               clin, wantStr, clinFallbackNote, devRev, clinRev, setupRev, monthly: devRev + clinRev };
    };

    const mc = payer(mcCount, "r", true);
    const md = payer(mdCount, "m", dual);

    // Reimbursement
    const reimbMonthly = mc.monthly + md.monthly;
    const setupTotal   = mc.setupRev + md.setupRev;          // one-time, counted in Year 1
    const reimbYear1   = reimbMonthly * 12 + setupTotal;

    // IndiAide software
    const seats          = Math.max(0, clinicians);
    const custom         = seats >= PRICING.customProposalAt;
    const engagedTotal   = mc.engagedPts + md.engagedPts;
    const rtmMonthly     = engagedTotal * PRICING.rtmPatientMonthly;
    const seatMonthly    = seats * PRICING.clinicianMonthly;
    const seatAnnual     = seats * PRICING.clinicianAnnual;
    const seatYear       = plan === "annual" ? seatAnnual : seatMonthly * 12;
    const softwareMonthly = (plan === "annual" ? seatAnnual / 12 : seatMonthly) + rtmMonthly; // per-month equivalent
    const softwareYear   = seatYear + rtmMonthly * 12;
    const upfront        = plan === "annual" ? seatAnnual : 0;
    const ongoingMonthly = plan === "annual" ? rtmMonthly : seatMonthly + rtmMonthly;
    const prepaidSavings = seats * (PRICING.clinicianMonthly * 12 - PRICING.clinicianAnnual);

    // Net financial contribution (can be negative)
    const netMonthly = reimbMonthly - softwareMonthly;
    const netYear1   = reimbYear1 - softwareYear;

    const capped = [setupPct, devicePct, clinicianPct].some(v => v > engagedPct);

    return { mc, md, want, wantStr, reimbMonthly, setupTotal, reimbYear1,
             seats, custom, engagedTotal, rtmMonthly, seatMonthly, seatAnnual, seatYear,
             softwareMonthly, softwareYear, upfront, ongoingMonthly, prepaidSavings,
             netMonthly, netYear1, capped };
  }, [mcCount, mdCount, s, dual, engagedPct, setupPct, devicePct, clinicianPct, minutes, clinicians, plan]);

  const card = { background:"#fff", borderRadius:16, border:"1px solid #E2E8F0", padding:"22px 20px", marginBottom:16 };
  const totalPatients = mcCount + (dual ? mdCount : 0);
  const resetAssumptions = () => {
    setEngagedPct(DEFAULTS.engagedPct); setSetupPct(DEFAULTS.setupPct); setDevicePct(DEFAULTS.devicePct);
    setClinicianPct(DEFAULTS.clinicianPct); setMinutes(DEFAULTS.minutes);
  };

  // Auto-resize iframe height for embedding — must be before any conditional return
  useEffect(() => {
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: "indiaide-resize", height }, "*");
    };
    sendHeight();
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [lead, stateCode, expandedCode, expanded]);

  // Gate check — all hooks above, conditional render below (rules of hooks compliant)
  if (!lead) {
    return (
      <GateScreen source={source} onSubmit={data => {
        setLead(data);
        setStateCode(data.state);
        setClinicians(Math.max(1, parseInt(data.clinicianCount, 10) || 1));
        // Derive Medicare/Medicaid counts strictly from what the prospect entered —
        // a blank field means 0 of that population.
        const adults = parseInt(data.adultPatients, 10) || 0;
        const peds   = parseInt(data.pediatricPatients, 10) || 0;
        setAdultPatients(adults);
        setPediatricPatients(peds);
        setMcCount(Math.round(adults * adultsMcPct / 100));
        setMdCount(Math.round(adults * adultsMdPct / 100 + peds * pedsMdPct / 100));
      }} />
    );
  }

  const assumptionRows = [
    { key:"engaged", name:"Engaged in RTM", badge:null,     sub:"2+ active days a month · IndiAide $20 per patient applies", val:engagedPct,   set:setEngagedPct,   pts:C.engagedTotal },
    { key:"setup",   name:"Setup & education", badge:"98975", sub:"One-time per episode of care",                           val:setupPct,     set:setSetupPct,     pts:C.mc.setupPts + C.md.setupPts },
    { key:"device",  name:"Device supply", badge:"98985 / 98977", sub:"Engaged patients whose care qualifies for a device code (98985 for 2–15 days, 98977 for 16–30)",                val:devicePct,    set:setDevicePct,    pts:C.mc.devPts + C.md.devPts },
    { key:"clin",    name:"Clinician time", badge:C.wantStr === "None" ? null : C.wantStr, sub:"Management time + 1 interactive communication", val:clinicianPct, set:setClinicianPct, pts:C.mc.clinPts + C.md.clinPts },
  ];

  const customBox = (
    <div style={{padding:"14px 16px",background:BRAND_BG,border:`1px solid ${BRAND}33`,borderRadius:10}}>
      <div style={{fontSize:14,fontWeight:700,color:BRAND}}>Get a Custom Practice Proposal</div>
      <div style={{fontSize:12,color:"#475569",marginTop:4,lineHeight:1.5}}>
        Practices with {PRICING.customProposalAt}+ clinicians receive custom pricing. Book a time below and we'll put together a proposal for {lead.practice}.
      </div>
    </div>
  );

  return (
    <div style={{width:"100%",background:"#fff",colorScheme:"light"}}>
    <div style={{fontFamily:"'Inter',sans-serif",width:"100%",maxWidth:860,margin:"0 auto",padding:"16px 16px",boxSizing:"border-box"}}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      {isTableMode ? (
        <div style={{textAlign:"center",padding:"18px 0 10px"}}>
          <div style={{fontSize:"clamp(24px,5vw,34px)",fontWeight:800,color:"#0F172A",lineHeight:1.15}}>{lead.practice}</div>
          <div style={{fontSize:"clamp(14px,3vw,18px)",fontWeight:600,color:BRAND,marginTop:4}}>{s.name}</div>
          <div style={{fontSize:"clamp(11px,2.5vw,13px)",fontWeight:600,color:"#64748B",marginTop:4}}>
            {fmtN(adultPatients)} adult · {fmtN(pediatricPatients)} pediatric patients/month · {fmtN(C.seats)} clinician{C.seats === 1 ? "" : "s"}
          </div>
        </div>
      ) : (
        <div style={{textAlign:"center",padding:"20px 0 24px"}}>
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
            <img src="/indiaide-animation.svg" alt="IndiAide" style={{width:"min(320px, 80vw)",marginBottom:12,cursor:"pointer"}} />
          </a>
          <div style={{fontSize:20,fontWeight:800,color:BRAND,letterSpacing:"0.02em",marginBottom:8}}>
            RTM ROI Calculator
          </div>
          <h1 style={{margin:0,fontSize:"clamp(22px,5vw,26px)",fontWeight:800,color:"#0F172A",lineHeight:1.25}}>
            {lead.firstName}, here's your estimated RTM return
          </h1>
          <p style={{margin:"8px auto 0",fontSize:13,color:"#64748B",lineHeight:1.6,maxWidth:520}}>
            For <strong>{lead.practice}</strong> · {lead.role} · Based on 2026 Medicare rates{dual ? " and Medicaid rates" : ""} for {s.name}.
          </p>
        </div>
      )}

      <FeeScheduleNote />

      {/* ── Compact summary (conference table view) ─────────────────────────── */}
      {isTableMode && (
        <div style={{marginBottom:20}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:14}}>
            <BigKpi label="Est. reimbursement / mo" value={fmt(C.reimbMonthly)} color={BRAND} inverted />
            <BigKpi label="IndiAide / mo" value={C.custom ? "Custom" : fmt(C.softwareMonthly)} color={SLATE} />
            <BigKpi label="Est. net / mo" value={C.custom ? "—" : fmt(C.netMonthly)} color={C.custom ? SLATE : netColor(C.netMonthly)} />
            <BigKpi label="Est. net, Year 1" value={C.custom ? "—" : fmtK(C.netYear1)} color={C.custom ? SLATE : netColor(C.netYear1)} />
          </div>
          <div style={{textAlign:"center",fontSize:13,color:"#475569",marginBottom:16}}>
            Plus an estimated <strong>{fmt(C.setupTotal)}</strong> one-time setup reimbursement (98975), included in Year 1.
          </div>
          {C.custom && <div style={{marginBottom:14}}>{customBox}</div>}
          <div style={{background:"#fff",borderRadius:12,padding:8,marginBottom:14}}>
            <CalendlyInline name={lead.firstName} email={lead.email} height={600} />
          </div>
          <div style={{textAlign:"center"}}>
            <button onClick={() => setExpanded(x => !x)} style={{
              background:"transparent",border:"none",color:BRAND,fontSize:13,fontWeight:700,
              cursor:"pointer",textDecoration:"underline",padding:8,
            }}>
              {expanded ? "Hide full breakdown" : "See full breakdown and adjust assumptions"}
            </button>
          </div>
          {!expanded && (
            <p style={{textAlign:"center",fontSize:10,color:"#94A3B8",marginTop:10,lineHeight:1.6}}>
              Estimates only. Reimbursement depends on payer coverage, billing requirements and clinical circumstances, and is not guaranteed.
            </p>
          )}
        </div>
      )}

      {(!isTableMode || expanded) && <>

      {/* ── Patients & state ──────────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Your patients</h2>
        <div style={{...sectionSub,marginBottom:14}}>Individual Medicare and Medicaid patients seen per month. Adjust to match your practice.</div>

        {(adultPatients>0 || pediatricPatients>0) && (
          <div style={{marginBottom:18,padding:"12px 14px",background:"#F8FAFC",borderRadius:8,border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:12,fontWeight:600,color:"#334155",marginBottom:10}}>
              Your payer mix <span style={{color:"#94A3B8",fontWeight:400}}>— adjust to match your practice</span>
            </div>
            {[
              { label:"Adults on Medicare",   val:adultsMcPct, set:setAdultsMcPct },
              { label:"Adults on Medicaid",   val:adultsMdPct, set:setAdultsMdPct },
              { label:"Pediatric on Medicaid",val:pedsMdPct,   set:setPedsMdPct   },
            ].map(({label,val,set}) => (
              <div key={label} style={{display:"flex",alignItems:"center",gap:12,marginBottom:8,flexWrap:"wrap"}}>
                <label style={{fontSize:13,color:"#64748B",minWidth:150}}>{label}</label>
                <input type="range" min={0} max={100} step={1} value={val}
                  onChange={e => {
                    let pct = parseInt(e.target.value,10);
                    // Adults on Medicare + Adults on Medicaid share one 100% adult pool.
                    let newAdultsMc = adultsMcPct, newAdultsMd = adultsMdPct;
                    if (label==="Adults on Medicare") {
                      newAdultsMc = pct;
                      if (newAdultsMc + newAdultsMd > 100) newAdultsMd = 100 - newAdultsMc;
                      setAdultsMcPct(newAdultsMc); setAdultsMdPct(newAdultsMd);
                    } else if (label==="Adults on Medicaid") {
                      newAdultsMd = pct;
                      if (newAdultsMc + newAdultsMd > 100) newAdultsMc = 100 - newAdultsMd;
                      setAdultsMdPct(newAdultsMd); setAdultsMcPct(newAdultsMc);
                    } else {
                      set(pct);
                    }
                    const newPedsMd = label==="Pediatric on Medicaid" ? pct : pedsMdPct;
                    setMcCount(Math.round(adultPatients * newAdultsMc / 100));
                    setMdCount(Math.round(adultPatients * newAdultsMd / 100 + pediatricPatients * newPedsMd / 100));
                  }}
                  style={{flex:1,minWidth:120}} />
                <span style={{fontSize:13,fontWeight:600,minWidth:34,textAlign:"right"}}>{val}%</span>
              </div>
            ))}
            <div style={{fontSize:10,color:"#94A3B8",marginTop:2}}>
              Adults on Medicare + Adults on Medicaid share one 100% pool — raising one lowers the other.
            </div>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16}}>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:BLUE,marginBottom:6}}>Medicare patients</label>
            <input type="number" inputMode="numeric" min={0} max={999999} value={mcCount}
              onChange={e => setMcCount(Math.max(0,Math.min(999999,parseInt(e.target.value)||0)))}
              style={{...numInput,border:`1.5px solid ${BLUE}44`}} />
            <div style={{fontSize:11,color:"#94A3B8",marginTop:4}}>
              {adultPatients>0 ? `${adultsMcPct}% of ${fmtN(adultPatients)} adults` : "Medicare caseload per month"}
            </div>
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:dual?GREEN:"#94A3B8",marginBottom:6}}>Medicaid patients</label>
            <input type="number" inputMode="numeric" min={0} max={999999} value={mdCount} disabled={!dual}
              onChange={e => setMdCount(Math.max(0,Math.min(999999,parseInt(e.target.value)||0)))}
              style={{...numInput,border:`1.5px solid ${dual?GREEN+"44":"#E2E8F0"}`,color:dual?"#0F172A":"#94A3B8",background:dual?"#fff":"#F8FAFC"}} />
            <div style={{fontSize:11,color:"#94A3B8",marginTop:4}}>
              {!dual ? `Medicaid RTM not reimbursed in ${s.name}`
                : (adultPatients>0||pediatricPatients>0)
                  ? `${fmtN(Math.round(adultPatients*adultsMdPct/100))} adult + ${fmtN(Math.round(pediatricPatients*pedsMdPct/100))} pediatric`
                  : "Medicaid caseload per month"}
            </div>
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:SLATE,marginBottom:6}}>State of practice</label>
            <select value={stateCode} onChange={e => setStateCode(e.target.value)}
              style={{...numInput,fontSize:14,fontWeight:500,border:"1.5px solid #E2E8F0"}}>
              <optgroup label={`Medicare + Medicaid RTM (${DUAL_LIST.length} states)`}>
                {DUAL_LIST.map(([c,n]) => <option key={c} value={c}>{n}</option>)}
              </optgroup>
              <optgroup label="Medicare RTM only">
                {SINGLE_LIST.map(([c,n]) => <option key={c} value={c}>{n}</option>)}
              </optgroup>
            </select>
            <div style={{fontSize:10,color:"#94A3B8",marginTop:4}}>
              {dual
                ? (mdCoverageNote
                    ? <span style={{color:AMBER,fontWeight:600}}>Medicare + partial Medicaid RTM coverage in {s.name}</span>
                    : <span style={{color:GREEN,fontWeight:600}}>Medicare and Medicaid both reimburse RTM in {s.name}</span>)
                : "Medicare RTM · 2026 CMS rates"}
            </div>
          </div>
        </div>

        {(() => {
          const totalPts = adultPatients + pediatricPatients;
          const gap = totalPts - mcCount - (dual ? mdCount : 0);
          if (totalPts <= 0 || gap <= 0) return null;
          return (
            <div style={{marginTop:16,padding:"11px 13px",background:AMBER_LIGHT,borderRadius:8}}>
              <span style={{fontSize:12,color:"#92400E",lineHeight:1.55}}>
                <strong>{fmtN(gap)} of your {fmtN(totalPts)} monthly patients aren't included</strong> (commercial, private pay, or Medicaid where it doesn't reimburse RTM).
                Commercial rates vary by contract; check your fee schedules for codes 98975–98986.
              </span>
            </div>
          );
        })()}
      </div>

      {/* ── RTM assumptions ───────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
          <div>
            <h2 style={sectionTitle}>RTM assumptions</h2>
            <div style={sectionSub}>Share of your Medicare{dual ? " and Medicaid" : ""} patients ({fmtN(totalPatients)}) expected to meet each code each month. Change any number.</div>
          </div>
          <button onClick={resetAssumptions} style={{background:"none",border:`1px solid ${BRAND}55`,color:BRAND,borderRadius:8,
            padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Reset to defaults</button>
        </div>

        <div style={{marginTop:12}}>
          {assumptionRows.map(r => (
            <div key={r.key} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #F1F5F9"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",flexWrap:"wrap"}}>
                  {r.badge && <CodeBadge code={r.badge} color={BRAND} bg={BRAND_BG} />}
                  <span style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{r.name}</span>
                </div>
                <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>{r.sub}</div>
              </div>
              <div style={{textAlign:"right",fontSize:12,color:"#475569",minWidth:74}}>
                <strong style={{color:"#0F172A"}}>{fmtN(r.pts)}</strong> patients
              </div>
              <PctInput value={r.val} onChange={r.set} label={`${r.name} percent`} />
            </div>
          ))}

          <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0 0"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>Clinician minutes per patient per month</div>
              <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>
                {C.want ? <>Bills <strong style={{color:GREEN}}>{C.wantStr}</strong> · 10–19 min = 98979 · 20–39 = 98980 · 40+ adds 98981 per 20 min</>
                        : "Under 10 minutes doesn't meet a clinician-time code."}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <input type="number" inputMode="numeric" min={0} max={120} step={5} value={minutes} aria-label="Clinician minutes per patient per month"
                onChange={e => setMinutes(Math.max(0, Math.min(120, parseInt(e.target.value,10) || 0)))}
                style={{width:68,padding:"7px 8px",border:"1.5px solid #E2E8F0",borderRadius:8,fontSize:16,fontWeight:700,
                  color:"#0F172A",textAlign:"right",boxSizing:"border-box",background:"#fff",colorScheme:"light"}} />
              <span style={{fontSize:13,color:SLATE}}>min</span>
            </div>
          </div>

          {C.capped && (
            <div style={{marginTop:12,fontSize:11,color:AMBER,lineHeight:1.5}}>
              Codes are capped at the engaged share ({engagedPct}%): a patient must be engaged in RTM before any code can be billed.
            </div>
          )}
        </div>
      </div>

      {/* ── IndiAide software ─────────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>IndiAide software</h2>
        <div style={{...sectionSub,marginBottom:14}}>
          ${PRICING.clinicianMonthly} per clinician per month, or ${PRICING.clinicianAnnual} per year prepaid · ${PRICING.rtmPatientMonthly} per RTM patient per month with 2+ active days · unlimited non-RTM home-program patients included.
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16,marginBottom:14}}>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:SLATE,marginBottom:6}}>Clinician accounts</label>
            <input type="number" inputMode="numeric" min={1} max={999} value={clinicians}
              onChange={e => setClinicians(Math.max(0, Math.min(999, parseInt(e.target.value,10) || 0)))}
              style={{...numInput,border:`1.5px solid ${BRAND}44`}} />
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:SLATE,marginBottom:6}}>Clinician billing</label>
            <Toggle value={plan} onChange={setPlan} options={[
              { key:"monthly", label:"Monthly", desc:`$${PRICING.clinicianMonthly}/clinician/mo` },
              { key:"annual",  label:"Annual",  desc:`$${PRICING.clinicianAnnual}/clinician/yr` },
            ]} />
          </div>
        </div>

        {C.custom ? customBox : (
          <div>
            {[
              [ plan === "annual"
                  ? `Clinician accounts · ${fmtN(C.seats)} × $${PRICING.clinicianAnnual}/yr, prepaid`
                  : `Clinician accounts · ${fmtN(C.seats)} × $${PRICING.clinicianMonthly}/mo`,
                plan === "annual" ? `${fmt(C.seatAnnual)} upfront` : `${fmt(C.seatMonthly)}/mo` ],
              [ `RTM patients · ${fmtN(C.engagedTotal)} × $${PRICING.rtmPatientMonthly}/mo`, `${fmt(C.rtmMonthly)}/mo` ],
            ].map(([l,v]) => (
              <div key={l} style={{display:"flex",justifyContent:"space-between",gap:12,padding:"9px 0",borderBottom:"1px solid #F1F5F9",fontSize:13}}>
                <span style={{color:"#334155"}}>{l}</span><strong style={{color:"#0F172A",whiteSpace:"nowrap"}}>{v}</strong>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginTop:14}}>
              <KpiCard label="Due upfront" value={fmt(C.upfront)} sub={plan === "annual" ? "annual clinician plan" : "no upfront charge"} color={SLATE} />
              <KpiCard label="Ongoing / month" value={fmt(C.ongoingMonthly)} sub={plan === "annual" ? "RTM patients only" : "clinicians + RTM patients"} color={SLATE} />
              <KpiCard label="Software, Year 1" value={fmt(C.softwareYear)} sub="assumes steady monthly usage" color={BRAND} />
            </div>
            <div style={{marginTop:12,fontSize:12,color: plan === "annual" ? GREEN : "#475569"}}>
              {plan === "annual"
                ? <>Annual billing saves <strong>{fmt(C.prepaidSavings)}</strong> a year on clinician accounts (12 months for the price of 10).</>
                : <>Switching to annual billing would save <strong>{fmt(C.prepaidSavings)}</strong> a year on clinician accounts.</>}
            </div>
          </div>
        )}
      </div>

      {/* ── Estimated financial impact ────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Estimated financial impact</h2>
        <div style={{...sectionSub,marginBottom:14}}>Reimbursement minus IndiAide software. A negative result means estimated costs exceed estimated reimbursement.</div>

        {!isTableMode && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:16}}>
            <KpiCard label="Est. reimbursement / mo" value={fmt(C.reimbMonthly)} sub="recurring" color={BRAND} inverted />
            <KpiCard label="IndiAide / mo" value={C.custom ? "Custom" : fmt(C.softwareMonthly)} sub={plan === "annual" ? "monthly equivalent" : "monthly"} color={SLATE} />
            <KpiCard label="Est. net / mo" value={C.custom ? "—" : fmt(C.netMonthly)} sub="recurring" color={C.custom ? SLATE : netColor(C.netMonthly)} />
            <KpiCard label="Est. net, Year 1" value={C.custom ? "—" : fmtK(C.netYear1)} sub="incl. one-time setup" color={C.custom ? SLATE : netColor(C.netYear1)} />
          </div>
        )}

        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{borderBottom:"2px solid #F1F5F9"}}>
                <th style={{textAlign:"left",padding:"6px 4px",fontSize:11,color:"#94A3B8",fontWeight:600}}></th>
                <th style={{textAlign:"right",padding:"6px 4px",fontSize:11,color:"#94A3B8",fontWeight:600}}>Monthly</th>
                <th style={{textAlign:"right",padding:"6px 4px",fontSize:11,color:"#94A3B8",fontWeight:600}}>Year 1</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Est. RTM reimbursement (recurring)", fmt(C.reimbMonthly), fmt(C.reimbMonthly * 12)],
                ["Est. setup reimbursement (98975, one-time)", "—", fmt(C.setupTotal)],
                ["IndiAide software", C.custom ? "Custom" : fmt(-C.softwareMonthly), C.custom ? "Custom" : fmt(-C.softwareYear)],
              ].map(([l,a,b]) => (
                <tr key={l} style={{borderBottom:"1px solid #F8FAFC"}}>
                  <td style={{padding:"9px 4px",color:"#334155"}}>{l}</td>
                  <td style={{padding:"9px 4px",textAlign:"right",color:"#0F172A",whiteSpace:"nowrap"}}>{a}</td>
                  <td style={{padding:"9px 4px",textAlign:"right",color:"#0F172A",whiteSpace:"nowrap"}}>{b}</td>
                </tr>
              ))}
              <tr style={{borderTop:"2px solid #E2E8F0"}}>
                <td style={{padding:"11px 4px",fontWeight:700,color:"#0F172A"}}>Est. net financial contribution</td>
                <td style={{padding:"11px 4px",textAlign:"right",fontWeight:800,whiteSpace:"nowrap",color:C.custom ? SLATE : netColor(C.netMonthly)}}>{C.custom ? "—" : fmt(C.netMonthly)}</td>
                <td style={{padding:"11px 4px",textAlign:"right",fontWeight:800,whiteSpace:"nowrap",color:C.custom ? SLATE : netColor(C.netYear1)}}>{C.custom ? "—" : fmt(C.netYear1)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {plan === "annual" && !C.custom && (
          <div style={{fontSize:11,color:"#94A3B8",marginTop:8}}>Monthly software shown as a monthly equivalent of the prepaid annual plan.</div>
        )}
      </div>

      {/* ── Reimbursement breakdown by payer and code ─────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Reimbursement by code</h2>
        <div style={{...sectionSub,marginBottom:14}}>{s.name} · 2026 Medicare rates{dual ? " and Medicaid fee schedule rates" : ""}.</div>

        <PayerBreakdown label="Medicare" color={BLUE} bg={BLUE_LIGHT} P={C.mc} stateName={s.name}
          expandedCode={expandedCode} setExpandedCode={setExpandedCode} idPrefix="mc" />
        {dual ? (
          <PayerBreakdown label="Medicaid" color={GREEN} bg={GREEN_LIGHT} P={C.md} stateName={s.name}
            expandedCode={expandedCode} setExpandedCode={setExpandedCode} idPrefix="md" />
        ) : (
          <div style={{padding:"10px 14px",background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,fontSize:12,color:"#64748B"}}>
            <strong>{s.name}</strong> Medicaid does not currently reimburse RTM codes.
          </div>
        )}
      </div>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <div style={{background:BRAND,borderRadius:18,padding:"30px clamp(10px,4vw,22px)",color:"#fff",boxShadow:`0 8px 32px ${BRAND}33`,textAlign:"center"}}>
        <div style={{fontSize:13,opacity:0.8,lineHeight:1.6,maxWidth:520,margin:"0 auto 18px"}}>
          You spend time between sessions on your patients, reviewing their progress, adjusting their home program, checking in. That work doesn't fall through the cracks. But for most clinics, it also doesn't get reimbursed.
        </div>
        <div style={{fontSize:"clamp(20px,4.5vw,24px)",fontWeight:800,lineHeight:1.25,marginBottom:10}}>
          An estimated {fmtK(C.reimbMonthly * 12)} a year in RTM reimbursement, from work you're already doing.
        </div>
        <div style={{fontSize:13,opacity:0.82,lineHeight:1.65,maxWidth:500,margin:"0 auto 20px"}}>
          IndiAide tracks what {dual ? "Medicare and Medicaid need" : "Medicare needs"} to see for RTM billing — active days, clinician time, patient communication — automatically.
        </div>
        <div style={{borderLeft:"3px solid rgba(255,255,255,0.4)",paddingLeft:16,textAlign:"left",maxWidth:500,margin:"0 auto 24px"}}>
          <div style={{fontSize:14,fontStyle:"italic",opacity:0.9,lineHeight:1.5}}>
            "This is the missing piece. This is something we've needed for so long."
          </div>
          <div style={{fontSize:11,opacity:0.65,marginTop:6}}>— Clinician-owner, adult practice, FL</div>
        </div>
        {!isTableMode && (
          <div style={{background:"#fff",borderRadius:12,padding:8,marginBottom:20,textAlign:"left"}}>
            <CalendlyInline name={lead.firstName} email={lead.email} height={620} />
          </div>
        )}
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20,justifyContent:"center"}}>
          <button onClick={() => window.open("https://indiaide.com","_blank")} style={{background:"transparent",color:"#fff",border:"2px solid rgba(255,255,255,0.32)",borderRadius:10,padding:"12px 24px",fontSize:14,fontWeight:500,cursor:"pointer"}}>Learn more</button>
        </div>
        <div style={{display:"flex",gap:20,flexWrap:"wrap",borderTop:"1px solid rgba(255,255,255,0.15)",paddingTop:16,justifyContent:"center"}}>
          {["Software as a Medical Device (SaMD)","Works on any device patients already own","RTM compliance tracked automatically"].map(b => (
            <div key={b} style={{fontSize:11,opacity:0.72,display:"flex",alignItems:"center",gap:4}}><span>✓</span>{b}</div>
          ))}
        </div>
      </div>

      {/* ── Assumptions & disclaimer ──────────────────────────────────────── */}
      <p style={{textAlign:"center",fontSize:10,color:"#94A3B8",margin:"14px auto 0",lineHeight:1.75,maxWidth:680}}>
        <strong>Estimates only — reimbursement is not guaranteed.</strong> Actual reimbursement depends on payer coverage, applicable billing requirements, documentation and clinical circumstances.
        {" "}Medicare estimates use 2026 CMS Physician Fee Schedule non-facility rates for {s.name}.
        {dual && ` Medicaid estimates use 2026 ${s.name} state fee schedule rates.`}
        {mdCoverageNote}
        {" "}Assumptions: {engagedPct}% of patients engaged in RTM (2+ active days a month); {setupPct}% billed 98975 once per episode of care, counted in Year 1;
        {" "}{devicePct}% billed device supply monthly (98985 for 2–15 days or 98977 for 16–30 days, paid at the same 2026 Medicare rate);
        {" "}{clinicianPct}% billed clinician time monthly at {minutes} minutes ({C.wantStr}), each requiring at least one interactive communication.
        {" "}Year 1 assumes consistent monthly usage. IndiAide software fees are separate from insurance reimbursement.
        {" "}IndiAide qualifies as Software as a Medical Device (SaMD) — no physical device or DME required.
      </p>

      </>}

    </div>
    </div>
  );
}
