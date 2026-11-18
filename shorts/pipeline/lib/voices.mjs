// Which narrator reads which video. A recorded voice.wav always wins; otherwise the synthetic
// voices in channel.json take turns, so two videos in a row never sound the same.
const num = (id) => parseInt(String(id).replace(/\D/g, ''), 10) || 1;

export const FALLBACK = [{ id: 'bm_george', lang: 'en-gb', speed: 1.22, label: 'UK male, steady' }];

/** The voice for video `id`: the script's `voice:` if it names one, else the rotation. */
export function pickVoice(id, channel = {}, script = null) {
  const roster = Array.isArray(channel.voices) && channel.voices.length ? channel.voices : FALLBACK;
  const want = script?.meta?.voice;
  if (want) {
    const v = roster.find((x) => x.id === want);
    if (!v) throw new Error(`voice "${want}" is not in channel.json (${roster.map((x) => x.id).join(', ')})`);
    return v;
  }
  return roster[(num(id) - 1) % roster.length];
}
