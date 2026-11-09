import { freqToMidi, pcOf } from "./theory";

export type Detection = {
  midi: number;
  pc: number;
  cents: number;
  freq: number;
  rms: number;
};

function parabolic(series: Float32Array, index: number): number {
  const y1 = series[index - 1] ?? series[index];
  const y2 = series[index];
  const y3 = series[index + 1] ?? series[index];
  const denom = y1 - 2 * y2 + y3;
  if (Math.abs(denom) < 1e-8) return index;
  return index + (y1 - y3) / (2 * denom);
}

/**
 * YIN pitch detector for guitar, including quiet USB interfaces.
 * The buffer is expected to be already gained by the caller.
 * Prefers the fundamental when distortion creates a strong octave harmonic.
 */
export function detectPitch(input: Float32Array, sampleRate: number): Detection | null {
  let peak = 0;
  let energy = 0;
  for (let i = 0; i < input.length; i++) {
    const sample = input[i];
    const mag = sample < 0 ? -sample : sample;
    if (mag > peak) peak = mag;
    energy += sample * sample;
  }
  const rmsIn = Math.sqrt(energy / input.length);
  if (peak < 0.0025 || rmsIn < 0.0008) return null;

  const length = input.length >> 1;
  if (length < 128) return null;
  const rate = sampleRate * 0.5;
  const highpass = 1 - Math.exp((-2 * Math.PI * 28) / rate);
  const buf = new Float32Array(length);
  let low = 0;
  for (let i = 0; i < length; i++) {
    const x = (input[i * 2] + (input[i * 2 + 1] ?? 0)) * 0.5;
    low += highpass * (x - low);
    buf[i] = x - low;
  }

  const minF = 30;
  const maxF = 1200;
  const minTau = Math.max(2, Math.floor(rate / maxF));
  const maxTau = Math.min((length >> 1) - 2, Math.floor(rate / minF));
  if (maxTau <= minTau + 4) return null;

  const yin = new Float32Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau++) {
    let sum = 0;
    const last = length - tau;
    for (let i = 0; i < last; i += 2) {
      const diff = buf[i] - buf[i + tau];
      sum += diff * diff;
    }
    yin[tau] = sum;
  }

  let running = 0;
  yin[0] = 1;
  for (let tau = 1; tau <= maxTau; tau++) {
    running += yin[tau];
    yin[tau] = running > 0 ? (yin[tau] * tau) / running : 1;
  }

  const threshold = 0.2;
  let tauEst = -1;
  for (let tau = minTau; tau <= maxTau; tau++) {
    if (yin[tau] >= threshold) continue;
    while (tau + 1 <= maxTau && yin[tau + 1] < yin[tau]) tau += 1;
    tauEst = tau;
    break;
  }
  if (tauEst < 0) {
    let best = 1;
    for (let tau = minTau; tau <= maxTau; tau++) {
      if (yin[tau] < best) {
        best = yin[tau];
        tauEst = tau;
      }
    }
    if (tauEst < 0 || best > 0.32) return null;
  }

  for (let step = 0; step < 2; step++) {
    const lower = tauEst * 2;
    if (lower > maxTau) break;
    const lowIndex = Math.round(lower);
    const fDown = rate / lowIndex;
    const credible = fDown >= 70 && fDown <= 500 && yin[lowIndex] < 0.4 && yin[lowIndex] <= yin[tauEst] + 0.08;
    if (credible) tauEst = lowIndex;
    else break;
  }

  const refined = parabolic(yin, tauEst);
  if (refined < minTau) return null;
  const freq = rate / refined;
  if (!Number.isFinite(freq) || freq < minF || freq > maxF) return null;
  const exact = freqToMidi(freq);
  const midi = Math.round(exact);
  if (midi < 16 || midi > 90) return null;
  const cents = Math.max(-99, Math.min(99, Math.round((exact - midi) * 100)));
  return { midi, pc: pcOf(midi), cents, freq, rms: rmsIn };
}
