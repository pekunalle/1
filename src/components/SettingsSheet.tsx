import { useEffect, useRef } from "react";
import { InputPicker } from "@/components/InputPicker";
import { SHARP, FINNISH, type LabelMode } from "@/lib/music/theory";
import { TUNINGS } from "@/lib/music/tunings";
import { useKitara, type FretCount } from "@/lib/store";

const FRETS: FretCount[] = [12, 15, 17, 22, 24];
const LABELS: { id: LabelMode; label: string }[] = [
  { id: "note", label: "Nuotti" },
  { id: "degree", label: "Aste" },
  { id: "interval", label: "Intervalli" },
];

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const tuningId = useKitara((s) => s.tuningId);
  const root = useKitara((s) => s.root);
  const labelMode = useKitara((s) => s.labelMode);
  const fretCount = useKitara((s) => s.fretCount);
  const leftHanded = useKitara((s) => s.leftHanded);
  const finnishNames = useKitara((s) => s.finnishNames);
  const setTuningId = useKitara((s) => s.setTuningId);
  const setRoot = useKitara((s) => s.setRoot);
  const setLabelMode = useKitara((s) => s.setLabelMode);
  const setFretCount = useKitara((s) => s.setFretCount);
  const setLeftHanded = useKitara((s) => s.setLeftHanded);
  const setFinnishNames = useKitara((s) => s.setFinnishNames);
  const names = finnishNames ? FINNISH : SHARP;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sheet-back" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-label="Säädöt"
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="title text-3xl">Säädöt</h2>
          <button type="button" className="btn" onClick={onClose}>
            Sulje
          </button>
        </div>

        <InputPicker hot={open} />

        <label className="mt-4 block text-sm text-muted" htmlFor="tuning">
          Vire
        </label>
        <select id="tuning" className="field mt-1" value={tuningId} onChange={(e) => setTuningId(e.target.value)}>
          {TUNINGS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.midi.length === 7 ? " · 7 kieltä" : ""}
            </option>
          ))}
        </select>

        <p className="mt-4 text-sm text-muted">Juuri</p>
        <div className="row-scroll mt-1">
          {names.map((name, i) => (
            <button type="button" key={name} className="choice" data-on={root === i ? "1" : "0"} onClick={() => setRoot(i)}>
              {name}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm text-muted">Merkinnät otelaudalla</p>
        <div className="row-scroll mt-1">
          {LABELS.map((item) => (
            <button
              type="button"
              key={item.id}
              className="choice"
              data-on={labelMode === item.id ? "1" : "0"}
              onClick={() => setLabelMode(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm text-muted">Nauhat</p>
        <div className="row-scroll mt-1">
          {FRETS.map((n) => (
            <button type="button" key={n} className="choice" data-on={fretCount === n ? "1" : "0"} onClick={() => setFretCount(n)}>
              {n}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn" data-on={leftHanded ? "1" : "0"} onClick={() => setLeftHanded(!leftHanded)}>
            {leftHanded ? "Vasenkätinen päällä" : "Vasenkätinen"}
          </button>
          <button type="button" className="btn" data-on={finnishNames ? "1" : "0"} onClick={() => setFinnishNames(!finnishNames)}>
            {finnishNames ? "Nimet: H ja Cis" : "Nimet: B ja C#"}
          </button>
        </div>
        <p className="mt-3 text-sm text-muted">
          Vasenkätinen peilaa kaulan: satula siirtyy oikealle, korkein kieli pysyy ylhäällä.
        </p>
      </div>
    </div>
  );
}
