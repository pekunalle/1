/** Quiet USB interfaces (M-Vave Blackbox shows up as "USB Audio") sit far below a phone mic. */

export function removeDc(src: Float32Array, dst: Float32Array): { peak: number; rms: number } {
  const n = src.length;
  if (n === 0) return { peak: 0, rms: 0 };
  let mean = 0;
  for (let i = 0; i < n; i++) mean += src[i];
  mean /= n;
  let peak = 0;
  let energy = 0;
  for (let i = 0; i < n; i++) {
    const sample = src[i] - mean;
    dst[i] = sample;
    const mag = sample < 0 ? -sample : sample;
    if (mag > peak) peak = mag;
    energy += sample * sample;
  }
  return { peak, rms: Math.sqrt(energy / n) };
}

/** Bring a quiet guitar up without letting a hot phone mic clip. */
export function makeupGain(peak: number, userGain: number): number {
  const user = Math.max(1, Math.min(24, userGain || 1));
  if (!(peak > 0.00002)) return user;
  if (peak * user < 0.18) return Math.min(96, 0.42 / peak);
  if (peak * user > 0.92) return Math.min(user, 0.9 / peak);
  return user;
}

/** Higher when the buffer is periodic in the guitar range. Noise loses to a real string. */
export function channelScore(buf: Float32Array, sampleRate: number): number {
  const n = buf.length;
  if (n < 128 || sampleRate < 8000) return 0;
  let energy = 0;
  for (let i = 0; i < n; i += 2) energy += buf[i] * buf[i];
  if (energy < 1e-10) return 0;
  const minTau = Math.max(2, Math.floor(sampleRate / 1000));
  const maxTau = Math.min((n >> 1) - 1, Math.floor(sampleRate / 70));
  let best = 0;
  for (let tau = minTau; tau <= maxTau; tau += 4) {
    let corr = 0;
    const last = n - tau;
    for (let i = 0; i < last; i += 8) corr += buf[i] * buf[i + tau];
    if (corr > best) best = corr;
  }
  return best / (energy * 4);
}
