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

// ─── IndiAide Tiered Pricing ──────────────────────────────────────────────────
const PRICING = [
  { max:200,    rate:20, label:"< 200" },
  { max:500,    rate:17, label:"201–500" },
  { max:1000,   rate:14, label:"501–1,000" },
  { max:2500,   rate:11, label:"1,001–2,500" },
  { max:4500,   rate: 9, label:"2,501–4,500" },
  { max:999999, rate: 7, label:"4,501+" },
];
const getIndiRate  = n => (PRICING.find(t => n <= t.max) || PRICING.at(-1)).rate;
const getIndiLabel = n => (PRICING.find(t => n <= t.max) || PRICING.at(-1)).label;

// ─── Model assumptions ────────────────────────────────────────────────────────
const DEVICE_BILL_PCT    = 0.50;
const CLINICIAN_BILL_PCT = 0.50;

const ADOPTION = [
  { key:"low",  pct:0.25, label:"25%", desc:"Conservative" },
  { key:"mid",  pct:0.50, label:"50%", desc:"Expected" },
  { key:"high", pct:0.75, label:"75%", desc:"Optimistic" },
];

const CLINICIAN = [
  { key:"low",  label:"10 min",  desc:"98979",       codeStr:"98979" },
  { key:"mid",  label:"20 min",  desc:"98980",       codeStr:"98980" },
  { key:"high", label:"40+ min", desc:"98980+98981", codeStr:"98980+98981" },
];

// Given the clinician-time tier selected (which reflects actual time delivered),
// finds the highest Medicaid-billable tier for that state — falling back to a
// LOWER tier only, since you can always bill for less time than you spent but
// never claim more. Returns null if the state's Medicaid covers nothing at
// or below the selected tier.
function resolveMdTier(tierKey, s) {
  const cascade = tierKey === "high" ? ["high","mid","low"] : tierKey === "mid" ? ["mid","low"] : ["low"];
  for (const key of cascade) {
    if (key === "high" && s.m80 !== null && s.m81 !== null) return { key, rate: s.m80 + s.m81, codeStr: "98980+98981" };
    if (key === "mid"  && s.m80 !== null)                    return { key, rate: s.m80,         codeStr: "98980" };
    if (key === "low"  && s.m79 !== null)                    return { key, rate: s.m79,          codeStr: "98979" };
  }
  return null;
}

