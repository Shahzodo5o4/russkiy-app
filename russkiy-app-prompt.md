# PROMPT — «Русский шаг за шагом» o'quv ilovasi

> Bu faylni to'liq nusxalab Claude Code'ga (yoki yangi Claude chatiga) yuboring.
> Pastdagi `[ ]` belgili joylarni o'zingiz to'ldirishingiz kerak.

---

## 0. Rol va kontekst

Sen tajribali frontend engineer va til-o'rgatish (language pedagogy) bo'yicha product designer'san.
Men uchun **shaxsiy rus tili o'rganish ilovasi** quryapsan. Foydalanuvchi — 2 kishi (men va bir sherigim). Ommaviy mahsulot emas, ro'yxatdan o'tish, to'lov, marketing sahifasi — **kerak emas**.

**Foydalanuvchi profili:**
- Ona tili: o'zbek. Ingliz tili B2. Rus tilini **0 dan**, asosan **so'zlashuv** uchun (ish maqsadida) o'rganadi.
- Kirill alifbosini o'qiy oladi, lekin grammatika (ayniqsa padejlar) — noldan.
- Interfeys tili: **o'zbekcha**. Rus tilidagi kontent — rus tilida, tarjima/izoh — o'zbekcha.

**Ilovaning bitta asosiy vazifasi:**
> Har kuni ochganda foydalanuvchi "bugun nima qilaman?" deb o'ylab qolmasin. Ilova aniq aytadi, u bajaradi, progress yoziladi.

Agar biror qaror shu maqsadga xizmat qilmasa — o'sha featureni qo'shma.

---

## 1. Texnik stack (qat'iy)

- **Vite + React 18 + TypeScript**
- **Tailwind CSS**
- **React Router** — `HashRouter` (GitHub Pages uchun shart)
- **Dexie.js** (IndexedDB) — barcha ma'lumot brauzerda
- **Web Speech API** (`SpeechSynthesis`, `lang: 'ru-RU'`) — audio uchun. Hech qanday pullik TTS API ishlatma.
- **MediaRecorder API** — gapirish mashqini yozib olish uchun
- **Recharts** — statistika grafiklari
- Deploy: **GitHub Pages** (`gh-pages` branch, GitHub Actions workflow bilan)
- Backend **yo'q**. Server **yo'q**. `.env` **yo'q**.

**Muhim arxitektura sharti — Storage Adapter:**
Barcha ma'lumot o'qish/yozish `src/storage/StorageAdapter.ts` interfeysi orqali o'tsin.
Hozir faqat `LocalAdapter` (Dexie) implementatsiyasi bo'lsin.
Kelajakda Supabase qo'shsam, faqat bitta yangi fayl yozib, bitta qatorni almashtirsam yetsin. Komponentlar ichida `db.` chaqiruvi bo'lmasin.

---

## 2. Kontent manbalari (4 ta kitob)

| # | Kitob | Roli | Holati |
|---|-------|------|--------|
| 1 | **Red Kalinka — "Privet, Student!" (A1–B1)** | **ASOSIY** — dars ketma-ketligini shu belgilaydi. Mavzu, grammatika, dialog. | Qo'lda bor |
| 2 | **30 шагов к русскому языку** (К. Ш. Турдиева) | Qo'shimcha grammatika + mashqlar | Elektron |
| 3 | **Русские падежи** | Faqat padej mashqlari. Grammatika mavzusiga qarab ulanadi. | Qo'lda bor |
| 4 | **50 текстов** | O'qish + **gapirish** mashqi. Matn → savollar → "o'z fikringiz" savoli. | Yo'q (keyin) |

Ustiga qo'shimcha: **tematik lug'at to'plamlari** (hayvonlar, tana a'zolari, o'simliklar, oziq-ovqat, fe'llar, sifatlar…) — kitobdan mustaqil, darajaga qarab.

**Muhim:** Ilova bu kitoblarning matnini **o'z ichida saqlab kelmaydi**. Men matnni (dialog, mashq, so'zlar) admin panel orqali **qo'lda kiritaman/paste qilaman**. Ilova bo'sh idish bo'lib tug'iladi va men to'ldiraman.
Kitob 2 va 4 hozir yo'q — ilova ular bo'lmasa ham to'liq ishlashi kerak (unit ichidagi ular uchun ajratilgan bo'sh joy shunchaki ko'rinmaydi).

---

## 3. Ma'lumot modeli

