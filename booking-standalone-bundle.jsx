// Booking flow — Calendly-style: pick by trainer availability OR by any trainer slot
// Now supports SINGLE or BULK (multi-day) booking with package discounts.
const { useState: useBS, useMemo: useBM } = React;

// Per-session price (INR)
const SESSION_PRICE = 2400;

// Duration packages — user picks one explicitly (NOT span-derived).
// Each maps to a number of weeks the schedule will cover.
const DURATIONS = [
  { id: "twoweek", weeks: 2, days: 14, pct: 5,  label: "2 weeks",  sub: "5% off"  },
  { id: "month",   weeks: 4, days: 28, pct: 10, label: "1 month",  sub: "10% off" },
  { id: "twomo",   weeks: 8, days: 56, pct: 15, label: "2 months", sub: "15% off" },
];
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_SHORT  = ["S", "M", "T", "W", "T", "F", "S"];

// Given chosen weekday-of-week numbers (Set of 0-6) + a duration in days,
// return the indices into BOOKING_DAYS that fall on those weekdays within [day0, day0+durationDays).
function expandSchedule(weekdaySet, durationDays) {
  const out = [];
  for (let i = 0; i < Math.min(durationDays, BOOKING_DAYS.length); i++) {
    if (weekdaySet.has(BOOKING_DAYS[i].date.getDay())) out.push(i);
  }
  return out;
}

function Booking({ initialMode = "time" }) {
  const [mode, setMode] = useBS(initialMode);             // "time" or "trainer"
  const [bookingType, setBookingType] = useBS("single");  // "single" or "bulk"
  const [step, setStep] = useBS(1);
  const [selection, setSelection] = useBS(null);
  const [auth, setAuth] = useBS({ method: null, value: "", reminders: ["email", "sms"] });

  const reset = () => {
    setStep(1); setSelection(null);
    setAuth({ method: null, value: "", reminders: ["email", "sms"] });
  };

  return (
    <section id="book" style={{ background: "var(--sand-50)", padding: "120px 0 140px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "end", marginBottom: 48 }}>
          <EyebrowTitle
            eyebrow="Book a session"
            title={<>Reserve your hour.</>}
            lead="One session, a week, or a full two-month block. Pick a coach or a time — the package discount kicks in automatically as you commit further out."
          />
          <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: 2, color: "var(--clay-600)", textTransform: "uppercase" }}>
            Step {step} / 3
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 40 }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: step >= n ? "var(--walnut-700)" : "var(--sand-200)",
              transition: "background .3s",
            }} />
          ))}
        </div>

        {step === 1 && (
          <BookingPick
            mode={mode} setMode={setMode}
            bookingType={bookingType} setBookingType={setBookingType}
            onConfirm={(sel) => { setSelection(sel); setStep(2); }}
          />
        )}
        {step === 2 && (
          <BookingLogin
            selection={selection}
            auth={auth} setAuth={setAuth}
            onBack={() => setStep(1)}
            onConfirm={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <BookingConfirm selection={selection} auth={auth} onReset={reset} />
        )}
      </div>
    </section>
  );
}

