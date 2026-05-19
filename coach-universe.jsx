/* Coach Universe — My Third Space
 * Sections:
 *   - Login (email or phone, OTP stub)
 *   - Dashboard shell (sidebar + header)
 *   - Calendar (day / week / month) with events
 *   - PT invites panel (accept / reject / suggest alternate)
 *   - Profile editor (photo, bio, insta, gallery)
 *   - Peer directory (read-only calendars)
 *   - Google Calendar connect
 */

const { useState, useEffect, useMemo, useRef } = React;

// ------- Mock PT invites (sent by members) -------
const SEED_INVITES = [
  { id: "inv-01", member: "Meera P.", memberInitials: "MP", requestedAt: "2 hrs ago",
    day: "Tue, Apr 21", time: "07:30", duration: 60, note: "First PT — looking to rebuild strength after knee rehab.", status: "pending" },
  { id: "inv-02", member: "Karan S.", memberInitials: "KS", requestedAt: "yesterday",
    day: "Wed, Apr 22", time: "18:30", duration: 60, note: "Hyrox prep — 6 weeks out from event.", status: "pending" },
  { id: "inv-03", member: "Anita V.", memberInitials: "AV", requestedAt: "3 days ago",
    day: "Fri, Apr 24", time: "09:00", duration: 60, note: "Weekly check-in. Same time as usual works.", status: "pending" },
];

// ------- Client profile data bridge -------
// In production this comes from the backend.
// In this prototype, we read from localStorage (set by profile.jsx / onboarding-flow.jsx).
// The demo user in profile.jsx is mapped to invite member "Meera P." for demo purposes.
function loadClientProfile(memberName) {
  try {
    const raw = localStorage.getItem('m3s.journey');
    if (raw) {
      const data = JSON.parse(raw);
      if (memberName === 'Meera P.' || memberName === 'Riya Sharma') {
        return {
          name: data.name || 'Meera P.',
          age: data.age,
          gender: data.gender,
          phone: data.phone,
          experience: data.experience,
          goal: data.goal,
          daysPerWeek: data.daysPerWeek,
          notes: data.notes,
          injuries: data.injuries || [],
          injuryNotes: data.injuryNotes,
          slots: data.slots || [],
          coachId: data.coachId,
          running5k: data.running5k,
          running2k: data.running2k,
          runRating: data.runRating,
          runFrequency: data.runFrequency,
          runInjuryFlag: data.runInjuryFlag,
          source: 'live',
        };
      }
    }
  } catch (e) {}
  return SEED_CLIENT_PROFILES[memberName] || null;
}

const SEED_CLIENT_PROFILES = {
  'Karan S.': {
    name: 'Karan S.', age: '28', gender: 'Male',
    experience: '2–5 years', goal: 'Performance',
    daysPerWeek: 5, injuries: ['Knee'],
    injuryNotes: "Runner's knee. No deep squats below 90°.",
    notes: 'Hyrox race in 6 weeks. Priority is sled and SkiErg.',
    running5k: '24:10', running2k: '9:05', runRating: 8,
    runFrequency: '5x / week', runInjuryFlag: false,
    coachId: 'rahul', source: 'seed',
  },
  'Anita V.': {
    name: 'Anita V.', age: '35', gender: 'Female',
    experience: '5+ years', goal: 'Muscle Gain',
    daysPerWeek: 4, injuries: ['Shoulder', 'Lower back'],
    injuryNotes: 'Lower back stiffness post-delivery. Cleared by physio Jan 2026.',
    notes: 'Wants visible hypertrophy. Happy with current intensity.',
    running5k: '31:20', running2k: '11:40', runRating: 4,
    runFrequency: '1x / week', runInjuryFlag: false,
    coachId: 'lee', source: 'seed',
  },
  'Vikram R.': {
    name: 'Vikram R.', age: '41', gender: 'Male',
    experience: '6–24 months', goal: 'Fat Loss',
    daysPerWeek: 3, injuries: ['Hip'],
    injuryNotes: 'Hip flexor tightness from desk job. Needs daily mobility.',
    notes: 'Travels 2 weeks a month. Needs travel-friendly programming.',
    running5k: '36:00', running2k: '13:10', runRating: 3,
    runFrequency: '2x / week', runInjuryFlag: true,
    coachId: 'deb', source: 'seed',
  },
  'Rohan T.': {
    name: 'Rohan T.', age: '30', gender: 'Male',
    experience: '2–5 years', goal: 'Performance',
    daysPerWeek: 4, injuries: [],
    injuryNotes: '',
    notes: 'On hold — work travel. Returns May 12.',
    running5k: '26:30', running2k: '9:50', runRating: 7,
    runFrequency: '4x / week', runInjuryFlag: false,
    coachId: 'rahul', source: 'seed',
  },
  'Shreya M.': {
    name: 'Shreya M.', age: '27', gender: 'Female',
    experience: '6–24 months', goal: 'Muscle Gain',
    daysPerWeek: 4, injuries: ['Shoulder'],
    injuryNotes: 'Post-surgical right shoulder. Cleared Dec 2025.',
    notes: 'Wedding in June. Upper body hypertrophy focus.',
    running5k: '33:10', running2k: '12:20', runRating: 4,
    runFrequency: '2x / week', runInjuryFlag: false,
    coachId: 'lee', source: 'seed',
  },
};

// Expose to other scripts (client-profile.jsx)
window.loadClientProfile = loadClientProfile;
window.SEED_CLIENT_PROFILES = SEED_CLIENT_PROFILES;

// ------- Mock active clients for the logged-in coach -------
const SEED_CLIENTS = [
  { id: "cl-01", name: "Meera P.",   initials: "MP", tone: "walnut",     programme: "Strength & Recovery",  done: 8,  total: 16, since: "Dec 2025", lastSession: "APR 20", status: "active" },
  { id: "cl-02", name: "Karan S.",   initials: "KS", tone: "sage",       programme: "Hyrox Prep",           done: 4,  total: 12, since: "Feb 2026", lastSession: "APR 18", status: "active" },
  { id: "cl-03", name: "Anita V.",   initials: "AV", tone: "terra",      programme: "Hypertrophy",          done: 12, total: 16, since: "Oct 2025", lastSession: "APR 19", status: "ending" },
  { id: "cl-04", name: "Vikram R.",  initials: "VR", tone: "espresso",   programme: "Strength & Mobility",  done: 2,  total: 8,  since: "Mar 2026", lastSession: "APR 17", status: "active" },
  { id: "cl-05", name: "Rohan T.",   initials: "RT", tone: "clay",       programme: "Hyrox Prep",           done: 6,  total: 12, since: "Jan 2026", lastSession: "APR 02", status: "hold" },
  { id: "cl-06", name: "Shreya M.",  initials: "SM", tone: "sand",       programme: "Strength",             done: 10, total: 12, since: "Nov 2025", lastSession: "APR 20", status: "ending" },
];

// ------- Mock calendar events for "me" (the logged-in coach) -------
// times are in minutes-from-midnight to make layout easy
const hm = (h, m=0) => h * 60 + (m || 0);

// Build a week of events keyed by ISO day
function buildEventsForCoach(coachId) {
  // Same structure for any coach, varied by id hash
  const seed = coachId.charCodeAt(0) % 5;
  return {
    // Mon
    0: [
      { id:"e1",  kind:"pt",    title:"PT · Meera P.",        start:hm(7,0),  end:hm(8,0) },
      { id:"e2",  kind:"group", title:"Group · Strength",     start:hm(9,30), end:hm(10,30) },
      { id:"e3",  kind:"pt",    title:"PT · Rohan",           start:hm(17,0), end:hm(18,0) },
      { id:"e4",  kind:"pt",    title:"PT · Shreya",          start:hm(18,30),end:hm(19,30) },
    ],
    // Tue
    1: [
      { id:"e5",  kind:"pending", title:"Invite · Meera P.",  start:hm(7,30), end:hm(8,30) },
      { id:"e6",  kind:"group", title:"Group · Hyrox Prep",   start:hm(17,0), end:hm(18,0) },
      { id:"e7",  kind:"pt",    title:"PT · Vikram",          start:hm(18,30),end:hm(19,30) },
    ],
    // Wed
    2: [
      { id:"e8",  kind:"pt",    title:"PT · Anita V.",        start:hm(6,30), end:hm(7,30) },
      { id:"e9",  kind:"block", title:"Off · Programming",    start:hm(12,0), end:hm(14,0) },
      { id:"e10", kind:"pending", title:"Invite · Karan S.",  start:hm(18,30),end:hm(19,30) },
    ],
    // Thu
    3: [
      { id:"e11", kind:"group", title:"Group · Mobility",     start:hm(7,0),  end:hm(8,0) },
      { id:"e12", kind:"pt",    title:"PT · Arjun",           start:hm(17,0), end:hm(18,0) },
    ],
    // Fri
    4: [
      { id:"e13", kind:"pending", title:"Invite · Anita V.",  start:hm(9,0),  end:hm(10,0) },
      { id:"e14", kind:"pt",    title:"PT · Rohan",           start:hm(17,0), end:hm(18,0) },
      { id:"e15", kind:"pt",    title:"PT · Shreya",          start:hm(18,30),end:hm(19,30) },
    ],
    // Sat
    5: [
      { id:"e16", kind:"group", title:"Group · Saturday Strong", start:hm(8,0), end:hm(9,30) },
      { id:"e17", kind:"block", title:"Off — personal",       start:hm(12,0), end:hm(23,59) },
    ],
    // Sun
    6: [
      { id:"e18", kind:"block", title:"Off day",              start:hm(0,0),  end:hm(23,59) },
    ],
  };
}