`src/types.ts` — shu tiplarni aynan shunday yoz:

```ts
// ---------- KONTENT (men kiritaman, ikkalamiz ko'ramiz) ----------

type Book = {
  id: string;
  title: string;          // "Privet, Student! A1-B1"
  role: 'main' | 'grammar' | 'cases' | 'reading';
};

/** Unit = bir haftalik blok. Ilovaning umurtqa pog'onasi. */
type Unit = {
  id: string;
  order: number;          // 1..28 — Privet Student darslariga mos
  title: string;          // "Моя квартира"
  topic: string;          // "Uy, xona"
  grammarFocus: string;   // "Предложный падеж — где?"
  padejRef?: string;      // "Предложный, 27" — Русские падежи kitobidagi bo'lim
  level: 'A1' | 'A2' | 'B1';
  status: 'draft' | 'ready';   // kontent to'ldirilganmi
};

/** Unit ichidagi bo'laklar — har biri ixtiyoriy */
type Block = {
  id: string;
  unitId: string;
  kind: 'dialog' | 'grammar' | 'exercise' | 'text' | 'note';
  source: { bookId: string; pageFrom?: number; pageTo?: number } | null;
  title: string;
  body: string;           // Markdown. Men paste qilaman.
  order: number;
};

type Resource = {
  id: string;
  unitId: string;
  youtubeUrl: string;
  title: string;
  note?: string;          // "13:20 dan padej tushuntiriladi"
};

/**
 * Kitobning original audiosi (dialog, matn). Foydalanuvchi o'z diskidan import qiladi.
 * MUHIM: bu fayllar HECH QACHON git repo'ga tushmaydi — faqat IndexedDB'da yashaydi.
 * `content/` papkasiga ham yozilmaydi, eksport JSON'iga ham kirmaydi.
 */
type AudioAsset = {
  id: string;
  unitId: string;
  title: string;          // "Dialog 1: В магазине"
  blob: Blob;             // mp3 — IndexedDB'da
  seconds: number;
  transcript?: string;    // ixtiyoriy, men paste qilaman — shadowing uchun
};

/** Cheatsheet — "qoidalar" bo'limi. Unitdan mustaqil ham yashay oladi. */
type Rule = {
  id: string;
  title: string;          // "Предложный падеж — oxirgi harflar"
  category: 'padej' | 'fe\'l' | 'ot' | 'sifat' | 'olmosh' | 'boshqa';
  body: string;           // Markdown + jadval. Bu ILOVANING eng ko'p ochiladigan sahifasi bo'ladi.
  unitIds: string[];      // qaysi unitlarda kerak bo'ladi
  pinned: boolean;
};

/** Tematik to'plam: "Hayvonlar", "Tana a'zolari", "Harakat fe'llari" */
type Deck = {
  id: string;
  title: string;
  level: 'A1' | 'A2' | 'B1';
  icon?: string;
};

type Word = {
  id: string;
  ru: string;             // "молоко"  (toza, urg'usiz — qidiruv uchun)
  ruStressed: string;     // "молоко́"  (U+0301 combining acute — ko'rsatish uchun)
  uz: string;             // "sut"
  pos: 'ot' | 'fe\'l' | 'sifat' | 'ravish' | 'ibora' | 'boshqa';

  // faqat kerakli hollarda:
  gender?: 'm' | 'f' | 'n';       // ot uchun
  plural?: string;                // ot uchun: "молоко" -> —
  aspectPair?: string;            // fe'l uchun: "делать / сделать"
  conjugation?: string;           // fe'l uchun qisqa: "я делаю, ты делаешь..."

  exampleRu?: string;
  exampleUz?: string;

  unitId?: string;        // qaysi darsdan chiqdi
  deckIds: string[];      // qaysi tematik to'plamlarga tegishli
  createdAt: number;
};

// ---------- PROGRESS (har kimda ALOHIDA) ----------

type Profile = { id: string; name: string; };   // "Shahzod", "Sherigim"

/** SM-2 karta holati. Bir so'z ikki yo'nalishda o'rganiladi. */
type CardState = {
  id: string;             // `${profileId}:${wordId}:${direction}`
  profileId: string;
  wordId: string;
  direction: 'ru2uz' | 'uz2ru';
  ease: number;           // 2.5 dan boshlanadi
  interval: number;       // kunlarda
  repetitions: number;
  dueAt: number;          // timestamp
  lapses: number;
};

type UnitProgress = {
  profileId: string;
  unitId: string;
  state: 'yangi' | 'jarayonda' | 'tugadi';
  blocksDone: string[];   // Block id'lar
  updatedAt: number;
};

type SpeakingLog = {
  id: string;
  profileId: string;
  unitId: string;
  prompt: string;         // "50 текстов" savoli yoki dialog
  audioBlob: Blob;        // MediaRecorder natijasi (IndexedDB'da)
  seconds: number;
  createdAt: number;
};

type DailyStat = {
  profileId: string;
  date: string;           // "2026-07-11"
  cardsReviewed: number;
  correct: number;
  minutesStudied: number;
  blocksDone: number;
};
```