function BookingPick({ mode, setMode, bookingType, setBookingType, onConfirm }) {
  const PT = window.PT_TRAINERS || TRAINERS;
  const [trainerId, setTrainerId] = useBS(PT[0].id);

  // Single-mode state
  const [dayIdx, setDayIdx] = useBS(0);
  const [selected, setSelected] = useBS(null); // {time, trainerId}
  const [weekOffset, setWeekOffset] = useBS(0);

  // Bulk-mode state — NEW model: cadence + duration drive the schedule, not free-form dates.
  const [daysPerWeek, setDaysPerWeek]   = useBS(3);                  // 2 / 3 / 4 / 5
  const [weekdays, setWeekdays]         = useBS(new Set([1, 3, 5])); // weekday-of-week numbers, 0=Sun..6=Sat
  const [durationId, setDurationId]     = useBS("twoweek");          // 2wk / 1mo / 2mo
  const [bulkTimes, setBulkTimes]       = useBS([]);                 // "HH:MM" strings — applied to every chosen weekday

  // ─── SINGLE mode views ────────────────────────────────────────────────
  const day = BOOKING_DAYS[dayIdx];
  const filteredSlots = useBM(() => {
    if (mode === "trainer") return day.slots.filter((s) => s.trainerId === trainerId);
    const map = {};
    day.slots.forEach((s) => { (map[s.time] = map[s.time] || []).push(s.trainerId); });
    return Object.entries(map).map(([time, ids]) => ({ time, ids }));
  }, [mode, trainerId, dayIdx]);

  const duration = DURATIONS.find(d => d.id === durationId) || DURATIONS[0];
  const scheduledDayIdxs = useBM(() => expandSchedule(weekdays, duration.days), [weekdays, duration.days]);

  // ─── BULK aggregation under the new model ─────────────────────────────
  // For each scheduled day, count how many of the picked time slots have an available trainer.
  const bulkSummary = useBM(() => {
    if (scheduledDayIdxs.length === 0 || bulkTimes.length === 0) {
      return { sessions: 0, perDay: [], misses: 0 };
    }
    let sessions = 0, misses = 0;
    const perDay = scheduledDayIdxs.map((idx) => {
      const d = BOOKING_DAYS[idx];
      const hits = bulkTimes.map((t) => {
        const slotMatch = d.slots.find((s) => s.time === t && (mode === "time" || s.trainerId === trainerId));
        if (slotMatch) sessions += 1; else misses += 1;
        return { time: t, ok: !!slotMatch, trainerId: slotMatch?.trainerId };
      });
      return { idx, day: d, hits };
    });
    return { sessions, perDay, misses };
  }, [scheduledDayIdxs, bulkTimes, trainerId, mode]);

  // Times rail: union of all times that appear in BOOKING_DAYS (deterministic order)
  const ALL_TIMES = useBM(() => {
    const set = new Set();
    BOOKING_DAYS.forEach((d) => d.slots.forEach((s) => set.add(s.time)));
    return [...set].sort();
  }, []);

  const isBulk = bookingType === "bulk";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 24 }}>
      {/* ─── LEFT: mode + booking type + trainer ─── */}
      <Card tone="paper" style={{ padding: 32 }}>
        <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--clay-600)", marginBottom: 16 }}>
          01 · How would you like to book?
        </div>
        <div style={{ display: "flex", gap: 4, background: "var(--sand-100)", padding: 4, borderRadius: "var(--r-pill)", border: "1px solid var(--hairline)" }}>
          {[
            { id: "trainer", label: "By trainer", icon: "user" },
            { id: "time", label: "By time", icon: "clock" },
          ].map((m) => (
            <button key={m.id}
              onClick={() => { setMode(m.id); setSelected(null); }}
              style={pillBtn(mode === m.id)}>
              <Icon name={m.icon} size={14} /> {m.label}
            </button>
          ))}
        </div>

        {/* Single vs Bulk */}
        <div style={{ marginTop: 24, fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--clay-600)", marginBottom: 12 }}>
          02 · Single or recurring?
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { id: "single", label: "Single session", sub: "One day, one slot" },
            { id: "bulk",   label: "Multi-day plan", sub: "Bulk discount up to 15%" },
          ].map((b) => {
            const on = bookingType === b.id;
            return (
              <button key={b.id} onClick={() => setBookingType(b.id)} style={{
                padding: 14, borderRadius: "var(--r-md)",
                border: `1.5px solid ${on ? "var(--walnut-700)" : "var(--hairline)"}`,
                background: on ? "var(--sand-100)" : "var(--paper)",
                cursor: "pointer", textAlign: "left", transition: "all .15s",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--espresso-900)" }}>{b.label}</div>
                <div style={{ fontFamily: "var(--f-mono)", fontSize: 9.5, letterSpacing: 1, color: "var(--clay-600)", marginTop: 4, textTransform: "uppercase" }}>{b.sub}</div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 24, fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--clay-600)", marginBottom: 14 }}>
          {mode === "trainer" ? "03 · Pick your coach" : "03 · Pick a focus (optional)"}
        </div>

        {mode === "trainer" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PT.map((t) => (
              <button key={t.id}
                onClick={() => { setTrainerId(t.id); setSelected(null); }}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: 14, borderRadius: "var(--r-md)",
                  border: `1px solid ${trainerId === t.id ? "var(--walnut-700)" : "var(--hairline)"}`,
                  background: trainerId === t.id ? "var(--sand-100)" : "var(--paper)",
                  cursor: "pointer", textAlign: "left", transition: "all .2s",
                }}>
                <TrainerAvatar t={t} size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--espresso-900)" }}>{t.name}</div>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 1, color: "var(--clay-600)", marginTop: 2, textTransform: "uppercase" }}>{t.role}</div>
                </div>
                {trainerId === t.id && <Icon name="check" size={16} color="var(--walnut-700)" />}
              </button>
            ))}
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--espresso-800)", opacity: 0.75, margin: 0 }}>
              Any trainer who has this slot open will be offered. You'll see all available coaches at that time — pick whoever resonates.
            </p>
            <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["Strength", "Mobility", "Recovery", "Yoga", "Cardio", "Assessment"].map((g) => (
                <Chip key={g} tone="sand">{g}</Chip>
              ))}
            </div>
          </div>
        )}

        {/* Bulk pricing preview */}
        {isBulk && (
          <BulkPricingCard
            sessions={bulkSummary.sessions}
            duration={duration}
            scheduledDays={scheduledDayIdxs.length}
            timesCount={bulkTimes.length}
          />
        )}
      </Card>

      {/* ─── RIGHT: day + slots ─── */}
      <Card tone="paper" style={{ padding: 32 }}>
        {!isBulk ? (
          <SingleDaySlots
            mode={mode} trainerId={trainerId}
            dayIdx={dayIdx} setDayIdx={(i) => { setDayIdx(i); setSelected(null); }}
            selected={selected} setSelected={setSelected}
            day={day} filteredSlots={filteredSlots}
            onConfirm={onConfirm}
            weekOffset={weekOffset} setWeekOffset={setWeekOffset}
          />
        ) : (
          <BulkPicker
            mode={mode} trainerId={trainerId}
            daysPerWeek={daysPerWeek} setDaysPerWeek={setDaysPerWeek}
            weekdays={weekdays} setWeekdays={setWeekdays}
            durationId={durationId} setDurationId={setDurationId}
            duration={duration}
            bulkTimes={bulkTimes} setBulkTimes={setBulkTimes}
            allTimes={ALL_TIMES}
            scheduledDayIdxs={scheduledDayIdxs}
            summary={bulkSummary}
            onConfirm={() => onConfirm({
              type: "bulk",
              trainer: TRAINERS.find(t => t.id === trainerId),
              mode,
              daysPerWeek,
              weekdays: [...weekdays],
              duration,
              days: scheduledDayIdxs.map(i => BOOKING_DAYS[i]),
              times: bulkTimes,
              sessions: bulkSummary.sessions,
              tier: duration,
              perDay: bulkSummary.perDay,
            })}
          />
        )}
      </Card>
    </div>
  );
}

