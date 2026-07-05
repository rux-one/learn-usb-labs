import { LabHeader, Section, Concept } from "./LabShell";
import { HidReportView } from "@/components/HidReportView";
import { Card } from "@/components/ui";

export function Lab3() {
  return (
    <div>
      <LabHeader
        num="3"
        title="Decoding class traffic (HID)"
        intro="Raw bytes only mean something once you know the spec. HID is a great first class to decode: keyboards and mice send tiny fixed-layout reports over an interrupt-IN endpoint."
      />

      <Section title="From bytes to meaning">
        <Concept>
          A boot-protocol <strong>keyboard</strong> report is 8 bytes: byte 0 is
          a modifier bitmap (Ctrl/Shift/…), byte 1 is reserved, bytes 2–7 are
          currently-pressed key codes. A <strong>mouse</strong> report is
          buttons + signed dX/dY (+ wheel). This same "spec tells you the
          layout" idea is exactly what you rebuild for vendor devices in Lab 4.
        </Concept>
        <Card>
          <HidReportView />
        </Card>
      </Section>

      <Section title="Try it with a real device">
        <Concept>
          Capture <code>usbmon</code> on the bus your keyboard/mouse is on, type
          a few keys, load the capture, and watch the key codes appear. Full
          (non-boot) HID uses a <em>report descriptor</em> to define the layout —
          a natural next step once boot protocol clicks.
        </Concept>
      </Section>
    </div>
  );
}
