import type { Tuning } from "./tunings";
import { labelFor, midiOf, noteName, pcOf, spellFromFormula, type LabelMode } from "./theory";

export type MarkKind = "root" | "tone" | "heard" | "target" | "seq" | "open" | "empty";

export type CellMark = {
  kind: MarkKind;
  label: string;
  aria: string;
};

export type SeqPoint = {
  pc: number;
  midi: number;
  stringIndex?: number;
  fret?: number;
};

export type MarkerInput = {
  tuning: Tuning;
  fretCount: number;
  root: number;
  finnish: boolean;
  labelMode: LabelMode;
  formula: string;
  tones: number[] | null;
  sequence: SeqPoint[];
  heardMidi: number | null;
  target: { stringIndex: number; fret: number } | null;
  /** 0 = whole neck. 1–3 limit the lit area to a playable span. */
  octaves?: 0 | 1 | 2 | 3;
  positionFret?: number;
};

function canonicalSlot(pc: number, tuning: Tuning, fretCount: number): string | null {
  let bestS = -1;
  let bestF = 99;
  const limit = Math.min(12, fretCount);
  for (let s = 0; s < tuning.midi.length; s++) {
    const open = tuning.midi[s];
    for (let f = 0; f <= limit; f++) {
      if (pcOf(open + f) !== pc) continue;
      if (f < bestF || (f === bestF && s < bestS)) {
        bestS = s;
        bestF = f;
      }
    }
  }
  return bestS >= 0 ? `${bestS}:${bestF}` : null;
}

export function inPlayZone(fret: number, octaves: 0 | 1 | 2 | 3, positionFret: number): boolean {
  if (octaves === 0) return true;
  const start = Math.max(0, positionFret);
  const width = octaves === 1 ? 5 : octaves === 2 ? 12 : 17;
  return fret >= start && fret < start + width;
}

export function makeMarker(input: MarkerInput): (stringIndex: number, fret: number) => CellMark {
  const spell = spellFromFormula(input.formula);
  const toneSet = input.tones ? new Set(input.tones.map((i) => pcOf(input.root + i))) : null;
  const positional = new Map<string, number>();
  const placedPcs = new Set<number>();
  input.sequence.forEach((n, i) => {
    if (n.stringIndex == null || n.fret == null) return;
    positional.set(`${n.stringIndex}:${n.fret}`, i + 1);
    placedPcs.add(pcOf(n.pc));
  });
  const floating = new Map<string, number>();
  input.sequence.forEach((n, i) => {
    const pc = pcOf(n.pc);
    if (placedPcs.has(pc)) return;
    const slot = canonicalSlot(pc, input.tuning, input.fretCount);
    if (!slot || floating.has(slot)) return;
    floating.set(slot, i + 1);
  });

  const zone = (fret: number) => inPlayZone(fret, input.octaves ?? 0, input.positionFret ?? 0);

  return (stringIndex: number, fret: number): CellMark => {
    const open = input.tuning.midi[stringIndex];
    const midi = midiOf(open, fret);
    const pc = pcOf(midi);
    const key = `${stringIndex}:${fret}`;
    const name = noteName(pc, input.finnish);
    const place = fret === 0 ? "avoin" : `${fret}. nauha`;
    const stringName = `${noteName(open, input.finnish)}-kieli`;
    const base = `${stringName}, ${place}, ${name}`;
    const inTone = Boolean(toneSet?.has(pc)) && zone(fret);
    const isRoot = inTone && pc === pcOf(input.root);
    const order = positional.get(key) ?? floating.get(key);
    const isTarget = input.target?.stringIndex === stringIndex && input.target.fret === fret;
    const isHeard = input.heardMidi != null && midi === input.heardMidi;

    if (isTarget) {
      return { kind: "target", label: labelFor(pc, input.root, input.labelMode, input.finnish, spell), aria: `${base}, jahti` };
    }
    if (order) {
      return { kind: "seq", label: String(order), aria: `${base}, fraseen nuotti ${order}` };
    }
    if (isHeard) return { kind: "heard", label: name, aria: `${base}, kuultu` };
    if (isRoot) {
      return { kind: "root", label: labelFor(pc, input.root, input.labelMode, input.finnish, spell), aria: `${base}, juuri` };
    }
    if (inTone) {
      return { kind: "tone", label: labelFor(pc, input.root, input.labelMode, input.finnish, spell), aria: `${base}, skaalassa` };
    }
    if (fret === 0) return { kind: "open", label: name, aria: base };
    return { kind: "empty", label: "", aria: base };
  };
}