---

## 4. Ekranlar

### 4.1 `/` — **Bugun** (eng muhim ekran)
Ilova ochilganda shu chiqadi. Bugungi vazifa kartochkalar shaklida, tepadan pastga, tartib bilan:

```
┌─────────────────────────────────────────────┐
│  Chorshanba, 11-iyul        🔥 12 kunlik seriya │
├─────────────────────────────────────────────┤
│  1. TAKRORLASH        24 ta karta   ~8 daq  │  ← doim birinchi
│  2. YANGI SO'ZLAR     7-darsdan, 10 ta      │
│  3. DARS              7-dars: Mening kunim  │
│       ├ Dialog (Privet Student, 54-56 bet)  │
│       ├ Video: "Предложный падеж за 10 мин" │
│       ├ Grammatika + Qoida kartasi          │
│       └ Mashq (Русские падежи, 27-33 bet)   │
│  4. GAPIRISH          1 ta matn, 3 daqiqa   │
└─────────────────────────────────────────────┘
```

Qoidalar:
- Takrorlash (SRS) **doim birinchi** va **doim ko'rinadi**, hatto dars kuni bo'lmasa ham.
- Har bir bo'lak bajarilganda ✓ bo'ladi. Hammasi ✓ bo'lsa — kun yopiladi, seriya (streak) +1.
- Foydalanuvchi tartibni buzsa ham bo'ladi, lekin default tartib shu.
- Agar unit `status: 'draft'` bo'lsa — "Bu dars hali to'ldirilmagan" + **Kontentni kiritish** tugmasi.