// ─── Single-day slot picker (existing flow, lightly cleaned) ───────────────
function SingleDaySlots({ mode, trainerId, dayIdx, setDayIdx, selected, setSelected, day, filteredSlots, onConfirm, weekOffset, setWeekOffset }) {
  const WEEK = 7;
  const visibleStart = weekOffset * WEEK;
  const visibleDays = BOOKING_DAYS.slice(visibleStart, visibleStart + WEEK);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--clay-600)" }}>
          04 · Choose a day
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))} disabled={weekOffset === 0} style={navBtn(weekOffset === 0)}>←</button>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 1.5, color: "var(--clay-600)", minWidth: 80, textAlign: "center" }}>
            Week {weekOffset + 1} / {Math.ceil(BOOKING_DAYS.length / WEEK)}
          </div>
          <button onClick={() => setWeekOffset(Math.min(Math.ceil(BOOKING_DAYS.length / WEEK) - 1, weekOffset + 1))} disabled={visibleStart + WEEK >= BOOKING_DAYS.length} style={navBtn(visibleStart + WEEK >= BOOKING_DAYS.length)}>→</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 28 }}>
        {visibleDays.map((d, i) => {
          const realIdx = visibleStart + i;
          const isActive = realIdx === dayIdx;
          return (
            <button key={d.iso} onClick={() => setDayIdx(realIdx)}
              style={{
                padding: "12px 6px", borderRadius: "var(--r-md)",
                border: `1px solid ${isActive ? "var(--walnut-700)" : "var(--hairline)"}`,
                background: isActive ? "var(--walnut-700)" : "var(--paper)",
                color: isActive ? "var(--paper)" : "var(--espresso-900)",
                cursor: "pointer", textAlign: "center", transition: "all .2s",
              }}>
              <div style={{ fontFamily: "var(--f-mono)", fontSize: 9, letterSpacing: 1, opacity: 0.7, textTransform: "uppercase" }}>{d.label}</div>
              <div style={{ fontFamily: "var(--f-display)", fontSize: 22, marginTop: 2, lineHeight: 1 }}>{d.day}</div>
              <div style={{ fontFamily: "var(--f-mono)", fontSize: 9, opacity: 0.7, marginTop: 2, textTransform: "uppercase" }}>{d.month}</div>
            </button>
          );
        })}
      </div>

      <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--clay-600)", marginBottom: 14 }}>
        05 · Available slots — {day.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      </div>

      {mode === "trainer" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {filteredSlots.length === 0 && <EmptyState trainer={TRAINERS.find(t => t.id === trainerId)} />}
          {filteredSlots.map((s, i) => {
            const isSel = selected && selected.time === s.time && selected.trainerId === s.trainerId;
            return (
              <button key={i} onClick={() => setSelected({ time: s.time, trainerId: s.trainerId })}
                style={slotBtn(isSel)}>
                <div style={{ fontFamily: "var(--f-display)", fontSize: 20, lineHeight: 1 }}>{s.time}</div>
                <div style={{ fontFamily: "var(--f-mono)", fontSize: 9, marginTop: 4, opacity: 0.7, textTransform: "uppercase" }}>60 min</div>
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {filteredSlots.length === 0 && <div style={{ padding: 24, color: "var(--clay-600)" }}>No slots this day.</div>}
          {filteredSlots.map((row) => {
            const isSelRow = selected && selected.time === row.time;
            return (
              <div key={row.time} style={{
                padding: 14, borderRadius: "var(--r-md)",
                border: `1px solid ${isSelRow ? "var(--walnut-700)" : "var(--hairline)"}`,
                background: "var(--paper)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: "var(--f-display)", fontSize: 22, color: "var(--espresso-900)" }}>{row.time}</div>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--clay-600)", letterSpacing: 1 }}>{row.ids.length} OPEN</div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  {row.ids.map((id) => {
                    const t = TRAINERS.find(x => x.id === id);
                    const pick = selected && selected.time === row.time && selected.trainerId === id;
                    return (
                      <button key={id} onClick={() => setSelected({ time: row.time, trainerId: id })}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "6px 10px", borderRadius: "var(--r-pill)",
                          border: `1px solid ${pick ? "var(--walnut-700)" : "var(--hairline)"}`,
                          background: pick ? "var(--walnut-700)" : "var(--sand-50)",
                          color: pick ? "var(--paper)" : "var(--espresso-900)",
                          cursor: "pointer", fontSize: 12, fontFamily: "var(--f-body)",
                          transition: "all .15s",
                        }}>
                        <TrainerAvatar t={t} size={18} />
                        {t.name.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div style={{
          marginTop: 28, padding: 20, borderRadius: "var(--r-md)",
          background: "var(--sand-100)", border: "1px solid var(--hairline)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <TrainerAvatar t={TRAINERS.find(t => t.id === selected.trainerId)} size={40} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{TRAINERS.find(t => t.id === selected.trainerId).name}</div>
              <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--clay-600)", marginTop: 2 }}>
                {day.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {selected.time} · 60 min
              </div>
            </div>
          </div>
          <Btn onClick={() => onConfirm({ type: "single", trainer: TRAINERS.find(t => t.id === selected.trainerId), day, time: selected.time })} icon={<Icon name="arrow" size={14} />}>
            Continue
          </Btn>
        </div>
      )}
    </>
  );
}

// ─── Bulk picker: multi-day grid + multi-time grid + summary ───────────────
function BulkPicker({ mode, trainerId, daysPerWeek, setDaysPerWeek, weekdays, setWeekdays, durationId, setDurationId, duration, bulkTimes, setBulkTimes, allTimes, scheduledDayIdxs, summary, onConfirm }) {
  const toggleWeekday = (n) => {
    const next = new Set(weekdays);
    if (next.has(n)) next.delete(n); else {
      if (next.size >= daysPerWeek) {
        // Drop the earliest-added (smallest weekday) to keep cap.
        const first = [...next].sort()[0];
        next.delete(first);
      }
      next.add(n);
    }
    setWeekdays(next);
  };
  const toggleTime = (t) => {
    setBulkTimes(bulkTimes.includes(t) ? bulkTimes.filter(x => x !== t) : [...bulkTimes, t]);
  };
  const handleCadence = (n) => {
    setDaysPerWeek(n);
    // Trim weekdays down if user reduced cadence
    if (weekdays.size > n) {
      const trimmed = new Set([...weekdays].sort().slice(0, n));
      setWeekdays(trimmed);
    }
  };
  const ready = weekdays.size === daysPerWeek && bulkTimes.length > 0 && summary.sessions > 0;
  const cadenceComplete = weekdays.size === daysPerWeek;

  return (
    <>
      {/* 04 · Days per week */}
      <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--clay-600)", marginBottom: 12 }}>
        04 · How many days per week?
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 22 }}>
        {[2, 3, 4, 5].map((n) => {
          const on = daysPerWeek === n;
          return (
            <button key={n} onClick={() => handleCadence(n)} style={{
              padding: "12px 8px", borderRadius: "var(--r-md)",
              border: `1.5px solid ${on ? "var(--walnut-700)" : "var(--hairline)"}`,
              background: on ? "var(--walnut-700)" : "var(--paper)",
              color: on ? "var(--paper)" : "var(--espresso-900)",
              cursor: "pointer", textAlign: "center", transition: "all .15s",
            }}>
              <div style={{ fontFamily: "var(--f-display)", fontSize: 22, lineHeight: 1 }}>{n}</div>
              <div style={{ fontFamily: "var(--f-mono)", fontSize: 9, marginTop: 4, opacity: 0.7, textTransform: "uppercase" }}>days / wk</div>
            </button>
          );
        })}
      </div>

      {/* 05 · Which weekdays */}
      <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--clay-600)", marginBottom: 12 }}>
        05 · Which days?
        <span style={{ color: cadenceComplete ? "var(--sage-500)" : "var(--walnut-700)", marginLeft: 8 }}>
          {weekdays.size} / {daysPerWeek} picked
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 22 }}>
        {WEEKDAY_LABELS.map((lbl, n) => {
          const on = weekdays.has(n);
          return (
            <button key={n} onClick={() => toggleWeekday(n)} style={{
              padding: "14px 6px", borderRadius: "var(--r-md)",
              border: `1.5px solid ${on ? "var(--walnut-700)" : "var(--hairline)"}`,
              background: on ? "var(--walnut-700)" : "var(--paper)",
              color: on ? "var(--paper)" : "var(--espresso-900)",
              cursor: "pointer", textAlign: "center", transition: "all .15s",
            }}>
              <div style={{ fontFamily: "var(--f-display)", fontSize: 18, lineHeight: 1 }}>{lbl}</div>
            </button>
          );
        })}
      </div>

      {/* 06 · Duration */}
      <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--clay-600)", marginBottom: 12 }}>
        06 · Duration
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 22 }}>
        {DURATIONS.map((d) => {
          const on = durationId === d.id;
          return (
            <button key={d.id} onClick={() => setDurationId(d.id)} style={{
              padding: 14, borderRadius: "var(--r-md)", textAlign: "left",
              border: `1.5px solid ${on ? "var(--walnut-700)" : "var(--hairline)"}`,
              background: on ? "var(--sand-100)" : "var(--paper)",
              cursor: "pointer", transition: "all .15s",
            }}>
              <div style={{ fontFamily: "var(--f-display)", fontSize: 20, color: "var(--espresso-900)", lineHeight: 1 }}>{d.label}</div>
              <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: on ? "var(--walnut-700)" : "var(--clay-600)", marginTop: 6, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>{d.sub}</div>
            </button>
          );
        })}
      </div>

      {/* 07 · Time slots */}
      <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--clay-600)", marginBottom: 12 }}>
        07 · Pick time slots <span style={{ color: "var(--walnut-700)", marginLeft: 8 }}>{bulkTimes.length} selected</span>
        <div style={{ marginTop: 4, fontFamily: "var(--f-body)", fontSize: 12, fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--clay-600)" }}>
          Applied to every chosen weekday across the {duration.label.toLowerCase()}.
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 20 }}>
        {allTimes.map((t) => {
          const on = bulkTimes.includes(t);
          return (
            <button key={t} onClick={() => toggleTime(t)} style={slotBtn(on)}>
              <div style={{ fontFamily: "var(--f-display)", fontSize: 18, lineHeight: 1 }}>{t}</div>
              <div style={{ fontFamily: "var(--f-mono)", fontSize: 9, marginTop: 4, opacity: 0.7, textTransform: "uppercase" }}>60 min</div>
            </button>
          );
        })}
      </div>

      {/* Schedule preview */}
      {scheduledDayIdxs.length > 0 && bulkTimes.length > 0 && (
        <div style={{
          marginTop: 8, padding: 14, borderRadius: "var(--r-md)",
          background: "var(--sand-50)", border: "1px solid var(--hairline)",
          maxHeight: 200, overflowY: "auto",
        }}>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: 9.5, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--clay-600)", marginBottom: 10 }}>
            Schedule preview · {summary.sessions} session{summary.sessions === 1 ? "" : "s"}{summary.misses > 0 ? ` · ${summary.misses} unavailable` : ""}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {summary.perDay.slice(0, 16).map((row) => (
              <div key={row.idx} style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 12, alignItems: "center", fontSize: 12 }}>
                <div style={{ fontFamily: "var(--f-mono)", fontSize: 10.5, letterSpacing: 1, color: "var(--espresso-900)" }}>
                  {row.day.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {row.hits.map((h) => (
                    <span key={h.time} style={{
                      padding: "3px 8px", borderRadius: 999,
                      background: h.ok ? "var(--walnut-700)" : "transparent",
                      color: h.ok ? "var(--paper)" : "var(--clay-600)",
                      border: h.ok ? "none" : "1px dashed var(--hairline-strong)",
                      fontFamily: "var(--f-mono)", fontSize: 10.5, letterSpacing: 0.5,
                      textDecoration: h.ok ? "none" : "line-through",
                    }}>{h.time}</span>
                  ))}
                </div>
              </div>
            ))}
            {summary.perDay.length > 16 && (
              <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--clay-600)", letterSpacing: 1, textAlign: "center", paddingTop: 6 }}>
                +{summary.perDay.length - 16} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Continue */}
      <div style={{
        marginTop: 24, padding: 20, borderRadius: "var(--r-md)",
        background: "var(--sand-100)", border: "1px solid var(--hairline)",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
      }}>
        <div>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: 9.5, letterSpacing: 1.5, color: "var(--clay-600)", textTransform: "uppercase" }}>
            {ready ? `${duration.label} · ${duration.pct}% off` : "Complete cadence, duration, and times to continue"}
          </div>
          <div style={{ fontFamily: "var(--f-display)", fontSize: 22, color: "var(--espresso-900)", marginTop: 4 }}>
            {ready ? `${summary.sessions} sessions · ${formatINR(calcTotal(summary.sessions, duration.pct))}` : "—"}
          </div>
        </div>
        <Btn disabled={!ready} onClick={onConfirm} icon={<Icon name="arrow" size={14} />}>Continue</Btn>
      </div>
    </>
  );
}

