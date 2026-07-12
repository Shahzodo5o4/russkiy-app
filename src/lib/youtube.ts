/** YouTube URL'dan video ID ajratadi (watch, youtu.be, embed, shorts). */
export function youtubeId(url: string): string | null {
  const m =
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?.*v=|embed\/|shorts\/))([\w-]{11})/.exec(url);
  return m ? m[1] : null;
}
