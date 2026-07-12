import { Link } from 'react-router-dom';
import { useProfile } from '../../store/ProfileContext';
import { useTodayPlan } from '../../hooks/useTodayPlan';
import { todayLabel } from '../../lib/date';
import EmptyState from '../../components/EmptyState';

/** Bugun — kunlik reja (spec 4.1): Takrorlash → Dars → Gapirish. */
export default function TodayScreen() {
  const { profile } = useProfile();
  const { plan, pinUnit } = useTodayPlan(profile.id);

  if (!plan) return <p className="text-muted">Reja tuzilmoqda…</p>;

  const srsLeft = plan.due + plan.fresh;
  const srsDone = srsLeft === 0 && plan.reviewedToday > 0;
  const blocksTotal = plan.blocks.length;
  const blocksDone = plan.blocks.filter((b) => plan.blocksDone.includes(b.id)).length;
  const lessonDone = blocksTotal > 0 && blocksDone === blocksTotal;
  const speakBlock = plan.blocks.find(
    (b) => b.title.toLowerCase().includes('о себе') || b.kind === 'text',
  );

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">{todayLabel()}</h1>
        <span className="text-sm text-muted" title="Uzluksiz o'qilgan kunlar">
          🔥 {plan.streak} kunlik seriya
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {/* 1 · TAKRORLASH — doim birinchi */}
        <Link to="/review"
          className={`rounded border bg-white p-4 hover:border-ink ${
            srsDone ? 'border-ok/60' : 'border-grid'
          }`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">1 · Takrorlash {srsDone && '✓'}</span>
            <span className="text-sm text-muted">
              {srsLeft > 0
                ? `${plan.due} takror · ${plan.fresh} yangi`
                : `bugun: ${plan.reviewedToday} ta karta`}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {srsLeft > 0 ? 'Boshlash uchun bosing' : 'Bajarildi — barakalla!'}
          </p>
        </Link>

        {/* 2 · DARS — joriy (qo'lda tanlanadi) */}
        {plan.unit ? (
          <div className={`rounded border bg-white p-4 ${
            lessonDone ? 'border-ok/60' : 'border-grid'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">2 · Dars {lessonDone && '✓'}</span>
              <select
                className="max-w-[55%] rounded border border-grid bg-paper px-2 py-1 text-sm"
                value={plan.unit.id}
                onChange={(e) => void pinUnit(e.target.value)}
                title="Joriy darsni almashtirish"
              >
                {plan.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.order} · {u.title}{u.status === 'draft' ? ' (bo‘sh)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <Link to={`/unit/${plan.unit.id}`} className="mt-2 block hover:underline">
              <span className="font-ru text-lg">{plan.unit.title}</span>
              <span className="ml-2 text-sm text-muted">{plan.unit.topic}</span>
            </Link>
            {blocksTotal > 0 ? (
              <div className="mt-2">
                <div className="h-1.5 overflow-hidden rounded bg-paper">
                  <div className="h-full bg-ok transition-all"
                    style={{ width: `${(blocksDone / blocksTotal) * 100}%` }} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {blocksDone} / {blocksTotal} blok bajarildi
                </p>
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted">
                Bu dars hali to'ldirilmagan
                {profile.isAdmin && (
                  <>
                    {' — '}
                    <Link to={`/admin/units/${plan.unit.id}`} className="underline">
                      kontent kiritish
                    </Link>
                  </>
                )}
              </p>
            )}
          </div>
        ) : (
          <EmptyState message="Darslar hali yuklanmagan." />
        )}

        {/* 3 · GAPIRISH */}
        <Link to="/speak" className="rounded border border-grid bg-white p-4 hover:border-ink">
          <div className="flex items-center justify-between">
            <span className="font-medium">3 · Gapirish</span>
            <span className="text-sm text-muted">~5 daqiqa</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {plan.unit && speakBlock
              ? 'Shadowing yoki «О себе́» savollariga javob yozib oling'
              : 'Shadowing — dialog jumlalarini takrorlash'}
          </p>
        </Link>

        {/* Test */}
        <Link to="/quiz" className="rounded border border-grid bg-white p-4 hover:border-ink">
          <div className="flex items-center justify-between">
            <span className="font-medium">Test (ixtiyoriy)</span>
            <span className="text-sm text-muted">RU→UZ · yozish · diktant</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Sherik bilan bir-biringizni tekshiring — dars bo'yicha filtr bor
          </p>
        </Link>
      </div>
    </div>
  );
}
