import { useEffect, useMemo, useState } from "react";
import { Fretboard } from "@/components/Fretboard";
import { InputPicker } from "@/components/InputPicker";
import { micErrorText } from "@/components/PitchReadout";
import { usePitch } from "@/components/use-pitch";
import { pluck } from "@/lib/music/audio";
import { chordById } from "@/lib/music/chords";
import { makeMarker } from "@/lib/music/marks";
import { confidence, matchScales, motif, pitchSetKey, uniquePcs } from "@/lib/music/match";
import { filterScales, scaleById } from "@/lib/music/scales";
import { FINNISH, SHARP, noteName, spellFromFormula, type LabelMode } from "@/lib/music/theory";
import { tuningById } from "@/lib/music/tunings";
import { useKitara } from "@/lib/store";

const LABELS: { id: LabelMode; label: string }[] = [
  { id: "note", label: "Nuotti" },
  { id: "degree", label: "Aste" },
  { id: "interval", label: "Intervalli" },
];

const SLAYER = [
  { pc: 4, midi: 40 },
  { pc: 5, midi: 41 },
  { pc: 8, midi: 44 },
  { pc: 9, midi: 45 },
  { pc: 11, midi: 47 },
];

const PENT = [
  { pc: 4, midi: 40 },
  { pc: 7, midi: 43 },
  { pc: 9, midi: 45 },
  { pc: 11, midi: 47 },
  { pc: 2, midi: 50 },
];

