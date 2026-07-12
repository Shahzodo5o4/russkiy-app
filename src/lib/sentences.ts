/** Markdown blok matnini shadowing uchun jumlalarga bo'lish. */
export function extractSentences(markdown: string): string[] {
  const lines = markdown
    .split('\n')
    .map((l) => l.trim())
    // sarlavha, izoh, jadval qatorlarini tashlab yuboramiz
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('|') && !l.startsWith('*') && !l.startsWith('<'))
    .map((l) =>
      l
        .replace(/^[—\-–]\s*/, '') // dialog chizig'i
        .replace(/\*\*|__|\*|_/g, '') // bold/italic
        .replace(/\s{2,}$/g, ''),
    );

  const sentences: string[] = [];
  for (const line of lines) {
    // Jumlalarga bo'lish: . ! ? … dan keyin
    const parts = line.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
    for (const p of parts) {
      // faqat kirill matni bor jumlalar
      if (/[а-яё]/i.test(p) && p.length > 1) sentences.push(p);
    }
  }
  return sentences;
}
