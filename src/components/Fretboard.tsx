import { memo, useEffect, useRef } from "react";
import type { CellMark } from "@/lib/music/marks";
import { midiOf, noteName } from "@/lib/music/theory";
import type { Tuning } from "@/lib/music/tunings";

const SINGLE = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
const DOUBLE = new Set([12, 24]);

type Props = {
  tuning: Tuning;
  fretCount: number;
  leftHanded: boolean;
  finnish?: boolean;
  marker: (stringIndex: number, fret: number) => CellMark;
  onPlay: (stringIndex: number, fret: number, midi: number) => void;
  focusFret?: number;
};

function MarkerDot({ mark }: { mark: CellMark }) {
  if (mark.kind === "empty") return null;
  return (
    <span className={`mark mark-${mark.kind}`} data-long={mark.label.length > 2 ? "1" : "0"}>
      {mark.label}
    </span>
  );
}

export const Fretboard = memo(function Fretboard({ tuning, fretCount, leftHanded, finnish = false, marker, onPlay, focusFret = 0 }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const frets = Array.from({ length: fretCount }, (_, i) => i + 1);
  const fretOrder = leftHanded ? [...frets].reverse() : frets;
  const rows = tuning.midi.map((open, stringIndex) => ({ open, stringIndex })).reverse();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const snap = () => {
      if (!leftHanded && focusFret > 0) {
        const cell = el.querySelectorAll(".fret-cell")[focusFret - 1] as HTMLElement | undefined;
        if (cell) {
          el.scrollLeft = Math.max(0, cell.offsetLeft - 12);
          return;
        }
      }
      el.scrollLeft = leftHanded ? el.scrollWidth : 0;
    };
    snap();
    const id = requestAnimationFrame(snap);
    return () => cancelAnimationFrame(id);
  }, [leftHanded, fretCount, tuning.id, focusFret]);

  const nut = (stringIndex: number) => {
    const mark = marker(stringIndex, 0);
    const midi = midiOf(tuning.midi[stringIndex], 0);
    return (
      <button type="button" className="nut-cell" aria-label={mark.aria} onClick={() => onPlay(stringIndex, 0, midi)}>
        <MarkerDot mark={mark} />
      </button>
    );
  };

  return (
    <div className="neck-frame" data-left={leftHanded ? "1" : "0"}>
      <div className="string-gutter" aria-hidden="true">
        {rows.map(({ open, stringIndex }) => (
          <div className="string-label" key={stringIndex}>
            {noteName(open, finnish)}
          </div>
        ))}
      </div>
      <div className="neck-scroll" ref={scrollRef}>
      <div className="neck">
        <div className="inlay-layer" aria-hidden="true">
          {leftHanded ? null : <div className="nut-spacer" />}
          {fretOrder.map((fret) => (
            <div className="inlay-cell" key={fret}>
              {SINGLE.has(fret) ? <i className="dot" /> : null}
              {DOUBLE.has(fret) ? (
                <>
                  <i className="dot dot-a" />
                  <i className="dot dot-b" />
                </>
              ) : null}
            </div>
          ))}
          {leftHanded ? <div className="nut-spacer" /> : null}
        </div>
        {rows.map(({ stringIndex }) => (
          <div className="string-row" data-gauge={String(stringIndex)} key={stringIndex}>
            {leftHanded ? null : nut(stringIndex)}
            {fretOrder.map((fret) => {
              const mark = marker(stringIndex, fret);
              const midi = midiOf(tuning.midi[stringIndex], fret);
              return (
                <button
                  type="button"
                  key={fret}
                  className="fret-cell"
                  data-fret={fret}
                  aria-label={mark.aria}
                  onClick={() => onPlay(stringIndex, fret, midi)}
                >
                  <MarkerDot mark={mark} />
                </button>
              );
            })}
            {leftHanded ? nut(stringIndex) : null}
          </div>
        ))}
      </div>
      <div className="fret-nums" aria-hidden="true">
        {leftHanded ? null : <div className="nut-spacer" />}
        {fretOrder.map((fret) => (
          <div className="fret-num" data-mark={SINGLE.has(fret) || DOUBLE.has(fret) ? "1" : "0"} key={fret}>
            {fret}
          </div>
        ))}
        {leftHanded ? <div className="nut-spacer" /> : null}
      </div>
      </div>
    </div>
  );
});
