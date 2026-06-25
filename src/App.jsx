import { useState, useMemo, useEffect } from "react";

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
// Dual-coverage states also carry m* Medicaid rates (Q2 2026 verified fee schedules)
// m79=null → 98979 not separately covered under that state's Medicaid
const ALL_STATES = {
  "AK":{ name:"Alaska",             r75:22.78, r77:54.61, r79:32.43, r80:66.12, r81:52.46 },
  "AL":{ name:"Alabama",            r75:18.79, r77:44.90, r79:24.28, r80:49.62, r81:38.48 },
  "AR":{ name:"Arkansas",           r75:18.42, r77:44.07, r79:24.01, r80:49.06, r81:38.11 },
  "AZ":{ name:"Arizona",            r75:19.16, r77:41.91, r79:24.01, r80:49.23, r81:38.50,  m75:20.57, m77:45.33, m79:27.20, m80:53.00, m81:41.49 },
  "CA":{ name:"California",         r75:23.42, r77:56.19, r79:27.91, r80:57.11, r81:43.22 },
  "CO":{ name:"Colorado",           r75:20.63, r77:45.23, r79:25.17, r80:51.60, r81:40.03,  m75:17.23, m77:37.45, m79:55.23, m80:43.86, m81:35.40 },
  "CT":{ name:"Connecticut",        r75:23.47, r77:55.44, r79:27.87, r80:57.23, r81:43.58 },
  "DC":{ name:"Washington D.C.",    r75:25.53, r77:60.57, r79:29.78, r80:61.11, r81:46.20 },
  "DE":{ name:"Delaware",           r75:21.39, r77:50.79, r79:26.22, r80:53.72, r81:41.18,  m75:20.96, m77:38.78, m79:null,  m80:52.65, m81:40.36 },
  "FL":{ name:"Florida",            r75:21.12, r77:49.36, r79:25.86, r80:53.19, r81:41.04 },
  "GA":{ name:"Georgia",            r75:17.58, r77:38.07, r79:22.89, r80:46.93, r81:37.18,  m75:15.84, m77:45.67, m79:22.63, m80:41.09, m81:33.39 },
  "HI":{ name:"Hawaii",             r75:17.58, r77:38.07, r79:22.89, r80:46.93, r81:37.18,  m75:22.56, m77:54.12, m79:null,  m80:30.95, m81:30.61 },
  "IA":{ name:"Iowa",               r75:19.52, r77:46.89, r79:24.85, r80:50.75, r81:39.11,  m75:19.55, m77:57.13, m79:null,  m80:53.12, m81:43.29 },
  "ID":{ name:"Idaho",              r75:19.68, r77:47.17, r79:24.95, r80:50.99, r81:39.29 },
  "IL":{ name:"Illinois",           r75:20.70, r77:47.69, r79:25.47, r80:52.53, r81:40.83 },
  "IN":{ name:"Indiana",            r75:19.83, r77:47.54, r79:25.07, r80:51.23, r81:39.44,  m75:17.91, m77:39.52, m79:null,  m80:47.23, m81:37.06 },
  "KS":{ name:"Kansas",             r75:19.36, r77:46.37, r79:24.71, r80:50.50, r81:39.00 },
  "KY":{ name:"Kentucky",           r75:19.32, r77:45.74, r79:24.62, r80:50.43, r81:39.11,  m75:14.41, m77:31.66, m79:10.00, m80:22.08, m81:22.08 },
  "LA":{ name:"Louisiana",          r75:20.56, r77:48.47, r79:25.51, r80:52.33, r81:40.37 },
  "MA":{ name:"Massachusetts",      r75:25.72, r77:61.31, r79:29.82, r80:61.13, r81:46.03 },
  "MD":{ name:"Maryland",           r75:21.91, r77:52.02, r79:26.65, r80:54.62, r81:41.78 },
  "ME":{ name:"Maine",              r75:17.84, r77:39.19, r79:23.01, r80:47.18, r81:37.11,  m75:14.31, m77:34.19, m79:18.10, m80:37.03, m81:28.55 },
  "MI":{ name:"Michigan",           r75:18.14, r77:39.28, r79:23.31, r80:47.80, r81:37.75,  m75:13.85, m77:32.80, m79:16.83, m80:34.51, m81:26.41 },
  "MN":{ name:"Minnesota",          r75:19.76, r77:43.86, r79:24.36, r80:49.95, r81:38.69,  m75:16.72, m77:40.39, m79:20.32, m80:41.68, m81:31.64 },
  "MO":{ name:"Missouri",           r75:18.79, r77:44.38, r79:24.21, r80:49.61, r81:38.63 },
  "MS":{ name:"Mississippi",        r75:18.61, r77:44.25, r79:24.12, r80:49.34, r81:38.37,  m75:15.08, m77:28.42, m79:21.71, m80:25.15, m81:24.61 },
  "MT":{ name:"Montana",            r75:21.71, r77:51.44, r79:26.39, r80:54.11, r81:41.42,  m75:27.70, m77:60.40, m79:35.87, m80:70.34, m81:54.90 },
  "NC":{ name:"North Carolina",     r75:20.06, r77:47.89, r79:25.21, r80:51.58, r81:39.71,  m75:15.40, m77:44.43, m79:null,  m80:41.25, m81:33.73 },
  "ND":{ name:"North Dakota",       r75:21.31, r77:51.24, r79:26.19, r80:53.51, r81:40.82 },
  "NE":{ name:"Nebraska",           r75:19.67, r77:47.29, r79:24.97, r80:50.99, r81:39.25 },
  "NH":{ name:"New Hampshire",      r75:22.49, r77:53.49, r79:26.99, r80:55.31, r81:42.11,  m75:19.03, m77:53.30, m79:null,  m80:48.54, m81:39.30 },
  "NJ":{ name:"New Jersey",         r75:25.12, r77:59.64, r79:29.57, r80:60.67, r81:45.98,  m75:10.36, m77:22.60, m79:5.64,  m80:25.71, m81:19.94 },
  "NM":{ name:"New Mexico",         r75:20.10, r77:47.26, r79:25.15, r80:51.62, r81:39.96,  m75:27.02, m77:63.46, m79:null,  m80:71.11, m81:56.79 },
  "NV":{ name:"Nevada",             r75:21.62, r77:51.43, r79:26.35, r80:53.97, r81:41.27 },
  "NY":{ name:"New York",           r75:25.51, r77:59.91, r79:29.79, r80:61.27, r81:46.55 },
  "OH":{ name:"Ohio",               r75:19.89, r77:46.99, r79:25.02, r80:51.30, r81:39.68 },
  "OK":{ name:"Oklahoma",           r75:19.31, r77:45.89, r79:24.63, r80:50.42, r81:39.05 },
  "OR":{ name:"Oregon",             r75:23.88, r77:57.02, r79:28.21, r80:57.78, r81:43.71 },
  "PA":{ name:"Pennsylvania",       r75:22.70, r77:53.60, r79:27.28, r80:56.00, r81:42.80 },
  "RI":{ name:"Rhode Island",       r75:22.33, r77:53.09, r79:27.07, r80:55.46, r81:42.36,  m75:33.23, m77:33.23, m79:7.02,  m80:29.93, m81:24.35 },
  "SC":{ name:"South Carolina",     r75:20.01, r77:47.50, r79:25.14, r80:51.50, r81:39.74 },
  "SD":{ name:"South Dakota",       r75:21.27, r77:51.22, r79:26.16, r80:53.44, r81:40.75 },
  "TN":{ name:"Tennessee",          r75:19.49, r77:46.63, r79:24.80, r80:50.70, r81:39.13 },
  "TX":{ name:"Texas",              r75:22.85, r77:54.36, r79:27.28, r80:55.92, r81:42.51 },
  "UT":{ name:"Utah",               r75:20.38, r77:48.34, r79:25.41, r80:52.06, r81:40.11 },
  "VA":{ name:"Virginia",           r75:19.27, r77:42.26, r79:24.09, r80:49.40, r81:38.57,  m75:17.35, m77:37.82, m79:null,  m80:44.08, m81:34.41 },
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

function GateScreen({ onSubmit }) {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [practice, setPractice] = useState("");
  const [state,    setState]    = useState("");
  const [role,     setRole]     = useState("");
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
    if (!name.trim())     e.name     = "Required";
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = "Valid email required";
    if (!practice.trim()) e.practice = "Required";
    if (!state)           e.state    = "Required";
    if (!role)            e.role     = "Required";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    const payload = { name:name.trim(), email:email.trim(), phone:phone.trim(), practice:practice.trim(), state, role, submittedAt: new Date().toISOString() };
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
        <div style={{fontSize:10,fontWeight:800,color:BRAND,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:10}}>
          IndiAide · RTM Revenue Calculator
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
            {fieldLabel("Full Name", "name")}
            <input value={name} onChange={e => { setName(e.target.value); setErrors(p=>({...p,name:""})); }}
              placeholder="Jane Smith" style={inputStyle("name")} />
            {errors.name && <div style={{fontSize:10,color:"#EF4444",marginTop:3}}>{errors.name}</div>}
          </div>
          <div>
            {fieldLabel("Work Email", "email")}
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(p=>({...p,email:""})); }}
              placeholder="jane@clinicname.com" style={inputStyle("email")} />
            {errors.email && <div style={{fontSize:10,color:"#EF4444",marginTop:3}}>{errors.email}</div>}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div>
            {fieldLabel("Practice / Clinic Name", "practice")}
            <input value={practice} onChange={e => { setPractice(e.target.value); setErrors(p=>({...p,practice:""})); }}
              placeholder="Sunrise Therapy Group" style={inputStyle("practice")} />
            {errors.practice && <div style={{fontSize:10,color:"#EF4444",marginTop:3}}>{errors.practice}</div>}
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:SLATE,marginBottom:5}}>
              Phone Number <span style={{fontWeight:400,color:"#94A3B8"}}>(optional)</span>
            </label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="(555) 000-0000" style={inputStyle("phone")} />
          </div>
        </div>

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
      </div>

      <div style={{marginTop:18,fontSize:11,color:"#94A3B8"}}>
        Powered by IndiAide · 2026 Medicare CMS PFS + Medicaid data
      </div>
    </div>
  );
}

