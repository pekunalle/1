import { useEffect, useState } from "react";
import { useKitara } from "@/lib/store";

export function InputPicker({ hot }: { hot: boolean }) {
  const inputId = useKitara((s) => s.inputId);
  const setInputId = useKitara((s) => s.setInputId);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const list = await navigator.mediaDevices.enumerateDevices();
      if (!cancel) setDevices(list.filter((d) => d.kind === "audioinput"));
    };
    void load();
    navigator.mediaDevices?.addEventListener("devicechange", load);
    return () => {
      cancel = true;
      navigator.mediaDevices?.removeEventListener("devicechange", load);
    };
  }, [hot]);

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted">Äänitulo</span>
      <select className="field" value={inputId} aria-label="Äänitulo" onChange={(e) => setInputId(e.target.value)}>
        <option value="">Puhelimen oletus</option>
        {devices.map((d, i) => (
          <option key={d.deviceId || i} value={d.deviceId}>
            {d.label || `Tulo ${i + 1}`}
          </option>
        ))}
      </select>
      <span className="text-muted">USB-kortti, esimerkiksi M-Vave Blackbox, näkyy usein nimellä USB Audio. Valitse se tästä. Kaiunpoisto on pois, jotta kitara ei vaimene.</span>
    </label>
  );
}