function BulkPricingCard({ sessions, duration, scheduledDays, timesCount }) {
  const subtotal = sessions * SESSION_PRICE;
  const discount = Math.round(subtotal * duration.pct / 100);
  const total = subtotal - discount;
  return (
    <div style={{
      marginTop: 24, padding: 16, borderRadius: "var(--r-md)",
      background: "var(--espresso-900)", color: "var(--paper)",
    }}>
      <div style={{ fontFamily: "var(--f-mono)", fontSize: 9.5, letterSpacing: 1.5, opacity: 0.6, textTransform: "uppercase" }}>
        Package preview
      </div>
      <div style={{ fontFamily: "var(--f-display)", fontSize: 22, marginTop: 6, color: "var(--ochre, #C99A3F)" }}>
        {duration.label} · −{duration.pct}%
      </div>
      <div style={{ fontSize: 11.5, opacity: 0.75, marginTop: 4, lineHeight: 1.5 }}>{duration.sub} on every session in the block.</div>

      {/* Tier ladder */}
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
        {DURATIONS.map((t) => {
          const active = t.id === duration.id;
          return (
            <div key={t.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "6px 10px", borderRadius: 6,
              background: active ? "rgba(201,154,63,0.18)" : "transparent",
              opacity: active ? 1 : 0.55,
            }}>
              <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 1 }}>
                {active ? "●" : "○"} {t.label}
              </div>
              <div style={{ fontFamily: "var(--f-body)", fontSize: 12, fontWeight: 600 }}>
                {t.pct}% off
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,253,248,0.15)", display: "flex", flexDirection: "column", gap: 6 }}>
        <Row k="Days scheduled" v={scheduledDays} />
        <Row k="Times / day" v={timesCount} />
        <Row k="Sessions" v={sessions || 0} />
        <Row k="Subtotal" v={formatINR(subtotal)} />
        {duration.pct > 0 && <Row k={`Discount (${duration.pct}%)`} v={`− ${formatINR(discount)}`} accent />}
        <Row k="Total" v={formatINR(total)} bold />
      </div>
    </div>
  );
}

