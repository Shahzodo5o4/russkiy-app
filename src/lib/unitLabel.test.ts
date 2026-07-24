import { describe, it, expect } from 'vitest';
import { isRepeatUnit, sortUnits, unitLabels } from './unitLabel';
import type { Unit } from '../types';

function u(id: string, level: Unit['level'], order: number, title = 'Dars'): Unit {
  return { id, order, title, topic: '', grammarFocus: '', level, status: 'ready' };
}

describe('isRepeatUnit', () => {
  it('r-prefiksli id yoki Повтор sarlavhasini aniqlaydi', () => {
    expect(isRepeatUnit({ id: 'r01', title: 'Dars' })).toBe(true);
    expect(isRepeatUnit({ id: 'u05', title: 'Повторение А1' })).toBe(true);
    expect(isRepeatUnit({ id: 'u05', title: 'Моя семья' })).toBe(false);
  });
});

describe('sortUnits', () => {
  it('level → order tartibi, takror level oxirida', () => {
    // DB order chalkash: r01 (order 11) u11 (order 12) dan oldin bo‘lsa ham
    const units = [u('u11', 'A2', 12), u('r01', 'A1', 11, 'Повторение'), u('u01', 'A1', 1)];
    expect(sortUnits(units).map((x) => x.id)).toEqual(['u01', 'r01', 'u11']);
  });
});

describe('unitLabels', () => {
  it('raqamlash har level ichida boshdan, takror raqamsiz', () => {
    const units = [
      u('u01', 'A1', 1),
      u('u02', 'A1', 2),
      u('r01', 'A1', 11, 'Повторение'),
      u('u11', 'A2', 12),
    ];
    const labels = unitLabels(units);
    expect(labels.get('u01')?.badge).toBe('A1-1');
    expect(labels.get('u02')?.badge).toBe('A1-2');
    expect(labels.get('r01')?.num).toBeNull();
    expect(labels.get('r01')?.badge).toBe('A1 · Takror');
    expect(labels.get('u11')?.badge).toBe('A2-1'); // A2 da qaytadan boshlanadi
  });
});
