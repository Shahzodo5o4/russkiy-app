/** MediaRecorder wrapper — gapirish mashqlarini yozib olish. */

export type Recording = { blob: Blob; seconds: number };

export type Recorder = {
  stop: () => Promise<Recording>;
  cancel: () => void;
};

export async function startRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = MediaRecorder.isTypeSupported('audio/webm')
    ? 'audio/webm'
    : 'audio/mp4';
  const rec = new MediaRecorder(stream, { mimeType: mime });
  const chunks: BlobPart[] = [];
  const startedAt = Date.now();

  rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  rec.start();

  const cleanup = () => stream.getTracks().forEach((t) => t.stop());

  return {
    stop: () =>
      new Promise<Recording>((resolve) => {
        rec.onstop = () => {
          cleanup();
          resolve({
            blob: new Blob(chunks, { type: mime }),
            seconds: Math.round((Date.now() - startedAt) / 1000),
          });
        };
        rec.stop();
      }),
    cancel: () => {
      rec.onstop = null;
      try { rec.stop(); } catch { /* allaqachon to'xtagan */ }
      cleanup();
    },
  };
}