// ─── Billing detail copy ──────────────────────────────────────────────────────
const BILLING_INFO = {
  device:{
    title:"When is this billed?",
    items:[
      { label:"Trigger",    text:"Patient has 2–30 active days on the IndiAide app in a 30-day period." },
      { label:"Which code", text:"98985 for 2–15 days · 98977 for 16–30 days. Only one code per 30-day period." },
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
      { label:"Trigger",    text:"40+ minutes of management time in IndiAide + at least 1 interactive communication. 98981 always billed in addition to 98980." },
      { label:"Stacking",   text:"40–59 min = 98981 ×1 · 60–79 min = 98981 ×2 · 80–99 min = 98981 ×3. Each additional 20-min block adds another 98981." },
      { label:"Tracked by", text:"\"Clinician Time\" column in IndiAide. Calculator assumes 98981 ×1 (one additional 20-min block)." },
    ],
  },
};

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmt  = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(Math.max(0,n));
const fmtK = n => n >= 100000 ? `$${(n/1000).toFixed(0)}K` : fmt(n);
const fmtN = n => Math.round(n).toLocaleString();

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
      <div style={{minWidth:280, minHeight:120, width:"100%", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", gap:10, padding:20, textAlign:"center"}}>
        <div style={{fontSize:13, color:"#64748B"}}>Scheduling widget couldn't load — often an ad blocker or network filter.</div>
        <button onClick={() => window.open(`${BOOKING_URL}?name=${encodeURIComponent(name || "")}&email=${encodeURIComponent(email || "")}`, "_blank")} style={{background:BRAND, color:"#fff", border:"none",
          borderRadius:10, padding:"10px 20px", fontSize:14, fontWeight:700, cursor:"pointer"}}>
          Book a time →
        </button>
      </div>
    );
  }

  return <div ref={containerRef} style={{minWidth:280, height, width:"100%"}} />;
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
    if (!clinicianCount)        e.clinicianCount = "Required";
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
      source, disciplines: disciplines.join(", "), clinicianCount, privatePayShare, fixFirst: fixFirst.trim(),
      submittedAt: new Date().toISOString(),
    };
    if (LEAD_WEBHOOK_URL) {
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
          RTM Revenue Calculator
        </div>
        <h1 style={{margin:0,fontSize:26,fontWeight:800,color:"#0F172A",lineHeight:1.25,maxWidth:400}}>
          See your personalized RTM revenue estimate
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
            <select value={clinicianCount} onChange={e => { setClinicianCount(e.target.value); setErrors(p=>({...p,clinicianCount:""})); }}
              style={{...inputStyle("clinicianCount"),color:clinicianCount?"#0F172A":"#94A3B8"}}>
              <option value="" disabled>Select</option>
              {["1","2-4","5-9","10-24","25-49","50+"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
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
          {loading ? "Calculating…" : "Calculate My Revenue →"}
        </button>

        <p style={{margin:"14px 0 0",fontSize:11,color:"#94A3B8",textAlign:"center",lineHeight:1.6}}>
          We'll use this to personalize your estimate and may follow up with resources specific to your state and discipline. No spam, ever.
        </p>
        <p style={{margin:"8px 0 0",fontSize:10,color:"#94A3B8",textAlign:"center",lineHeight:1.6}}>
          Estimate uses publicly available Medicare and Medicaid fee schedules. Commercial payers typically reimburse at or above these rates,
          so your actual opportunity may be higher than shown.
        </p>
      </div>

      <div style={{marginTop:18,fontSize:11,color:"#94A3B8"}}>
        Powered by IndiAide · 2026 Medicare CMS PFS + Medicaid data
      </div>
    </div>
  );
}

// Single payer revenue column (used in the two-column dual layout)
function PayerCol({ label, color, bg, totalCount, activePts, devPts, devRate, devRev, devUncovered, devNote, clinPts, clinRate, clinRev, clinUncovered, clinNote, clinFallbackNote, codeStr, monthly, annual, setup }) {
  return (
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:6,background:bg,borderRadius:6,padding:"3px 10px",marginBottom:12}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:color}} />
        <span style={{fontSize:11,fontWeight:700,color}}>{label}</span>
        <span style={{fontSize:10,color,opacity:0.7}}>{fmtN(totalCount)} patients</span>
      </div>
      {/* Device supply */}
      <div style={{marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:600,color:"#334155",marginBottom:2,textAlign:"center"}}>Device Supply</div>
        {devUncovered
          ? <div style={{fontSize:11,color:"#94A3B8",fontStyle:"italic",lineHeight:1.4}}>{devNote}</div>
          : <>
              <div style={{fontSize:11,color:"#94A3B8",marginBottom:3}}>{fmtN(devPts)} pts × {fmt(devRate)} · 50% of active</div>
              <div style={{fontSize:15,fontWeight:800,color}}>{fmt(devRev)}</div>
            </>
        }
      </div>
      {/* Clinician time */}
      <div style={{marginBottom:12,paddingBottom:12,borderBottom:"1px dashed #E2E8F0"}}>
        <div style={{fontSize:11,fontWeight:600,color:"#334155",marginBottom:2,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          Clinician Time
          <CodeBadge code={codeStr} color={color} bg={bg} />
        </div>
        {clinUncovered
          ? <div style={{fontSize:11,color:"#94A3B8",fontStyle:"italic",lineHeight:1.4}}>{clinNote}</div>
          : <>
              <div style={{fontSize:11,color:"#94A3B8",marginBottom:3}}>{fmtN(clinPts)} pts × {fmt(clinRate)} · 50% of active</div>
              <div style={{fontSize:15,fontWeight:800,color}}>{fmt(clinRev)}</div>
              {clinFallbackNote && <div style={{fontSize:10,color:AMBER,fontStyle:"italic",marginTop:3,lineHeight:1.3}}>{clinFallbackNote}</div>}
            </>
        }
      </div>
      {/* Subtotals */}
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
        <span style={{fontSize:11,color:"#64748B"}}>Monthly</span>
        <span style={{fontSize:13,fontWeight:800,color}}>{fmt(monthly)}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
        <span style={{fontSize:11,color:"#64748B"}}>Annual</span>
        <span style={{fontSize:12,fontWeight:600,color:"#334155"}}>{fmtK(annual)}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <span style={{fontSize:11,color:"#64748B"}}>Year 1 setup</span>
        <span style={{fontSize:11,color:AMBER,fontWeight:600}}>+{fmt(setup)}</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ROICalculator() {
  const [lead,         setLead]         = useState(null);   // null = not yet submitted
  const [mcCount,      setMcCount]      = useState(200);
  const [mdCount,      setMdCount]      = useState(50);
  const [stateCode,    setStateCode]    = useState("TX");
  const [adoptionKey,  setAdoptionKey]  = useState("mid");
  const [clinicianKey, setClinicianKey] = useState("mid");
  const [expandedCode, setExpandedCode] = useState(null);

  // Raw monthly patient counts from the gate form (0 if left blank there)
  const [adultPatients,     setAdultPatients]     = useState(0);
  const [pediatricPatients, setPediatricPatients] = useState(0);

  // Payer-mix % used to derive the Medicare/Medicaid boxes above from the raw counts.
  // NOTE: these three defaults are placeholders, not real market data — swap in
  // your actual SLP/OT payer-mix figures when you have them. They only affect the
  // pre-fill; the Medicare/Medicaid boxes remain freely editable either way.
  const [adultsMcPct, setAdultsMcPct] = useState(50);  // % of adult patients on Medicare
  const [adultsMdPct, setAdultsMdPct] = useState(20);  // % of adult patients on Medicaid
  const [pedsMdPct,   setPedsMdPct]   = useState(55);  // % of pediatric patients on Medicaid

  // Conference/embed routing — read once from the URL. source defaults to "website"
  // when absent (the existing rtm-calculator page); mode=table triggers the compact
  // laptop/tablet view used at the conference table.
  const source      = useMemo(() => new URLSearchParams(window.location.search).get("source") || "website", []);
  const isTableMode = useMemo(() => new URLSearchParams(window.location.search).get("mode") === "table", []);
  const [expanded, setExpanded] = useState(false); // "See full breakdown" toggle in compact view

  const s    = ALL_STATES[stateCode] || ALL_STATES["TX"];
  const dual = isDualState(s);

  // Builds an accurate Medicaid coverage footnote for ANY partial-coverage pattern
  // (not just the 98979-only case) — covers states like DC/OR (only 98979 billable),
  // NE (only 98975 billable), UT (only 98980/98981 billable), etc.
  const mdCoverageNote = useMemo(() => {
    if (!dual) return null;
    const codeLabels = { r75:"98975", r77:"98977", r79:"98979", r80:"98980", r81:"98981" };
    const uncovered = Object.entries(codeLabels).filter(([k]) => s[`m${k.slice(1)}`] === null).map(([,v]) => v);
    if (uncovered.length === 0) return null;
    const covered = Object.entries(codeLabels).filter(([k]) => s[`m${k.slice(1)}`] !== null).map(([,v]) => v);
    const uncoveredStr = uncovered.join(", ");
    const coveredStr = covered.length
      ? ` ${covered.join(", ")} ${covered.length === 1 ? "remains" : "remain"} billable.`
      : " No RTM codes are separately reimbursed by Medicaid in this state.";
    return ` ${s.name} Medicaid does not separately reimburse ${uncoveredStr}.${coveredStr}`;
  }, [dual, s]);

  const C = useMemo(() => {
    const adoption = ADOPTION.find(a => a.key === adoptionKey).pct;

    // Medicare
    const mcActive  = Math.round(mcCount * adoption);
    const mcDevPts  = Math.round(mcActive * DEVICE_BILL_PCT);
    const mcClinPts = Math.round(mcActive * CLINICIAN_BILL_PCT);
    const mcDevRev  = mcDevPts * s.r77;
    const mcClinR   = clinicianKey==="low" ? s.r79 : clinicianKey==="mid" ? s.r80 : s.r80+s.r81;
    const mcClinRev = mcClinPts * mcClinR;
    const mcMonthly = mcDevRev + mcClinRev;
    const mcAnnual  = mcMonthly * 12;
    const mcSetup   = mcCount * s.r75;

    // Medicaid (only if dual state, else zeros)
    const mdActive  = dual ? Math.round(mdCount * adoption) : 0;
    const mdDevPts  = Math.round(mdActive * DEVICE_BILL_PCT);
    const mdClinPts = Math.round(mdActive * CLINICIAN_BILL_PCT);
    const mdDevUncov  = dual && s.m77 === null;
    const mdDevRev  = dual ? mdDevPts * s.m77 : 0;
    const mdTier      = dual ? resolveMdTier(clinicianKey, s) : null;
    const mdClinUncov = dual && mdTier === null;               // nothing billable at all, even with fallback
    const mdClinFallback = dual && mdTier !== null && mdTier.key !== clinicianKey; // billing a lower tier than Medicare's selection
    const mdClinR   = mdTier ? mdTier.rate : 0;
    const mdClinRev = mdTier ? mdClinPts * mdTier.rate : 0;
    const mdMonthly = mdDevRev + mdClinRev;
    const mdAnnual  = mdMonthly * 12;
    const mdSetup   = dual ? mdCount * s.m75 : 0;

    // Note only shown when NOTHING is billable to Medicaid (no fallback tier exists either)
    const mdClinUncovCodes = clinicianKey==="low" ? "98979" : clinicianKey==="mid" ? "98980" : "98980 and 98981";
    const mdClinNote = `${mdClinUncovCodes} not reimbursed under ${s.name} Medicaid.`;
    const mdDevNote  = `98977 not reimbursed under ${s.name} Medicaid.`;
    // Shown when Medicaid bills a lower tier than Medicare (fallback happened)
    const mcClinCodeStr = clinicianKey==="low" ? "98979" : clinicianKey==="mid" ? "98980" : "98980+98981";
    const mdClinFallbackNote = mdClinFallback
      ? `Billed as ${mdTier.codeStr} (${CLINICIAN.find(c=>c.key===mdTier.key).label}) — ${s.name} Medicaid doesn't reimburse ${mcClinCodeStr}.`
      : null;

    // Combined
    const totalActive    = mcActive + mdActive;
    const indiRate       = getIndiRate(totalActive);
    const indiLabel      = getIndiLabel(totalActive);
    const indiMonthly    = totalActive * indiRate;
    const combMonthly    = mcMonthly + mdMonthly;
    const combAnnual     = combMonthly * 12;
    const combSetup      = mcSetup + mdSetup;
    const year1Total     = combAnnual + combSetup;
    const netMonthly     = combMonthly - indiMonthly;
    const netAnnual      = combAnnual - indiMonthly * 12;
    const roi            = indiMonthly > 0 ? Math.round(netMonthly / indiMonthly * 100) : 0;

    return {
      mcActive, mcDevPts, mcClinPts, mcClinR, mcDevRev, mcClinRev, mcMonthly, mcAnnual, mcSetup,
      mdActive, mdDevPts, mdClinPts, mdClinR, mdClinRev, mdDevRev, mdMonthly, mdAnnual, mdSetup,
      mdClinUncov, mdDevUncov, mdClinNote, mdDevNote,
      mdTier, mdClinFallback, mdClinFallbackNote,
      totalActive, indiRate, indiLabel, indiMonthly,
      combMonthly, combAnnual, combSetup, year1Total,
      netMonthly, netAnnual, roi,
    };
  }, [mcCount, mdCount, stateCode, adoptionKey, clinicianKey, s, dual]);

  // Comparison table rows
  const compRows = useMemo(() => {
    const adoption = ADOPTION.find(a => a.key === adoptionKey).pct;
    const mcA  = Math.round(mcCount * adoption);
    const mdA  = dual ? Math.round(mdCount * adoption) : 0;
    const totA = mcA + mdA;
    const iR   = getIndiRate(totA);
    const mcD  = Math.round(mcA * DEVICE_BILL_PCT) * s.r77;
    const mdD  = dual ? Math.round(mdA * DEVICE_BILL_PCT) * s.m77 : 0;
    return CLINICIAN.map(sc => {
      const mcCR  = sc.key==="low" ? s.r79 : sc.key==="mid" ? s.r80 : s.r80+s.r81;
      const mdT   = dual ? resolveMdTier(sc.key, s) : null;
      const mdCUncov   = dual && mdT === null;
      const mdCFallback = dual && mdT !== null && mdT.key !== sc.key;
      const mdCR = mdT ? mdT.rate : 0;
      const mcMr = mcD + Math.round(mcA * CLINICIAN_BILL_PCT) * mcCR;
      const mdMr = mdD + Math.round(mdA * CLINICIAN_BILL_PCT) * mdCR;
      const mr   = mcMr + mdMr;
      const ar   = mr * 12;
      const net  = ar - iR * totA * 12;
      const roi  = (iR * totA) > 0 ? Math.round((mr - iR*totA) / (iR*totA) * 100) : 0;
      return { ...sc, mcMr, mdMr, mr, ar, net, roi, mdCUncov, mdCFallback, mdTierCodeStr: mdT ? mdT.codeStr : null };
    });
  }, [mcCount, mdCount, stateCode, adoptionKey, s, dual]);

  const clin    = CLINICIAN.find(c => c.key === clinicianKey);
  const billKey = `clinician_${clinicianKey}`;
  const card    = { background:"#fff", borderRadius:16, border:"1px solid #E2E8F0", padding:24, marginBottom:16 };

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
  }, [lead, adoptionKey, clinicianKey, stateCode, expandedCode]);

  // Gate check — all hooks above, conditional render below (rules of hooks compliant)
  if (!lead) {
    return (
      <GateScreen source={source} onSubmit={data => {
        setLead(data);
        setStateCode(data.state);
        // Only treat the fields as "given" if the prospect actually typed something —
        // someone who leaves both blank still gets the 200/50 starting point. But once
        // either field has real input (including an explicit 0), trust it completely:
        // an explicit 0 should zero out that payer, not fall back to the defaults.
        const adultsGiven = data.adultPatients.trim() !== "";
        const pedsGiven    = data.pediatricPatients.trim() !== "";
        if (adultsGiven || pedsGiven) {
          const adults = parseInt(data.adultPatients, 10) || 0;
          const peds   = parseInt(data.pediatricPatients, 10) || 0;
          setAdultPatients(adults);
          setPediatricPatients(peds);
          setMcCount(Math.round(adults * adultsMcPct / 100));
          setMdCount(Math.round(adults * adultsMdPct / 100 + peds * pedsMdPct / 100));
        }
      }} />
    );
  }

  return (
    <div style={{width:"100%",background:"#fff",colorScheme:"light"}}>
    <div style={{fontFamily:"'Inter',sans-serif",width:"100%",maxWidth:860,margin:"0 auto",padding:"16px 24px",boxSizing:"border-box"}}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      {isTableMode ? (
        <div style={{textAlign:"center",padding:"18px 0 10px"}}>
          <div style={{fontSize:"clamp(24px,5vw,34px)",fontWeight:800,color:"#0F172A",lineHeight:1.15}}>{lead.practice}</div>
          <div style={{fontSize:"clamp(14px,3vw,18px)",fontWeight:600,color:BRAND,marginTop:4}}>{s.name}</div>
          <div style={{fontSize:"clamp(11px,2.5vw,13px)",fontWeight:600,color:"#64748B",marginTop:4}}>
            {fmtN(adultPatients)} adult · {fmtN(pediatricPatients)} pediatric patients/month
          </div>
        </div>
      ) : (
        <div style={{textAlign:"center",padding:"20px 0 24px"}}>
          <a href="https://calendly.com/indiaide-scheduling/30min" target="_blank" rel="noopener noreferrer">
            <img src="/indiaide-animation.svg" alt="IndiAide" style={{width:320,marginBottom:12,cursor:"pointer"}} />
          </a>
          <div style={{fontSize:22,fontWeight:800,color:BRAND,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:8}}>
            RTM Revenue Calculator
          </div>
          <h1 style={{margin:0,fontSize:26,fontWeight:800,color:"#0F172A",lineHeight:1.25}}>
            {lead.firstName}, here's your RTM revenue estimate
          </h1>
          <p style={{margin:"8px 0 0",fontSize:13,color:"#64748B",lineHeight:1.6,maxWidth:520,marginLeft:"auto",marginRight:"auto"}}>
            For <strong>{lead.practice}</strong> · {lead.role}
            {" "}· Based on 2026 Medicare CMS rates{dual ? " + Medicaid" : ""} for {s.name}.
          </p>
          {dual && (
            <div style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:10,background:GREEN_LIGHT,border:"1px solid #D1FAE5",borderRadius:999,padding:"4px 12px"}}>
              <span style={{color:GREEN,fontSize:11,fontWeight:700}}>✅ {s.name} Medicaid also reimburses RTM — both payers shown below</span>
            </div>
          )}
        </div>
      )}

      {/* ── Compact summary (conference table view) ─────────────────────────── */}
      {isTableMode && (
        <div style={{marginBottom:20}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:16}}>
            <BigKpi label="Monthly Conservative" value={fmt(C.combMonthly)} color={BRAND} inverted />
            <BigKpi label="Annual Conservative"  value={fmtK(C.combAnnual)} color={BRAND} inverted />
            <BigKpi label="Net Profit Monthly"   value={fmt(C.netMonthly)} color={GREEN} />
            <BigKpi label="ROI"                  value={`${C.roi}%`} color={AMBER} />
          </div>
          <div style={{textAlign:"center",marginBottom:18}}>
            <div style={{fontSize:12,fontWeight:800,color:AMBER,textTransform:"uppercase",letterSpacing:"0.06em"}}>Year 1 Bonus — CPT 98975</div>
            <div style={{fontSize:"clamp(24px,6vw,32px)",fontWeight:800,color:AMBER,marginTop:2}}>+ {fmt(C.combSetup)}</div>
          </div>
          <div style={{background:"#fff",borderRadius:12,padding:8,marginBottom:14}}>
            <CalendlyInline name={lead.firstName} email={lead.email} height={600} />
          </div>
          <div style={{textAlign:"center"}}>
            <button onClick={() => setExpanded(x => !x)} style={{
              background:"transparent",border:"none",color:BRAND,fontSize:13,fontWeight:700,
              cursor:"pointer",textDecoration:"underline",padding:8,
            }}>
              {expanded ? "Hide full breakdown ↑" : "See full breakdown ↓"}
            </button>
          </div>
          {!expanded && (
            <p style={{textAlign:"center",fontSize:10,color:"#94A3B8",marginTop:10,lineHeight:1.6}}>
              Estimate uses published Medicare{dual ? " and Medicaid" : ""} fee schedules for {s.name}. Actual reimbursement varies by payer mix and documentation. For informational purposes only.
            </p>
          )}
        </div>
      )}

      {(!isTableMode || expanded) && <>

      {/* ── Inputs ────────────────────────────────────────────────────────── */}
      <div style={card}>

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
              <div key={label} style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                <label style={{fontSize:13,color:"#64748B",minWidth:150}}>{label}</label>
                <input type="range" min={0} max={100} step={1} value={val}
                  onChange={e => {
                    let pct = parseInt(e.target.value,10);
                    // Adults on Medicare + Adults on Medicaid draw from the SAME adult pool —
                    // they must share one 100% budget, or maxing both out double-counts adults
                    // into ghost patients that don't exist. Pediatric has its own pool (no
                    // Medicare eligibility), so it stays independent.
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
                  style={{flex:1}} />
                <span style={{fontSize:13,fontWeight:600,minWidth:34,textAlign:"right"}}>{val}%</span>
              </div>
            ))}
            <div style={{fontSize:10,color:"#94A3B8",marginTop:2}}>
              Adults on Medicare + Adults on Medicaid share one 100% pool — raising one lowers the other.
            </div>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:18}}>
          {/* Medicare patients */}
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:BLUE,marginBottom:6}}>
              Medicare Patients
            </label>
            <input type="number" min={0} max={999999} value={mcCount}
              onChange={e => setMcCount(Math.max(0,Math.min(999999,parseInt(e.target.value)||0)))}
              style={{width:"100%",padding:"10px 12px",border:`1.5px solid ${BLUE}44`,borderRadius:8,fontSize:16,fontWeight:700,color:"#0F172A",boxSizing:"border-box",background:"#fff",colorScheme:"light"}}
            />
            <div style={{fontSize:11,color:"#94A3B8",marginTop:4}}>
              {adultPatients>0 ? `${adultsMcPct}% of ${fmtN(adultPatients)} adults` : "Active Medicare caseload"}
            </div>
          </div>
          {/* Medicaid patients */}
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:dual?GREEN:"#94A3B8",marginBottom:6}}>
              Medicaid Patients
            </label>
            <input type="number" min={0} max={999999} value={mdCount}
              onChange={e => setMdCount(Math.max(0,Math.min(999999,parseInt(e.target.value)||0)))}
              style={{width:"100%",padding:"10px 12px",border:`1.5px solid ${dual?GREEN+"44":"#E2E8F0"}`,borderRadius:8,fontSize:16,fontWeight:700,color:dual?"#0F172A":"#94A3B8",boxSizing:"border-box",background:dual?"#fff":"#F8FAFC",colorScheme:"light"}}
            />
            <div style={{fontSize:11,color:"#94A3B8",marginTop:4}}>
              {!dual ? `Medicaid RTM not reimbursed in ${s.name}`
                : (adultPatients>0||pediatricPatients>0)
                  ? `${fmtN(Math.round(adultPatients*adultsMdPct/100))} adult + ${fmtN(Math.round(pediatricPatients*pedsMdPct/100))} pediatric`
                  : "Active Medicaid caseload"}
            </div>
          </div>
          {/* State */}
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:SLATE,marginBottom:6}}>
              State of Practice
            </label>
            <select value={stateCode} onChange={e => setStateCode(e.target.value)}
              style={{width:"100%",padding:"10px 12px",border:"1.5px solid #E2E8F0",borderRadius:8,fontSize:13,color:"#0F172A",boxSizing:"border-box",background:"#fff",colorScheme:"light"}}
            >
              <optgroup label={`✅ Medicare + Medicaid RTM (${DUAL_LIST.length} states)`}>
                {DUAL_LIST.map(([c,n]) => <option key={c} value={c}>{n}</option>)}
              </optgroup>
              <optgroup label="Medicare RTM Only">
                {SINGLE_LIST.map(([c,n]) => <option key={c} value={c}>{n}</option>)}
              </optgroup>
            </select>
            <div style={{fontSize:10,color:"#94A3B8",marginTop:4}}>
              {dual
                ? (mdCoverageNote
                    ? <span style={{color:AMBER,fontWeight:600}}>⚠️ Medicare + partial Medicaid RTM coverage in {s.name} · Q3 2026</span>
                    : <span style={{color:GREEN,fontWeight:600}}>✅ Both Medicare &amp; Medicaid fully reimburse RTM in {s.name} · Q3 2026</span>)
                : "Medicare RTM · 2026 CMS PFS rates"
              }
            </div>
          </div>
        </div>

        {(() => {
          const totalPts = adultPatients + pediatricPatients;
          const gap = totalPts - mcCount - mdCount;
          if (totalPts <= 0 || gap <= 0) return null;
          return (
            <div style={{marginBottom:18,padding:"11px 13px",background:AMBER_LIGHT,borderRadius:8}}>
              <span style={{fontSize:12,color:"#92400E",lineHeight:1.55}}>
                <strong>{fmtN(gap)} of your {fmtN(totalPts)} monthly patients are commercial.</strong>{" "}
                Figures above use published Medicare and Medicaid fee schedules only — commercial payers frequently
                reimburse at or above these rates, so your actual opportunity is likely higher.
              </span>
            </div>
          );
        })()}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:SLATE,marginBottom:6}}>IndiAide Adoption Rate</label>
            <Toggle options={ADOPTION} value={adoptionKey} onChange={setAdoptionKey} />
            <div style={{fontSize:11,color:"#94A3B8",marginTop:5}}>
              % of caseload enrolled &amp; active →{" "}
              <strong style={{color:BRAND}}>{fmtN(C.totalActive)} active{dual ? ` (Medicare ${fmtN(C.mcActive)} + Medicaid ${fmtN(C.mdActive)})` : ""}</strong>
            </div>
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:SLATE,marginBottom:6}}>Clinician Time Per Patient / Month</label>
            <Toggle options={CLINICIAN} value={clinicianKey} onChange={setClinicianKey} activeColor={GREEN} />
            <div style={{fontSize:11,color:"#94A3B8",marginTop:5}}>
              Management time + 1 interactive communication → bills{" "}
              <strong style={{color:GREEN}}>{clin.codeStr}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards (skipped in table mode — compact tiles above cover this) ── */}
      {!isTableMode && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
          <KpiCard label={dual?"Combined Monthly":"Monthly Revenue"} value={fmt(C.combMonthly)} sub={dual?"Medicare + Medicaid":"recurring"} color={BRAND} inverted />
          <KpiCard label={dual?"Combined Annual":"Annual Revenue"}   value={fmtK(C.combAnnual)} sub="recurring" color={BRAND} inverted />
          <KpiCard label="Net Monthly"  value={fmt(C.netMonthly)} sub={`$${C.indiRate}/pt · ${C.indiLabel} tier`} color={GREEN} />
          <KpiCard label="ROI"          value={`${C.roi}%`}       sub="return on platform" color={AMBER} />
        </div>
      )}

      {/* ── Year 1 Setup Banner ───────────────────────────────────────────── */}
      <div style={{background:AMBER_LIGHT,border:"1px solid #FDE68A",borderRadius:12,padding:"14px 20px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:AMBER,textTransform:"uppercase",letterSpacing:"0.06em"}}>Year 1 Bonus — CPT 98975</div>
          <div style={{fontSize:13,color:"#78350F",marginTop:2}}>Setup &amp; education · billed once per patient · triggers with 2+ active days</div>
          <div style={{fontSize:11,color:"#92400E",marginTop:4,display:"flex",gap:16,flexWrap:"wrap"}}>
            <span>Medicare: {fmtN(mcCount)} pts × {fmt(s.r75)} = <strong>{fmt(C.mcSetup)}</strong></span>
            {dual && <span>Medicaid: {fmtN(mdCount)} pts × {fmt(s.m75)} = <strong>{fmt(C.mdSetup)}</strong></span>}
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:20,fontWeight:800,color:AMBER}}>+ {fmt(C.combSetup)}</div>
          <div style={{fontSize:11,color:"#92400E",marginTop:2}}>= {fmtK(C.year1Total)} total in Year 1</div>
        </div>
      </div>

      {/* ── Revenue Breakdown ─────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,color:SLATE,textTransform:"uppercase",letterSpacing:"0.06em"}}>Monthly Revenue Breakdown</div>
          <div style={{fontSize:12,color:"#94A3B8",marginTop:4}}>
            {dual
              ? `${ADOPTION.find(a=>a.key===adoptionKey).label} adoption · Medicare ${fmtN(C.mcActive)} + Medicaid ${fmtN(C.mdActive)} active patients · ${s.name} 2026`
              : `${ADOPTION.find(a=>a.key===adoptionKey).label} adoption · ${fmtN(C.mcActive)} active patients · ${s.name} Medicare 2026`
            }
          </div>
        </div>

        {dual ? (
          /* ── Two-column payer view ── */
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:0,marginBottom:16}}>
              <PayerCol
                label="Medicare"  color={BLUE}  bg={BLUE_LIGHT}
                totalCount={mcCount} activePts={C.mcActive}
                devPts={C.mcDevPts} devRate={s.r77} devRev={C.mcDevRev}
                clinPts={C.mcClinPts} clinRate={C.mcClinR} clinRev={C.mcClinRev}
                clinUncovered={false}
                codeStr={clin.codeStr}
                monthly={C.mcMonthly} annual={C.mcAnnual} setup={C.mcSetup}
              />
              <div style={{width:1,background:"#E2E8F0",margin:"0 16px"}} />
              <PayerCol
                label="Medicaid" color={GREEN} bg={GREEN_LIGHT}
                totalCount={mdCount} activePts={C.mdActive}
                devPts={C.mdDevPts} devRate={s.m77} devRev={C.mdDevRev}
                devUncovered={C.mdDevUncov} devNote={C.mdDevNote}
                clinPts={C.mdClinPts} clinRate={C.mdClinR} clinRev={C.mdClinRev}
                clinUncovered={C.mdClinUncov}
                clinNote={C.mdClinNote}
                clinFallbackNote={C.mdClinFallbackNote}
                codeStr={C.mdTier ? C.mdTier.codeStr : clin.codeStr}
                monthly={C.mdMonthly} annual={C.mdAnnual} setup={C.mdSetup}
              />
            </div>
            {/* Expanders */}
            <div style={{borderTop:"1px solid #F1F5F9",paddingTop:12,display:"grid",gridTemplateColumns: C.mdClinFallback ? "1fr 1fr 1fr" : "1fr 1fr",gap:16}}>
              <BillingDetail id="device" open={expandedCode} onToggle={setExpandedCode} info={BILLING_INFO.device} />
              <BillingDetail id="clinician" open={expandedCode} onToggle={setExpandedCode}
                info={C.mdClinFallback ? {...BILLING_INFO[billKey], title:`Medicare: ${BILLING_INFO[billKey].title}`} : BILLING_INFO[billKey]} />
              {C.mdClinFallback && (
                <BillingDetail id="clinician_md" open={expandedCode} onToggle={setExpandedCode}
                  info={{...BILLING_INFO[`clinician_${C.mdTier.key}`], title:`Medicaid: ${BILLING_INFO[`clinician_${C.mdTier.key}`].title}`}} />
              )}
            </div>
          </>
        ) : (
          /* ── Single Medicare column ── */
          <>
            <div style={{padding:"12px 0",borderBottom:"1px solid #F1F5F9"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                    <CodeBadge code="98977 / 98985" color={BRAND} bg={BRAND_BG} />
                    <span style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>Device Supply</span>
                  </div>
                  <div style={{fontSize:11,color:"#94A3B8"}}>{fmtN(C.mcDevPts)} patients × {fmt(s.r77)} · ~50% of active patients billed monthly</div>
                  <BillingDetail id="device" open={expandedCode} onToggle={setExpandedCode} info={BILLING_INFO.device} />
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:16,fontWeight:800,color:BRAND}}>{fmt(C.mcDevRev)}</div>
                  <div style={{fontSize:10,color:"#94A3B8"}}>per month</div>
                </div>
              </div>
            </div>
            <div style={{padding:"12px 0",borderBottom:"1px solid #F1F5F9"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                    <CodeBadge code={clin.codeStr} color={GREEN} bg={GREEN_LIGHT} />
                    <span style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>Clinician Time — {clin.label}/month</span>
                  </div>
                  <div style={{fontSize:11,color:"#94A3B8"}}>{fmtN(C.mcClinPts)} patients × {fmt(C.mcClinR)} · ~50% of active patients billed monthly</div>
                  <BillingDetail id="clinician" open={expandedCode} onToggle={setExpandedCode} info={BILLING_INFO[billKey]} />
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:16,fontWeight:800,color:GREEN}}>{fmt(C.mcClinRev)}</div>
                  <div style={{fontSize:10,color:"#94A3B8"}}>per month</div>
                </div>
              </div>
            </div>
            {/* Medicare-only notice */}
            <div style={{marginTop:12,padding:"10px 14px",background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,fontSize:12,color:"#64748B"}}>
              💡 <strong>{s.name}</strong> Medicaid does not currently reimburse RTM codes.
              Switch to one of the <strong style={{color:GREEN}}>{DUAL_LIST.length} ✅ states</strong> in the dropdown to see Medicaid revenue alongside Medicare.
            </div>
          </>
        )}

        {/* Combined total */}
        <div style={{marginTop:16,borderTop:"2px solid #E2E8F0",paddingTop:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>
              {dual ? "Combined Monthly Total" : "Monthly Total"}
            </div>
            <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>
              IndiAide: {fmt(C.indiMonthly)}/mo · {C.indiLabel} tier · ${C.indiRate}/active patient
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:22,fontWeight:800,color:BRAND}}>{fmt(C.combMonthly)}</div>
            <div style={{fontSize:12,fontWeight:600,color:GREEN}}>Net {fmt(C.netMonthly)}/mo</div>
          </div>
        </div>
      </div>

      {/* ── Scenario Comparison ───────────────────────────────────────────── */}
      <div style={card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:SLATE,textTransform:"uppercase",letterSpacing:"0.06em"}}>Clinician Time Comparison</div>
            <div style={{fontSize:12,color:"#94A3B8",marginTop:3}}>
            {ADOPTION.find(a=>a.key===adoptionKey).label} adoption · {fmtN(C.totalActive)} active patients · {s.name}
            </div>
          </div>
          <div style={{fontSize:11,color:"#94A3B8"}}>Click a row to update ↑</div>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{borderBottom:"2px solid #F1F5F9"}}>
                {(dual
                  ? ["Time/Mo","Code","Medicare","Medicaid","Combined","Net Annual","ROI"]
                  : ["Time/Mo","Code","Monthly","Annual","Net Annual","ROI"]
                ).map(h => (
                  <th key={h} style={{
                    padding:"6px 8px",
                    textAlign:(h==="Time/Mo"||h==="Code")?"left":"right",
                    fontSize:10,fontWeight:700,color:"#94A3B8",
                    textTransform:"uppercase",letterSpacing:"0.04em",whiteSpace:"nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compRows.map(row => {
                const on = row.key === clinicianKey;
                return (
                  <tr key={row.key} onClick={() => setClinicianKey(row.key)} style={{
                    background:on?BRAND_LIGHT:"transparent",
                    borderLeft:`3px solid ${on?BRAND:"transparent"}`,
                    borderBottom:"1px solid #F8FAFC",
                    cursor:"pointer",transition:"background 0.1s",
                  }}>
                    <td style={{padding:"10px 8px",fontWeight:on?700:500,color:on?BRAND:SLATE}}>
                      {row.label}
                      {on && <span style={{marginLeft:6,fontSize:9,background:BRAND,color:"#fff",borderRadius:999,padding:"1px 5px"}}>Active</span>}
                    </td>
                    <td style={{padding:"10px 8px",fontFamily:"monospace",fontSize:11,color:on?BRAND:"#94A3B8"}}>
                      {row.codeStr}
                      {row.mdCUncov && <span style={{marginLeft:4,fontSize:9,color:"#94A3B8",fontFamily:"sans-serif",fontStyle:"italic"}}>MD: {row.key==="low"?"98979":row.key==="mid"?"98980":"98980+81"} N/C</span>}
                      {row.mdCFallback && <span style={{marginLeft:4,fontSize:9,color:AMBER,fontFamily:"sans-serif",fontStyle:"italic"}}>MD → {row.mdTierCodeStr}</span>}
                    </td>
                    {dual && <td style={{padding:"10px 8px",textAlign:"right",color:BLUE,fontWeight:600}}>{fmt(row.mcMr)}</td>}
                    {dual && <td style={{padding:"10px 8px",textAlign:"right",color:GREEN,fontWeight:600}}>{fmt(row.mdMr)}</td>}
                    <td style={{padding:"10px 8px",textAlign:"right",fontWeight:700,color:on?BRAND:"#1e293b"}}>
                      {dual ? fmt(row.mr) : fmt(row.mcMr)}
                    </td>
                    {!dual && <td style={{padding:"10px 8px",textAlign:"right",color:on?BRAND:SLATE}}>{fmtK(row.mr * 12)}</td>}
                    <td style={{padding:"10px 8px",textAlign:"right",fontWeight:700,color:GREEN}}>{fmtK(row.net)}</td>
                    <td style={{padding:"10px 8px",textAlign:"right",fontWeight:800,color:on?AMBER:"#94A3B8"}}>{row.roi}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <div style={{background:BRAND,borderRadius:18,padding:"32px 28px",color:"#fff",boxShadow:`0 8px 32px ${BRAND}33`,textAlign:"center"}}>
        <div style={{fontSize:13,opacity:0.8,lineHeight:1.6,marginBottom:18,maxWidth:520,margin:"0 auto 18px"}}>
          You spend time between sessions on your patients, reviewing their progress, adjusting their home program, checking in. That work doesn't fall through the cracks. But for most clinics, it also doesn't get reimbursed.
        </div>
        <div style={{fontSize:24,fontWeight:800,lineHeight:1.2,marginBottom:10}}>
          {fmtK(C.combAnnual)}/year{dual ? " across both payers" : ""}, from work you're already doing.
        </div>
        <div style={{fontSize:13,opacity:0.82,lineHeight:1.65,marginBottom:20,maxWidth:500,margin:"0 auto 20px"}}>
          IndiAide tracks everything {dual ? "Medicare and Medicaid need" : "Medicare needs"} to see for RTM billing — active days, clinician time, patient communication — automatically.
        </div>
        <div style={{borderLeft:"3px solid rgba(255,255,255,0.4)",paddingLeft:16,marginBottom:24,textAlign:"left",maxWidth:500,margin:"0 auto 24px"}}>
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

      {/* ── Disclaimer ────────────────────────────────────────────────────── */}
      <p style={{textAlign:"center",fontSize:10,color:"#94A3B8",marginTop:14,lineHeight:1.75,maxWidth:680}}>
        Medicare estimates use 2026 CMS Physician Fee Schedule NonFac rates for {s.name}.
        {dual && ` Medicaid estimates use Q3 2026 ${s.name} state fee schedule rates.`}
        {" "}Device supply assumes 98977 (musculoskeletal, 16–30 active days), billable for approximately 50% of active patients per month.
        Clinician time assumes approximately 50% of active patients billed monthly, requiring documented management time plus at least one interactive communication.
        {mdCoverageNote}
        {" "}Adoption rate reflects estimated proportion of caseload actively enrolled and using IndiAide.
        Setup code 98975 billed once per episode of care.
        IndiAide qualifies as Software as a Medical Device (SaMD) — no physical device or DME required.
        Actual reimbursement varies by payer mix, patient eligibility, and clinical documentation. For informational purposes only.
      </p>

      </>}

    </div>
    </div>
  );
}