// ------- Login screen -------
function Login({ onLogin }) {
  const [mode, setMode] = useState("email"); // email | phone
  const [step, setStep] = useState(1); // 1 = id, 2 = otp
  const [id, setId] = useState("");
  const [otp, setOtp] = useState("");
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [err, setErr] = useState("");

  // Pretend DB: coach login lookup by trainer id
  const coaches = (window.TRAINERS || []).filter(t => t.ptEligible);

  function submitId(e) {
    e.preventDefault();
    if (mode === "email" && !id.includes("@")) return setErr("Enter a valid email");
    if (mode === "phone" && id.replace(/\D/g,"").length < 10) return setErr("Enter a 10-digit phone");
    setErr("");
    setStep(2);
  }
  function submitOtp(e) {
    e.preventDefault();
    if (otp.length !== 4) return setErr("4-digit OTP");
    setErr("");
    // In demo, pick coach. For real: look up by id.
    onLogin(selectedCoach || coaches[0]);
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      {/* Left — brand panel */}
      <div className="desktop-only" style={{
        background: "var(--espresso-900)", color: "var(--sand-100)",
        padding: "64px 56px", display: "flex", flexDirection: "column", justifyContent: "space-between",
        position: "relative", overflow: "hidden"
      }}>
        {/* subtle radial */}
        <div style={{
          position:"absolute", inset:0, opacity:0.25,
          background: "radial-gradient(ellipse at 30% 20%, var(--walnut-700), transparent 60%), radial-gradient(ellipse at 80% 80%, var(--terracotta-500), transparent 55%)"
        }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <a href="index.html" className="mono" style={{ color: "var(--sand-200)", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:10 }}>
            ← Back to studio
          </a>
          <div style={{ marginTop: 120 }}>
            <div className="mono" style={{ color: "var(--ochre-500)", marginBottom: 20, letterSpacing: 3 }}>
              — Coach Universe
            </div>
            <h1 className="serif" style={{ fontSize: 72, lineHeight: 1.02, margin: 0, fontStyle: "italic", color: "var(--paper)" }}>
              Your calendar.<br/>Your hours.<br/><span style={{ color: "var(--sand-300)" }}>Your members.</span>
            </h1>
            <p style={{ maxWidth: 380, marginTop: 32, fontSize: 16, lineHeight: 1.6, color: "var(--sand-200)", opacity: 0.85 }}>
              A private workspace for M3S coaches — manage bookings, accept PT invites,
              keep your profile fresh, and sync with Google Calendar.
            </p>
          </div>
        </div>
        <div style={{ position:"relative", zIndex:1, display:"flex", gap:32, fontSize:13, color:"var(--sand-300)", opacity:0.7 }}>
          <span>11 coaches</span>
          <span>·</span>
          <span>HAL 2nd Stage, Indiranagar</span>
          <span>·</span>
          <span>v1.0</span>
        </div>
      </div>

      {/* Right — form */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 32px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div className="mono" style={{ color: "var(--clay-600)", marginBottom: 12 }}>— Coach Sign-in</div>
          <h2 className="serif" style={{ fontSize: 44, margin: "0 0 8px", color: "var(--espresso-900)" }}>Welcome back.</h2>
          <p style={{ color: "var(--clay-600)", fontSize: 15, lineHeight: 1.6, margin: "0 0 32px" }}>
            Only coaches on the M3S roster can access this workspace.
          </p>

          {step === 1 && (
            <>
              {/* Mode toggle */}
              <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--sand-100)", borderRadius: 999, marginBottom: 24, width: "fit-content" }}>
                {["email","phone"].map(m => (
                  <button key={m} onClick={() => setMode(m)} className="mono" style={{
                    padding: "8px 16px", borderRadius: 999, border: "none", cursor: "pointer",
                    background: mode === m ? "var(--paper)" : "transparent",
                    color: mode === m ? "var(--walnut-700)" : "var(--clay-600)",
                    boxShadow: mode === m ? "var(--sh-1)" : "none",
                    fontFamily: "var(--f-mono)",
                  }}>{m}</button>
                ))}
              </div>

              <form onSubmit={submitId}>
                <label className="mono" style={{ display: "block", marginBottom: 8, color: "var(--clay-600)" }}>
                  {mode === "email" ? "Email address" : "Phone number"}
                </label>
                <input
                  className="m3s-input"
                  type={mode === "email" ? "email" : "tel"}
                  placeholder={mode === "email" ? "coach@mythirdspace.fit" : "+91 98xxx xxxxx"}
                  value={id}
                  onChange={e => setId(e.target.value)}
                  autoFocus
                />

                {/* Demo: pick a coach identity */}
                <div style={{ marginTop: 20 }}>
                  <div className="mono" style={{ color: "var(--clay-600)", marginBottom: 8, fontSize: 10 }}>
                    Demo · sign in as
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {coaches.slice(0, 6).map(c => (
                      <button type="button" key={c.id} onClick={() => setSelectedCoach(c)} style={{
                        padding: "6px 12px", borderRadius: 999,
                        border: "1px solid " + (selectedCoach?.id === c.id ? "var(--walnut-700)" : "var(--hairline-strong)"),
                        background: selectedCoach?.id === c.id ? "var(--walnut-700)" : "var(--paper)",
                        color: selectedCoach?.id === c.id ? "var(--paper)" : "var(--walnut-700)",
                        fontFamily: "var(--f-body)", fontSize: 12, cursor: "pointer",
                      }}>{c.name}</button>
                    ))}
                  </div>
                </div>

                {err && <div style={{ color: "var(--terracotta-500)", fontSize: 13, marginTop: 12 }}>{err}</div>}

                <button className="btn-primary" style={{ marginTop: 24, width: "100%", justifyContent:"center" }} type="submit">
                  Send OTP →
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <form onSubmit={submitOtp}>
              <label className="mono" style={{ display: "block", marginBottom: 8, color: "var(--clay-600)" }}>
                4-digit code sent to {mode === "email" ? id || "your email" : id || "your phone"}
              </label>
              <input
                className="m3s-input"
                inputMode="numeric"
                maxLength={4}
                placeholder="1234"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g,""))}
                autoFocus
                style={{ fontFamily: "var(--f-mono)", fontSize: 24, letterSpacing: 12, textAlign: "center" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <button type="button" onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "var(--clay-600)", fontSize: 13, cursor: "pointer" }}>← change {mode}</button>
                <button type="button" style={{ background: "none", border: "none", color: "var(--walnut-700)", fontSize: 13, cursor: "pointer" }}>Resend in 0:30</button>
              </div>
              {err && <div style={{ color: "var(--terracotta-500)", fontSize: 13, marginTop: 12 }}>{err}</div>}
              <button className="btn-primary" style={{ marginTop: 24, width: "100%", justifyContent: "center" }} type="submit">
                Enter Coach Universe →
              </button>
              <div className="mono" style={{ color: "var(--clay-600)", marginTop: 20, fontSize: 10, textAlign: "center" }}>
                Hint · any 4 digits work in this demo
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ------- Sidebar -------
function Sidebar({ coach, section, onSection, onLogout }) {
  const items = [
    { id: "calendar", label: "My Calendar", icon: "▦" },
    { id: "invites",  label: "PT Invites",  icon: "✧", badgeKey: "pendingInvites" },
    { id: "clients",  label: "My Clients",  icon: "◐", badgeKey: "endingSoon" },
    { id: "peers",    label: "Peer Calendars", icon: "⚲" },
    { id: "profile",  label: "My Profile", icon: "◉" },
    { id: "sync",     label: "Integrations", icon: "◈" },
  ];
  return (
    <aside style={{
      width: 260, background: "var(--paper)", borderRight: "1px solid var(--hairline)",
      display: "flex", flexDirection: "column", padding: "28px 20px",
      position: "sticky", top: 0, height: "100vh",
    }}>
      <a href="index.html" style={{ textDecoration: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--espresso-900)",
            display:"flex", alignItems:"center", justifyContent:"center", color:"var(--sand-100)",
            fontFamily:"var(--f-display)", fontStyle:"italic", fontSize:20 }}>M</div>
          <div>
            <div style={{ fontFamily: "var(--f-display)", fontSize: 18, color: "var(--espresso-900)", lineHeight: 1 }}>My Third Space</div>
            <div className="mono" style={{ color: "var(--ochre-500)", fontSize: 9, marginTop: 2 }}>Coach Universe</div>
          </div>
        </div>
      </a>

      <div style={{ marginTop: 32 }}>
        <div className="mono" style={{ color: "var(--clay-600)", marginBottom: 8, fontSize: 9 }}>— Signed in</div>
        <div style={{
          padding: 12, borderRadius: "var(--r-md)", border: "1px solid var(--hairline)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <CoachAvatar coach={coach} size={40} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 500, fontSize: 14, color: "var(--espresso-900)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{coach.name}</div>
            <div style={{ color: "var(--clay-600)", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{coach.role}</div>
          </div>
        </div>
      </div>

      <nav style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map(it => {
          const active = section === it.id;
          return (
            <button key={it.id} onClick={() => onSection(it.id)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 12px", borderRadius: "var(--r-md)",
              border: "none", background: active ? "var(--sand-100)" : "transparent",
              color: active ? "var(--walnut-700)" : "var(--espresso-800)",
              fontSize: 14, fontWeight: active ? 500 : 400, cursor: "pointer",
              textAlign: "left", fontFamily: "var(--f-body)",
              transition: "background .15s"
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--sand-50)"; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
              <span style={{ width: 18, textAlign: "center", opacity: 0.7 }}>{it.icon}</span>
              <span style={{ flex: 1 }}>{it.label}</span>
              {it.id === "invites" && window.__pendingInvites > 0 && (
                <span style={{
                  background: "var(--ochre-500)", color: "var(--espresso-900)",
                  fontFamily: "var(--f-mono)", fontSize: 10, fontWeight: 600,
                  padding: "2px 7px", borderRadius: 999, minWidth: 20, textAlign: "center"
                }}>{window.__pendingInvites}</span>
              )}
              {it.id === "clients" && window.__endingSoon > 0 && (
                <span style={{
                  background: "var(--terracotta-500)", color: "var(--paper)",
                  fontFamily: "var(--f-mono)", fontSize: 10, fontWeight: 600,
                  padding: "2px 7px", borderRadius: 999, minWidth: 20, textAlign: "center"
                }}>{window.__endingSoon}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", paddingTop: 24, borderTop: "1px solid var(--hairline)" }}>
        <button onClick={onLogout} style={{
          width: "100%", padding: "10px 12px", borderRadius: "var(--r-md)",
          border: "none", background: "transparent", color: "var(--clay-600)",
          fontSize: 13, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12,
          fontFamily: "var(--f-body)",
        }}>
          <span style={{ width: 18, textAlign: "center" }}>→</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}

// fix the var() bug — use actual CSS var values via computed inline
// (JS template strings don't interpret var()), so we override below.
// -----------------------------------------------------------

// ------- Avatar -------
function CoachAvatar({ coach, size = 48 }) {
  const toneMap = {
    walnut: ["#5E4228", "#EADBC4"],
    espresso: ["#3E2C1C", "#EADBC4"],
    terra: ["#B86B4B", "#FBF7F0"],
    sage: ["#7B8B6F", "#FBF7F0"],
    clay: ["#8A6640", "#EADBC4"],
    sand: ["#C3A781", "#3E2C1C"],
  };
  const [bg, fg] = toneMap[coach.tone] || toneMap.walnut;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg, color: fg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--f-display)", fontSize: size * 0.4, fontStyle: "italic",
      flexShrink: 0,
    }}>{coach.initials}</div>
  );
}

// ------- Week / date helpers -------
function startOfWeek(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mon = 0
  x.setDate(x.getDate() - day);
  x.setHours(0,0,0,0);
  return x;
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fmtMonth(d) { return d.toLocaleDateString("en-US", { month: "long", year: "numeric" }); }
function fmtDayLong(d) { return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }); }
function fmtTime(mins) {
  const h = Math.floor(mins/60), m = mins%60;
  const ampm = h < 12 ? "am" : "pm";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}${m ? ":" + String(m).padStart(2,"0") : ""}${ampm}`;
}

// ------- CalendarHeader: view switch + nav + today -------
function CalendarHeader({ view, setView, cursor, setCursor, onNewBlock }) {
  const label = view === "month" ? fmtMonth(cursor)
    : view === "week" ? `${addDays(startOfWeek(cursor),0).toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${addDays(startOfWeek(cursor),6).toLocaleDateString("en-US",{month:"short",day:"numeric"})}, ${cursor.getFullYear()}`
    : fmtDayLong(cursor);

  function shift(n) {
    const x = new Date(cursor);
    if (view === "day") x.setDate(x.getDate() + n);
    else if (view === "week") x.setDate(x.getDate() + n*7);
    else x.setMonth(x.getMonth() + n);
    setCursor(x);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <h2 className="serif" style={{ fontSize: 36, margin: 0, color: "var(--espresso-900)", letterSpacing: "-0.01em" }}>
          {label}
        </h2>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn-icon" onClick={() => shift(-1)} aria-label="Previous">‹</button>
          <button className="btn-icon" onClick={() => shift(1)} aria-label="Next">›</button>
          <button className="btn-ghost" onClick={() => setCursor(new Date(2026, 3, 20))} style={{ marginLeft: 4 }}>Today</button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* View pill */}
        <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--sand-100)", borderRadius: 999 }}>
          {["month","week","day"].map(v => (
            <button key={v} onClick={() => setView(v)} className="mono" style={{
              padding: "7px 14px", borderRadius: 999, border: "none", cursor: "pointer",
              background: view === v ? "var(--paper)" : "transparent",
              color: view === v ? "var(--walnut-700)" : "var(--clay-600)",
              boxShadow: view === v ? "var(--sh-1)" : "none",
              fontFamily: "var(--f-mono)",
            }}>{v}</button>
          ))}
        </div>
        <button className="btn-primary" onClick={onNewBlock}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Block time
        </button>
      </div>
    </div>
  );
}

// ------- Week view -------
const HOUR_HEIGHT = 56; // px per hour
const START_HOUR = 5;
const END_HOUR = 22;

function eventStyle(ev, col = 0, cols = 1) {
  const startMin = Math.max(ev.start, START_HOUR*60);
  const endMin = Math.min(ev.end, END_HOUR*60);
  const top = ((startMin - START_HOUR*60) / 60) * HOUR_HEIGHT;
  const h = Math.max(18, ((endMin - startMin) / 60) * HOUR_HEIGHT - 2);
  const width = `calc((100% - 8px) / ${cols} - 4px)`;
  const left = `calc(${col} * ((100% - 8px) / ${cols}) + 4px)`;
  return { top, height: h, width, left, position: "absolute" };
}

// Resolve overlaps into columns (simple greedy)
function layoutDay(events) {
  const sorted = [...events].sort((a,b) => a.start - b.start);
  const cols = []; // each col is array of events
  sorted.forEach(ev => {
    let placed = false;
    for (let i=0;i<cols.length;i++) {
      const last = cols[i][cols[i].length-1];
      if (last.end <= ev.start) { cols[i].push(ev); ev._col = i; placed = true; break; }
    }
    if (!placed) { cols.push([ev]); ev._col = cols.length - 1; }
  });
  const totalCols = Math.max(1, cols.length);
  sorted.forEach(ev => { ev._totalCols = totalCols; });
  return sorted;
}

function WeekView({ cursor, events, onEventClick }) {
  const weekStart = startOfWeek(cursor);
  const days = [0,1,2,3,4,5,6].map(i => addDays(weekStart, i));
  const hours = [];
  for (let h = START_HOUR; h < END_HOUR; h++) hours.push(h);
  const todayIso = new Date(2026, 3, 20).toDateString();

  return (
    <div style={{
      background: "var(--paper)", borderRadius: "var(--r-xl)",
      border: "1px solid var(--hairline)", overflow: "hidden",
      boxShadow: "var(--sh-2)"
    }}>
      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", borderBottom: "1px solid var(--hairline)" }}>
        <div />
        {days.map((d,i) => {
          const isToday = d.toDateString() === todayIso;
          return (
            <div key={i} style={{ padding: "14px 10px", textAlign: "center", borderLeft: "1px solid var(--hairline)" }}>
              <div className="mono" style={{ color: "var(--clay-600)", fontSize: 10, marginBottom: 4 }}>
                {d.toLocaleDateString("en-US",{weekday:"short"})}
              </div>
              <div style={{
                width: 34, height: 34, margin: "0 auto",
                borderRadius: "50%",
                background: isToday ? "var(--walnut-700)" : "transparent",
                color: isToday ? "var(--paper)" : "var(--espresso-900)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--f-display)", fontSize: 20,
              }}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      {/* Scroll body */}
      <div className="cal-scroll" style={{ maxHeight: "calc(100vh - 280px)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", position: "relative" }}>
          {/* Hour column */}
          <div>
            {hours.map(h => (
              <div key={h} style={{ height: HOUR_HEIGHT, padding: "4px 8px 0 0", textAlign: "right" }} className="hour-label">
                {fmtTime(h*60)}
              </div>
            ))}
          </div>
          {/* Day columns */}
          {days.map((d, di) => {
            const dayEvents = events[di] || [];
            const laidOut = layoutDay(dayEvents);
            return (
              <div key={di} style={{ borderLeft: "1px solid var(--hairline)", position: "relative" }}>
                {hours.map(h => (
                  <div key={h} className="hour-line" style={{ height: HOUR_HEIGHT }} />
                ))}
                {laidOut.map(ev => (
                  <div key={ev.id} className={`evt ${ev.kind}`} onClick={() => onEventClick(ev, di)} style={eventStyle(ev, ev._col, ev._totalCols)}>
                    <div style={{ fontFamily: "var(--f-mono)", fontSize: 9, letterSpacing: 1, textTransform: "uppercase", opacity: 0.7 }}>
                      {fmtTime(ev.start)}
                    </div>
                    <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ------- Day view (vertical list, richer cards) -------
function DayView({ cursor, events, onEventClick }) {
  const day = cursor.getDay() === 0 ? 6 : cursor.getDay() - 1; // mon=0
  const dayEvents = events[day] || [];
  const laidOut = layoutDay(dayEvents);
  const hours = [];
  for (let h = START_HOUR; h < END_HOUR; h++) hours.push(h);

  return (
    <div style={{
      background: "var(--paper)", borderRadius: "var(--r-xl)",
      border: "1px solid var(--hairline)", overflow: "hidden",
      boxShadow: "var(--sh-2)"
    }}>
      <div className="cal-scroll" style={{ maxHeight: "calc(100vh - 240px)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "72px 1fr", position: "relative" }}>
          <div>
            {hours.map(h => (
              <div key={h} style={{ height: HOUR_HEIGHT*1.2, padding: "6px 10px 0 0", textAlign: "right" }} className="hour-label">
                {fmtTime(h*60)}
              </div>
            ))}
          </div>
          <div style={{ borderLeft: "1px solid var(--hairline)", position: "relative" }}>
            {hours.map(h => <div key={h} className="hour-line" style={{ height: HOUR_HEIGHT*1.2 }} />)}
            {laidOut.map(ev => {
              const top = ((ev.start - START_HOUR*60) / 60) * HOUR_HEIGHT * 1.2;
              const h = Math.max(28, ((Math.min(ev.end, END_HOUR*60) - ev.start) / 60) * HOUR_HEIGHT * 1.2 - 4);
              const left = `calc(${ev._col} * ((100% - 16px) / ${ev._totalCols}) + 8px)`;
              const width = `calc((100% - 16px) / ${ev._totalCols} - 6px)`;
              return (
                <div key={ev.id} className={`evt ${ev.kind}`} onClick={() => onEventClick(ev, day)} style={{
                  position:"absolute", top, height: h, left, width, padding: "10px 14px",
                }}>
                  <div style={{ fontFamily:"var(--f-mono)", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", opacity: 0.75 }}>
                    {fmtTime(ev.start)} — {fmtTime(ev.end)}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{ev.title}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ------- Month view -------
function MonthView({ cursor, events, onDayClick }) {
  const y = cursor.getFullYear(), m = cursor.getMonth();
  const first = new Date(y, m, 1);
  const startGrid = startOfWeek(first);
  const cells = [];
  for (let i=0;i<42;i++) cells.push(addDays(startGrid, i));
  const weekStart = startOfWeek(new Date(2026, 3, 20));

  // For demo: flatten all week events into per-date bucket within the displayed April 2026 week
  function eventsForDate(d) {
    // Only show for the current demo week
    const diff = Math.floor((d - weekStart) / (24*3600*1000));
    if (diff >= 0 && diff < 7) return events[diff] || [];
    return [];
  }

  const todayStr = new Date(2026, 3, 20).toDateString();

  return (
    <div style={{
      background: "var(--paper)", borderRadius: "var(--r-xl)",
      border: "1px solid var(--hairline)", overflow: "hidden",
      boxShadow: "var(--sh-2)"
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--hairline)" }}>
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
          <div key={d} className="mono" style={{ padding: "14px 16px", color: "var(--clay-600)" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "minmax(110px, 1fr)" }}>
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === m;
          const isToday = d.toDateString() === todayStr;
          const evs = eventsForDate(d);
          return (
            <button key={i} onClick={() => onDayClick(d)} style={{
              borderLeft: i % 7 === 0 ? "none" : "1px solid var(--hairline)",
              borderTop: i >= 7 ? "1px solid var(--hairline)" : "none",
              padding: 10, background: inMonth ? "var(--paper)" : "var(--sand-50)",
              textAlign: "left", cursor: "pointer", fontFamily: "var(--f-body)",
              opacity: inMonth ? 1 : 0.55,
              display:"flex", flexDirection:"column", gap: 4, minHeight: 110,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                display:"flex", alignItems:"center", justifyContent:"center",
                background: isToday ? "var(--walnut-700)" : "transparent",
                color: isToday ? "var(--paper)" : "var(--espresso-900)",
                fontFamily: "var(--f-display)", fontSize: 16,
                marginBottom: 2,
              }}>{d.getDate()}</div>
              <div style={{ display:"flex", flexDirection:"column", gap:3, overflow:"hidden" }}>
                {evs.slice(0,3).map(ev => (
                  <div key={ev.id} className={`evt ${ev.kind}`} style={{
                    position: "static", padding: "3px 7px", fontSize: 11, borderRadius: 5,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                  }}>
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: 9, marginRight: 4, opacity: 0.7 }}>{fmtTime(ev.start)}</span>
                    {ev.title.replace(/^(PT|Group|Invite|Off) · /, "")}
                  </div>
                ))}
                {evs.length > 3 && <div style={{ fontSize: 11, color: "var(--clay-600)", paddingLeft: 4 }}>+{evs.length - 3} more</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ------- Calendar Page (wraps views + legend + event drawer) -------
function CalendarPage({ coach, events, setEvents, invites, setInvites, toast }) {
  const [view, setView] = useState("week");
  const [cursor, setCursor] = useState(new Date(2026, 3, 20));
  const [selected, setSelected] = useState(null); // { ev, dayIdx }
  const [showBlock, setShowBlock] = useState(false);

  function handleEventClick(ev, dayIdx) { setSelected({ ev, dayIdx }); }

  function deleteEvent() {
    const { ev, dayIdx } = selected;
    const nxt = { ...events, [dayIdx]: events[dayIdx].filter(e => e.id !== ev.id) };
    setEvents(nxt);
    setSelected(null);
    toast("Event removed");
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", alignItems:"center", gap: 12, flexWrap:"wrap" }}>
        <div className="mono" style={{ color: "var(--clay-600)" }}>— Week of Apr 20, 2026</div>
        <div style={{ display:"flex", gap: 12, fontSize: 12, color: "var(--clay-600)", flexWrap:"wrap", marginLeft:"auto" }}>
          <LegendSwatch color="#EFE2D3" border="#D9C3A3" label="PT Session" />
          <LegendSwatch color="#DEE5D3" border="#B8C4A5" label="Group Class" />
          <LegendSwatch color="#FFF2D8" border="#E8C77A" label="Pending Invite" />
          <LegendSwatch color="#ECCDBF" border="#D9A890" label="Off / Blocked" />
        </div>
      </div>

      <CalendarHeader view={view} setView={setView} cursor={cursor} setCursor={setCursor} onNewBlock={() => setShowBlock(true)} />

      {view === "month" && <MonthView cursor={cursor} events={events} onDayClick={(d) => { setCursor(d); setView("day"); }} />}
      {view === "week"  && <WeekView  cursor={cursor} events={events} onEventClick={handleEventClick} />}
      {view === "day"   && <DayView   cursor={cursor} events={events} onEventClick={handleEventClick} />}

      {selected && <EventDrawer selected={selected} onClose={() => setSelected(null)} onDelete={deleteEvent} />}

      {showBlock && <BlockTimeModal onClose={() => setShowBlock(false)} onSave={(blk) => {
        const nxt = { ...events };
        nxt[blk.dayIdx] = [...(nxt[blk.dayIdx] || []), blk.ev];
        setEvents(nxt);
        setShowBlock(false);
        toast("Time blocked — members won't see this slot");
      }} />}
    </div>
  );
}

function LegendSwatch({ color, border, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 12, height: 12, borderRadius: 3, background: color, border: `1px solid ${border}` }} />
      <span style={{ fontFamily: "var(--f-mono)", letterSpacing: 1, textTransform: "uppercase", fontSize: 10 }}>{label}</span>
    </span>
  );
}

// ------- Event drawer (right panel slide-in) -------
function EventDrawer({ selected, onClose, onDelete }) {
  const { ev } = selected;
  return (
    <div className="m3s-modal-backdrop" onClick={onClose}>
      <div className="m3s-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 20 }}>
          <span className="chip">
            <span className="chip-dot" style={{
              background: ev.kind === "pt" ? "#B89E7C" : ev.kind === "group" ? "#7B8B6F" : ev.kind === "pending" ? "#E8C77A" : "#B86B4B"
            }} />
            {ev.kind === "pending" ? "Pending Invite" : ev.kind === "pt" ? "PT Session" : ev.kind === "group" ? "Group Class" : "Off / Blocked"}
          </span>
          <button onClick={onClose} className="btn-icon" aria-label="Close">✕</button>
        </div>
        <h3 className="serif" style={{ fontSize: 28, margin: "4px 0 16px", color: "var(--espresso-900)" }}>
          {ev.title}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "12px 16px", marginBottom: 24 }}>
          <div className="mono" style={{ color: "var(--clay-600)" }}>Time</div>
          <div>{fmtTime(ev.start)} – {fmtTime(ev.end)}</div>
          <div className="mono" style={{ color: "var(--clay-600)" }}>Duration</div>
          <div>{Math.round((ev.end - ev.start))} mins</div>
          {ev.kind === "pt" && <>
            <div className="mono" style={{ color: "var(--clay-600)" }}>Location</div>
            <div>Studio Floor · Indiranagar</div>
          </>}
        </div>
        {ev.kind === "block" && (
          <p style={{ color: "var(--clay-600)", fontSize: 14, background: "var(--sand-100)", padding: 14, borderRadius: 10, lineHeight: 1.5 }}>
            This time is blocked on your calendar. Members cannot book PT during this window.
          </p>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
          {ev.kind === "block" && <button className="btn-ghost" onClick={onDelete} style={{ color: "var(--terracotta-500)", borderColor: "var(--terracotta-200)" }}>Remove block</button>}
          <button className="btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ------- Block time modal -------
function BlockTimeModal({ onClose, onSave }) {
  const [day, setDay] = useState(0);
  const [start, setStart] = useState("12:00");
  const [end, setEnd] = useState("14:00");
  const [reason, setReason] = useState("");
  const [allDay, setAllDay] = useState(false);

  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  function save() {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const ev = {
      id: "blk-" + Math.random().toString(36).slice(2,7),
      kind: "block",
      title: "Off · " + (reason || "Personal"),
      start: allDay ? hm(0) : hm(sh, sm||0),
      end: allDay ? hm(23,59) : hm(eh, em||0),
    };
    onSave({ dayIdx: day, ev });
  }

  return (
    <div className="m3s-modal-backdrop" onClick={onClose}>
      <div className="m3s-modal" onClick={e => e.stopPropagation()}>
        <div className="mono" style={{ color: "var(--clay-600)", marginBottom: 8 }}>— Block time</div>
        <h3 className="serif" style={{ fontSize: 28, margin: "0 0 20px", color: "var(--espresso-900)" }}>
          Off hours or off day
        </h3>

        <label className="mono" style={{ display:"block", color:"var(--clay-600)", marginBottom:8 }}>Day</label>
        <div style={{ display: "flex", gap: 4, flexWrap:"wrap", marginBottom: 20 }}>
          {days.map((d, i) => (
            <button key={i} onClick={() => setDay(i)} style={{
              padding: "8px 14px", borderRadius: 999,
              border: "1px solid " + (day === i ? "var(--walnut-700)" : "var(--hairline-strong)"),
              background: day === i ? "var(--walnut-700)" : "var(--paper)",
              color: day === i ? "var(--paper)" : "var(--walnut-700)",
              cursor: "pointer", fontSize: 13, fontFamily: "var(--f-body)",
            }}>{d}</button>
          ))}
        </div>

        <label style={{ display: "flex", alignItems:"center", gap: 10, marginBottom: 16, fontSize: 14, color: "var(--espresso-900)", cursor: "pointer" }}>
          <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} />
          All-day (off day)
        </label>

        {!allDay && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label className="mono" style={{ display:"block", color:"var(--clay-600)", marginBottom:8 }}>From</label>
              <input className="m3s-input" type="time" value={start} onChange={e => setStart(e.target.value)} />
            </div>
            <div>
              <label className="mono" style={{ display:"block", color:"var(--clay-600)", marginBottom:8 }}>To</label>
              <input className="m3s-input" type="time" value={end} onChange={e => setEnd(e.target.value)} />
            </div>
          </div>
        )}

        <label className="mono" style={{ display:"block", color:"var(--clay-600)", marginBottom:8 }}>Reason (optional)</label>
        <input className="m3s-input" value={reason} onChange={e => setReason(e.target.value)} placeholder="Programming · Doctor · Personal · ..." />

        <div style={{ display: "flex", gap: 8, marginTop: 24, justifyContent: "flex-end" }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save}>Block time</button>
        </div>
      </div>
    </div>
  );
}

// ------- Invites page -------
function InvitesPage({ coach, invites, setInvites, events, setEvents, toast }) {
  const [altFor, setAltFor] = useState(null); // invite object
  const pending = invites.filter(i => i.status === "pending");
  const decided = invites.filter(i => i.status !== "pending");

  function accept(inv) {
    setInvites(invites.map(i => i.id === inv.id ? { ...i, status: "accepted" } : i));
    toast(`Confirmed — ${inv.member} added to your calendar`);
  }
  function reject(inv) {
    setInvites(invites.map(i => i.id === inv.id ? { ...i, status: "rejected" } : i));
    toast(`Declined — ${inv.member} will be notified`);
  }

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 44, margin: "0 0 8px", color: "var(--espresso-900)" }}>PT Invites</h2>
      <p style={{ color: "var(--clay-600)", maxWidth: 600, lineHeight: 1.6, margin: "0 0 32px" }}>
        Members who requested a personal training session with you. Accept to confirm,
        decline to free their slot, or suggest an alternate time that works better.
      </p>

      {pending.length === 0 && (
        <div style={{ padding: 48, borderRadius: "var(--r-xl)", background: "var(--paper)", border: "1px solid var(--hairline)", textAlign: "center", color: "var(--clay-600)" }}>
          <div style={{ fontSize: 40, marginBottom: 8, opacity: 0.3 }}>✓</div>
          All caught up. No pending invites.
        </div>
      )}

      {pending.length > 0 && (
        <>
          <div className="mono" style={{ color: "var(--clay-600)", marginBottom: 12 }}>— {pending.length} pending</div>
          <div style={{ display: "grid", gap: 14 }}>
            {pending.map(inv => (
              <InviteCard key={inv.id} inv={inv} onAccept={() => accept(inv)} onReject={() => reject(inv)} onSuggest={() => setAltFor(inv)} />
            ))}
          </div>
        </>
      )}

      {decided.length > 0 && (
        <>
          <div className="mono" style={{ color: "var(--clay-600)", marginTop: 40, marginBottom: 12 }}>— Recent</div>
          <div style={{ display: "grid", gap: 10 }}>
            {decided.map(inv => (
              <div key={inv.id} style={{
                padding: "14px 18px", borderRadius: "var(--r-lg)",
                background: "var(--paper)", border: "1px solid var(--hairline)",
                display: "flex", alignItems: "center", gap: 16,
                opacity: 0.8,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "var(--sand-200)", color: "var(--walnut-700)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily: "var(--f-display)", fontStyle: "italic",
                  fontSize: 14, flexShrink: 0,
                }}>{inv.memberInitials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: "var(--espresso-900)" }}>
                    <strong style={{ fontWeight: 500 }}>{inv.member}</strong> · {inv.day} · {inv.time}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--clay-600)" }}>{inv.requestedAt}</div>
                </div>
                <span className="chip" style={{
                  background: inv.status === "accepted" ? "#DEE5D3" : "#ECCDBF",
                  color: inv.status === "accepted" ? "#3E4A32" : "#5A3020"
                }}>
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {altFor && <SuggestAlternateModal inv={altFor} onClose={() => setAltFor(null)} onSend={(alt) => {
        setInvites(invites.map(i => i.id === altFor.id ? { ...i, status: "alternate-sent", alternate: alt } : i));
        setAltFor(null);
        toast(`Suggested ${alt.day} · ${alt.time} — ${altFor.member} will confirm`);
      }} />}
    </div>
  );
}

function InviteCard({ inv, onAccept, onReject, onSuggest }) {
  return (
    <div style={{
      background: "var(--paper)", borderRadius: "var(--r-xl)",
      border: "1px solid var(--hairline)", padding: 24,
      display: "grid", gridTemplateColumns: "56px 1fr auto", gap: 20, alignItems: "start",
      boxShadow: "var(--sh-1)"
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: "var(--sand-200)", color: "var(--walnut-700)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: 20,
      }}>{inv.memberInitials}</div>

      <div>
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom: 6, flexWrap:"wrap" }}>
          <h4 style={{ fontSize: 18, margin: 0, color: "var(--espresso-900)", fontWeight: 500 }}>{inv.member}</h4>
          <span className="chip" style={{ background:"#FFF2D8", color:"#6A4A10", borderColor:"#E8C77A" }}>
            <span className="chip-dot" style={{ background: "#E8C77A" }} />
            Pending
          </span>
          <span className="mono" style={{ color: "var(--clay-600)" }}>{inv.requestedAt}</span>
        </div>
        <div style={{ fontSize: 15, color: "var(--espresso-800)", marginBottom: 8 }}>
          {inv.day} · <strong style={{ fontWeight: 500 }}>{inv.time}</strong> · {inv.duration} min session
        </div>
        <p style={{ fontSize: 14, color: "var(--clay-600)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
          "{inv.note}"
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
        <button className="btn-primary" onClick={onAccept} style={{ justifyContent:"center" }}>Accept</button>
        <button className="btn-ghost" onClick={onSuggest} style={{ justifyContent:"center" }}>Suggest alt. time</button>
        <button className="btn-ghost" onClick={onReject} style={{ justifyContent:"center", color: "var(--terracotta-500)", borderColor: "var(--terracotta-200)" }}>Decline</button>
      </div>
    </div>
  );
}

function SuggestAlternateModal({ inv, onClose, onSend }) {
  const [day, setDay] = useState(inv.day);
  const [time, setTime] = useState(inv.time);
  const [note, setNote] = useState("");

  return (
    <div className="m3s-modal-backdrop" onClick={onClose}>
      <div className="m3s-modal" onClick={e => e.stopPropagation()}>
        <div className="mono" style={{ color:"var(--clay-600)", marginBottom:8 }}>— Suggest alternate</div>
        <h3 className="serif" style={{ fontSize: 28, margin: "0 0 8px", color:"var(--espresso-900)" }}>
          Propose a different time
        </h3>
        <p style={{ color:"var(--clay-600)", fontSize: 14, margin: "0 0 24px" }}>
          {inv.member} will get this as a push notification and can confirm with one tap.
        </p>

        <label className="mono" style={{ display:"block", color:"var(--clay-600)", marginBottom:8 }}>Day</label>
        <input className="m3s-input" value={day} onChange={e => setDay(e.target.value)} style={{ marginBottom: 16 }} />

        <label className="mono" style={{ display:"block", color:"var(--clay-600)", marginBottom:8 }}>Time</label>
        <input className="m3s-input" value={time} onChange={e => setTime(e.target.value)} style={{ marginBottom: 16 }} />

        <label className="mono" style={{ display:"block", color:"var(--clay-600)", marginBottom:8 }}>Note (optional)</label>
        <textarea className="m3s-input" value={note} onChange={e => setNote(e.target.value)} rows={3}
          placeholder="Hey! Mornings work better for me — how about this slot?"
          style={{ resize: "vertical", fontFamily:"var(--f-body)" }} />

        <div style={{ display:"flex", gap: 8, marginTop: 24, justifyContent:"flex-end" }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSend({ day, time, note })}>Send suggestion</button>
        </div>
      </div>
    </div>
  );
}

// ------- Peer Calendars — read-only -------
function PeersPage({ coach }) {
  const peers = (window.TRAINERS || []).filter(t => t.id !== coach.id);
  const [selected, setSelected] = useState(peers[0]);
  const peerEvents = useMemo(() => selected ? buildEventsForCoach(selected.id) : {}, [selected]);

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 44, margin: "0 0 8px", color: "var(--espresso-900)" }}>Peer Calendars</h2>
      <p style={{ color: "var(--clay-600)", maxWidth: 640, lineHeight: 1.6, margin: "0 0 24px" }}>
        See when your fellow coaches are busy. <strong style={{ color: "var(--espresso-900)", fontWeight: 500 }}>Read-only</strong> — you can't edit their calendars, but you can plan around them.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 24 }}>
        <div>
          <div className="mono" style={{ color: "var(--clay-600)", marginBottom: 10 }}>— Roster · {peers.length}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {peers.map(p => {
              const active = selected?.id === p.id;
              return (
                <button key={p.id} onClick={() => setSelected(p)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                  borderRadius: "var(--r-md)", border: "1px solid " + (active ? "var(--walnut-700)" : "transparent"),
                  background: active ? "var(--sand-100)" : "var(--paper)",
                  cursor: "pointer", textAlign: "left", fontFamily: "var(--f-body)",
                }}>
                  <CoachAvatar coach={p} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: "var(--espresso-900)", fontWeight: active ? 500 : 400 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "var(--clay-600)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.role}</div>
                  </div>
                  <span style={{ fontSize: 10, fontFamily: "var(--f-mono)", color: "var(--clay-600)", textTransform:"uppercase", letterSpacing: 1 }}>
                    {p.ptEligible ? "PT" : "Group"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {selected && (
            <div style={{
              background: "var(--paper)", borderRadius: "var(--r-xl)", border: "1px solid var(--hairline)",
              padding: 24, boxShadow: "var(--sh-2)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <CoachAvatar coach={selected} size={56} />
                <div>
                  <h3 className="serif" style={{ fontSize: 28, margin: 0, color:"var(--espresso-900)" }}>{selected.name}'s week</h3>
                  <div style={{ color: "var(--clay-600)", fontSize: 13, marginTop: 2 }}>{selected.role} · Read-only</div>
                </div>
                <span className="chip" style={{ marginLeft: "auto" }}>
                  <span className="chip-dot" style={{ background: "var(--clay-500)" }} />
                  View-only
                </span>
              </div>
              <WeekView cursor={new Date(2026, 3, 20)} events={peerEvents} onEventClick={() => {}} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ------- Profile page -------
function ProfilePage({ coach, profile, setProfile, toast }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);

  useEffect(() => { setDraft(profile); }, [profile]);

  function save() {
    setProfile(draft);
    setEditing(false);
    toast("Profile updated — changes are live on the studio site");
  }

  const gallery = draft.gallery;

  function addMedia(kind) {
    const url = prompt(kind === "photo" ? "Paste image URL (or leave blank for placeholder)" : "Paste video URL (YouTube / Vimeo)");
    if (url === null) return;
    setDraft({ ...draft, gallery: [...gallery, { kind, url: url || "", caption: "" }] });
  }
  function removeMedia(i) {
    setDraft({ ...draft, gallery: gallery.filter((_, j) => j !== i) });
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        <div>
          <h2 className="serif" style={{ fontSize: 44, margin: "0 0 6px", color: "var(--espresso-900)" }}>My Profile</h2>
          <p style={{ color: "var(--clay-600)", margin: 0 }}>How you appear to members on the Trainers page.</p>
        </div>
        {!editing ? (
          <button className="btn-primary" onClick={() => setEditing(true)}>Edit profile</button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-ghost" onClick={() => { setDraft(profile); setEditing(false); }}>Cancel</button>
            <button className="btn-primary" onClick={save}>Save changes</button>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 32 }}>
        {/* Left: photo + handles */}
        <div>
          <div style={{
            background: "var(--paper)", border: "1px solid var(--hairline)",
            borderRadius: "var(--r-xl)", padding: 24, boxShadow: "var(--sh-1)"
          }}>
            <div style={{ position: "relative", width: 200, height: 200, margin: "0 auto 20px" }}>
              {draft.photo ? (
                <img src={draft.photo} alt="" style={{
                  width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%",
                  border: "4px solid var(--paper)", boxShadow: "var(--sh-2)"
                }} />
              ) : (
                <div style={{
                  width: "100%", height: "100%", borderRadius: "50%",
                  background: "var(--sand-200)", color: "var(--walnut-700)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: 72,
                  border: "4px solid var(--paper)", boxShadow: "var(--sh-2)",
                }}>{coach.initials}</div>
              )}
              {editing && (
                <button onClick={() => {
                  const url = prompt("Paste profile photo URL");
                  if (url !== null) setDraft({ ...draft, photo: url });
                }} style={{
                  position: "absolute", bottom: 8, right: 8,
                  width: 44, height: 44, borderRadius: "50%",
                  background: "var(--walnut-700)", color: "var(--paper)",
                  border: "3px solid var(--paper)", cursor: "pointer",
                  fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "var(--sh-2)",
                }} aria-label="Change photo">✎</button>
              )}
            </div>
            <h3 className="serif" style={{ fontSize: 28, textAlign: "center", margin: "0 0 4px", color: "var(--espresso-900)" }}>{coach.name}</h3>
            <div style={{ textAlign: "center", color: "var(--clay-600)", fontSize: 14, marginBottom: 20 }}>{coach.role}</div>

            <div className="mono" style={{ color: "var(--clay-600)", marginBottom: 8 }}>Instagram</div>
            {editing ? (
              <input className="m3s-input" value={draft.instagram} onChange={e => setDraft({ ...draft, instagram: e.target.value })} placeholder="@handle" />
            ) : (
              <a href={`https://instagram.com/${draft.instagram.replace("@","")}`} target="_blank" style={{
                color: "var(--walnut-700)", textDecoration: "none", fontSize: 15,
                borderBottom: "1px solid var(--hairline-strong)"
              }}>{draft.instagram}</a>
            )}

            <div className="mono" style={{ color: "var(--clay-600)", marginTop: 20, marginBottom: 8 }}>Certifications</div>
            <div style={{ fontSize: 14, color: "var(--espresso-900)" }}>{coach.cert}</div>

            <div className="mono" style={{ color: "var(--clay-600)", marginTop: 20, marginBottom: 8 }}>Specialties</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {coach.specialties.map(s => <span key={s} className="chip">{s}</span>)}
            </div>
          </div>
        </div>

        {/* Right: bio + gallery */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{
            background: "var(--paper)", border: "1px solid var(--hairline)",
            borderRadius: "var(--r-xl)", padding: 32, boxShadow: "var(--sh-1)"
          }}>
            <div className="mono" style={{ color: "var(--clay-600)", marginBottom: 12 }}>— About you</div>
            {editing ? (
              <textarea className="m3s-input" value={draft.bio} onChange={e => setDraft({ ...draft, bio: e.target.value })} rows={5}
                style={{ fontFamily:"var(--f-body)", fontSize: 17, lineHeight: 1.6, resize: "vertical" }} />
            ) : (
              <p style={{ fontSize: 19, lineHeight: 1.5, color: "var(--espresso-900)", margin: 0, fontFamily: "var(--f-display)", fontStyle: "italic" }}>
                "{draft.bio}"
              </p>
            )}
          </div>

          <div style={{
            background: "var(--paper)", border: "1px solid var(--hairline)",
            borderRadius: "var(--r-xl)", padding: 32, boxShadow: "var(--sh-1)"
          }}>
            <div style={{ display: "flex", justifyContent:"space-between", alignItems:"center", marginBottom: 16 }}>
              <div className="mono" style={{ color:"var(--clay-600)" }}>— Gallery · {gallery.length} items</div>
              {editing && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn-ghost" onClick={() => addMedia("photo")}>+ Photo</button>
                  <button className="btn-ghost" onClick={() => addMedia("video")}>+ Video</button>
                </div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
              {gallery.map((m, i) => (
                <div key={i} style={{
                  position: "relative", aspectRatio: "1 / 1", borderRadius: "var(--r-lg)",
                  overflow: "hidden", background: "var(--sand-100)",
                  border: "1px solid var(--hairline)",
                }}>
                  {m.kind === "photo" ? (
                    m.url ? <img src={m.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                    : <PlaceholderMedia kind="photo" />
                  ) : (
                    <PlaceholderMedia kind="video" />
                  )}
                  {editing && (
                    <button onClick={() => removeMedia(i)} style={{
                      position: "absolute", top: 6, right: 6, width: 26, height: 26,
                      borderRadius: "50%", border: "none", background: "rgba(36,24,16,0.8)", color: "var(--paper)",
                      cursor: "pointer", fontSize: 14,
                    }}>✕</button>
                  )}
                </div>
              ))}
              {gallery.length === 0 && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 40, color: "var(--clay-600)" }}>
                  No photos or videos yet. {editing ? "Click + Photo or + Video above." : "Click Edit profile to add some."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AIClientInsightsCard toast={toast} />
    </div>
  );
}

// ------- AI Client Insights card (bottom of My Profile) -------
function AIClientInsightsCard({ toast }) {
  const blocks = [
    {
      kind: "flag", accent: "var(--terracotta-500)", eyebrow: "Attention",
      client: "Anita V.",
      text: "Programme ends in 4 sessions. No renewal conversation logged. Consider scheduling a check-in before Apr 30.",
      action: "Log check-in →",
      chipBg: "var(--terracotta-200)", chipFg: "var(--terracotta-500)",
    },
    {
      kind: "progress", accent: "var(--ochre-500)", eyebrow: "Progress signal",
      client: "Meera P.",
      text: "Body fat down 2.2% across 3 check-ins. Muscle mass holding. Strong trend — worth documenting for her milestone review.",
      action: "Add milestone note →",
      chipBg: "#FFF2D8", chipFg: "#6A4A10",
    },
    {
      kind: "pattern", accent: "var(--sage-500)", eyebrow: "Pattern",
      client: "Rohan T.",
      text: "On hold for 18 days. Last hold lasted 12 days. A short check-in message may help re-engagement.",
      action: "Send message →",
      chipBg: "var(--sage-200)", chipFg: "var(--sage-500)",
    },
  ];

  return (
    <div style={{
      marginTop: 32, maxWidth: 1080,
      background: "var(--paper)", borderRadius: 24,
      border: "1px solid var(--hairline-strong)", boxShadow: "var(--sh-2)",
      overflow: "hidden",
    }}>
      {/* Top bar */}
      <div style={{
        background: "var(--espresso-900)", padding: "16px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
      }}>
        <div className="mono" style={{ color: "var(--sand-200)", display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ochre-500)" }} />
          AI · Client Insights
        </div>
        <div className="mono" style={{ color: "var(--sand-300)" }}>
          Generated today · Apr 28
        </div>
      </div>

      {/* Blocks */}
      <div>
        {blocks.map((b, i) => (
          <div key={i} style={{
            display: "flex", gap: 16, padding: "22px 24px",
            borderBottom: "1px solid var(--hairline)",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", left: 0, top: 22, bottom: 22, width: 3,
              background: b.accent, borderRadius: "0 2px 2px 0",
            }} />
            <div style={{ flex: 1, paddingLeft: 12 }}>
              <div className="mono" style={{ color: b.accent, marginBottom: 6, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: b.accent }} />
                {b.eyebrow}
              </div>
              <div style={{ fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 17, color: "var(--espresso-900)", marginBottom: 6 }}>
                {b.client}
              </div>
              <p style={{
                fontSize: 15, lineHeight: 1.55, color: "var(--ink)",
                margin: "0 0 12px", maxWidth: 720,
              }}>{b.text}</p>
              <button onClick={() => toast(`${b.client} — ${b.action.replace(" →", "")}`)} className="mono" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: "var(--r-pill)",
                background: b.chipBg, color: b.chipFg, border: "none",
                fontSize: 10, letterSpacing: 1.5, fontWeight: 600, cursor: "pointer",
              }}>{b.action}</button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: "18px 24px", display: "flex", flexDirection: "column",
        alignItems: "center", gap: 10, background: "var(--sand-50)",
      }}>
        <div className="mono" style={{ color: "var(--clay-600)", textAlign: "center" }}>
          Insights based on session logs · body comp data · programme timeline
        </div>
        <button onClick={() => toast("Regenerating insights…")} className="mono" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "transparent", border: "none", color: "var(--walnut-700)",
          cursor: "pointer", padding: 4,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          Regenerate
        </button>
      </div>
    </div>
  );
}

function PlaceholderMedia({ kind }) {
  const toneClasses = ["#EADBC4","#D7DECF","#ECCDBF","#F5EDE0"];
  const tone = toneClasses[Math.floor(Math.random() * toneClasses.length)];
  return (
    <div style={{
      width:"100%", height:"100%", background: tone,
      display:"flex", alignItems:"center", justifyContent:"center",
      color:"var(--clay-600)", fontFamily:"var(--f-mono)", fontSize: 11, letterSpacing: 1, textTransform:"uppercase",
    }}>
      {kind === "photo" ? "◱ Photo" : "▶ Video"}
    </div>
  );
}

// ------- Integrations / Google Calendar sync -------
function SyncPage({ connected, setConnected, toast }) {
  return (
    <div>
      <h2 className="serif" style={{ fontSize: 44, margin: "0 0 8px", color:"var(--espresso-900)" }}>Integrations</h2>
      <p style={{ color:"var(--clay-600)", maxWidth: 600, lineHeight: 1.6, margin: "0 0 32px" }}>
        Keep your personal calendar in sync with Coach Universe. Your M3S events show up on your phone,
        and personal events block PT bookings automatically.
      </p>

      <div style={{
        background:"var(--paper)", borderRadius:"var(--r-xl)", border:"1px solid var(--hairline)",
        padding: 32, boxShadow:"var(--sh-1)", maxWidth: 720, marginBottom: 20,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap: 20, flexWrap:"wrap" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 14, background: "var(--sand-50)",
            border: "1px solid var(--hairline)", display:"flex", alignItems:"center", justifyContent:"center",
            flexShrink: 0,
          }}>
            <svg width="36" height="36" viewBox="0 0 48 48">
              <rect x="6" y="10" width="36" height="32" rx="4" fill="#fff" stroke="#ddd" strokeWidth="1"/>
              <rect x="6" y="10" width="36" height="8" rx="4" fill="#4285F4"/>
              <rect x="6" y="14" width="36" height="4" fill="#4285F4"/>
              <circle cx="14" cy="8" r="2" fill="#4285F4"/>
              <circle cx="34" cy="8" r="2" fill="#4285F4"/>
              <text x="24" y="34" fontSize="14" fill="#4285F4" textAnchor="middle" fontFamily="sans-serif" fontWeight="600">31</text>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ fontSize: 20, margin: "0 0 4px", color:"var(--espresso-900)", fontWeight: 500 }}>Google Calendar</h3>
            <p style={{ color:"var(--clay-600)", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
              Two-way sync · M3S events → Google, personal events → M3S (as busy)
            </p>
          </div>
          {connected ? (
            <button className="btn-ghost" onClick={() => { setConnected(false); toast("Disconnected from Google Calendar"); }}
              style={{ color: "var(--terracotta-500)", borderColor: "var(--terracotta-200)" }}>
              Disconnect
            </button>
          ) : (
            <button className="btn-primary" onClick={() => { setConnected(true); toast("Connected — syncing this week's events"); }}>
              Connect Google
            </button>
          )}
        </div>

        {connected && (
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--hairline)" }}>
            <div style={{ display:"flex", alignItems:"center", gap: 10, marginBottom: 20 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7B8B6F" }} />
              <span className="mono" style={{ color:"var(--sage-500)" }}>Connected · last sync 3 min ago</span>
            </div>
            <SyncToggle label="Push M3S events to Google" checked={true} />
            <SyncToggle label="Pull personal events from Google (as 'Busy')" checked={true} />
            <SyncToggle label="Include PT member names in pushed events" checked={false} />
            <SyncToggle label="Auto-decline conflicting PT invites" checked={false} />
          </div>
        )}
      </div>

      <div style={{
        background:"var(--paper)", borderRadius:"var(--r-xl)", border:"1px solid var(--hairline)",
        padding: 24, boxShadow:"var(--sh-1)", maxWidth: 720, opacity: 0.65,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--sand-50)", border:"1px solid var(--hairline)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontFamily:"var(--f-display)", fontSize:24, color:"var(--clay-600)" }}>A</span>
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: 17, color: "var(--espresso-900)", fontWeight: 500 }}>Apple Calendar · iCal</h4>
            <p style={{ margin: "4px 0 0", color:"var(--clay-600)", fontSize: 13 }}>Coming soon — iCal subscription URL</p>
          </div>
          <span className="chip">Soon</span>
        </div>
      </div>
    </div>
  );
}

function SyncToggle({ label, checked: initial }) {
  const [on, setOn] = useState(initial);
  return (
    <label style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--hairline)", cursor:"pointer" }}>
      <span style={{ fontSize: 14, color:"var(--espresso-800)" }}>{label}</span>
      <button type="button" onClick={() => setOn(!on)} style={{
        width: 42, height: 24, borderRadius: 999, border: "none",
        background: on ? "var(--walnut-700)" : "var(--sand-300)",
        position: "relative", cursor: "pointer", transition: "background .2s",
      }}>
        <span style={{
          position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18,
          borderRadius: "50%", background: "var(--paper)", transition: "left .2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
        }} />
      </button>
    </label>
  );
}