// Single payer revenue column (used in the two-column dual layout)
function PayerCol({ label, color, bg, totalCount, activePts, devPts, devRate, devRev, clinPts, clinRate, clinRev, clinUncovered, clinNote, codeStr, monthly, annual, setup }) {
  return (
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:6,background:bg,borderRadius:6,padding:"3px 10px",marginBottom:12}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:color}} />
        <span style={{fontSize:11,fontWeight:700,color}}>{label}</span>
        <span style={{fontSize:10,color,opacity:0.7}}>{fmtN(totalCount)} patients</span>
      </div>
      {/* Device supply */}
      <div style={{marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:600,color:"#334155",marginBottom:2}}>Device Supply</div>
        <div style={{fontSize:11,color:"#94A3B8",marginBottom:3}}>{fmtN(devPts)} pts × {fmt(devRate)} · 50% of active</div>
        <div style={{fontSize:15,fontWeight:800,color}}>{fmt(devRev)}</div>
      </div>
      {/* Clinician time */}
      <div style={{marginBottom:12,paddingBottom:12,borderBottom:"1px dashed #E2E8F0"}}>
        <div style={{fontSize:11,fontWeight:600,color:"#334155",marginBottom:2,display:"flex",alignItems:"center",flexWrap:"wrap"}}>
          Clinician Time
          <CodeBadge code={codeStr} color={color} bg={bg} />
        </div>
        {clinUncovered
          ? <div style={{fontSize:11,color:"#94A3B8",fontStyle:"italic",lineHeight:1.4}}>{clinNote}</div>
          : <>
              <div style={{fontSize:11,color:"#94A3B8",marginBottom:3}}>{fmtN(clinPts)} pts × {fmt(clinRate)} · 50% of active</div>
              <div style={{fontSize:15,fontWeight:800,color}}>{fmt(clinRev)}</div>
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

  const s    = ALL_STATES[stateCode] || ALL_STATES["TX"];
  const dual = isDualState(s);

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
    const mdDevRev  = dual ? mdDevPts * s.m77 : 0;
    const mdClinUncov = dual && clinicianKey==="low" && s.m79===null;
    const mdClinRaw   = dual ? (clinicianKey==="low" ? s.m79 : clinicianKey==="mid" ? s.m80 : s.m80+s.m81) : null;
    const mdClinR   = (!dual || mdClinUncov || mdClinRaw===null) ? 0 : mdClinRaw;
    const mdClinRev = mdClinUncov ? 0 : mdClinPts * mdClinR;
    const mdMonthly = mdDevRev + mdClinRev;
    const mdAnnual  = mdMonthly * 12;
    const mdSetup   = dual ? mdCount * s.m75 : 0;

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
      mdClinUncov,
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
      const mdCUncov = dual && sc.key==="low" && s.m79===null;
      const mdCRaw   = dual ? (sc.key==="low" ? s.m79 : sc.key==="mid" ? s.m80 : s.m80+s.m81) : 0;
      const mdCR     = (!dual || mdCUncov || mdCRaw===null) ? 0 : mdCRaw;
      const mcMr = mcD + Math.round(mcA * CLINICIAN_BILL_PCT) * mcCR;
      const mdMr = mdD + Math.round(mdA * CLINICIAN_BILL_PCT) * mdCR;
      const mr   = mcMr + mdMr;
      const ar   = mr * 12;
      const net  = ar - iR * totA * 12;
      const roi  = (iR * totA) > 0 ? Math.round((mr - iR*totA) / (iR*totA) * 100) : 0;
      return { ...sc, mcMr, mdMr, mr, ar, net, roi, mdCUncov };
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
      <GateScreen onSubmit={data => {
        setLead(data);
        setStateCode(data.state);
      }} />
    );
  }

  return (
    <div style={{fontFamily:"'Inter',sans-serif",maxWidth:860,margin:"0 auto",padding:"16px 24px",background:"#fff",colorScheme:"light"}}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{textAlign:"center",padding:"20px 0 24px"}}>
        <div style={{fontSize:10,fontWeight:800,color:BRAND,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:8}}>
          IndiAide · RTM Revenue Calculator
        </div>
        <h1 style={{margin:0,fontSize:26,fontWeight:800,color:"#0F172A",lineHeight:1.25}}>
          {lead.name.split(" ")[0]}, here's your RTM revenue estimate
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

      {/* ── Inputs ────────────────────────────────────────────────────────── */}
      <div style={card}>
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
            <div style={{fontSize:11,color:"#94A3B8",marginTop:4}}>Active Medicare caseload</div>
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
              {dual ? "Active Medicaid caseload" : `Medicaid RTM not reimbursed in ${s.name}`}
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
              <optgroup label="✅ Medicare + Medicaid RTM (19 states)">
                {DUAL_LIST.map(([c,n]) => <option key={c} value={c}>{n}</option>)}
              </optgroup>
              <optgroup label="Medicare RTM Only">
                {SINGLE_LIST.map(([c,n]) => <option key={c} value={c}>{n}</option>)}
              </optgroup>
            </select>
            <div style={{fontSize:10,color:"#94A3B8",marginTop:4}}>
              {dual
                ? <span style={{color:GREEN,fontWeight:600}}>✅ Both Medicare &amp; Medicaid reimburse RTM in {s.name} · Q2 2026</span>
                : "Medicare RTM · 2026 CMS PFS rates"
              }
            </div>
          </div>
        </div>
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

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        <KpiCard label={dual?"Combined Monthly":"Monthly Revenue"} value={fmt(C.combMonthly)} sub={dual?"Medicare + Medicaid":"recurring"} color={BRAND} inverted />
        <KpiCard label={dual?"Combined Annual":"Annual Revenue"}   value={fmtK(C.combAnnual)} sub="recurring" color={BRAND} inverted />
        <KpiCard label="Net Monthly"  value={fmt(C.netMonthly)} sub={`$${C.indiRate}/pt · ${C.indiLabel} tier`} color={GREEN} />
        <KpiCard label="ROI"          value={`${C.roi}%`}       sub="return on platform" color={AMBER} />
      </div>

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
                clinPts={C.mdClinPts} clinRate={C.mdClinR} clinRev={C.mdClinRev}
                clinUncovered={C.mdClinUncov}
                clinNote={`98979 not covered under ${s.name} Medicaid — switch to 20 min to bill 98980`}
                codeStr={clin.codeStr}
                monthly={C.mdMonthly} annual={C.mdAnnual} setup={C.mdSetup}
              />
            </div>
            {/* Expanders */}
            <div style={{borderTop:"1px solid #F1F5F9",paddingTop:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <BillingDetail id="device" open={expandedCode} onToggle={setExpandedCode} info={BILLING_INFO.device} />
              <BillingDetail id="clinician" open={expandedCode} onToggle={setExpandedCode} info={BILLING_INFO[billKey]} />
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
              Switch to one of the <strong style={{color:GREEN}}>19 ✅ states</strong> in the dropdown to see Medicaid revenue alongside Medicare.
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
                      {row.mdCUncov && <span style={{marginLeft:4,fontSize:9,color:"#94A3B8",fontFamily:"sans-serif",fontStyle:"italic"}}>MD: 98979 N/C</span>}
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
          You spend time between sessions on your patients — reviewing their progress, adjusting their home program, checking in. That work doesn't fall through the cracks. But for most clinics, it also doesn't get reimbursed.
        </div>
        <div style={{fontSize:24,fontWeight:800,lineHeight:1.2,marginBottom:10}}>
          {fmtK(C.combAnnual)}/year{dual ? " across both payers" : ""} — from work you're already doing.
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
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20,justifyContent:"center"}}>
          <button onClick={() => window.open(BOOKING_URL,"_blank")} style={{background:"#fff",color:BRAND,border:"none",borderRadius:10,padding:"12px 24px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Book a conversation →</button>
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
        {dual && ` Medicaid estimates use Q2 2026 ${s.name} state fee schedule rates.`}
        {" "}Device supply assumes 98977 (musculoskeletal, 16–30 active days), billable for approximately 50% of active patients per month.
        Clinician time assumes approximately 50% of active patients billed monthly, requiring documented management time plus at least one interactive communication.
        {dual && s.m79===null && ` ${s.name} Medicaid does not separately reimburse 98979 (10-min tier); 98980 and 98981 remain billable.`}
        {" "}Adoption rate reflects estimated proportion of caseload actively enrolled and using IndiAide.
        Setup code 98975 billed once per episode of care.
        IndiAide qualifies as Software as a Medical Device (SaMD) — no physical device or DME required.
        Actual reimbursement varies by payer mix, patient eligibility, and clinical documentation. For informational purposes only.
      </p>

    </div>
  );
}