function Row({ k, v, bold, accent }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 1, opacity: 0.7, textTransform: "uppercase" }}>{k}</span>
      <span style={{
        fontFamily: bold ? "var(--f-display)" : "var(--f-body)",
        fontSize: bold ? 18 : 13, fontWeight: bold ? 400 : 500,
        color: accent ? "var(--ochre, #C99A3F)" : "var(--paper)",
      }}>{v}</span>
    </div>
  );
}

function calcTotal(sessions, pct) {
  return sessions * SESSION_PRICE - Math.round(sessions * SESSION_PRICE * pct / 100);
}
function formatINR(n) {
  return "₹ " + n.toLocaleString("en-IN");
}

function pillBtn(active) {
  return {
    flex: 1, padding: "10px 14px", borderRadius: "var(--r-pill)",
    border: "none", cursor: "pointer",
    background: active ? "var(--walnut-700)" : "transparent",
    color: active ? "var(--paper)" : "var(--espresso-800)",
    fontFamily: "var(--f-body)", fontSize: 13, fontWeight: 500,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "all .2s",
  };
}
function navBtn(disabled) {
  return {
    width: 32, height: 32, borderRadius: "50%",
    border: "1px solid var(--hairline)", background: "var(--paper)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.3 : 1, fontSize: 14, color: "var(--walnut-700)",
  };
}
function slotBtn(active) {
  return {
    padding: "12px 8px", borderRadius: "var(--r-md)",
    border: `1px solid ${active ? "var(--walnut-700)" : "var(--hairline)"}`,
    background: active ? "var(--walnut-700)" : "var(--paper)",
    color: active ? "var(--paper)" : "var(--espresso-900)",
    cursor: "pointer", textAlign: "center", transition: "all .15s",
  };
}