### 4.2 `/review` — SRS sessiyasi
- Karta oldi: rus so'zi (urg'u bilan) + 🔊 tugma (avtomatik o'qib beradi).
- Karta orqasi: o'zbekcha + misol gap + 🔊.
- Baholash: **Yana / Qiyin / Yaxshi / Oson** (4 tugma).
- Klaviatura: `Space` = ochish, `1-4` = baholash.
- Yo'nalish `uz2ru` bo'lsa — **yozish** rejimi (pastdagi 4.3'ga qara).

### 4.3 `/quiz` — Test rejimi
Uch xil:
1. **RU → UZ** — 4 variantli tanlov.
2. **UZ → RU** — **yozish**. Kirill klaviatura kerak:
   - Ekranda **virtual kirill klaviatura** komponenti (ЙЦУКЕН).
   - Baholashda yumshoq tekshiruv: katta-kichik harf, ортиқча пробел, `ё`↔`е` — farq qilmasin. Urg'u belgisi hisobga olinmasin.
3. **Diktant** — TTS rus so'zini o'qiydi, foydalanuvchi yozadi.

### 4.4 `/unit/:id` — Dars sahifasi
Bloklar ketma-ket. Har blok yonida ✓ checkbox. YouTube — embed qilib qo'y (`youtube-nocookie.com`).
O'ng tomonda (desktopda) — shu darsga bog'langan **Qoida kartalari** paneli, doim ko'rinib turadi.
Har bir rus tilidagi matnda: matnni belgilasa (select) — kichik popover chiqadi: **🔊 O'qish** | **➕ Lug'atga qo'sh**. Bu ikkinchisi so'z qo'shish formasini oldindan to'ldirib ochadi. **Bu feature ilovaning eng ko'p ishlatiladigan qismi bo'ladi — yaxshi qil.**

### 4.5 `/rules` — Qoidalar (cheatsheet)
- Kategoriya bo'yicha filtr. Qidiruv.
- Padej jadvallari — chiroyli, mobilda ham o'qiladigan.
- **Har sahifada tepada doim "Qoidalar" tugmasi turadi** — istalgan paytda ochish mumkin (`Cmd/Ctrl + K` ham).

### 4.6 `/speak` — Gapirish va shadowing

**Audio pleyer** (dars sahifasida ham, shu yerda ham):
- Tezlik: 0.6 / 0.75 / 1.0 (rus tilida tez gapiriladi — sekinlashtirish shart).
- **A–B loop**: audioning bir bo'lagini belgilab, qayta-qayta aylantirish. Dialogni yodlashning eng samarali usuli.
- Transkript bo'lsa — yonida ko'rsat, joriy jumla belgilanib tursin (transkriptdagi jumlaga bosilsa — audio o'sha joyga sakraydi; vaqt belgilarini men qo'lda kiritaman yoki jumlalarni teng taqsimla).

**Shadowing rejimi** (asosiy so'zlashuv mashqi):
1. Manba tanlanadi: **kitob audiosi** (ustunlik beriladi) yoki **TTS** (audio yo'q bo'lsa).
2. Bir jumla ijro etiladi (0.75x).
3. Foydalanuvchi takrorlaydi → MediaRecorder yozadi.
4. **Yonma-yon eshitish**: original → o'zinikini, ketma-ket. Baholash yo'q, faqat quloq bilan taqqoslash.
5. Keyingi jumla.

**Erkin gapirish**: prompt (50 текстов savoli yoki dialog roli) → yozib olish → saqlash → `SpeakingLog`. Eski yozuvlarni eshitib, o'sishni sezish mumkin.

### 4.7 `/admin` — Kontent kiritish
Bu ekran chiroyli bo'lishi shart emas, **tez** bo'lishi shart.
- Unit qo'shish/tahrirlash, Block paste qilish (Markdown), YouTube link qo'shish, Rule yozish.
- **Ommaviy so'z kiritish (bulk)**: katta textarea, har qatorda:
  ```
  молоко́ | sut | ot,n | Я пью молоко. | Men sut ichaman.
  де́лать / сде́лать | qilmoq | fe'l | Что ты делаешь? | Nima qilyapsan?
  ```
  Parse qilib jadvalda ko'rsat → tasdiqlash → saqlash. **Bu men eng ko'p ishlatadigan forma.**
- Urg'u qo'yish yordamchisi: so'z ustiga bosib, unli harfni tanlasa — U+0301 qo'shiladi.
- **Audio import**: bir necha mp3 faylni birdan tanlash → har birini unit'ga biriktirish. Fayl nomidan unit'ni avtomatik taxmin qil (`A1_07_...mp3` → 7-unit), lekin tasdiqlatib ol. Blob IndexedDB'ga yoziladi.

### 4.8 `/stats` — Statistika
Seriya, kunlik takrorlash grafigi, o'zlashtirilgan so'zlar soni, kelgusi 30 kun uchun yuklama (forecast), zaif so'zlar (`lapses` ko'p bo'lganlari) ro'yxati.

---

## 5. SRS — SM-2 algoritmi (aniq spetsifikatsiya)

Buni o'zingdan o'ylab topma, aynan shunday qil:

```ts
// quality: 0 = Yana, 3 = Qiyin, 4 = Yaxshi, 5 = Oson
function sm2(card: CardState, quality: number): CardState {
  let { ease, interval, repetitions, lapses } = card;

  if (quality < 3) {
    repetitions = 0;
    interval = 0;               // shu sessiya ichida qayta ko'rsatiladi (~10 daqiqadan keyin)
    lapses += 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * ease);
  }

  ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease < 1.3) ease = 1.3;

  const dueAt = Date.now() + interval * 24 * 60 * 60 * 1000;
  return { ...card, ease, interval, repetitions, lapses, dueAt };
}
```

Qo'shimcha qoidalar:
- Yangi karta: `ease = 2.5, interval = 0, repetitions = 0`.
- Kunlik limit: **yangi 15 ta**, **takrorlash 100 ta** (sozlanadigan).
- `interval === 0` bo'lgan kartalar sessiya oxirida qayta chiqadi (learning queue).
- Bitta so'z uchun `ru2uz` va `uz2ru` — **alohida kartalar**. `uz2ru` kartasi faqat `ru2uz` bir marta "Yaxshi" bo'lgandan keyin ochiladi.

---

## 6. Audio (TTS)

```ts
function speak(text: string, rate = 1) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ru-RU';
  u.rate = rate;
  const voice = speechSynthesis.getVoices().find(v => v.lang.startsWith('ru'));
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}
```
- TTS'ga **urg'usiz** matn ber (`ru`, `ruStressed` emas) — combining accent ba'zi ovozlarni buzadi.
- Rus ovozi topilmasa: bir marta ogohlantirish ko'rsat ("Tizimda rus ovozi yo'q — Windows: Settings → Time & Language → Speech → Add voices → Russian"), lekin ilova ishlashda davom etsin.
- Har bir rus matni yonida 🔊 tugma. SRS kartasi ochilganda avtomatik o'qisin (sozlamadan o'chirish mumkin).

---

## 7. Profil va sinxronizatsiya

- Ilova ochilganda profil tanlanadi: **Shahzod** / **Sherigim**. `localStorage`da eslab qolinadi.
- **Kontent** (unit, word, rule, block) — profil bo'yicha ajratilmaydi, umumiy.
- **Progress** (CardState, UnitProgress, SpeakingLog, DailyStat) — `profileId` bilan ajratiladi.
- **Backup**: Sozlamalarda **"Hammasini JSON'ga eksport"** va **"JSON'dan import"** tugmalari. Bu MAJBURIY — IndexedDB brauzer tozalansa o'chib ketadi.
- Ilova 7 kundan beri backup olinmagan bo'lsa — yumshoq eslatma banneri ko'rsatsin.
- Kontentni sherik bilan bo'lishish: **"Faqat kontentni eksport"** → JSON fayl → u import qiladi. Progress tegilmaydi.

---

## 8. Dizayn yo'nalishi

**Konsepsiya:** rus maktab daftari (тетрадь в клетку) — lekin zamonaviy, toza, raqamli. Nostaljik emas, funksional.

**Palitra** (aniq shu qiymatlar):
```
--ink:      #14213D   // asosiy matn, sarlavhalar
--paper:    #FBFBF8   // fon
--grid:     #E3E6EC   // kletka chiziqlari, borderlar
--stress:   #E8A33D   // URG'U — faqat va faqat shu uchun
--muted:    #6B7684   // ikkilamchi matn
--ok:       #3F7D5C   // to'g'ri javob
--miss:     #C4553B   // xato
```

**SIGNATURE ELEMENT — urg'u rangi:**
`--stress` rangi butun ilovada **faqat urg'uli unli harfda** ishlatiladi. Boshqa hech qayerda. Tugmada yo'q, linkda yo'q, badge'da yo'q. Foydalanuvchi ilovani ochganda ko'zi darrov o'sha bitta harfga tushadi — chunki sahifada boshqa hech narsa o'sha rangda emas. Rus tilida urg'u eng ko'p xato qilinadigan narsa; dizayn shuni o'rgatsin.

```tsx
// молок<span className="text-stress">о́</span>
```

**Ikkinchi signature — Падеж матрица (`/rules` sahifasida):**
6 padej × 3 jins + ko'plik = katta jadval-grid. Har bir katak foydalanuvchi o'sha padejni o'tgan sari **to'ladi** (bo'sh → kulrang → to'q). Mendeleyev jadvali kabi. Bu — progressning eng vizual ko'rinishi va ayni paytda eng foydali cheatsheet. Bosilsa — o'sha qoida ochiladi.

**Tipografika** (Google Fonts, kirill uchun maxsus):
- Rus matni: **PT Serif** — kirill uchun ParaType tomonidan yasalgan, ekranda o'qish uchun ideal.
- Interfeys: **Golos Text** — kirill-first, zamonaviy.
- Transkripsiya/urg'u/kod: **JetBrains Mono**.
- Type scale: 14 / 16 / 20 / 28 / 40. Rus matni har doim body'dan bir pog'ona katta (o'rganuvchi harflarni aniq ko'rishi kerak).

**Layout:**
- Fon — juda nozik kletka pattern (CSS `repeating-linear-gradient`, `--grid` rangida, 24px). Bosma bo'lmasin, sezilar-sezilmas.
- Border-radius: 4px (daftar burchagi kabi, yumshoq emas).
- Soya deyarli yo'q — chiziq bilan ajrat.
- Animatsiya: faqat karta aylanishida (200ms flip) va padej matritsasi to'lganda. Boshqa hech qayerda. `prefers-reduced-motion` hurmat qilinsin.

**Mobil:** ilovaning 70% telefonda ishlatiladi. Mobil — birinchi navbatda. Katta tegish maydonlari, pastda tab bar (Bugun / Takrorlash / Qoidalar / Statistika). PWA manifest + offline ishlasin.

---

## 9. Seed data

`content/seed.json` faylini oldindan to'ldirib qo'y:

**Rule'lar** — "Русские падежи" kitobi mundarijasidan (o'qitish tartibi shu):
1. Имя существительное, прилагательное, притяжательные местоимения, «этот» — 5-bet
2. Предложный падеж (birlik) — 27-bet
3. Винительный падеж — 68-bet
4. Родительный падеж — 108-bet
5. Дательный падеж — 147-bet
6. Творительный падеж — 178-bet
7. Ко'плик: Именительный 215 · Родительный 219 · Дательный 227 · Винительный 233 · Творительный 237 · Предложный 242
8. Таблицы склонений — 258-bet

Har biri uchun bo'sh `Rule` yozuvi yarat (`body: ""`, men to'ldiraman), lekin `title`, `category: 'padej'`, sahifa raqami bilan.

