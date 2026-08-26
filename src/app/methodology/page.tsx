import Link from "next/link";

export const metadata = {
  title: "Methodology — Archive Lens",
};

/**
 * In-app summary of the historical methodology. The full document lives at
 * docs/METHODOLOGY.md in the repository.
 */
export default function MethodologyPage() {
  return (
    <div className="doc-serif mx-auto max-w-2xl space-y-5 text-[15px] leading-relaxed">
      <h1 className="text-2xl font-semibold">How Archive Lens handles evidence</h1>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Primary-source classification</h2>
        <p>
          Every result is classified by how it stands to the events it
          records: <strong>contemporaneous</strong> (written at the time),{" "}
          <strong>retrospective firsthand</strong> (an eyewitness writing
          later), <strong>official record</strong>,{" "}
          <strong>public argument</strong> (made to persuade),{" "}
          <strong>visual source</strong>,{" "}
          <strong>index or finding aid</strong>, or{" "}
          <strong>secondary context</strong> — which is never mixed into
          primary results without its label. Each classification shows its
          confidence and the metadata signals behind it, and the three dates
          that matter — event, creation, later publication — are kept
          distinct.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Geography is not allegiance</h2>
        <p>
          The Perspective Lens weights sources by the region and community
          that produced them. It never assigns loyalty from location: a
          Kentucky letter may be Unionist, secessionist, or torn; a Northern
          editorial may despise abolition. Political alignment is used only
          when documented, and institutional records <em>about</em> enslaved
          people are marked &ldquo;about, not by&rdquo; — never boosted as
          the voice of the people they describe.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Against invented history</h2>
        <p>
          The Worldview panel is a cited synthesis, not role-play: every claim
          links to retrieved records, generalizations require at least two
          independent sources, nothing generated is placed inside quotation
          marks, and the panel respects an information horizon — what could
          not yet be known is not claimed. Where evidence is thin,
          unrepresentative, or contradictory, the panel says so. Established
          facts do not change with the lens; documented falsehoods are
          described as beliefs or propaganda, never as alternative facts.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Quotation and citation rules</h2>
        <p>
          Exact quotations come only from document transcripts, shown beside
          the scan where one exists, with OCR uncertainty flagged and never
          silently repaired. Citations are constructed from verified archive
          metadata; missing fields are left missing. Offensive historical
          language in sources is preserved exactly, behind a content notice,
          and never repeated in the application&apos;s own voice.
        </p>
      </section>
      <p className="text-sm text-ink-soft">
        The complete methodology, including classification rules and
        safeguards, is in{" "}
        <code className="font-mono text-xs">docs/METHODOLOGY.md</code> in the
        repository. Questions about a specific record? Open its workspace —
        the analysis tab separates archive metadata from application
        inference. <Link href="/" className="text-accent underline">Back to search</Link>.
      </p>
    </div>
  );
}
