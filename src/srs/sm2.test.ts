import { describe, it, expect } from 'vitest';
import { sm2, freshCard, type SrsFields } from './sm2';

const base: SrsFields = { ease: 2.5, interval: 0, repetitions: 0, dueAt: 0, lapses: 0 };

describe('sm2', () => {
  it('birinchi to‘g‘ri javob — interval 1 kun', () => {
    const r = sm2(base, 4);
    expect(r.repetitions).toBe(1);
    expect(r.interval).toBe(1);
  });

  it('ikkinchi to‘g‘ri javob — interval 6 kun', () => {
    const r = sm2({ ...base, repetitions: 1, interval: 1 }, 4);
    expect(r.repetitions).toBe(2);
    expect(r.interval).toBe(6);
  });

  it('uchinchi+ javob — interval ease ga ko‘paytiriladi', () => {
    const r = sm2({ ...base, repetitions: 2, interval: 6, ease: 2.5 }, 4);
    expect(r.repetitions).toBe(3);
    expect(r.interval).toBe(Math.round(6 * 2.5)); // 15
  });

  it('xato (quality<3) — repetitions/interval nolga, lapses +1', () => {
    const r = sm2({ ...base, repetitions: 5, interval: 30, lapses: 1 }, 0);
    expect(r.repetitions).toBe(0);
    expect(r.interval).toBe(0);
    expect(r.lapses).toBe(2);
  });

  it('ease hech qachon 1.3 dan pastga tushmaydi', () => {
    let card: SrsFields = { ...base, ease: 1.3 };
    for (let i = 0; i < 10; i++) card = sm2(card, 3);
    expect(card.ease).toBeGreaterThanOrEqual(1.3);
  });

  it('quality 5 ease ni oshiradi, quality 3 pasaytiradi', () => {
    expect(sm2(base, 5).ease).toBeGreaterThan(2.5);
    expect(sm2(base, 3).ease).toBeLessThan(2.5);
  });

  it('to‘g‘ri javobda dueAt kelajakda', () => {
    const r = sm2(base, 4);
    expect(r.dueAt).toBeGreaterThan(Date.now() - 1000);
  });
});

describe('freshCard', () => {
  it('standart SRS maydonlari va kompozit id bilan karta yaratadi', () => {
    const c = freshCard('p1', 'w1', 'ru2uz');
    expect(c.id).toBe('p1:w1:ru2uz');
    expect(c.ease).toBe(2.5);
    expect(c.repetitions).toBe(0);
    expect(c.direction).toBe('ru2uz');
  });
});