**Bo'sh Deck'lar** yarat: Hayvonlar · Tana a'zolari · Oziq-ovqat · O'simliklar · Uy-ro'zg'or · Kasblar · Kiyim · Ranglar · Sonlar · Vaqt va kun · Harakat fe'llari · Ko'p ishlatiladigan fe'llar · Sifatlar · Ish/ofis leksikasi

**Unit'lar:** "Privet, Student!" — 28 ta dars. A1 = 1–10, A2 = 11–20, B1 = 21–28.
Har bir unit'da kitob audiosi bor (foydalanuvchi import qiladi, fayl nomi `NN_urok_...mp3`).

`grammarFocus` va `padejRef` ustunlari — **boshlang'ich taxmin**. Darsga borganda admin panelda tuzatiladi.
`padejRef` = "Русские падежи" kitobidagi bo'lim (sahifa).

| # | Lvl | title | topic | grammarFocus | padejRef |
|---|-----|-------|-------|--------------|----------|
| 1 | A1 | Привет, студент | Tanishuv, salomlashish | Alifbo, «это», shaxs olmoshlari | — |
| 2 | A1 | Это мой друг | Do'stlar, tanishtirish | Egalik olmoshlari: мой/моя/моё, otning jinsi | Kirish, 5-bet |
| 3 | A1 | Моя семья | Oila | Ko'plik: -ы/-и, у меня есть + И.п. | Kirish, 5-bet |
| 4 | A1 | Профессия | Kasblar | «Он врач» — Именительный, кто? | — |
| 5 | A1 | Я русский, а вы? | Millat, davlat | Sifat: -ый/-ая/-ое, moslashuv | Kirish, 5-bet |
| 6 | A1 | Язык | Tillar | говорить по-русски, знать, ravish | — |
| 7 | A1 | Что ты делаешь? | Kundalik ishlar | Fe'l hozirgi zamon: I va II tuslanish | — |
| 8 | A1 | Трудный урок | Sifatlar, baho | Sifat + ot moslashuvi, «этот» | Kirish, 5-bet |
| 9 | A1 | Дни недели и время | Hafta kunlari, soat | «Когда?» → в + Винительный (в среду) | Винительный, 68 |
| 10 | A1 | Мой день | Kun tartibi | -ся fe'llar, утром/днём/вечером | — |
| 11 | A2 | У меня есть всё | Egalik, narsalar | **у + Родительный** (у меня, у брата), нет + Р.п. | Родительный, 108 |
| 12 | A2 | Еда и продукты | Ovqat | **Винительный** — я ем что? хочу что? | Винительный, 68 |
| 13 | A2 | Одежда | Kiyim | Винительный + sifat, носить/надеть | Винительный, 68 |
| 14 | A2 | Моя квартира | Uy, xona | **Предложный** — где? в комнате, на столе | Предложный, 27 |
| 15 | A2 | Мой город | Shahar, yo'nalish | Предложный (жить в) ↔ Винительный (идти в) — farqi | Предложный 27 + Винительный 68 |
| 16 | A2 | Сколько тебе лет? | Yosh, sonlar | **Дательный** (мне 25) + son bilan Р.п. (года/лет) | Дательный 147 + Родительный 108 |
| 17 | A2 | Погода | Ob-havo | Shaxssiz gaplar: холодно, было, будет | — |
| 18 | A2 | Я иду в больницу | Salomatlik, yo'nalish | **Harakat fe'llari**: идти/ходить, ехать/ездить + В.п. | Винительный, 68 |
| 19 | A2 | Планы на отпуск | Rejalar, ta'til | Kelasi zamon, **aspekt**: делать / сделать | — |
| 20 | A2 | Ресторан | Restoranda | Buyruq mayli, дать кому что (Д.п. + В.п.) | Дательный, 147 |
| 21 | B1 | В деревне | Qishloq, tabiat | O'tgan zamon hikoya, Предложный ko'plik | Ko'plik: Предложный, 242 |
| 22 | B1 | Культурная жизнь | Teatr, kino, musiqa | **Творительный** — интересоваться чем, заниматься чем | Творительный, 178 |
| 23 | B1 | Семейный портрет | Ta'rif, xarakter | **Родительный ko'plik** (много друзей) | Ko'plik: Родительный, 219 |
| 24 | B1 | Наша Родина | Vatan, geografiya | Ko'plikda barcha padejlar, umumlashtirish | Ko'plik, 215–257 |
| 25 | B1 | Животный мир | Hayvonlar | Sifat qiyosiy darajasi: больше, самый | — |
| 26 | B1 | Русские праздники | Bayramlar, sana | Tartib sonlar, sana: 1-го мая (Р.п.) | Родительный, 108 |
| 27 | B1 | Великие люди | Tarixiy shaxslar | O'tgan zamon, сложное предложение (который) | — |
| 28 | B1 | Глобальные проблемы | Muammolar, munozara | чтобы, потому что, поэтому — fikr bildirish | — |

