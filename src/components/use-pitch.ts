import { useEffect, useRef, useState } from "react";
import { channelScore, makeupGain, removeDc } from "@/lib/music/input-gain";
import { detectPitch, type Detection } from "@/lib/music/pitch";

function constraintsFor(deviceId: string): MediaTrackConstraints {
  const audio: MediaTrackConstraints = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: { ideal: 2 },
  };
  if (deviceId) audio.deviceId = { exact: deviceId };
  return audio;
}

export function usePitch(active: boolean, onStable?: (heard: Detection) => void, deviceId = "", inputGain = 6) {
  const [heard, setHeard] = useState<Detection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [deviceLabel, setDeviceLabel] = useState("");
  const onStableRef = useRef(onStable);
  const gainRef = useRef(inputGain);
  const waveRef = useRef<Float32Array | null>(null);
  onStableRef.current = onStable;
  gainRef.current = inputGain;

  useEffect(() => {
    if (!active) {
      setHeard(null);
      setLevel(0);
      return;
    }
    let dead = false;
    let raf = 0;
    let audioCtx: AudioContext | null = null;
    const streamRef: { current: MediaStream | null } = { current: null };
    const tracker = { pc: -1, held: 0, fired: false, silent: 0 };
    let lastUi = 0;
    let lock: 0 | 1 = 0;

    const stopTracks = () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };

    const openStream = async () => {
      try {
        return await navigator.mediaDevices.getUserMedia({ audio: constraintsFor(deviceId), video: false });
      } catch (err) {
        if (!deviceId) throw err;
        const name = err instanceof DOMException ? err.name : "";
        if (name !== "OverconstrainedError" && name !== "NotFoundError") throw err;
        return navigator.mediaDevices.getUserMedia({ audio: constraintsFor(""), video: false });
      }
    };

    void (async () => {
      try {
        const stream = await openStream();
        if (dead) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const track = stream.getAudioTracks()[0];
        if (track) {
          setDeviceLabel(track.label || "Äänitulo");
          try {
            await track.applyConstraints({
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              channelCount: 2,
            });
          } catch {
            /* USB-kortti ei aina hyväksy lisärajoitteita. Signaali kelpaa silti. */
          }
        }
        const rate = track?.getSettings().sampleRate || 48000;
        try {
          audioCtx = new AudioContext({ sampleRate: rate, latencyHint: "interactive" });
        } catch {
          audioCtx = new AudioContext({ latencyHint: "interactive" });
        }
        if (audioCtx.state === "suspended") await audioCtx.resume();
        const source = audioCtx.createMediaStreamSource(stream);
        const left = audioCtx.createAnalyser();
        left.fftSize = 4096;
        left.smoothingTimeConstant = 0;
        let right: AnalyserNode | null = null;
        try {
          source.channelCount = 2;
          source.channelCountMode = "explicit";
          source.channelInterpretation = "discrete";
          const splitter = audioCtx.createChannelSplitter(2);
          source.connect(splitter);
          splitter.connect(left, 0);
          right = audioCtx.createAnalyser();
          right.fftSize = 4096;
          right.smoothingTimeConstant = 0;
          splitter.connect(right, 1);
        } catch {
          source.channelCountMode = "max";
          source.connect(left);
          right = null;
        }
        const sink = audioCtx.createGain();
        sink.gain.value = 0;
        source.connect(sink);
        sink.connect(audioCtx.destination);

        const bufL = new Float32Array(left.fftSize);
        const bufR = new Float32Array(left.fftSize);
        const cleanL = new Float32Array(left.fftSize);
        const cleanR = new Float32Array(left.fftSize);
        const mixed = new Float32Array(left.fftSize);
        const loop = () => {
          if (dead || !audioCtx) return;
          if (audioCtx.state === "suspended") void audioCtx.resume();
          left.getFloatTimeDomainData(bufL);
          const statsL = removeDc(bufL, cleanL);
          let statsR = { peak: 0, rms: 0 };
          if (right) {
            right.getFloatTimeDomainData(bufR);
            statsR = removeDc(bufR, cleanR);
          }
          const scoreL = channelScore(cleanL, audioCtx.sampleRate);
          const scoreR = right ? channelScore(cleanR, audioCtx.sampleRate) : -1;
          let useRight = false;
          if (right && scoreR >= 0) {
            if (lock === 1 && scoreR > 0.015 && scoreR + 0.04 >= scoreL) useRight = true;
            else if (lock === 0 && scoreL > 0.015 && scoreL + 0.04 >= scoreR) useRight = false;
            else if (scoreR > scoreL + 0.06 && statsR.rms > 0.00003) useRight = true;
            else if (scoreL > scoreR + 0.06) useRight = false;
            else useRight = statsR.rms > statsL.rms * 1.8 && scoreR > scoreL;
          }
          const chosen = useRight ? cleanR : cleanL;
          const peak = useRight ? statsR.peak : statsL.peak;
          const gain = makeupGain(peak, gainRef.current);
          let outPeak = 0;
          for (let i = 0; i < chosen.length; i++) {
            const sample = Math.max(-1, Math.min(1, chosen[i] * gain));
            mixed[i] = sample;
            const mag = sample < 0 ? -sample : sample;
            if (mag > outPeak) outPeak = mag;
          }
          if (!waveRef.current || waveRef.current.length !== mixed.length) waveRef.current = new Float32Array(mixed.length);
          waveRef.current.set(mixed);
          const det = detectPitch(mixed, audioCtx.sampleRate);
          const now = performance.now();
          const paint = now - lastUi > 80;
          if (paint) lastUi = now;
          if (paint) setLevel(Math.max(0, Math.min(1, outPeak)));
          if (!det) {
            tracker.silent += 1;
            if (tracker.silent > 14) {
              tracker.pc = -1;
              tracker.held = 0;
              tracker.fired = false;
            }
            if (tracker.silent === 4) setHeard(null);
          } else {
            lock = useRight ? 1 : 0;
            tracker.silent = 0;
            if (paint) setHeard(det);
            if (Math.abs(det.cents) <= 55) {
              if (det.pc !== tracker.pc) {
                tracker.pc = det.pc;
                tracker.held = 1;
                tracker.fired = false;
              } else {
                tracker.held += 1;
              }
              if (!tracker.fired && tracker.held >= 3) {
                tracker.fired = true;
                onStableRef.current?.(det);
              }
            }
          }
          raf = requestAnimationFrame(loop);
        };
        setError(null);
        raf = requestAnimationFrame(loop);
      } catch (err) {
        if (dead) return;
        const name = err instanceof DOMException ? err.name : "";
        setError(name === "NotAllowedError" || name === "SecurityError" ? "denied" : name === "NotFoundError" ? "missing" : "failed");
      }
    })();

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      stopTracks();
      void audioCtx?.close();
      waveRef.current = null;
    };
  }, [active, deviceId]);

  return {
    heard,
    error,
    level,
    deviceLabel,
    getWave: () => waveRef.current,
  };
}