export function BoardView({ onSettings }: { onSettings: () => void }) {
  const [listening, setListening] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const tab = useKitara((s) => s.tab);
  const tuningId = useKitara((s) => s.tuningId);
  const root = useKitara((s) => s.root);
  const scaleId = useKitara((s) => s.scaleId);
  const chordId = useKitara((s) => s.chordId);
  const highlight = useKitara((s) => s.highlight);
  const labelMode = useKitara((s) => s.labelMode);
  const fretCount = useKitara((s) => s.fretCount);
  const leftHanded = useKitara((s) => s.leftHanded);
  const finnishNames = useKitara((s) => s.finnishNames);
  const sequence = useKitara((s) => s.sequence);
  const octaves = useKitara((s) => s.octaves);
  const positionFret = useKitara((s) => s.positionFret);
  const inputId = useKitara((s) => s.inputId);
  const setRoot = useKitara((s) => s.setRoot);
  const setScaleId = useKitara((s) => s.setScaleId);
  const setHighlight = useKitara((s) => s.setHighlight);
  const setLabelMode = useKitara((s) => s.setLabelMode);
  const setTab = useKitara((s) => s.setTab);
  const setOctaves = useKitara((s) => s.setOctaves);
  const setPositionFret = useKitara((s) => s.setPositionFret);
  const addSequence = useKitara((s) => s.addSequence);
  const removeSequence = useKitara((s) => s.removeSequence);
  const clearSequence = useKitara((s) => s.clearSequence);
  const loadSequence = useKitara((s) => s.loadSequence);
  const applyMatch = useKitara((s) => s.applyMatch);
  const tuning = tuningById(tuningId);
  const scale = scaleById(scaleId);
  const chord = chordById(chordId);
  const names = finnishNames ? FINNISH : SHARP;
  const metal = useMemo(() => filterScales("metal", ""), []);
  const phrase = tab === "detect";

  useEffect(() => {
    if (!phrase) setListening(false);
  }, [phrase]);

  const { heard, error, level, deviceLabel } = usePitch(phrase && listening, (det) => {
    addSequence({ pc: det.pc, midi: det.midi });
  }, inputId);

  const matches = useMemo(() => (phrase ? matchScales(sequence) : []), [phrase, sequence]);
  const unique = uniquePcs(sequence);
  const active = matches.find((m) => `${m.scaleId}:${m.root}` === picked) ?? matches[0] ?? null;
  const activeScale = active ? scaleById(active.scaleId) : null;
  const topKey = active && activeScale ? pitchSetKey(activeScale, active.root) : "";
  const shown = phrase && activeScale ? activeScale : highlight === "scale" ? scale : chord;
  const shownRoot = phrase && active ? active.root : root;
  const line =
    phrase && active && activeScale ? motif(sequence, active.root, finnishNames, spellFromFormula(activeScale.formula)) : null;

  const marker = useMemo(
    () =>
      makeMarker({
        tuning,
        fretCount,
        root: shownRoot,
        finnish: finnishNames,
        labelMode,
        formula: shown.formula,
        tones: phrase && !activeScale ? null : shown.intervals,
        sequence: phrase ? sequence : [],
        heardMidi: phrase && heard && Math.abs(heard.cents) <= 45 ? heard.midi : null,
        target: null,
        octaves: phrase ? 0 : octaves,
        positionFret,
      }),
    [tuning, fretCount, shownRoot, finnishNames, labelMode, shown, phrase, activeScale, sequence, heard, octaves, positionFret],
  );

  return (
    <div className="flex flex-col gap-3">
      {phrase ? (
        <div>
          <p className="kicker">Frase</p>
          <h1 className="title mt-1">Mistä skaalasta?</h1>
          <p className="mt-2 text-sm text-muted">
            Soita nuotteja peräkkäin, yksi kerrallaan. Napauta kaulaa tai käytä mikrofonia. Skaalalauta kertoo, mihin skaalaan ne menevät.
          </p>
        </div>
      ) : (
        <div>
          <p className="kicker">{tuning.name}</p>
          <h1 className="title mt-1">
            {noteName(root, finnishNames)} {shown.name}
          </h1>
          <p className="formula">{shown.formula}</p>
        </div>
      )}

      {phrase ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn" onClick={() => { setListening(false); setTab("board"); }}>
            Takaisin skaalaan
          </button>
          <button type="button" className="btn" data-on={listening ? "1" : "0"} onClick={() => setListening((v) => !v)}>
            {listening ? "Pysäytä mikrofoni" : "Mikrofoni"}
          </button>
          <button type="button" className="btn" onClick={() => { setPicked(null); loadSequence(SLAYER); }}>
            Esimerkki Slayer
          </button>
          <button type="button" className="btn" onClick={() => { setPicked(null); loadSequence(PENT); }}>
            Esimerkki pentatoninen
          </button>
          <button
            type="button"
            className="btn"
            disabled={sequence.length === 0}
            onClick={() => {
              setPicked(null);
              clearSequence();
            }}
          >
            Tyhjennä
          </button>
        </div>
      ) : (
        <button type="button" className="banner" onClick={() => setTab("detect")}>
          <span className="kicker">Frase</span>
          <span className="mt-1 block font-display text-2xl uppercase leading-none tracking-wide">Soita nuotit — katso skaala</span>
          <span className="mt-1 block text-sm text-muted">
            {sequence.length > 0
              ? `Fraseessa on ${sequence.length} nuottia. Jatka siitä.`
              : "Napauta kaulaa järjestyksessä. Kokeile vaikka Slayerin E–F–G#–A–B."}
          </span>
        </button>
      )}

      {!phrase ? (
        <>
          <div className="row-scroll" aria-label="Juuri">
            {names.map((name, i) => (
              <button type="button" key={name} className="choice" data-on={root === i ? "1" : "0"} onClick={() => setRoot(i)}>
                {name}
              </button>
            ))}
          </div>
          <div className="row-scroll" aria-label="Skaalat">
            {metal.map((item) => (
              <button
                type="button"
                key={item.id}
                className="chip"
                data-on={highlight === "scale" && scaleId === item.id ? "1" : "0"}
                onClick={() => {
                  setScaleId(item.id);
                  setHighlight("scale");
                }}
              >
                {item.name}
              </button>
            ))}
            <button type="button" className="chip" onClick={() => setTab("scales")}>
              Kaikki skaalat
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn" data-on={highlight === "scale" ? "1" : "0"} onClick={() => setHighlight("scale")}>
              Skaala
            </button>
            <button type="button" className="btn" data-on={highlight === "chord" ? "1" : "0"} onClick={() => setHighlight("chord")}>
              Sointu
            </button>
            {LABELS.map((item) => (
              <button type="button" key={item.id} className="btn" data-on={labelMode === item.id ? "1" : "0"} onClick={() => setLabelMode(item.id)}>
                {item.label}
              </button>
            ))}
            <button type="button" className="btn" onClick={onSettings}>
              Vire ja nauhat
            </button>
          </div>
          <div className="legend">
            <span>
              <i className="swatch-root" /> Juuri
            </span>
            <span>
              <i className="swatch-tone" /> Skaalassa
            </span>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Oktaavit">
            {([0, 1, 2, 3] as const).map((n) => (
              <button type="button" key={n} className="btn" data-on={octaves === n ? "1" : "0"} onClick={() => setOctaves(n)}>
                {n === 0 ? "Koko kaula" : `${n} okt.`}
              </button>
            ))}
          </div>
          {octaves > 0 ? (
            <div className="row-scroll" aria-label="Alueen alku">
              {[0, 3, 5, 7, 9, 12, 15].map((fret) => (
                <button type="button" key={fret} className="choice" data-on={positionFret === fret ? "1" : "0"} onClick={() => setPositionFret(fret)}>
                  {fret === 0 ? "Avoin" : `${fret}. nauha`}
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div>
          <p className="text-sm text-muted">Fraseesi · napauta nuottia poistaaksesi</p>
          {sequence.length === 0 ? (
            <p className="panel mt-2 text-sm text-muted">Ei vielä nuotteja. Kaksi eri säveltä riittää alkuun.</p>
          ) : (
            <div className="row-scroll mt-2">
              {sequence.map((n, i) => (
                <button
                  type="button"
                  key={n.id}
                  className="seq-chip"
                  onClick={() => removeSequence(n.id)}
                  aria-label={`Poista ${noteName(n.pc, finnishNames)}`}
                >
                  <span>{i + 1}</span>
                  {noteName(n.pc, finnishNames)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {phrase && active && activeScale ? (
        <div className="verdict">
          <p className="kicker">{confidence(active, unique.length)}</p>
          <h2 className="title mt-1">
            {noteName(active.root, finnishNames)} {activeScale.name}
          </h2>
          <p className="formula">{activeScale.formula}</p>
          <p className="mt-2 text-sm">
            {active.contained
              ? "Nämä nuotit menevät tähän skaalaan."
              : `Lähin osuma. Ulkona: ${active.outside.map((pc) => noteName(pc, finnishNames)).join(", ")}.`}
          </p>
          {line ? (
            <p className="mt-2 text-sm">
              <span className="text-muted">Järjestys </span>
              {line.notes}
              <span className="text-muted"> · asteet </span>
              <span className="formula">{line.degrees}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <Fretboard
        tuning={tuning}
        fretCount={fretCount}
        leftHanded={leftHanded}
        finnish={finnishNames}
        focusFret={phrase || octaves === 0 ? 0 : positionFret}
        marker={marker}
        onPlay={(stringIndex, fret, midi) => {
          pluck(midi);
          if (!phrase) return;
          setPicked(null);
          addSequence({ pc: midi % 12, midi, stringIndex, fret });
        }}
      />

      {phrase ? <InputPicker hot={listening} /> : null}
      {phrase && micErrorText(error) ? <p className="text-sm text-primary">{micErrorText(error)}</p> : null}
      {phrase && listening ? (
        <div>
          <div className="cents-track" aria-label="Äänitaso">
            <span className="level-fill" style={{ width: `${Math.round(level * 100)}%` }} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {deviceLabel ? deviceLabel : "Äänitulo"}
            {level < 0.04 ? " · hiljainen. Nosta USB-kortin lähtöä, jos kitara ei kuulu." : ""}
          </p>
        </div>
      ) : null}
      {phrase && listening ? (
        <p className="text-sm text-muted">
          {heard
            ? `Kuultu ${noteName(heard.pc, finnishNames)} · ${heard.cents > 0 ? "+" : ""}${heard.cents} senttiä. Yksi sävel kerrallaan.`
            : "Soita yksi nuotti kerrallaan."}
        </p>
      ) : null}

      {phrase && unique.length < 2 ? (
        <p className="text-sm text-muted">
          {unique.length === 0
            ? "Napauta nauhoja järjestyksessä. Numerot jäävät kaulaan."
            : "Sama sävel ei vielä rajaa skaalaa. Soita toinen, eri nuotti."}
        </p>
      ) : null}

      {phrase && active && activeScale ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted">{activeScale.hint}</p>
          <button type="button" className="btn btn-accent" onClick={() => applyMatch(active.scaleId, active.root)}>
            Näytä koko skaala
          </button>
        </div>
      ) : null}

      {phrase && matches.length > 1 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">Muut skaalat, joihin nuotit mahtuvat</p>
          {matches.slice(1, 6).map((m) => {
            const item = scaleById(m.scaleId);
            const same = pitchSetKey(item, m.root) === topKey;
            const on = active?.scaleId === m.scaleId && active.root === m.root;
            return (
              <button
                type="button"
                key={`${m.scaleId}-${m.root}`}
                className="card-btn"
                data-on={on ? "1" : "0"}
                onClick={() => setPicked(`${m.scaleId}:${m.root}`)}
              >
                <span className="font-display text-xl uppercase tracking-wide">
                  {noteName(m.root, finnishNames)} {item.name}
                </span>
                <span className="mt-1 block text-sm text-muted">
                  {m.contained ? (m.exact ? "Täysi skaala" : "Kaikki nuotit sisällä") : `Ulkona ${m.outside.map((pc) => noteName(pc, finnishNames)).join(", ")}`}
                  {same ? " · sama sävelistö, eri juuri" : ""}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <p className="text-sm text-muted">
        {phrase
          ? "Otelauta näyttää parhaan osuman. Numerot ovat soittamasi järjestys. Mikrofoni kuulee yhden sävelen kerrallaan."
          : "Napauta nauhaa, niin se soi. Rajaa oktaavit, jos haluat nähdä vain soittoalueen."}
      </p>
    </div>
  );
}