**Muhim eslatma sequencing haqida:**
"Русские падежи" kitobining o'z tartibi (Предложный → Винительный → Родительный → Дательный → Творительный) "Privet, Student!" tartibi bilan **mos kelmaydi** (u yerda Родительный 11-darsda, Предложный 14-darsda chiqadi).
**Asosiy kitob yutadi.** Padej kitobi chiziqli o'qilmaydi — kerakli bo'lim kerakli darsda ochiladi. "Bugun" ekrani aynan shuni hal qiladi: foydalanuvchi qaysi sahifani ochishini o'ylab qolmaydi.

---

## 10. Nima QILMASLIK kerak

- ❌ Login, parol, ro'yxatdan o'tish
- ❌ Gamifikatsiya bezaklari: XP, level, medal, konfetti, avatar
- ❌ AI chat / suhbatdosh bot
- ❌ Landing page, "About", "Pricing"
- ❌ Pullik API (TTS, tarjima) — hammasi brauzer ichida bepul
- ❌ Kitob matnini kodga hardcode qilish — hammasi admin orqali kiritiladi
- ❌ **Audio yoki kitob matnini repo'ga commit qilish.** `.gitignore`ga `*.mp3`, `*.m4a`, `content/local/` qo'sh. Repo'da faqat **kod** bo'ladi, kontent har birimizning brauzerimizda yashaydi. `public/audio/` papkasi umuman yaratilmasin.

