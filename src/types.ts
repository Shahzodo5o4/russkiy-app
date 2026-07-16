// ---------- KONTENT (admin kiritadi, ikkala profil ko'radi) ----------

export type Book = {
  id: string;
  title: string; // "Privet, Student! A1-B1"
  role: 'main' | 'grammar' | 'cases' | 'reading';
};

/** Unit = bir haftalik blok. Ilovaning umurtqa pog'onasi. */
export type Unit = {
  id: string;
  order: number; // 1..28 — Privet Student darslariga mos
  title: string; // "Моя квартира"
  topic: string; // "Uy, xona"
  grammarFocus: string; // "Предложный падеж — где?"
  padejRef?: string; // "Предложный, 27" — Русские падежи kitobidagi bo'lim
  level: 'A1' | 'A2' | 'B1';
  status: 'draft' | 'ready'; // kontent to'ldirilganmi
};

/** Unit ichidagi bo'laklar — har biri ixtiyoriy */
export type Block = {
  id: string;
  unitId: string;
  kind: 'dialog' | 'grammar' | 'exercise' | 'text' | 'note';
  source: { bookId: string; pageFrom?: number; pageTo?: number } | null;
  title: string;
  body: string; // Markdown
  order: number;
};

export type Resource = {
  id: string;
  unitId: string;
  youtubeUrl: string;
  title: string;
  note?: string; // "13:20 dan padej tushuntiriladi"
};

/**
 * Kitobning original audiosi (dialog, matn).
 * Blob — Supabase Storage private bucket'da. Git repo'ga HECH QACHON tushmaydi.
 */
export type AudioAsset = {
  id: string;
  unitId: string;
  title: string; // "Dialog 1: В магазине"
  blob: Blob;
  seconds: number;
  transcript?: string; // shadowing uchun
};

/** Cheatsheet — "qoidalar" bo'limi. Unitdan mustaqil ham yashay oladi. */
export type Rule = {
  id: string;
  title: string; // "Предложный падеж — oxirgi harflar"
  category: 'padej' | "fe'l" | 'ot' | 'sifat' | 'olmosh' | 'boshqa';
  body: string; // Markdown + jadval
  unitIds: string[]; // qaysi unitlarda kerak bo'ladi
  pinned: boolean;
};

/** Tematik to'plam: "Hayvonlar", "Tana a'zolari", "Harakat fe'llari" */
export type Deck = {
  id: string;
  title: string;
  level: 'A1' | 'A2' | 'B1';
  icon?: string;
};

export type Word = {
  id: string;
  ru: string; // "молоко"  (toza, urg'usiz — qidiruv uchun)
  ruStressed: string; // "молоко́"  (U+0301 combining acute)
  uz: string; // "sut"
  pos: 'ot' | "fe'l" | 'sifat' | 'ravish' | 'ibora' | 'boshqa';

  gender?: 'm' | 'f' | 'n'; // ot uchun
  plural?: string; // ot uchun
  aspectPair?: string; // fe'l uchun: "делать / сделать"
  conjugation?: string; // fe'l uchun qisqa

  exampleRu?: string;
  exampleUz?: string;

  unitId?: string; // qaysi darsdan chiqdi
  deckIds: string[]; // qaysi tematik to'plamlarga tegishli
  createdAt: number;
};

/** Grammatika test savoli — dars bilan birga import qilinadi. */
export type QuizQuestion = {
  id: string; // "u09-q01"
  unitId: string;
  type: 'mcq' | 'tf';
  prompt: string; // ruscha, urg'ular bilan; tf'da — hukm qilinadigan gap
  options: string[]; // mcq: 3–4 variant; tf: bo'sh (UI To'g'ri/Noto'g'ri chiqaradi)
  correctIndex: number; // mcq: options indeksi; tf: 0 = To'g'ri, 1 = Noto'g'ri
  explanation?: string; // qisqa o'zbekcha izoh (javobdan keyin)
  createdAt: number;
};

// ---------- PROGRESS (har profilda ALOHIDA) ----------

export type Profile = {
  id: string;
  name: string;
  /** Shu emailli akkaunt kirsa — profil avtomatik tanlanadi */
  email?: string;
  /** Admin panel faqat shu profilga ko'rinadi */
  isAdmin?: boolean;
  /** false bo'lsa — Statistika'dagi 🏆 Raqobat bo'limida ko'rinmaydi va boshqalarni ham ko'rmaydi */
  competesInStats?: boolean;
};

/** SM-2 karta holati. Bir so'z ikki yo'nalishda o'rganiladi. */
export type CardState = {
  id: string; // `${profileId}:${wordId}:${direction}`
  profileId: string;
  wordId: string;
  direction: 'ru2uz' | 'uz2ru';
  ease: number; // 2.5 dan boshlanadi
  interval: number; // kunlarda
  repetitions: number;
  dueAt: number; // timestamp
  lapses: number;
};

/** Grammatika savoli SM-2 holati (binar: to'g'ri/xato). */
export type QuizState = {
  id: string; // `${profileId}:${questionId}`
  profileId: string;
  questionId: string;
  ease: number;
  interval: number;
  repetitions: number;
  dueAt: number;
  lapses: number;
};

export type UnitProgress = {
  profileId: string;
  unitId: string;
  state: 'yangi' | 'jarayonda' | 'tugadi';
  blocksDone: string[]; // Block id'lar
  updatedAt: number;
};

export type SpeakingLog = {
  id: string;
  profileId: string;
  unitId: string;
  prompt: string; // "50 текстов" savoli yoki dialog
  audioBlob: Blob; // MediaRecorder natijasi
  seconds: number;
  createdAt: number;
};

export type DailyStat = {
  profileId: string;
  date: string; // "2026-07-11"
  cardsReviewed: number;
  correct: number;
  minutesStudied: number;
  blocksDone: number;
};