// ------- Clients page -------
function ClientsPage({ coach, clients, toast }) {
  const [filter, setFilter] = useState("all");
  const [openClient, setOpenClient] = useState(null);

  if (openClient) {
    return <ClientProfile client={openClient} onBack={() => setOpenClient(null)} />;
  }

  const filters = [
    { id: "all",    label: "All" },
    { id: "active", label: "Active" },
    { id: "hold",   label: "On hold" },
    { id: "ending", label: "Ending soon" },
  ];

  const filtered = clients.filter(c => filter === "all" ? true : c.status === filter);
  const activeCount = clients.filter(c => c.status === "active" || c.status === "ending").length;

  const statusMeta = {
    active: { label: "Active",       bg: "var(--sage-200)",       fg: "var(--sage-500)",       dot: "var(--sage-500)" },
    hold:   { label: "On hold",      bg: "var(--sand-200)",       fg: "var(--clay-600)",       dot: "var(--clay-600)" },
    ending: { label: "Ending soon",  bg: "var(--terracotta-200)", fg: "var(--terracotta-500)", dot: "var(--terracotta-500)" },
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div className="mono" style={{ color: "var(--clay-600)", marginBottom: 10, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ochre-500)" }} />
          MY CLIENTS
        </div>
        <h2 className="serif" style={{ fontSize: 44, margin: "0 0 8px", color: "var(--espresso-900)", fontStyle: "italic" }}>
          Active Clients
        </h2>
        <div className="mono" style={{ color: "var(--clay-600)" }}>
          {coach.name.split(" ")[0].toUpperCase()} · {activeCount} ACTIVE
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {filters.map(f => {
          const active = filter === f.id;
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} className="mono" style={{
              padding: "8px 16px", borderRadius: "var(--r-pill)",
              border: "1px solid " + (active ? "var(--walnut-700)" : "var(--hairline-strong)"),
              background: active ? "var(--walnut-700)" : "var(--paper)",
              color: active ? "var(--paper)" : "var(--walnut-700)",
              cursor: "pointer", fontFamily: "var(--f-mono)",
              fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase",
            }}>{f.label}</button>
          );
        })}
      </div>

      {/* Card grid */}
      <div className="clients-grid" style={{
        display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16,
      }}>
        {filtered.map(c => {
          const pct = Math.round((c.done / c.total) * 100);
          const meta = statusMeta[c.status];
          return (
            <div key={c.id} style={{
              background: "var(--paper)", borderRadius: "var(--r-lg)",
              border: "1px solid var(--hairline-strong)", boxShadow: "var(--sh-2)",
              padding: 20, display: "flex", flexDirection: "column", gap: 14,
            }}>
              {/* Row 1: avatar + name + programme tag */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <CoachAvatar coach={{ initials: c.initials, tone: c.tone }} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 16, color: "var(--espresso-900)", lineHeight: 1.2 }}>
                    {c.name}
                  </div>
                </div>
                <span className="mono" style={{
                  background: "var(--sand-100)", color: "var(--walnut-700)",
                  padding: "4px 10px", borderRadius: "var(--r-pill)",
                  fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
                  border: "1px solid var(--hairline)", whiteSpace: "nowrap",
                }}>{c.programme}</span>
              </div>

              {/* Row 2: stats */}
              <div className="mono" style={{ color: "var(--clay-600)", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>
                Session {c.done} of {c.total} · Since {c.since.toUpperCase()}
              </div>

              {/* Row 3: progress bar */}
              <div style={{ width: "100%", height: 6, background: "var(--sand-200)", borderRadius: "var(--r-pill)", overflow: "hidden" }}>
                <div style={{
                  width: pct + "%", height: "100%",
                  background: "var(--ochre-500)", borderRadius: "var(--r-pill)",
                  transition: "width .3s",
                }} />
              </div>

              {/* Row 4: chips */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className="mono" style={{
                  fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
                  color: "var(--clay-600)", padding: "4px 8px",
                  border: "1px solid var(--hairline)", borderRadius: "var(--r-pill)",
                }}>Last session: {c.lastSession}</span>
                <span className="mono" style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: meta.bg, color: meta.fg,
                  padding: "4px 10px", borderRadius: "var(--r-pill)",
                  fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.dot }} />
                  {meta.label}
                </span>
              </div>

              {/* Footer actions */}
              <div style={{ display: "flex", gap: 8, marginTop: 4, paddingTop: 12, borderTop: "1px solid var(--hairline)" }}>
                <button onClick={() => setOpenClient(c)} style={{
                  flex: 1, padding: "8px 14px", borderRadius: "var(--r-pill)",
                  background: "var(--walnut-700)", color: "var(--paper)", border: "none",
                  cursor: "pointer", fontSize: 12, fontFamily: "var(--f-body)", fontWeight: 500,
                }}>View profile</button>
                <button onClick={() => toast(`Logging session for ${c.name}`)} style={{
                  flex: 1, padding: "8px 14px", borderRadius: "var(--r-pill)",
                  background: "var(--paper)", color: "var(--walnut-700)",
                  border: "1px solid var(--hairline-strong)",
                  cursor: "pointer", fontSize: 12, fontFamily: "var(--f-body)", fontWeight: 500,
                }}>Log session</button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 48, borderRadius: "var(--r-lg)", background: "var(--paper)", border: "1px solid var(--hairline)", textAlign: "center", color: "var(--clay-600)" }}>
          No clients match this filter.
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .clients-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ------- App root -------
function App() {
  const [coach, setCoach] = useState(null);
  const [section, setSection] = useState("calendar");
  const [events, setEvents] = useState({});
  const [invites, setInvites] = useState(SEED_INVITES);
  const [clients, setClients] = useState(SEED_CLIENTS);
  const [profile, setProfile] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [gConnected, setGConnected] = useState(false);

  // Track pending for sidebar badge (writing to window so Sidebar can read)
  useEffect(() => {
    window.__pendingInvites = invites.filter(i => i.status === "pending").length;
  }, [invites]);

  // Track ending-soon clients for sidebar badge
  useEffect(() => {
    window.__endingSoon = clients.filter(c => c.status === "ending").length;
  }, [clients]);

  function toast(msg) {
    setToastMsg(msg);
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => setToastMsg(""), 3000);
  }

  function login(selectedCoach) {
    setCoach(selectedCoach);
    setEvents(buildEventsForCoach(selectedCoach.id));
    setProfile({
      photo: "", // empty → initials avatar
      bio: selectedCoach.bio,
      instagram: "@" + selectedCoach.id + ".m3s",
      gallery: [
        { kind: "photo", url: "" },
        { kind: "photo", url: "" },
        { kind: "video", url: "" },
      ],
    });
  }

  function logout() {
    setCoach(null);
    setSection("calendar");
  }

  if (!coach) return <Login onLogin={login} />;

  // Mobile notice
  return (
    <>
      <div className="mobile-notice" style={{
        minHeight: "100vh", background: "var(--espresso-900)", color: "var(--sand-100)",
        alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", flexDirection: "column",
      }}>
        <div className="mono" style={{ color: "var(--ochre-500)", marginBottom: 16 }}>— Coach Universe</div>
        <h2 className="serif" style={{ fontSize: 32, margin: "0 0 16px", fontStyle: "italic" }}>
          Best on a larger screen
        </h2>
        <p style={{ maxWidth: 320, lineHeight: 1.5, color: "var(--sand-200)" }}>
          The calendar workspace needs room to breathe. Open Coach Universe on a tablet or laptop for the full experience.
        </p>
        <a href="index.html" style={{ color: "var(--ochre-500)", textDecoration: "none", marginTop: 32, fontSize: 14 }}>
          ← Back to studio site
        </a>
      </div>

      <div className="desktop-only" style={{ display: "flex", minHeight: "100vh", background: "var(--sand-50)" }}>
        <Sidebar coach={coach} section={section} onSection={setSection} onLogout={logout} />

        <main style={{ flex: 1, padding: "36px 40px", overflow: "hidden" }}>
          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, gap: 16, flexWrap:"wrap" }}>
            <div className="mono" style={{ color: "var(--clay-600)" }}>
              — {new Date(2026, 3, 20).toLocaleDateString("en-US", { weekday: "long", month:"long", day:"numeric", year:"numeric" })}
            </div>
            <div style={{ display: "flex", alignItems:"center", gap: 12 }}>
              {gConnected && (
                <span className="chip" style={{ background:"#DEE5D3", color:"#3E4A32", borderColor:"#B8C4A5" }}>
                  <span className="chip-dot" style={{ background:"#7B8B6F" }} />
                  Google synced
                </span>
              )}
              <span className="chip">{invites.filter(i => i.status === "pending").length} pending invites</span>
            </div>
          </div>

          {section === "calendar" && <CalendarPage coach={coach} events={events} setEvents={setEvents} invites={invites} setInvites={setInvites} toast={toast} />}
          {section === "invites"  && <InvitesPage coach={coach} invites={invites} setInvites={setInvites} events={events} setEvents={setEvents} toast={toast} />}
          {section === "clients"  && <ClientsPage coach={coach} clients={clients} toast={toast} />}
          {section === "peers"    && <PeersPage coach={coach} />}
          {section === "profile"  && profile && <ProfilePage coach={coach} profile={profile} setProfile={setProfile} toast={toast} />}
          {section === "sync"     && <SyncPage connected={gConnected} setConnected={setGConnected} toast={toast} />}
        </main>
      </div>

      {toastMsg && <div className="toast"><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ochre-500)" }} />{toastMsg}</div>}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

Object.assign(window, { Login, Sidebar, CoachAvatar, SEED_INVITES, buildEventsForCoach, hm, App });
