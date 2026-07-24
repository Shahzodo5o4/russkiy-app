-- ============================================================
-- «Русский шаг за шагом» — Supabase schema + boshlang'ich seed
-- ISHLATISH: Supabase Dashboard → SQL Editor → New query →
--            shu faylni to'liq paste qiling → Run.
-- Qayta ishga tushirish xavfsiz (idempotent).
-- ============================================================

-- ---------- KONTENT ----------

create table if not exists books (
  id    text primary key,
  title text not null,
  role  text not null check (role in ('main','grammar','cases','reading'))
);

create table if not exists units (
  id            text primary key,
  "order"       int  not null,
  title         text not null,
  topic         text not null default '',
  grammar_focus text not null default '',
  padej_ref     text,
  level         text not null check (level in ('A1','A2','B1')),
  status        text not null default 'draft' check (status in ('draft','ready'))
);

create table if not exists blocks (
  id      text primary key,
  unit_id text not null references units(id) on delete cascade,
  kind    text not null check (kind in ('dialog','grammar','exercise','text','note')),
  source  jsonb,
  title   text not null default '',
  body    text not null default '',
  "order" int  not null default 0
);
create index if not exists blocks_unit_order on blocks (unit_id, "order");

create table if not exists resources (
  id          text primary key,
  unit_id     text not null references units(id) on delete cascade,
  youtube_url text not null,
  title       text not null default '',
  note        text
);
create index if not exists resources_unit on resources (unit_id);

create table if not exists audio_assets (
  id           text primary key,
  unit_id      text not null references units(id) on delete cascade,
  title        text not null default '',
  storage_path text not null,
  seconds      double precision not null default 0,
  transcript   text
);
create index if not exists audio_assets_unit on audio_assets (unit_id);

create table if not exists rules (
  id       text primary key,
  title    text not null,
  category text not null default 'boshqa',
  body     text not null default '',
  unit_ids text[] not null default '{}',
  pinned   boolean not null default false
);

create table if not exists decks (
  id    text primary key,
  title text not null,
  level text not null default 'A1' check (level in ('A1','A2','B1')),
  icon  text
);

create table if not exists words (
  id          text primary key,
  ru          text not null,
  ru_stressed text not null default '',
  uz          text not null,
  pos         text not null default 'boshqa',
  gender      text,
  plural      text,
  aspect_pair text,
  conjugation text,
  example_ru  text,
  example_uz  text,
  unit_id     text references units(id) on delete set null,
  deck_ids    text[] not null default '{}',
  created_at  bigint not null default 0
);
create index if not exists words_unit on words (unit_id);
create index if not exists words_ru on words (ru);

create table if not exists quiz_questions (
  id            text primary key,
  unit_id       text not null references units(id) on delete cascade,
  type          text not null check (type in ('mcq','tf')),
  prompt        text not null,
  options       text[] not null default '{}',
  correct_index int  not null default 0,
  explanation   text,
  created_at    bigint not null default 0
);
create index if not exists quiz_questions_unit on quiz_questions (unit_id);
alter table quiz_questions add column if not exists exam boolean not null default false;

-- ---------- PROFIL VA PROGRESS ----------

create table if not exists profiles (
  id   text primary key,
  name text not null
);

-- Keyinchalik qo'shilgan ustunlar (akkaunt bog'lash, admin, raqobat ko'rinishi)
alter table profiles add column if not exists email text;
alter table profiles add column if not exists is_admin boolean not null default false;
alter table profiles add column if not exists competes_in_stats boolean not null default true;

create table if not exists card_states (
  id          text primary key,
  profile_id  text not null references profiles(id) on delete cascade,
  word_id     text not null references words(id) on delete cascade,
  direction   text not null check (direction in ('ru2uz','uz2ru')),
  ease        double precision not null default 2.5,
  "interval"  double precision not null default 0,
  repetitions int not null default 0,
  due_at      bigint not null default 0,
  lapses      int not null default 0
);
create index if not exists card_states_due on card_states (profile_id, due_at);
create unique index if not exists card_states_word_dir
  on card_states (profile_id, word_id, direction);

