import { useEffect, useRef, useState } from "react";
import { detectPitch, type Detection } from "@/lib/music/pitch";

function constraintsFor(deviceId: string): MediaTrackConstraints {
  const audio: MediaTrackConstraints = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  };
  if (deviceId) audio.deviceId = { exact: deviceId };
  return audio;
}

export function usePitch(active: boolean, onStable?: (heard: Detection) => void, deviceId = "") {
  const [heard, setHeard] = useState<Detection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [deviceLabel, setDeviceLabel] = useState("");
  const onStableRef = useRef(onStable);
  const waveRef = useRef<Float32Array | null>(null);
  onStableRef.current = onStable;

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
            });
          } catch {
            /* USB-kortti ei aina hyväksy lisärajoitteita. Signaali kelpaa silti. */
          }
        }
        const rate = track?.getSettings().sampleRate || 48000;
        audioCtx = new AudioContext({ sampleRate: rate, latencyHint: "interactive" });
        if (audioCtx.state === "suspended") await audioCtx.resume();
        const source = audioCtx.createMediaStreamSource(stream);
        const splitter = audioCtx.createChannelSplitter(2);
        const left = audioCtx.createAnalyser();
        const right = audioCtx.createAnalyser();
        left.fftSize = 4096;
        right.fftSize = 4096;
        left.smoothingTimeConstant = 0;
        right.smoothingTimeConstant = 0;
        source.connect(splitter);
        splitter.connect(left, 0);
        splitter.connect(right, 1);
        const bufL = new Float32Array(left.fftSize);
        const bufR = new Float32Array(right.fftSize);
        const loop = () => {
          if (dead || !audioCtx) return;
          left.getFloatTimeDomainData(bufL);
          right.getFloatTimeDomainData(bufR);
          const mixed = new Float32Array(bufL.length);
          let peak = 0;
          for (let i = 0; i < bufL.length; i++) {
            const sample = Math.abs(bufR[i]) > Math.abs(bufL[i]) ? bufR[i] : bufL[i];
            mixed[i] = sample;
            const mag = sample < 0 ? -sample : sample;
            if (mag > peak) peak = mag;
          }
          if (!waveRef.current || waveRef.current.length !== mixed.length) waveRef.current = new Float32Array(mixed.length);
          waveRef.current.set(mixed);
          const det = detectPitch(mixed, audioCtx.sampleRate);
          const now = performance.now();
          const paint = now - lastUi > 80;
          if (paint) lastUi = now;
          if (paint) setLevel(Math.max(0, Math.min(1, peak * 14)));
          if (!det) {
            tracker.silent += 1;
            if (tracker.silent > 12) {
              tracker.pc = -1;
              tracker.held = 0;
              tracker.fired = false;
            }
            if (tracker.silent === 4) setHeard(null);
          } else {
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
              if (!tracker.fired && tracker.held >= 4) {
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
