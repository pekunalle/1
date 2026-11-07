import { useEffect, useState } from "react";
import { BookOpen, Drum, Guitar, ListMusic, Mic, Music2, ScanSearch, Settings2 } from "lucide-react";
import { BoardView } from "@/components/BoardView";
import { GuideView } from "@/components/GuideView";
import { ChordLibrary, ScaleLibrary } from "@/components/LibraryView";
import { ListenView } from "@/components/ListenView";
import { PracticeView } from "@/components/PracticeView";
import { SettingsSheet } from "@/components/SettingsSheet";
import { hydrateKitara, useKitara, type TabId } from "@/lib/store";

const NAV: { id: TabId; label: string; icon: typeof Guitar }[] = [
  { id: "board", label: "Ote", icon: Guitar },
  { id: "scales", label: "Skaalat", icon: ListMusic },
  { id: "chords", label: "Soinnut", icon: Music2 },
  { id: "detect", label: "Frase", icon: ScanSearch },
  { id: "listen", label: "Kuuntelu", icon: Mic },
  { id: "practice", label: "Reeni", icon: Drum },
];

export function Shell() {
  const tab = useKitara((s) => s.tab);
  const setTab = useKitara((s) => s.setTab);
  const [settings, setSettings] = useState(false);

  useEffect(() => {
    hydrateKitara();
  }, []);

  return (
    <div className="app-shell">
      <header className="header">
        <div className="brand">
          <span className="jewel" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-display text-xl uppercase leading-none tracking-wide sm:text-2xl">Skaalalauta</p>
            <p className="text-xs text-muted">Skaalat ja otelauta</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" className="icon-btn" data-on={tab === "guide" ? "1" : "0"} aria-label="Opas" onClick={() => setTab(tab === "guide" ? "board" : "guide")}>
            <BookOpen size={20} />
          </button>
          <button type="button" className="icon-btn" aria-label="Säädöt" onClick={() => setSettings(true)}>
            <Settings2 size={20} />
          </button>
        </div>
      </header>
      <main className="app-main">
        {tab === "board" || tab === "detect" ? <BoardView onSettings={() => setSettings(true)} /> : null}
        {tab === "scales" ? <ScaleLibrary /> : null}
        {tab === "chords" ? <ChordLibrary /> : null}
        {tab === "listen" ? <ListenView /> : null}
        {tab === "practice" ? <PracticeView /> : null}
        {tab === "guide" ? <GuideView /> : null}
      </main>
      <nav className="nav" aria-label="Päänavigaatio">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <button type="button" key={item.id} className="nav-btn" data-on={tab === item.id ? "1" : "0"} onClick={() => setTab(item.id)}>
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
    </div>
  );
}
