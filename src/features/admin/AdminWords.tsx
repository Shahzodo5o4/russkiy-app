import { useState } from 'react';
import BulkWords from './BulkWords';
import WordList from './WordList';

/** So'zlar bo'limi: bulk kiritish + ro'yxat. */
export default function AdminWords() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="grid gap-4">
      <BulkWords onSaved={() => setRefreshKey((k) => k + 1)} />
      <WordList refreshKey={refreshKey} />
    </div>
  );
}
