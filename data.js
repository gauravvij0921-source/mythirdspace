// Data for My Third Space
// Order: females first (starting Joe), then males (starting Rahul)
window.TRAINERS = [
  // — Female coaches —
  { id: "joe",     name: "Joe",     role: "Hypertrophy & Strength", tone: "espresso", bio: "Block-periodised hypertrophy. Muscle you can actually use.", specialties: ["Hypertrophy", "Strength", "Recovery"], initials: "JO", cert: "Strength · Hypertrophy", ptEligible: true },
  { id: "deb",     name: "Deb",     role: "Strength & Recovery", tone: "walnut", bio: "Post-rehab strength and long-term recovery planning.", specialties: ["Strength", "Recovery", "Hyrox Prep"], initials: "DB", cert: "Strength · Recovery", ptEligible: true },
  { id: "deepika", name: "Deepika", role: "Hyrox & Conditioning", tone: "terra", bio: "Zone 2 devotee turned Hyrox specialist. Endurance with structure.", specialties: ["Hyrox Prep", "Strength", "Conditioning"], initials: "DE", cert: "Hyrox · Strength", ptEligible: true },
  { id: "lee",     name: "Lee",     role: "Hypertrophy & Strength", tone: "sage", bio: "Form first, always. The coach who makes the last rep look like the first.", specialties: ["Hypertrophy", "Strength", "Recovery"], initials: "LE", cert: "Hypertrophy · Strength", ptEligible: true },
  { id: "pilates", name: "Anisha",  role: "Pilates & Mobility", tone: "sand", bio: "Clinical Pilates for posture, core control, and post-injury returns.", specialties: ["Pilates", "Mobility", "Recovery"], initials: "AN", cert: "Pilates · Mobility", ptEligible: false },
  { id: "shailaa", name: "Shailaa", role: "Dance Fitness", tone: "terra", bio: "Rhythm-led conditioning. Cardio that feels like a party and trains like a workout.", specialties: ["Dance", "Conditioning", "Mobility"], initials: "SL", cert: "Dance Fitness", ptEligible: false },
  // — Male coaches —
  { id: "rahul",   name: "Rahul",   role: "Strength & Hyrox Prep", tone: "walnut", bio: "Competition-tested Hyrox coach. Builds engines that don't quit in round four.", specialties: ["Strength", "Hyrox Prep", "Conditioning"], initials: "RA", cert: "Strength · Hyrox · Recovery", ptEligible: true },
  { id: "aakash",  name: "Aakash",  role: "Strength & Recovery", tone: "clay", bio: "Old-school strength with new-school recovery protocols.", specialties: ["Strength", "Recovery", "Mobility"], initials: "AK", cert: "Strength · Recovery", ptEligible: true },
  { id: "tarun",   name: "Tarun",   role: "Hyrox & Hypertrophy", tone: "clay", bio: "Hybrid athlete programming — size, speed, stamina.", specialties: ["Hyrox Prep", "Hypertrophy", "Strength"], initials: "TR", cert: "Hyrox · Hypertrophy", ptEligible: true },
  { id: "santo",   name: "Santo",   role: "Strength & Hypertrophy", tone: "espresso", bio: "Classical strength training with a bodybuilder's eye for detail.", specialties: ["Strength", "Hypertrophy", "Conditioning"], initials: "SA", cert: "Strength · Hypertrophy", ptEligible: true },
  { id: "shahbaz", name: "Shahbaz", role: "Yoga & Breathwork", tone: "sage", bio: "Traditional hatha and vinyasa. Breath-led practice for strength that lasts.", specialties: ["Yoga", "Breathwork", "Mobility"], initials: "SH", cert: "Yoga · Breathwork", ptEligible: false },
];
window.PT_TRAINERS = window.TRAINERS.filter(t => t.ptEligible);

// Instagram posts from @my.thirdspace (representative)
window.IG_POSTS = [
  { tone: "walnut", cap: "Strength isn't loud. It's consistent. @shwetashetty leading this morning's 6:30 strength block.", likes: 342, tag: "STRENGTH" },
  { tone: "sage", cap: "Breath before barbell. Our breathwork workshop last Saturday with visiting practitioner @arjan.", likes: 218, tag: "BREATHWORK" },
  { tone: "terra", cap: "Ice bath → sauna → ice bath. The contrast is the point. Open all week for drop-ins.", likes: 489, tag: "RECOVERY" },
  { tone: "sand", cap: "Body Composition Analysis day. Numbers don't lie, but they don't judge either.", likes: 156, tag: "ASSESSMENT" },
  { tone: "clay", cap: "Sunday running club. 8km easy through Cubbon, coffee at Koshy's. Every Sunday, 7AM.", likes: 602, tag: "COMMUNITY" },
  { tone: "espresso", cap: "\"I came for weight loss. I stayed for a body I actually trust.\" — Meera, 3 yrs with us.", likes: 871, tag: "MEMBER STORY" },
  { tone: "walnut", cap: "Kids' gymnastics Saturday. The joy of moving, before anyone tells them it should hurt.", likes: 293, tag: "KIDS" },
  { tone: "sage", cap: "In-house cafe update: new seasonal menu with @thekenkolife. Order at the counter, pick up after class.", likes: 347, tag: "KENKO × M3S" },
  { tone: "terra", cap: "Couple PT with @ria.kapoor. One hour, two people, zero phones.", likes: 184, tag: "COUPLE PT" },
];

