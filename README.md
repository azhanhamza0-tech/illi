# ڕوانین (RWANIN) — Cinematic Kurdish Streaming Platform

پلاتفۆرمی پێشکەوتووی پەخشی سینیەمایی بۆ بینینی شاڕاکارەکانی سینەمای کوردی و جیهانی بە کوالێتی بەرزی 4K و ژێرنووسی تایبەت.

---

## تایبەتمەندییە سەرەکییەکان (Features)

- 🎬 **پەخشی کوالێتی بەرز (Adaptive HLS & 4K Streaming):** پەخشی ڕاستەوخۆی ڤیدیۆ بە چەندین کوالێتی جیاواز (4K, 1080p, 720p, Auto).
- 📺 **پشتگیری زنجیرە و فیلمەکان:** دابەشکردنی ئەڵقەکان، وەرزی نوێ و پەخشی دەستبەجێ.
- 📱 **پشتگیری مۆبایل و کۆمپیوتەر (PWA & Responsive):** ئەزموونی فول سکرین، دیزاینی شوشەیی مۆدێرن (Glassmorphic Cinema UI) و ڕووکاری ڕاست بۆ چەپ (RTL Kurdish).
- 🔒 **هەژماری بەکارهێنەران و پاراستن:** بەستنەوە بە Firebase Authentication و بنکەدراوەی Firestore.
- 👑 **بەشی VIP و بەڕێوەبەرایەتی (Admin Suite):** کۆنترۆڵکردنی کەتەلۆگ، ئامار، دەستکاریکردنی فیلمەکان و بەستەرەکانی پەخش.

---

## داواکارییە بنەڕەتییەکان (Prerequisites)

- **Node.js** وەشانی 18 یان نوێتر
- **npm** یان **pnpm** یان **yarn**

---

## دامەزراندن و کارپێکردن لە کۆمپیوتەری خۆت (Quick Start)

### ١. دامەزراندنی پاکێجەکان:
```bash
npm install
```

### ٢. کارپێکردنی سێرڤەری لۆکاڵ (Development Server):
```bash
npm run dev
```
پاشان لە وێبگەڕەکەت سەردانی ئەم ناونیشانە بکە:
`http://localhost:5173`

### ٣. دروستکردنی وەشانی بەرهەمهێنان (Production Build):
```bash
npm run build
```

---

## ڕێکخستنی گۆڕاوەکانی ژینگە (Environment Variables)

فایلی `.env.example` بگۆڕە بۆ `.env` لە ڕەگی پرۆژەکەدا بۆ ڕێکخستنی کلیلەکان:
- کلیلەکانی Firebase (پێشتر بە شێوەی خۆکار لە کلایەنت ئامادەکراوە)
- کلیلەکانی Mux (ئارەزوومەندانە، بۆ ستریمینگی تایبەت بە کلیل)

---

## تەکنەلۆژیا بەکارهاتووەکان (Tech Stack)

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Modern Vanilla CSS & Responsive Glassmorphism
- **Video Engine:** HLS.js, Custom Cinematic Video Player
- **Backend / Database:** Firebase Authentication, Cloud Firestore
- **Icons & Motion:** Lucide Icons, Framer Motion

---

## مۆڵەت (License)
ئەم پرۆژەیە بۆ مەبەستی پشکنین و تاقیکردنەوەی گشتی (Public Testing) ئامادەکراوە.
