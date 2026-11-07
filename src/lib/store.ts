import { create } from "zustand";
import { chordById } from "./music/chords";
import { scaleById } from "./music/scales";
import type { LabelMode } from "./music/theory";
import { pcOf } from "./music/theory";
import { tuningById } from "./music/tunings";

export type TabId = "board" | "scales" | "chords" | "detect" | "listen" | "practice" | "guide";

export type SeqNote = {
  id: string;
  pc: number;
  midi: number;
  stringIndex?: number;
  fret?: number;
};

export type FretCount = 12 | 15 | 17 | 22 | 24;

type KitaraState = {
  tab: TabId;
  tuningId: string;
  root: number;
  scaleId: string;
  chordId: string;
  highlight: "scale" | "chord";
  labelMode: LabelMode;
  fretCount: FretCount;
  leftHanded: boolean;
  finnishNames: boolean;
  sequence: SeqNote[];
  done: string[];
  bpm: number;
  beats: number;
  huntBest: number;
  octaves: 0 | 1 | 2 | 3;
  positionFret: number;
  inputId: string;
  setTab: (tab: TabId) => void;
  setTuningId: (id: string) => void;
  setRoot: (root: number) => void;
  setScaleId: (id: string) => void;
  setChordId: (id: string) => void;
  setHighlight: (highlight: "scale" | "chord") => void;
  setLabelMode: (mode: LabelMode) => void;
  setFretCount: (n: FretCount) => void;
  setLeftHanded: (v: boolean) => void;
  setFinnishNames: (v: boolean) => void;
  addSequence: (note: Omit<SeqNote, "id">) => void;
  removeSequence: (id: string) => void;
  clearSequence: () => void;
  loadSequence: (notes: Omit<SeqNote, "id">[]) => void;
  toggleDone: (id: string) => void;
  setBpm: (n: number) => void;
  setBeats: (n: number) => void;
  setHuntBest: (n: number) => void;
  setOctaves: (n: 0 | 1 | 2 | 3) => void;
  setPositionFret: (n: number) => void;
  setInputId: (id: string) => void;
  applyMatch: (scaleId: string, root: number) => void;
};

const FRET_OK: FretCount[] = [12, 15, 17, 22, 24];
const KEY = "kitara-reeni-otelauta";

let lastSeq: { pc: number; at: number } = { pc: -1, at: 0 };

export const useKitara = create<KitaraState>((set) => ({
  tab: "board",
  tuningId: "standard",
  root: 4,
  scaleId: "phrygian",
  chordId: "power",
  highlight: "scale",
  labelMode: "note",
  fretCount: 15,
  leftHanded: false,
  finnishNames: false,
  sequence: [],
  done: [],
  bpm: 80,
  beats: 4,
  huntBest: 0,
  octaves: 0,
  positionFret: 0,
  inputId: "",
  setTab: (tab) => set({ tab }),
  setTuningId: (tuningId) => set({ tuningId }),
  setRoot: (root) => set({ root: pcOf(root) }),
  setScaleId: (scaleId) => set({ scaleId, highlight: "scale" }),
  setChordId: (chordId) => set({ chordId, highlight: "chord" }),
  setHighlight: (highlight) => set({ highlight }),
  setLabelMode: (labelMode) => set({ labelMode }),
  setFretCount: (fretCount) => set({ fretCount }),
  setLeftHanded: (leftHanded) => set({ leftHanded }),
  setFinnishNames: (finnishNames) => set({ finnishNames }),
  addSequence: (note) =>
    set((s) => {
      const pc = pcOf(note.pc);
      const now = Date.now();
      if (lastSeq.pc === pc && now - lastSeq.at < 420) return s;
      lastSeq = { pc, at: now };
      return {
        sequence: [...s.sequence, { ...note, pc, id: `${now.toString(36)}-${s.sequence.length}` }].slice(-16),
      };
    }),
  removeSequence: (id) => set((s) => ({ sequence: s.sequence.filter((n) => n.id !== id) })),
  clearSequence: () => set({ sequence: [] }),
  loadSequence: (notes) =>
    set({
      sequence: notes.slice(0, 16).map((n, i) => ({ ...n, pc: pcOf(n.pc), id: `ex-${i}` })),
    }),
  toggleDone: (id) =>
    set((s) => ({
      done: s.done.includes(id) ? s.done.filter((x) => x !== id) : [...s.done, id],
    })),
  setBpm: (bpm) => set({ bpm: Math.max(40, Math.min(220, Math.round(bpm))) }),
  setBeats: (beats) => set({ beats }),
  setHuntBest: (huntBest) => set({ huntBest }),
  setOctaves: (octaves) => set({ octaves }),
  setPositionFret: (n) => set({ positionFret: Math.max(0, Math.min(19, Math.round(n))) }),
  setInputId: (inputId) => set({ inputId }),
  applyMatch: (scaleId, root) => set({ scaleId, root: pcOf(root), highlight: "scale", tab: "board" }),
}));

