import { useEffect, useState } from 'react';
import { storage, type SpeakingLogMeta } from '../../storage';
import { useProfile } from '../../store/ProfileContext';

/** Saqlangan gapirish yozuvlari — o'sishni eshitish uchun. */
export default function Recordings() {
  const { profile } = useProfile();
  const [logs, setLogs] = useState<SpeakingLogMeta[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    storage.listSpeakingLogs(profile.id).then(setLogs);
  }, [profile.id]);

  async function load(id: string) {
    if (urls[id]) return;
    const url = await storage.getSpeakingAudioUrl(id);
    if (url) setUrls((u) => ({ ...u, [id]: url }));
  }

  if (logs.length === 0) {
    return <p className="text-sm text-muted">Hali yozuvlar yo'q — «Erkin gapirish»da birinchisini yozing.</p>;
  }

  return (
    <ul className="grid gap-2">
      {logs.map((l) => (
        <li key={l.id} className="rounded border border-grid bg-white p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-ru text-sm">{l.prompt}</span>
            <span className="shrink-0 text-[11px] text-muted">
              {new Date(l.createdAt).toLocaleDateString()} · {l.seconds}s
            </span>
          </div>
          {urls[l.id] ? (
            <audio controls src={urls[l.id]} className="mt-2 w-full" />
          ) : (
            <button onClick={() => void load(l.id)}
              className="mt-2 w-full rounded border border-grid bg-paper py-1.5 text-sm">
              ▶ Eshitish
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
