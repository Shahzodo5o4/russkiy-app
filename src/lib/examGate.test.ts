import { describe, it, expect } from 'vitest';
import { examGate } from './examGate';
import type { Unit, UnitProgress } from '../types';

function u(id: string, level: Unit['level'], order: number): Unit {
  return { id, order, title: 'Dars', topic: '', grammarFocus: '', level, status: 'ready' };
}
function done(unitId: string): UnitProgress {
  return { profileId: 'p1', unitId, state: 'tugadi', blocksDone: [], updatedAt: 0 };
}

const A1 = Array.from({ length: 6 }, (_, i) => u(`u0${i + 1}`, 'A1', i + 1));

describe('examGate', () => {
  it('hech narsa tugatilmaganda qulflangan (A1: 5 kerak)', () => {
    const g = examGate(A1, [], 0);
    expect(g.ready).toBe(false);
    expect(g.needed).toBe(5);
    expect(g.fresh).toBe(0);
    expect(g.remaining).toBe(5);
  });

  it('A1 da 5 dars tugatilsa ochiladi', () => {
    const progress = A1.slice(0, 5).map((x) => done(x.id));
    const g = examGate(A1, progress, 0);
    expect(g.ready).toBe(true);
    expect(g.remaining).toBe(0);
  });

  it('checkpoint dan keyingi darslar hisoblanadi (qayta qulflanadi)', () => {
    const progress = A1.slice(0, 5).map((x) => done(x.id));
    const g = examGate(A1, progress, 5); // oxirgi imtihonda 5 ta edi
    expect(g.fresh).toBe(0);
    expect(g.ready).toBe(false);
  });

  it('level eng yuqori tugatilgan darsdan aniqlanadi (B1: 3 kerak)', () => {
    const units = [u('u01', 'A1', 1), u('u21', 'B1', 21), u('u22', 'B1', 22), u('u23', 'B1', 23)];
    const progress = [done('u21'), done('u22'), done('u23')];
    const g = examGate(units, progress, 0);
    expect(g.needed).toBe(3);
    expect(g.ready).toBe(true);
  });
});