type Persisted = {
  tab: TabId;
  tuningId: string;
  root: number;
  scaleId: string;
  chordId: string;
  highlight: "scale" | "chord";
  labelMode: LabelMode;
  fretCount: FretCount;
  leftHanded: boolean;
  finnishNames: boolean;
  sequence: SeqNote[];
  done: string[];
  bpm: number;
  beats: number;
  huntBest: number;
  octaves: 0 | 1 | 2 | 3;
  positionFret: number;
  inputId: string;
};

function snapshot(s: KitaraState): Persisted {
  return {
    tab: s.tab,
    tuningId: s.tuningId,
    root: s.root,
    scaleId: s.scaleId,
    chordId: s.chordId,
    highlight: s.highlight,
    labelMode: s.labelMode,
    fretCount: s.fretCount,
    leftHanded: s.leftHanded,
    finnishNames: s.finnishNames,
    sequence: s.sequence,
    done: s.done,
    bpm: s.bpm,
    beats: s.beats,
    huntBest: s.huntBest,
    octaves: s.octaves,
    positionFret: s.positionFret,
    inputId: s.inputId,
  };
}

let hydrated = false;

export function hydrateKitara(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw) as Partial<Persisted>;
      const tabs: TabId[] = ["board", "scales", "chords", "detect", "listen", "practice", "guide"];
      useKitara.setState({
        tab: data.tab && tabs.includes(data.tab) ? data.tab : "board",
        tuningId: data.tuningId && tuningById(data.tuningId).id === data.tuningId ? data.tuningId : "standard",
        root: typeof data.root === "number" ? pcOf(data.root) : 4,
        scaleId: data.scaleId && scaleById(data.scaleId).id === data.scaleId ? data.scaleId : "phrygian",
        chordId: data.chordId && chordById(data.chordId).id === data.chordId ? data.chordId : "power",
        highlight: data.highlight === "chord" ? "chord" : "scale",
        labelMode: data.labelMode === "degree" || data.labelMode === "interval" ? data.labelMode : "note",
        fretCount: data.fretCount && FRET_OK.includes(data.fretCount) ? data.fretCount : 15,
        leftHanded: Boolean(data.leftHanded),
        finnishNames: Boolean(data.finnishNames),
        sequence: Array.isArray(data.sequence) ? data.sequence.slice(0, 16) : [],
        done: Array.isArray(data.done) ? data.done.filter((x) => typeof x === "string") : [],
        bpm: typeof data.bpm === "number" ? data.bpm : 80,
        beats: typeof data.beats === "number" ? data.beats : 4,
        huntBest: typeof data.huntBest === "number" ? data.huntBest : 0,
        octaves: data.octaves === 1 || data.octaves === 2 || data.octaves === 3 ? data.octaves : 0,
        positionFret: typeof data.positionFret === "number" ? Math.max(0, Math.min(19, data.positionFret)) : 0,
        inputId: typeof data.inputId === "string" ? data.inputId : "",
      });
    }
  } catch {
    /* ignore broken storage */
  }
  useKitara.subscribe((s) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(snapshot(s)));
    } catch {
      /* ignore quota */
    }
  });
}