function EmptyState({ trainer }) {
  return (
    <div style={{ gridColumn: "1/-1", padding: 32, textAlign: "center", background: "var(--sand-100)", borderRadius: "var(--r-md)", border: "1px dashed var(--hairline-strong)" }}>
      <div style={{ fontFamily: "var(--f-display)", fontSize: 22, color: "var(--walnut-700)" }}>No slots this day</div>
      <div style={{ fontSize: 13, color: "var(--clay-600)", marginTop: 6 }}>
        {trainer.name.split(" ")[0]} is booked. Try another date, or switch to "By time" to see all trainers.
      </div>
    </div>
  );
}

function TrainerAvatar({ t, size = 36 }) {
  const tones = { walnut: "var(--walnut-700)", sage: "var(--sage-500)", terra: "var(--terracotta-500)", clay: "var(--clay-500)", sand: "var(--sand-400)" };
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: tones[t.tone] || "var(--walnut-700)",
      color: "var(--paper)", display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--f-display)", fontSize: size * 0.42, flexShrink: 0,
    }}>{t.initials}</div>
  );
}

function BookingLogin({ selection, auth, setAuth, onBack, onConfirm }) {
  const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(auth.value);
  const validPhone = /^\+?[\d\s-]{8,}$/.test(auth.value);
  const ok = auth.method === "email" ? validEmail : auth.method === "phone" ? validPhone : false;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
      <Card tone="paper" style={{ padding: 40 }}>
        <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--clay-600)", marginBottom: 12 }}>
          06 · How should we remind you?
        </div>
        <h3 style={{ fontFamily: "var(--f-display)", fontSize: 36, fontWeight: 400, lineHeight: 1.1, margin: 0, color: "var(--espresso-900)" }}>
          {selection?.type === "bulk" ? "Your plan, saved." : "Your slot, saved."}
        </h3>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--espresso-800)", opacity: 0.8, marginTop: 12, maxWidth: 480 }}>
          Log in so we can send reminders and let you reschedule in one tap. No passwords — a magic link or OTP.
        </p>

        <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { id: "email", label: "Continue with Email", icon: "mail", hint: "Magic link, no password" },
            { id: "phone", label: "Continue with Phone", icon: "phone", hint: "OTP via SMS" },
          ].map((m) => (
            <button key={m.id}
              onClick={() => setAuth({ ...auth, method: m.id, value: "" })}
              style={{
                padding: 20, borderRadius: "var(--r-md)", textAlign: "left",
                border: `1.5px solid ${auth.method === m.id ? "var(--walnut-700)" : "var(--hairline)"}`,
                background: auth.method === m.id ? "var(--sand-100)" : "var(--paper)",
                cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, transition: "all .2s",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Icon name={m.icon} size={20} color="var(--walnut-700)" />
                {auth.method === m.id && <Icon name="check" size={16} color="var(--walnut-700)" />}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--espresso-900)" }}>{m.label}</div>
              <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 1, color: "var(--clay-600)", textTransform: "uppercase" }}>{m.hint}</div>
            </button>
          ))}
        </div>

        {auth.method && (
          <div style={{ marginTop: 28 }}>
            <label style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--clay-600)" }}>
              {auth.method === "email" ? "Email address" : "Mobile number"}
            </label>
            <input
              type={auth.method === "email" ? "email" : "tel"}
              value={auth.value}
              onChange={(e) => setAuth({ ...auth, value: e.target.value })}
              placeholder={auth.method === "email" ? "you@gmail.com" : "+91 98200 12345"}
              style={{
                display: "block", width: "100%", marginTop: 8,
                padding: "14px 16px", borderRadius: "var(--r-md)",
                border: "1.5px solid var(--hairline-strong)", background: "var(--paper)",
                fontFamily: "var(--f-body)", fontSize: 16, color: "var(--espresso-900)",
                outline: "none", transition: "border .2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--walnut-700)"}
              onBlur={(e) => e.target.style.borderColor = "var(--hairline-strong)"}
            />
          </div>
        )}

        <div style={{ marginTop: 28 }}>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--clay-600)", marginBottom: 12 }}>
            Reminders
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { id: "email", label: "Email 24h before" },
              { id: "sms", label: "SMS 2h before" },
              { id: "ics", label: "Add to calendar" },
            ].map((r) => {
              const on = auth.reminders.includes(r.id);
              return (
                <button key={r.id}
                  onClick={() => setAuth({ ...auth, reminders: on ? auth.reminders.filter(x => x !== r.id) : [...auth.reminders, r.id] })}
                  style={{
                    padding: "10px 16px", borderRadius: "var(--r-pill)",
                    border: `1px solid ${on ? "var(--walnut-700)" : "var(--hairline)"}`,
                    background: on ? "var(--walnut-700)" : "var(--paper)",
                    color: on ? "var(--paper)" : "var(--espresso-900)",
                    cursor: "pointer", fontSize: 13, fontFamily: "var(--f-body)",
                    display: "inline-flex", alignItems: "center", gap: 6, transition: "all .15s",
                  }}>
                  {on && <Icon name="check" size={13} />}
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Btn variant="ghost" onClick={onBack}>← Back</Btn>
          <Btn onClick={onConfirm} disabled={!ok} icon={<Icon name="arrow" size={14} />}>
            Confirm booking
          </Btn>
        </div>
      </Card>

      <BookingSummary selection={selection} />
    </div>
  );
}

function BookingSummary({ selection }) {
  if (!selection) return null;
  const isBulk = selection.type === "bulk";

  if (isBulk) {
    const subtotal = selection.sessions * SESSION_PRICE;
    const discount = Math.round(subtotal * selection.tier.pct / 100);
    const total = subtotal - discount;
    return (
      <Card tone="walnut" style={{ padding: 28, position: "sticky", top: 100, height: "fit-content", maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
        <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", opacity: 0.65, marginBottom: 16 }}>
          Your package
        </div>
        <div style={{ paddingBottom: 16, borderBottom: "1px solid rgba(255,253,248,0.15)" }}>
          <div style={{ fontFamily: "var(--f-display)", fontSize: 22 }}>{selection.tier.label}</div>
          {selection.tier.pct > 0 && (
            <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--ochre, #C99A3F)", letterSpacing: 1, marginTop: 4 }}>
              −{selection.tier.pct}% PACKAGE DISCOUNT
            </div>
          )}
        </div>
        <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <SumRow k="Sessions" v={selection.sessions} />
          <SumRow k="Cadence" v={`${selection.daysPerWeek}× / week`} />
          <SumRow k="Days" v={selection.weekdays.map(n => WEEKDAY_LABELS[n]).join(", ")} />
          <SumRow k="Times" v={selection.times.join(", ")} />
          {selection.mode === "trainer" && <SumRow k="Coach" v={selection.trainer.name} />}
          <SumRow k="Subtotal" v={formatINR(subtotal)} />
          {selection.tier.pct > 0 && <SumRow k={`Discount (−${selection.tier.pct}%)`} v={`− ${formatINR(discount)}`} />}
          <SumRow k="Total" v={formatINR(total)} highlight />
        </div>
        <div style={{ marginTop: 16, padding: 12, background: "rgba(255,253,248,0.08)", borderRadius: "var(--r-sm)", fontSize: 11.5, lineHeight: 1.5, opacity: 0.85 }}>
          Reschedule any session up to 4h before. Unused sessions roll forward 30 days.
        </div>
      </Card>
    );
  }

  return (
    <Card tone="walnut" style={{ padding: 28, position: "sticky", top: 100, height: "fit-content" }}>
      <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", opacity: 0.65, marginBottom: 16 }}>
        Your booking
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 20, borderBottom: "1px solid rgba(255,253,248,0.15)" }}>
        <TrainerAvatar t={selection.trainer} size={48} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{selection.trainer.name}</div>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 1, opacity: 0.7, marginTop: 3, textTransform: "uppercase" }}>{selection.trainer.role}</div>
        </div>
      </div>
      <div style={{ paddingTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <SumRow k="Date" v={selection.day.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} />
        <SumRow k="Time" v={`${selection.time} — ${addMin(selection.time, 60)} IST`} />
        <SumRow k="Duration" v="60 minutes" />
        <SumRow k="Location" v="M3S Studio · Khar W." />
        <SumRow k="Price" v={formatINR(SESSION_PRICE)} highlight />
      </div>
      <div style={{ marginTop: 20, padding: 14, background: "rgba(255,253,248,0.08)", borderRadius: "var(--r-sm)", fontSize: 12, lineHeight: 1.5, opacity: 0.85 }}>
        Free to reschedule up to 4 hours before the session.
      </div>
    </Card>
  );
}

function SumRow({ k, v, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
      <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 1.5, opacity: 0.65, textTransform: "uppercase" }}>{k}</span>
      <span style={{ fontSize: highlight ? 18 : 13, fontWeight: highlight ? 600 : 400, fontFamily: highlight ? "var(--f-display)" : "var(--f-body)", textAlign: "right" }}>{v}</span>
    </div>
  );
}