create table if not exists quiz_states (
  id          text primary key,
  profile_id  text not null references profiles(id) on delete cascade,
  question_id text not null references quiz_questions(id) on delete cascade,
  ease        double precision not null default 2.5,
  "interval"  double precision not null default 0,
  repetitions int not null default 0,
  due_at      bigint not null default 0,
  lapses      int not null default 0
);
create index if not exists quiz_states_due on quiz_states (profile_id, due_at);
create unique index if not exists quiz_states_q on quiz_states (profile_id, question_id);

create table if not exists unit_progress (
  profile_id  text not null references profiles(id) on delete cascade,
  unit_id     text not null references units(id) on delete cascade,
  state       text not null default 'yangi' check (state in ('yangi','jarayonda','tugadi')),
  blocks_done text[] not null default '{}',
  updated_at  bigint not null default 0,
  primary key (profile_id, unit_id)
);

create table if not exists speaking_logs (
  id           text primary key,
  profile_id   text not null references profiles(id) on delete cascade,
  unit_id      text not null,
  prompt       text not null default '',
  storage_path text not null,
  seconds      double precision not null default 0,
  created_at   bigint not null default 0
);
create index if not exists speaking_logs_profile on speaking_logs (profile_id, created_at);

create table if not exists daily_stats (
  profile_id      text not null references profiles(id) on delete cascade,
  date            text not null,
  cards_reviewed  int not null default 0,
  correct         int not null default 0,
  minutes_studied int not null default 0,
  blocks_done     int not null default 0,
  primary key (profile_id, date)
);

create table if not exists settings (
  key   text primary key,
  value jsonb
);

-- ---------- RLS: faqat authenticated foydalanuvchi ----------

do $$
declare t text;
begin
  foreach t in array array[
    'books','units','blocks','resources','audio_assets','rules','decks',
    'words','profiles','card_states','unit_progress','speaking_logs',
    'daily_stats','settings','quiz_questions','quiz_states'
  ] loop
    execute format('alter table %I enable row level security', t);
    begin
      execute format(
        'create policy authenticated_all on %I for all to authenticated using (true) with check (true)',
        t
      );
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ---------- STORAGE: private "audio" bucket ----------

insert into storage.buckets (id, name, public)
values ('audio', 'audio', false)
on conflict (id) do nothing;

do $$
begin
  begin
    create policy audio_auth_select on storage.objects
      for select to authenticated using (bucket_id = 'audio');
  exception when duplicate_object then null; end;
  begin
    create policy audio_auth_insert on storage.objects
      for insert to authenticated with check (bucket_id = 'audio');
  exception when duplicate_object then null; end;
  begin
    create policy audio_auth_update on storage.objects
      for update to authenticated using (bucket_id = 'audio');
  exception when duplicate_object then null; end;
  begin
    create policy audio_auth_delete on storage.objects
      for delete to authenticated using (bucket_id = 'audio');
  exception when duplicate_object then null; end;
end $$;

-- ============================================================
-- SEED — struktura (kontent EMAS: bloklar/so'zlar OCR'dan keladi)
-- ============================================================

insert into books (id, title, role) values
  ('book-main',    'Privet, Student! (Red Kalinka A1–B1)', 'main'),
  ('book-grammar', '30 шагов к русскому языку',            'grammar'),
  ('book-cases',   'Русские падежи',                       'cases'),
  ('book-reading', '50 текстов',                           'reading')
on conflict (id) do nothing;

insert into profiles (id, name) values
  ('shahzod',  'Shahzod'),
  ('sherigim', 'Ma''mura')
on conflict (id) do nothing;

