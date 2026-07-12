# PLAN — «Русский шаг за шагом»

> Bu fayl `russkiy-app-prompt.md` spetsifikatsiyasining **12-bo'lim** talabiga javob.
> Tasdiqlangach, implementatsiya Fable (`claude-fable-5`) modelida, 11-bo'limdagi 5 bosqich bo'yicha ketadi.
> Har bosqichda: TypeScript strict, `any` yo'q, komponentlar ≤150 qator.

---

## 1. Fayl strukturasi (papka daraxti)

```
russkiy-app/
├─ .github/workflows/deploy.yml      # GitHub Pages (gh-pages)
├─ index.html
├─ vite.config.ts                    # base: '/russkiy-app/'
├─ tailwind.config.ts                # dizayn tokenlari (--ink, --stress, ...)
├─ tsconfig.json                     # strict: true
├─ .gitignore                        # *.mp3, *.m4a, content/local/
├─ public/
│  ├─ manifest.webmanifest           # PWA
│  ├─ sw.js                          # offline (yoki vite-plugin-pwa)
│  └─ icons/                         # PWA ikonkalar
├─ content/
│  └─ seed.json                      # 28 unit, bo'sh rule/deck (9-bo'lim)
└─ src/
   ├─ main.tsx
   ├─ App.tsx                        # HashRouter, tab bar, profil guard
   ├─ types.ts                       # 3-bo'limdagi tiplar AYNAN
   │
   ├─ storage/
   │  ├─ StorageAdapter.ts           # INTERFACE — barcha CRUD shu yerda
   │  ├─ SupabaseAdapter.ts          # ASOSIY implementatsiya (Postgres + Storage)
   │  ├─ LocalAdapter.ts             # Dexie — offline kesh / zaxira nusxa
   │  ├─ supabase.ts                 # createClient(url, anonKey)
   │  ├─ db.ts                       # Dexie schema (offline kesh, 2-quyida)
   │  └─ index.ts                    # export const storage = new SupabaseAdapter()  ← 1 QATOR
   │
   ├─ srs/
   │  ├─ sm2.ts                      # 5-bo'lim algoritmi AYNAN
   │  └─ queue.ts                    # kunlik navbat: due + learning + limitlar
   │
   ├─ audio/
   │  ├─ tts.ts                      # speak() (6-bo'lim), ovoz yo'qligini boshqarish
   │  ├─ recorder.ts                 # MediaRecorder wrapper
   │  └─ player.ts                   # tezlik, A–B loop mantiqi
   │
   ├─ lib/
   │  ├─ stress.ts                   # U+0301 qo'shish/olib tashlash, urg'uni <span>ga o'rash
   │  ├─ normalize.ts                # yumshoq tekshiruv: ё↔е, urg'u, probel, katta-kichik
   │  ├─ bulkParse.ts                # "молоко́ | sut | ot,n | ..." → Word[]
   │  └─ date.ts                     # "YYYY-MM-DD", streak sanash
   │
   ├─ store/
   │  ├─ ProfileContext.tsx          # tanlangan profil (localStorage)
   │  └─ SettingsContext.tsx         # kunlik limitlar, avto-TTS, oxirgi backup
   │
   ├─ hooks/
   │  ├─ useLiveQuery.ts             # Dexie liveQuery → React
   │  ├─ useTodayPlan.ts             # 3-quyidagi logika
   │  └─ useReviewSession.ts
   │
   ├─ components/                    # umumiy: Button, Card, Checkbox, StressedText,
   │  │                             #   CyrillicKeyboard, RuleTable, AudioPlayer, Popover...
   │  └─ ...
   │
   └─ features/                      # ekran bo'yicha (4-bo'lim)
      ├─ today/     TodayScreen.tsx
      ├─ review/    ReviewScreen.tsx  FlipCard.tsx
      ├─ quiz/      QuizScreen.tsx    (RU→UZ, UZ→RU yozish, Diktant)
      ├─ unit/      UnitScreen.tsx    BlockView.tsx  SelectionPopover.tsx
      ├─ rules/     RulesScreen.tsx   PadejMatrix.tsx
      ├─ speak/     SpeakScreen.tsx   Shadowing.tsx  FreeSpeak.tsx
      ├─ admin/     AdminScreen.tsx   BulkWords.tsx  StressHelper.tsx  AudioImport.tsx
      └─ stats/     StatsScreen.tsx
```

**Arxitektura qat'iy qoidasi:** hech qaysi `features/*` yoki `components/*` fayl `db`ni to'g'ridan-to'g'ri import qilmaydi — faqat `storage` orqali. Buni linta bilan tekshirish mumkin (kelajakda).

---

## 2. Dexie schema (jadvallar va indekslar)

`src/storage/db.ts` — `version(1)`:

| Store | Primary key | Indekslar | Izoh |
|---|---|---|---|
| `books` | `id` | `role` | 4 ta kitob |
| `units` | `id` | `order`, `status`, `level` | umurtqa pog'onasi |
| `blocks` | `id` | `unitId`, `[unitId+order]` | tartibli o'qish uchun compound |
| `resources` | `id` | `unitId` | YouTube |
| `audioAssets` | `id` | `unitId` | **Blob** IndexedDB'da, repo'ga tushmaydi |
| `rules` | `id` | `category`, `pinned`, `*unitIds` | `*` = multiEntry |
| `decks` | `id` | `level` | tematik to'plamlar |
| `words` | `id` | `ru`, `unitId`, `createdAt`, `*deckIds` | `ru` — qidiruv (urg'usiz) |
| `profiles` | `id` | — | 2 ta |
| `cardStates` | `id` | `profileId`, `dueAt`, `[profileId+dueAt]`, `[profileId+wordId+direction]` | SRS — due bo'yicha tez tanlash |
| `unitProgress` | `[profileId+unitId]` | `profileId`, `state` | compound PK |
| `speakingLogs` | `id` | `profileId`, `unitId`, `createdAt` | **Blob** |
| `dailyStats` | `[profileId+date]` | `profileId`, `date` | compound PK |
| `settings` | `key` | — | kunlik limit, avto-TTS, oxirgi backup sanasi |

Muhim indekslar sababi:
- `cardStates.[profileId+dueAt]` → «Bugun takrorlash» navbatini bitta so'rovda oladi.
- `blocks.[unitId+order]` → dars bloklarini tartibda.
- `words.*deckIds` va `rules.*unitIds` → multiEntry, teskari qidiruvsiz.

**Eksport/import** (7-bo'lim): `settings`, `blocks`, `words`, `rules`, `units`, `decks` — JSON'ga; `audioAssets.blob` va `speakingLogs.blob` — **hech qachon** JSON'ga kirmaydi (faqat lokal). «Faqat kontent eksport» progress jadvallarini (`cardStates`, `unitProgress`, `dailyStats`, `speakingLogs`) chiqarib tashlaydi.

---

## 3. «Bugun» ekrani reja-logikasi (psevdokod)

```
buildTodayPlan(profileId, today):
  plan = []
  s = settings   // newLimit=15, reviewLimit=100

  # ── 1. TAKRORLASH — DOIM BIRINCHI, DOIM KO'RINADI ──
  due = cardStates
        .where('[profileId+dueAt]').between([profileId, 0], [profileId, endOf(today)])
        .toArray()
  learning = due.filter(c => c.interval === 0)   # shu sessiya ichida qayta chiqadi
  reviewCount = min(due.length, s.reviewLimit)
  plan.push(review: { count: reviewCount, est: reviewCount * ~20s })

  # ── joriy darsni aniqlash ──
  unit = pickCurrentUnit(profileId)     # ← 4-BO'LIM SAVOLI SHU YERDA

  # ── 2. YANGI SO'ZLAR ──
  learned = cardStates(profileId).map(wordId)   # allaqachon boshlangan
  newWords = words.where(unitId == unit.id).filter(w => w.id not in learned)
  newCount = min(newWords.length, s.newLimit)
  if newCount > 0: plan.push(newWords: { unitId: unit.id, count: newCount })

  # ── 3. DARS ──
  if unit.status == 'ready':
     blocks = blocks.where('[unitId+order]', unit.id)   # tartibda
     done   = unitProgress[profileId, unit.id]?.blocksDone ?? []
     plan.push(lesson: { unit, blocks, done, subitems: dialog|video|grammar+rule|exercise })
  else:
     plan.push(lessonDraft: { unit })   # "Bu dars hali to'ldirilmagan" + [Kontentni kiritish]

  # ── 4. GAPIRISH ──
  if unit has (text|dialog block) OR speaking prompt:
     plan.push(speak: { unitId: unit.id, count: 1 })

  return plan


# Har bo'lak bajarilganda ✓. Hammasi ✓ → kun yopiladi:
onDayComplete(profileId, today):
  dailyStats[profileId, today].blocksDone = totalDone
  if allSectionsDone AND streakNotCountedToday:
     streak += 1        # date.ts: kecha ham yopilgan bo'lsa davom etadi, aks holda 1'dan


# Streak (date.ts):
streak = ketma-ket to'liq yopilgan kunlar soni (bugundan orqaga).
  bugun ochiq bo'lsa — kechagacha sanaladi, bugun yopilsa +1.
```

`review` bo'lagi **hatto `plan`da dars bo'lmasa ham** doim qo'shiladi (4.1 qoidasi).

---

## 4. Bitta savol (taxmin qilmadim — so'rayapman)

`pickCurrentUnit(profileId)` = **QO'LDA tanlanadi** (tasdiqlangan). Foydalanuvchi «joriy dars»ni o'zi pin qiladi; ilova avtomatik surilmaydi. Pin `settings`da `currentUnit:{profileId}` sifatida (progress — profil bo'yicha).

---

## 5. Backend — Supabase (yangilangan qaror, spetsifikatsiyani ustidan yozadi)

Foydalanuvchi tanlovi: **Supabase**. Sabab: qo'lda import bo'lmasin + kontent maxfiy (repo'da emas) + 2 qurilma/2 kishi sync.

**Nima o'zgaradi:**
- Asosiy adapter = `SupabaseAdapter` (Postgres). `LocalAdapter` (Dexie) — **offline kesh** sifatida qoladi: SupabaseAdapter yozganda Dexie'ga ham mirror qiladi, offline'da o'qish shundan. (MVP'da online-first ham bo'lishi mumkin — kelishamiz.)
- **Kontent** (units, blocks, words, rules, decks, resources) → Postgres jadvallar.
- **Progress** (cardStates, unitProgress, dailyStats, speakingLogs) → Postgres, `profileId` bo'yicha.
- **Bloblar** (audioAssets, speakingLogs audiosi) → **Supabase Storage** (private bucket), IndexedDB o'rniga — endi sync bo'ladi. Bepul tarif: 1GB.
- **Seed:** men kontentni bir marta `scripts/seed.ts` orqali Supabase'ga yuklayman. Sizlar hech narsa import qilmaysiz.
- **Eksport/import** (7-bo'lim) baribir qoladi — endi "majburiy" emas, "qo'shimcha zaxira" sifatida.

**Yangi majburiy oqibat — kirish nazorati (auth):**
Ilova GitHub Pages'da **ommaviy URL**'da turadi, `anonKey` esa kod ichida ko'rinadi. Demak baza ochiq qolmasligi uchun kirish nazorati **shart** (spetsifikatsiyaning «login yo'q» qoidasi shu sabab buziladi).

**Qaror: 1 umumiy Supabase akkaunt** (tasdiqlangan). Har qurilmada bir marta login (session `localStorage`da saqlanadi, «eslab qol»). Kirgach — asl rejadagidek `Profile` (Shahzod / Sherigim) ilova ichida tanlanadi; profil auth'dan mustaqil, faqat progress ajratgichi. RLS siyosati: **`auth.role() = 'authenticated'`** bo'lganlar barcha jadvalni o'qiy/yoza oladi; anonim = hech narsa. Login ekrani = `App.tsx`da guard, profildan oldin.

`.env` **endi bor** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) — gitignore'langan; GitHub Actions'da secret sifatida.

## 5b. Mavjud kontent manbalari (lokal, git'da emas)

Foydalanuvchi fayllarni tashladi. `.gitignore`da: `books/`, `audios/`, `content/local/`.

**Per-dars manbalar (segmentlangan — seed uchun ideal):**
- `books/A2 Red Kalinka 10 ders ses tapsiriq helli/` → **11–20-darslar**: `NN_урок_*.pdf` + `*_SOLUTIONS.pdf` + `*_.mp3`
- `books/08 Lecciones de ruso B1/` → **21–28-darslar**: `NN_урок_*.pdf` + `*_SOLUTIONS.pdf` + `*.mp3`
- `audios/RED KALINKA аудио А1|А2|В1/` → 1–10, 11–20, 21–28 dars audiolari (В1'da `(1)` dublikatlar bor — bittasini olamiz)

**Kitob rollari (`books` jadvali):**
| Fayl | role | Izoh |
|---|---|---|
| `Red Kalinka A1 A2 B1.pdf` | main | 1–10 dars matni shundan (11–28 per-dars PDF'dan) |
| `30_ШАГОВ_К_русскому_языку.pdf` | grammar | kitob #2 |
| `Русские падежи.pdf` | cases | kitob #3 — seed'dagi sahifa raqamlari shunga |
| `50 текстов.pdf` | reading | kitob #4 |
| `Red Kalinka (падежи).pdf`, `Глаголы-движения.pdf`, `5 - ...приставками.pdf`, `Rasskazy_RED_KALINKA_A2.pdf` | — | qo'shimcha mashq (kerakli darsga ulanadi) |
| `Red Kalinka B1-B2.pdf`, `Red_kalinka_C1-C2.pdf` | — | hozircha ishlatilmaydi (28-darsdan yuqori) |

**Seed oqimi:** PDF'lar skaner-rasm → OCR men (vision) qilaman, sahifa 20 tadan. 11–28 avval (segmentlangan, oson), 1–10 katta kitobdan. Audio → Supabase Storage private bucket, fayl nomidan `unitId` (`NN_урок` → NN-dars). Har dars uchun tekshiruvni foydalanuvchiga ko'rsataman.

## 5c. Postgres schema (3-bo'lim tiplariga mos, snake_case): `books, units, blocks, resources, audio_assets, rules, decks, words, profiles, card_states, unit_progress, speaking_logs, daily_stats, settings`. Indekslar Dexie'dagi bilan bir xil mantiq (`card_states(profile_id, due_at)`, `blocks(unit_id, order)` ...). RLS siyosati 6-savolga bog'liq.
