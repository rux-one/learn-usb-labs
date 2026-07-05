import { LabHeader, Section, Concept, Cmd } from "./LabShell";
import { CaptureLoader } from "@/components/CaptureLoader";
import { PacketList } from "@/components/PacketList";
import { TransferDetail } from "@/components/TransferDetail";
import { Card } from "@/components/ui";

export function Lab0() {
  return (
    <div>
      <LabHeader
        num="0"
        title="Setup & first capture"
        intro="Get usbmon capturing, load a capture into the dashboard, and learn to read the raw packet list and hex view. Everything else builds on this."
      />

      <Section title="What is usbmon?">
        <Concept>
          <strong>usbmon</strong> is a Linux kernel facility that taps every URB
          (USB Request Block) flowing between the host controller and devices.
          Each USB bus gets a virtual capture interface (<code>usbmon1</code>,{" "}
          <code>usbmon2</code>, …). <strong>tshark</strong> (Wireshark's CLI)
          records these into a <code>.pcapng</code> file.
        </Concept>
      </Section>

      <Section title="Capture some traffic">
        <Cmd>{`# load the kernel module (once per boot)
sudo modprobe usbmon

# see which interfaces exist
tshark -D | grep usbmon

# capture bus 1 for 10 seconds, then interact with a device
./scripts/capture.sh -b 1 -d 10 -o first-capture`}</Cmd>
        <Concept>
          Not sure which bus your device is on? Run <code>lsusb</code> — the
          "Bus 001" number maps to <code>usbmon1</code>. Bus <code>0</code>{" "}
          captures all buses at once.
        </Concept>
      </Section>

      <Section title="Load a capture">
        <Card>
          <CaptureLoader />
        </Card>
      </Section>

      <Section title="Packet list">
        <Concept>
          Rows here are <strong>logical transfers</strong> — the dashboard pairs
          each SUBMIT with its COMPLETE so you see one line per request instead
          of two. Click a row to decode it on the right.
        </Concept>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="max-h-[480px] overflow-auto">
            <PacketList />
          </div>
          <Card title="Selected transfer">
            <TransferDetail />
          </Card>
        </div>
      </Section>
    </div>
  );
}