---

## 11. Yetkazib berish tartibi

Hammasini bir zarbada yozma. Shu bosqichlarda ket, har bosqichdan keyin to'xta va menga ko'rsat:

1. **Skelet:** Vite loyihasi, types.ts, Dexie schema, StorageAdapter, routing, dizayn tokenlari + 2 ta demo unit bilan bo'sh ekranlar.
2. **Admin + kontent:** unit/block/rule/word CRUD, bulk so'z kiritish, urg'u yordamchisi, import/export.
3. **SRS + audio:** SM-2, review ekrani, TTS, quiz (3 rejim), virtual kirill klaviatura.
4. **Bugun ekrani + progress:** kunlik reja logikasi, streak, statistika, padej matritsasi.
5. **Gapirish + PWA + GitHub Pages deploy** (Actions workflow bilan).

Har bosqichda: TypeScript strict, hech qanday `any`, komponentlar 150 qatordan oshmasin.

---

## 12. Birinchi javobingda

Kod yozishdan oldin menga quyidagilarni ko'rsat va tasdiqlashimni kut:
1. Fayl strukturasi (papka daraxti)
2. Dexie schema (jadvallar va indekslar)
3. "Bugun" ekranining reja tuzish logikasi — psevdokod
4. Bir savol: agar spetsifikatsiyada noaniqlik ko'rsang, taxmin qilma — so'ra.