function addMin(t, m) {
  const [h, mm] = t.split(":").map(Number);
  const d = new Date(2026, 3, 17, h, mm + m);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function BookingConfirm({ selection, auth, onReset }) {
  const isBulk = selection?.type === "bulk";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
      <Card tone="paper" style={{ padding: 48, textAlign: "center" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "var(--sage-500)", color: "var(--paper)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
        }}>
          <Icon name="check" size={34} strokeWidth={2.5} />
        </div>
        <h3 style={{ fontFamily: "var(--f-display)", fontSize: 48, fontWeight: 400, lineHeight: 1.05, margin: "24px 0 12px", color: "var(--espresso-900)" }}>
          {isBulk ? "Your plan is locked." : "You're in."}
        </h3>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--espresso-800)", opacity: 0.85, margin: "0 auto", maxWidth: 460 }}>
          {isBulk
            ? `${selection.sessions} sessions over ${selection.duration.label.toLowerCase()}, locked at ${selection.tier.pct}% off. We've sent the schedule to `
            : `We've sent a confirmation to `}
          <strong>{auth.value}</strong>. {auth.reminders.includes("sms") && "SMS reminders 2 hours before each session. "}See you on the floor.
        </p>

        <div style={{ marginTop: 40, display: "inline-flex", flexDirection: "column", gap: 8, padding: 20, border: "1px dashed var(--hairline-strong)", borderRadius: "var(--r-md)", textAlign: "left", minWidth: 320 }}>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--clay-600)" }}>BOOKING REF</div>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: 15, color: "var(--espresso-900)" }}>M3S-{Math.random().toString(36).slice(2, 8).toUpperCase()}</div>
        </div>

        <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center" }}>
          <Btn variant="secondary" onClick={onReset}>Book another</Btn>
          <Btn variant="sage">Add to calendar</Btn>
        </div>
      </Card>

      <BookingSummary selection={selection} />
    </div>
  );
}

Object.assign(window, { Booking });
