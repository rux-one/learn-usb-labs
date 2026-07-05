import { LabHeader, Section, Concept } from "./LabShell";
import { TransferTimeline } from "@/components/TransferTimeline";
import { PacketList } from "@/components/PacketList";
import { Card } from "@/components/ui";

export function Lab2() {
  return (
    <div>
      <LabHeader
        num="2"
        title="Transfer types & packet structure"
        intro="USB moves data with four transfer types, each suited to a purpose. Learn to recognize them on a timeline and to break a control transfer into its SETUP / DATA / STATUS stages."
      />

      <Section title="The four transfer types">
        <Concept>
          <strong>Control</strong> (setup/config, EP0),{" "}
          <strong>Bulk</strong> (large reliable transfers — storage),{" "}
          <strong>Interrupt</strong> (small, periodic, low-latency — keyboards),
          and <strong>Isochronous</strong> (streaming with guaranteed
          bandwidth, no retries — audio/video). Endpoints are one-directional;
          an address's high bit marks IN vs OUT.
        </Concept>
      </Section>

      <Section title="Timeline (by endpoint lane)">
        <Concept>
          Each lane is one endpoint/direction. Blocks are colored by transfer
          type and placed by time. Click a control block to see its stage
          breakdown below the timeline.
        </Concept>
        <Card>
          <TransferTimeline />
        </Card>
      </Section>

      <Section title="All transfers">
        <div className="max-h-[420px] overflow-auto">
          <PacketList />
        </div>
      </Section>
    </div>
  );
}