// Kenko Life menu (representative)
window.KENKO_MENU = [
  { category: "Bowls", items: [
    { name: "Kenko Power Bowl", desc: "Brown rice, grilled chicken, avocado, roasted veg, miso-tahini", price: 380, tag: "High Protein" },
    { name: "Greek Goddess Bowl", desc: "Quinoa, falafel, hummus, cucumber, olives, tzatziki", price: 340, tag: "Vegetarian" },
    { name: "Teriyaki Salmon Bowl", desc: "Jasmine rice, glazed salmon, edamame, pickled ginger", price: 460, tag: "Omega-3" },
  ]},
  { category: "Salads", items: [
    { name: "Kale Caesar", desc: "Massaged kale, grilled chicken, parmesan, sourdough croutons", price: 320, tag: "Low Carb" },
    { name: "Rainbow Buddha", desc: "Spinach, beet, carrot, chickpea, sunflower seeds, lemon-dijon", price: 290, tag: "Vegan" },
  ]},
  { category: "Proteins & Sides", items: [
    { name: "Herb Grilled Chicken", desc: "130g · rosemary, thyme, olive oil", price: 260, tag: "30g Protein" },
    { name: "Roasted Sweet Potato", desc: "With tahini drizzle and chili flakes", price: 140, tag: "Complex Carb" },
  ]},
  { category: "Drinks", items: [
    { name: "Green Goddess Smoothie", desc: "Spinach, banana, mango, coconut water, chia", price: 220, tag: "Post-Workout" },
    { name: "Cold Brew Protein", desc: "Cold brew coffee + 25g whey isolate", price: 240, tag: "25g Protein" },
  ]},
];

// BCA sample data from user's Tanita MC-780 scan
window.BCA_HISTORY = [
  { date: "Oct 2025", weight: 98.2, fatPct: 24.8, muscle: 68.1, visceral: 14, bmi: 29.3, metabolicAge: 34 },
  { date: "Dec 2025", weight: 96.5, fatPct: 23.5, muscle: 68.8, visceral: 13, bmi: 28.8, metabolicAge: 32 },
  { date: "Feb 2026", weight: 95.1, fatPct: 22.7, muscle: 69.3, visceral: 12, bmi: 28.4, metabolicAge: 30 },
  { date: "Apr 2026", weight: 94.1, fatPct: 21.9, muscle: 69.7, visceral: 12, bmi: 28.1, metabolicAge: 28 },
];

window.CONTACT = {
  address: "HAL 2nd Stage, Indiranagar, Bengaluru 560008",
  phone: "+91 81239 01143",
  email: "hello@mythirdspace.fit",
  instagram: "@my.thirdspace",
  hours: [
    { d: "Mon – Fri", t: "5:30 AM – 9:30 PM" },
    { d: "Saturday", t: "7:00 AM – 6:00 PM" },
    { d: "Sunday", t: "9:00 AM – 6:00 PM" },
  ],
};

window.SERVICES = [
  {
    id: "approach", kind: "Comprehensive Approach", tone: "walnut",
    tagline: "Before we move, we measure.",
    items: ["1-1 Consultation", "Blood Test", "Body Composition Analysis", "Fitness Assessment", "Personalized Nutrition Plan"],
    desc: "A 360° baseline so every minute you train is aimed, not guessed. We start with biomarkers and end with a plan you'll actually follow.",
  },
  {
    id: "pt", kind: "Personal Training", tone: "espresso",
    tagline: "Your coach, your hour.",
    items: ["1-on-1 Programming", "Form Correction", "Progressive Overload", "Recovery Protocols", "Weekly Check-ins"],
    desc: "Deliberate, private sessions with a coach who knows your knees, your sleep, and your goals for the next ten years.",
  },
  {
    id: "group", kind: "Group Workouts", tone: "sand",
    tagline: "Move with your people.",
    items: ["Yoga", "Pilates", "Running Club", "Strength & Conditioning"],
    desc: "Small groups, big accountability. Six classes a day, capped at twenty, so the coach still knows your name.",
  },
  {
    id: "work", kind: "Workshops", tone: "sage",
    tagline: "New skills, old wisdom.",
    items: ["Dance", "Gymnastics", "Expert Sessions", "Martial Arts", "Calisthenics", "Breathwork", "And more"],
    desc: "Monthly deep dives with visiting practitioners. Leave with something your body didn't know yesterday.",
  },
  {
    id: "recover", kind: "Recovery & Mind", tone: "terra",
    tagline: "The work between the work.",
    items: ["Infrared Sauna", "Cold Plunge", "Guided Meditation", "Sleep Coaching", "Mobility Flow"],
    desc: "Your nervous system is the app; we help you close the tabs. Drop-in recovery any time the studio is open.",
  },
];

// Booking — next 10 days
function generateSlots() {
  const days = [];
  const today = new Date(2026, 3, 17); // Apr 17 2026
  const times = ["06:30", "07:30", "09:00", "10:30", "17:00", "18:30", "19:30"];
  for (let i = 0; i < 70; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const slots = [];
    times.forEach((t) => {
      // vary availability pseudo-deterministically
      // Only PT-eligible coaches are offered in the booking grid
      window.PT_TRAINERS.forEach((tr) => {
        const seed = (i * 31 + t.charCodeAt(0) + tr.id.charCodeAt(0)) % 10;
        if (seed > 3) slots.push({ time: t, trainerId: tr.id });
      });
    });
    days.push({
      date: d,
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      day: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }),
      slots,
    });
  }
  return days;
}
window.BOOKING_DAYS = generateSlots();

window.TESTIMONIALS = [
  { q: "I came for weight loss. I stayed for a body I actually trust.", by: "Meera P.", role: "Member, 3 yrs" },
  { q: "The only gym where the coach asks how you slept before how much you lifted.", by: "Karan S.", role: "Member, 1 yr" },
  { q: "Shwetambari changed how I think about aging. I lift weights to play with my grandkids.", by: "Anita V.", role: "Member, 5 yrs" },
];
