import { LabHeader, Section, Concept, Cmd } from "./LabShell";
import { AlertTriangle } from "lucide-react";
import { useCapture } from "@/state/CaptureContext";

export function Lab5() {
  const { transfers } = useCapture();
  // Surface control transfers as replay candidates (read-only preview here).
  const controls = transfers.filter((t) => t.setup);

  return (
    <div>
      <LabHeader
        num="5"
        title="Replay & intro to fuzzing"
        intro="Once you can read a protocol, you can speak it. Replaying reconstructed control transfers confirms your understanding; mutating them is the seed of fuzzing. This lab is analysis + generated code you run yourself — nothing is sent from the browser."
      />

      <div className="mb-6 flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
        <div className="text-sm text-amber-200">
          <strong>Safety first.</strong> Replaying or fuzzing writes real data to
          a real device. Use only a device you own and are willing to brick.
          Never fuzz storage with data you care about. The dashboard never sends
          anything — you run the generated Python explicitly.
        </div>
      </div>

      <Section title="Replay candidates from your capture">
        <Concept>
          These are the control requests in the current capture. Each maps
          directly to a <code>pyusb</code> <code>ctrl_transfer()</code> call.
        </Concept>
        <div className="overflow-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-500">
              <tr>
                <th className="px-2 py-1.5">#</th>
                <th className="px-2 py-1.5">Request</th>
                <th className="px-2 py-1.5">pyusb call</th>
              </tr>
            </thead>
            <tbody>
              {controls.map((t) => {
                const f = t.setup!.fields;
                const call = `dev.ctrl_transfer(${f[0].raw}, ${f[1].raw}, ${f[2].raw}, ${f[3].raw}, ${f[4].raw})`;
                return (
                  <tr key={t.id} className="border-t border-slate-800/50">
                    <td className="px-2 py-1 font-mono text-slate-500">{t.id}</td>
                    <td className="px-2 py-1 text-slate-200">{t.setup!.summary}</td>
                    <td className="px-2 py-1 font-mono text-emerald-300">{call}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Replay script (pyusb)">
        <Cmd>{`# pip install pyusb   (or: nix develop provides it)
import usb.core, usb.util

dev = usb.core.find(idVendor=0x1d83, idProduct=0x0001)
if dev is None:
    raise SystemExit("device not found")
dev.set_configuration()

# replay a reconstructed vendor command (bmRequestType, bRequest, wValue, wIndex, data|wLength)
dev.ctrl_transfer(0x40, 0x01, 0x0001, 0, None)`}</Cmd>
      </Section>

      <Section title="Minimal mutator (fuzzing seed)">
        <Concept>
          Fuzzing = replay with mutated fields while watching for crashes or
          anomalous responses. Start narrow: vary one field over a small range,
          log responses, and reset the device between iterations.
        </Concept>
        <Cmd>{`import itertools, time
for wValue in range(0x00, 0x10):        # sweep one parameter
    try:
        r = dev.ctrl_transfer(0x40, 0x01, wValue, 0, None)
        print(f"wValue={wValue:#04x} -> ok")
    except usb.core.USBError as e:
        print(f"wValue={wValue:#04x} -> {e}")   # anomalies worth investigating
    time.sleep(0.1)`}</Cmd>
      </Section>
    </div>
  );
}
