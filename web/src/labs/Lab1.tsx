import { LabHeader, Section, Concept } from "./LabShell";
import { EnumerationSequence } from "@/components/EnumerationSequence";
import { DescriptorTree } from "@/components/DescriptorTree";
import { TransferDetail } from "@/components/TransferDetail";
import { Card } from "@/components/ui";

export function Lab1() {
  return (
    <div>
      <LabHeader
        num="1"
        title="Enumeration & descriptors"
        intro="When a device is plugged in, the host interrogates it through a fixed handshake and reads its descriptors. This is where a device tells the world what it is — and the first thing you decode when reversing one."
      />

      <Section title="The enumeration handshake">
        <Concept>
          The host uses <strong>control transfers on endpoint 0</strong> to:
          read the device descriptor, assign an address (<code>SET_ADDRESS</code>
          ), read the full descriptor set, then pick a configuration (
          <code>SET_CONFIGURATION</code>). Click any step to inspect its raw
          bytes.
        </Concept>
        <Card>
          <EnumerationSequence />
        </Card>
      </Section>

      <Section title="Descriptor tree">
        <Concept>
          A <strong>configuration</strong> contains{" "}
          <strong>interfaces</strong>, each containing{" "}
          <strong>endpoints</strong>. The class/subclass/protocol triple on an
          interface tells you what kind of device it is (HID, Mass Storage, …).
          Every field is decoded with its byte offset.
        </Concept>
        <Card>
          <DescriptorTree />
        </Card>
      </Section>

      <Section title="Raw bytes of the selected request">
        <Card>
          <TransferDetail />
        </Card>
      </Section>
    </div>
  );
}
