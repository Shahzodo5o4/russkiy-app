import type { Word } from '../../types';

export type QuizMode = 'ru2uz' | 'uz2ru' | 'dictation';

export type QuizResult = { word: Word; correct: boolean };