-- Real foydalanuvchi sozlamalari (Supabase Auth emaillari + admin bayrog'i).
-- Profil ustunlari yuqorida qo'shilgan (email/is_admin/competes_in_stats).
update profiles set email = 'shahzod.bahronov05@gmail.com', is_admin = true  where id = 'shahzod';
update profiles set email = 'abdumamura0015@gmail.com',     is_admin = false where id = 'sherigim';

insert into profiles (id, name, email, is_admin, competes_in_stats)
values ('ukam', 'Ibrohim', 'bahronovibrohim09@gmail.com', false, false)
on conflict (id) do update set
  name              = excluded.name,
  email             = excluded.email,
  is_admin          = excluded.is_admin,
  competes_in_stats = excluded.competes_in_stats;

insert into units (id, "order", title, topic, grammar_focus, padej_ref, level, status) values
  ('u01', 1,  'Привет, студент',      'Tanishuv, salomlashish',  'Alifbo, «это», shaxs olmoshlari', null, 'A1', 'draft'),
  ('u02', 2,  'Это мой друг',         'Do''stlar, tanishtirish', 'Egalik olmoshlari: мой/моя/моё, otning jinsi', 'Kirish, 5-bet', 'A1', 'draft'),
  ('u03', 3,  'Моя семья',            'Oila',                    'Ko''plik: -ы/-и, у меня есть + И.п.', 'Kirish, 5-bet', 'A1', 'draft'),
  ('u04', 4,  'Профессия',            'Kasblar',                 '«Он врач» — Именительный, кто?', null, 'A1', 'draft'),
  ('u05', 5,  'Я русский, а вы?',     'Millat, davlat',          'Sifat: -ый/-ая/-ое, moslashuv', 'Kirish, 5-bet', 'A1', 'draft'),
  ('u06', 6,  'Язык',                 'Tillar',                  'говорить по-русски, знать, ravish', null, 'A1', 'draft'),
  ('u07', 7,  'Что ты делаешь?',      'Kundalik ishlar',         'Fe''l hozirgi zamon: I va II tuslanish', null, 'A1', 'draft'),
  ('u08', 8,  'Трудный урок',         'Sifatlar, baho',          'Sifat + ot moslashuvi, «этот»', 'Kirish, 5-bet', 'A1', 'draft'),
  ('u09', 9,  'Дни недели и время',   'Hafta kunlari, soat',     '«Когда?» → в + Винительный (в среду)', 'Винительный, 68', 'A1', 'draft'),
  ('u10', 10, 'Мой день',             'Kun tartibi',             '-ся fe''llar, утром/днём/вечером', null, 'A1', 'draft'),
  ('u11', 11, 'У меня есть всё',      'Egalik, narsalar',        'у + Родительный (у меня, у брата), нет + Р.п.', 'Родительный, 108', 'A2', 'draft'),
  ('u12', 12, 'Еда и продукты',       'Ovqat',                   'Винительный — я ем что? хочу что?', 'Винительный, 68', 'A2', 'draft'),
  ('u13', 13, 'Одежда',               'Kiyim',                   'Винительный + sifat, носить/надеть', 'Винительный, 68', 'A2', 'draft'),
  ('u14', 14, 'Моя квартира',         'Uy, xona',                'Предложный — где? в комнате, на столе', 'Предложный, 27', 'A2', 'draft'),
  ('u15', 15, 'Мой город',            'Shahar, yo''nalish',      'Предложный (жить в) ↔ Винительный (идти в) — farqi', 'Предложный 27 + Винительный 68', 'A2', 'draft'),
  ('u16', 16, 'Сколько тебе лет?',    'Yosh, sonlar',            'Дательный (мне 25) + son bilan Р.п. (года/лет)', 'Дательный 147 + Родительный 108', 'A2', 'draft'),
  ('u17', 17, 'Погода',               'Ob-havo',                 'Shaxssiz gaplar: холодно, было, будет', null, 'A2', 'draft'),
  ('u18', 18, 'Я иду в больницу',     'Salomatlik, yo''nalish',  'Harakat fe''llari: идти/ходить, ехать/ездить + В.п.', 'Винительный, 68', 'A2', 'draft'),
  ('u19', 19, 'Планы на отпуск',      'Rejalar, ta''til',        'Kelasi zamon, aspekt: делать / сделать', null, 'A2', 'draft'),
  ('u20', 20, 'Ресторан',             'Restoranda',              'Buyruq mayli, дать кому что (Д.п. + В.п.)', 'Дательный, 147', 'A2', 'draft'),
  ('u21', 21, 'В деревне',            'Qishloq, tabiat',         'O''tgan zamon hikoya, Предложный ko''plik', 'Ko''plik: Предложный, 242', 'B1', 'draft'),
  ('u22', 22, 'Культурная жизнь',     'Teatr, kino, musiqa',     'Творительный — интересоваться чем, заниматься чем', 'Творительный, 178', 'B1', 'draft'),
  ('u23', 23, 'Семейный портрет',     'Ta''rif, xarakter',       'Родительный ko''plik (много друзей)', 'Ko''plik: Родительный, 219', 'B1', 'draft'),
  ('u24', 24, 'Наша Родина',          'Vatan, geografiya',       'Ko''plikda barcha padejlar, umumlashtirish', 'Ko''plik, 215–257', 'B1', 'draft'),
  ('u25', 25, 'Животный мир',         'Hayvonlar',               'Sifat qiyosiy darajasi: больше, самый', null, 'B1', 'draft'),
  ('u26', 26, 'Русские праздники',    'Bayramlar, sana',         'Tartib sonlar, sana: 1-го мая (Р.п.)', 'Родительный, 108', 'B1', 'draft'),
  ('u27', 27, 'Великие люди',         'Tarixiy shaxslar',        'O''tgan zamon, сложное предложение (который)', null, 'B1', 'draft'),
  ('u28', 28, 'Глобальные проблемы',  'Muammolar, munozara',     'чтобы, потому что, поэтому — fikr bildirish', null, 'B1', 'draft')
on conflict (id) do nothing;

insert into rules (id, title, category, body, unit_ids, pinned) values
  ('rule-01', 'Существительное, прилагательное, притяжательные местоимения, «этот» — 5-bet', 'padej', '', '{u02,u03,u05,u08}', false),
  ('rule-02', 'Предложный падеж (ед.ч.) — 27-bet',   'padej', '', '{u14,u15}', false),
  ('rule-03', 'Винительный падеж — 68-bet',           'padej', '', '{u09,u12,u13,u15,u18}', false),
  ('rule-04', 'Родительный падеж — 108-bet',          'padej', '', '{u11,u16,u26}', false),
  ('rule-05', 'Дательный падеж — 147-bet',            'padej', '', '{u16,u20}', false),
  ('rule-06', 'Творительный падеж — 178-bet',         'padej', '', '{u22}', false),
  ('rule-07', 'Множественное число — все падежи (215–257)', 'padej', '', '{u21,u23,u24}', false),
  ('rule-08', 'Таблицы склонений — 258-bet',          'padej', '', '{}', true)
on conflict (id) do nothing;

insert into decks (id, title, level, icon) values
  ('deck-01', 'Hayvonlar',                      'A1', '🐾'),
  ('deck-02', 'Tana a''zolari',                 'A1', '👂'),
  ('deck-03', 'Oziq-ovqat',                     'A1', '🍞'),
  ('deck-04', 'O''simliklar',                   'A2', '🌿'),
  ('deck-05', 'Uy-ro''zg''or',                  'A2', '🏠'),
  ('deck-06', 'Kasblar',                        'A1', '🛠'),
  ('deck-07', 'Kiyim',                          'A2', '👕'),
  ('deck-08', 'Ranglar',                        'A1', '🎨'),
  ('deck-09', 'Sonlar',                         'A1', '🔢'),
  ('deck-10', 'Vaqt va kun',                    'A1', '🕐'),
  ('deck-11', 'Harakat fe''llari',              'A2', '🚶'),
  ('deck-12', 'Ko''p ishlatiladigan fe''llar',  'A1', '⭐'),
  ('deck-13', 'Sifatlar',                       'A1', '✨'),
  ('deck-14', 'Ish/ofis leksikasi',             'B1', '💼'),
  ('deck-15', 'Shahar',                         'A2', '🏙'),
  ('deck-16', 'Musiqa va bayram',               'A2', '🎉'),
  ('deck-17', 'Ob-havo va tabiat',              'A2', '🌦'),
  ('deck-18', 'Salomatlik',                     'A2', '🏥'),
  ('deck-19', 'Sayohat va transport',           'A2', '✈️'),
  ('deck-20', 'Restoran',                        'A2', '🍽'),
  ('deck-21', 'Teatr va kino',                   'B1', '🎭'),
  ('deck-22', 'Tashqi ko''rinish va oila',        'B1', '🧑'),
  ('deck-23', 'Vatan va davlat',                  'B1', '🇷🇺'),
  ('deck-24', 'Hasharotlar va tabiat',            'B1', '🐞'),
  ('deck-25', 'Bayramlar va an''analar',          'B1', '🎄'),
  ('deck-26', 'Fan, san''at, yutuqlar',           'B1', '🎖'),
  ('deck-27', 'Global muammolar',                 'B1', '🌍'),
  ('deck-28', 'Qo''shimcha leksika',              'A1', '📎')
on conflict (id) do nothing;
