import { useMemo, useState } from "react";
import { Fretboard } from "@/components/Fretboard";
import { InputPicker } from "@/components/InputPicker";
import { PitchReadout, micErrorText } from "@/components/PitchReadout";
import { usePitch } from "@/components/use-pitch";
import { Waveform } from "@/components/Waveform";
import { pluck } from "@/lib/music/audio";
import { inPlayZone, makeMarker } from "@/lib/music/marks";
import { chordById } from "@/lib/music/chords";
import { scaleById } from "@/lib/music/scales";
import { noteName, pcOf } from "@/lib/music/theory";
import { tuningById } from "@/lib/music/tunings";
import { useKitara } from "@/lib/store";

type Level = 0 | 1 | 2;

function rollTarget(
  level: Level,
  fretCount: number,
  midi: number[],
  tones: Set<number> | null,
  octaves: 0 | 1 | 2 | 3,
  positionFret: number,
) {
  const max = level === 0 ? Math.min(3, fretCount) : level === 1 ? Math.min(7, fretCount) : fretCount;
  for (let i = 0; i < 40; i++) {
    const stringIndex = Math.floor(Math.random() * midi.length);
    const fret = Math.floor(Math.random() * (max + 1));
    if (!inPlayZone(fret, octaves, positionFret)) continue;
    const pc = pcOf(midi[stringIndex] + fret);
    if (!tones || tones.has(pc)) return { stringIndex, fret };
  }
  return { stringIndex: 0, fret: positionFret };
}

export function ListenView() {
  const [listening, setListening] = useState(false);
  const [hunt, setHunt] = useState(false);
  const [level, setLevel] = useState<Level>(0);
  const [streak, setStreak] = useState(0);
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null);
  const [target, setTarget] = useState<{ stringIndex: number; fret: number } | null>(null);

  const tuningId = useKitara((s) => s.tuningId);
  const root = useKitara((s) => s.root);
  const scaleId = useKitara((s) => s.scaleId);
  const chordId = useKitara((s) => s.chordId);
  const highlight = useKitara((s) => s.highlight);
  const labelMode = useKitara((s) => s.labelMode);
  const fretCount = useKitara((s) => s.fretCount);
  const leftHanded = useKitara((s) => s.leftHanded);
  const finnish = useKitara((s) => s.finnishNames);
  const huntBest = useKitara((s) => s.huntBest);
  const octaves = useKitara((s) => s.octaves);
  const positionFret = useKitara((s) => s.positionFret);
  const inputId = useKitara((s) => s.inputId);
  const setHuntBest = useKitara((s) => s.setHuntBest);
  const tuning = tuningById(tuningId);
  const scale = scaleById(scaleId);
  const chord = chordById(chordId);
  const active = highlight === "scale" ? scale : chord;
  const toneSet = useMemo(() => new Set(active.intervals.map((i) => pcOf(root + i))), [active, root]);

  const succeed = (nextTarget: { stringIndex: number; fret: number } | null) => {
    if (!nextTarget) return;
    const want = tuning.midi[nextTarget.stringIndex] + nextTarget.fret;
    return (midi: number) => {
      if (midi !== want) {
        setStreak(0);
        setFlash("miss");
        return;
      }
      setStreak((n) => {
        const value = n + 1;
        if (value > huntBest) setHuntBest(value);
        return value;
      });
      setFlash("hit");
      setTarget(rollTarget(level, fretCount, tuning.midi, toneSet));
    };
  };

  const { heard, error, level: meter, deviceLabel, getWave } = usePitch(
    listening,
    (det) => {
      if (!hunt || !target) return;
      if (Math.abs(det.cents) > 45) return;
      succeed(target)?.(det.midi);
    },
    inputId,
  );

  const marker = useMemo(
    () =>
      makeMarker({
        tuning,
        fretCount,
        root,
        finnish,
        labelMode,
        formula: active.formula,
        tones: active.intervals,
        sequence: [],
        heardMidi: heard && Math.abs(heard.cents) <= 45 ? heard.midi : null,
        target: hunt ? target : null,
        octaves,
        positionFret,
      }),
    [tuning, fretCount, root, finnish, labelMode, active, heard, hunt, target, octaves, positionFret],
  );

  const place = target
    ? `${noteName(tuning.midi[target.stringIndex], finnish)}-kieli, ${target.fret === 0 ? "avoin" : `${target.fret}. nauha`} · ${noteName(pcOf(tuning.midi[target.stringIndex] + target.fret), finnish)}`
    : "Käynnistä jahti";

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="kicker">Kuuntelu</p>
        <h1 className="title mt-1">{hunt ? "Nuottijahti" : "Vire ja nuotti"}</h1>
        <p className="mt-2 text-sm text-muted">Yksi sävel kerrallaan. Salli mikrofoni, kun selain kysyy. Jahdissa voit myös napauttaa merkityn paikan.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={() => setListening((v) => !v)}>
          {listening ? "Pysäytä" : "Kuuntele"}
        </button>
        <button
          type="button"
          className="btn"
          data-on={hunt ? "1" : "0"}
          onClick={() => {
            setHunt((v) => {
              const next = !v;
              if (next) {
                setTarget(rollTarget(level, fretCount, tuning.midi, toneSet, octaves, positionFret));
                setStreak(0);
                setFlash(null);
              }
              return next;
            });
          }}
        >
          {hunt ? "Jahti päällä" : "Nuottijahti"}
        </button>
      </div>
      {micErrorText(error) ? <p className="text-sm text-primary">{micErrorText(error)}</p> : null}
      <InputPicker hot={listening} />
      {listening ? (
        <div>
          <div className="cents-track" aria-label="Äänitaso">
            <span className="level-fill" style={{ width: `${Math.round(meter * 100)}%` }} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {deviceLabel || "Äänitulo"}
            {meter < 0.04 ? " · hiljainen. USB-kortilla nosta lähtövoimakkuutta." : ""}
          </p>
        </div>
      ) : null}

      <PitchReadout heard={listening ? heard : null} finnish={finnish} idle={listening ? "Soita yksi nuotti" : "Mikrofoni ei ole päällä"} />
      <Waveform getWave={getWave} />

      {hunt ? (
        <div className="panel">
          <p className="kicker">Soita tämä</p>
          <p className="mt-1 font-display text-2xl uppercase tracking-wide">{place}</p>
          <p className="mt-1 text-sm text-muted tabular-nums">
            Putki {streak} · ennätys {Math.max(huntBest, streak)}
            {flash === "hit" ? " · osuma" : flash === "miss" ? " · eri nuotti" : ""}
          </p>
          <div className="row-scroll mt-3">
            {([0, 1, 2] as Level[]).map((n) => (
              <button
                type="button"
                key={n}
                className="choice"
                data-on={level === n ? "1" : "0"}
                onClick={() => {
                  setLevel(n);
                  setTarget(rollTarget(n, fretCount, tuning.midi, toneSet, octaves, positionFret));
                  setStreak(0);
                  setFlash(null);
                }}
              >
                {n === 0 ? "Alkeet" : n === 1 ? "Keski" : "Vaikea"}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <Fretboard
        tuning={tuning}
        fretCount={fretCount}
        leftHanded={leftHanded}
        finnish={finnish}
        focusFret={octaves === 0 ? 0 : positionFret}
        marker={marker}
        onPlay={(stringIndex, fret, midi) => {
          pluck(midi);
          if (!hunt || !target) return;
          succeed(target)?.(midi);
        }}
      />
    </div>
  );
}
