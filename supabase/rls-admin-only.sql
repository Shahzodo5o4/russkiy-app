-- ============================================================
-- IXTIYORIY XAVFSIZLIK: kontentga yozishni faqat adminlarga cheklash
-- ============================================================
-- HOZIR: har login qilgan foydalanuvchi (authenticated_all) BARCHA kontentni
--        (darslar, so'zlar, quiz…) o'zgartira oladi. Bu skript kontent
--        jadvallarini "hamma o'qiydi, faqat admin yozadi" qilib qattiqlashtiradi.
--
-- TEGILMAYDI (har foydalanuvchi o'ziniki bilan ishlaydi — ochiq qoladi):
--   card_states, quiz_states, unit_progress, daily_stats, speaking_logs, settings
--   (settings'siz Sozlamalar ekrani va examCheckpoint ishlamaydi!)
--
-- ISHLATISH: schema.sql'dan KEYIN Supabase SQL Editor'da ishga tushiring.
-- ⚠️ DIQQAT: agar keyin schema.sql'ni QAYTA ishga tushirsangiz, u kontent
--    jadvallariga blanket "authenticated_all" ni qaytadan qo'shadi —
--    shunda bu skriptni HAM qayta ishga tushiring.
-- ============================================================

-- Admin tekshiruvi: joriy auth foydalanuvchisi (email bo'yicha) profiles'da
-- is_admin = true bo'lsa TRUE. SECURITY DEFINER — RLS rekursiyasidan qochish uchun.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.email = auth.jwt() ->> 'email'
      and p.is_admin
  );
$$;

-- Kontent jadvallari: hamma o'qiydi, faqat admin yozadi
do $$
declare t text;
begin
  foreach t in array array[
    'books','units','blocks','resources','audio_assets','rules','decks',
    'words','quiz_questions'
  ] loop
    execute format('alter table %I enable row level security', t);
    -- eski blanket siyosatni olib tashlaymiz
    execute format('drop policy if exists authenticated_all on %I', t);
    -- o'qish — hammaga
    begin
      execute format(
        'create policy content_read on %I for select to authenticated using (true)', t);
    exception when duplicate_object then null; end;
    -- yozish (insert/update/delete) — faqat admin
    begin
      execute format(
        'create policy content_write on %I for all to authenticated '
        || 'using (public.is_admin()) with check (public.is_admin())', t);
    exception when duplicate_object then null; end;
  end loop;
end $$;

-- Tekshirish: kontent jadvallaridagi siyosatlar
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('books','units','blocks','resources','audio_assets',
                    'rules','decks','words','quiz_questions')
order by tablename, policyname;
