import { LabHeader, Section, Concept } from "./LabShell";
import { DiffView } from "@/components/DiffView";
import { Card } from "@/components/ui";

export function Lab4() {
  return (
    <div>
      <LabHeader
        num="4"
        title="RE workflow: diffing & reconstructing a protocol"
        intro="Vendor-specific devices have no public spec. The reverse engineer's core loop: perform one action, capture it, change one thing, capture again, and diff. The bytes that change encode the thing you changed."
      />

      <Section title="Diff two captures">
        <Concept>
          The bundled <strong>Vendor LED (red)</strong> and{" "}
          <strong>(blue)</strong> samples are the same device performing almost
          the same actions. Rows that differ are highlighted — notice the
          control request whose <code>wValue</code> changes with color. That's
          the command you just reversed.
        </Concept>
        <Card>
          <DiffView />
        </Card>
      </Section>

      <Section title="The reversing loop">
        <Concept>
          <strong>1.</strong> Baseline capture (device idle).{" "}
          <strong>2.</strong> Perform exactly one action, capture.{" "}
          <strong>3.</strong> Diff against baseline to isolate the transfer.{" "}
          <strong>4.</strong> Vary one parameter (e.g. intensity), capture, diff
          again to map <em>which byte = which field</em>. <strong>5.</strong>{" "}
          Build a command table. Constant fields are structure; variable fields
          are parameters.
        </Concept>
      </Section>
    </div>
  );
}
