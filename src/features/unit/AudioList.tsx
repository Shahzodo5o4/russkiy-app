import { useEffect, useState } from 'react';
import { storage, type AudioAssetMeta } from '../../storage';
import LoopPlayer from '../../components/LoopPlayer';

/** Darsga biriktirilgan kitob audiolari — A–B loop pleyer bilan. */
export default function AudioList({ unitId }: { unitId: string }) {
  const [assets, setAssets] = useState<AudioAssetMeta[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    storage.listAudioAssets(unitId).then(setAssets);
  }, [unitId]);

  async function loadUrl(id: string) {
    if (urls[id]) return;
    const url = await storage.getAudioUrl(id);
    if (url) setUrls((u) => ({ ...u, [id]: url }));
  }

  if (assets.length === 0) return null;

  return (
    <section className="rounded border border-grid bg-white p-4">
      <h3 className="font-medium">🎧 Kitob audiosi</h3>
      <ul className="mt-3 grid gap-2">
        {assets.map((a) => (
          <li key={a.id} className="rounded border border-grid p-2">
            <p className="mb-1 text-sm">{a.title}</p>
            {urls[a.id] ? (
              <LoopPlayer src={urls[a.id]} title={a.title} />
            ) : (
              <button
                onClick={() => void loadUrl(a.id)}
                className="w-full rounded border border-grid bg-paper py-2 text-sm"
              >
                ▶ Yuklash va eshitish
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
