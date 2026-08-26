/**
 * Demo-mode reference records.
 *
 * HONESTY CONTRACT for this file:
 *  - Every LCCN, title, place, and digitized-issue date below is copied
 *    verbatim from the Library of Congress's own published dataset
 *    (LibraryOfCongress/data-exploration → chronam.csv, a snapshot of the
 *    Chronicling America title list). Nothing is invented.
 *  - Famous-document records carry only text that is verbatim from the
 *    canonical published text of the document, with the edition named in
 *    `transcript.sourceNote`. No quotation is paraphrased or reconstructed.
 *  - URLs follow patterns verified from official provider documentation.
 *    `scripts/validate-links.ts` re-checks every URL against the live
 *    archives; the build sandbox for this repository blocked outbound
 *    network access, so run it once from a normal network (see README).
 *  - Where a fact could not be verified, the record says so rather than
 *    filling the gap.
 */

import type {
  PoliticalAlignment,
  SocialPosition,
  SourceRecord,
} from "@/lib/types";
import { classifySource } from "@/lib/classify/classify";
import { bandForState } from "@/lib/search/aliases";

const ACCESSED = new Date().toISOString().slice(0, 10);
const CSV_PROV =
  "LCCN, title, place, and digitized-issue dates verbatim from chronam.csv in the official LibraryOfCongress/data-exploration repository (Chronicling America title list snapshot, ~Oct 2022).";

// ─── Newspaper titles (verified from the Library's own dataset) ──────────────

interface PaperDef {
  lccn: string;
  /** Verbatim CSV title. */
  csvTitle: string;
  displayTitle: string;
  place: string;
  state: string;
  run: string;
  firstIssue: string;
  lastIssue?: string;
  alignment: PoliticalAlignment;
  alignmentNote: string;
  social?: SocialPosition[];
  csvLine: string;
}

const PAPERS: PaperDef[] = [
  {
    lccn: "sn84024738",
    csvTitle: "The daily dispatch. [volume]Richmond [Va.], 1850-1884",
    displayTitle: "The Daily Dispatch",
    place: "Richmond, Va.",
    state: "VA",
    run: "1850–1884",
    firstIssue: "1852-01-14",
    lastIssue: "1884-06-29",
    alignment: "confederate-aligned",
    alignmentNote:
      "Richmond's largest-circulation wartime daily, published in the Confederate capital and supportive of the Confederate war effort. Alignment is documented from the paper's wartime record, not from its location.",
    csvLine: "chronam.csv (Virginia section)",
  },
  {
    lccn: "sn84024735",
    csvTitle: "Richmond enquirer. [volume]Richmond, Va., 1815-1867",
    displayTitle: "Richmond Enquirer",
    place: "Richmond, Va.",
    state: "VA",
    run: "1815–1867",
    firstIssue: "1815-09-20",
    lastIssue: "1867-01-08",
    alignment: "confederate-aligned",
    alignmentNote:
      "Long-established Democratic organ; during the war a Confederate administration paper. Documented from the paper's record, not location.",
    csvLine: "chronam.csv (Virginia section)",
  },
  {
    lccn: "sn86071866",
    csvTitle: "Daily Richmond Whig. [volume]Richmond, Va., 1861-1862",
    displayTitle: "Daily Richmond Whig",
    place: "Richmond, Va.",
    state: "VA",
    run: "1861–1862",
    firstIssue: "1861-09-05",
    lastIssue: "1862-05-14",
    alignment: "confederate-aligned",
    alignmentNote:
      "Confederate-side paper often critical of the Davis administration — a reminder that the wartime South had internal political conflict.",
    csvLine: "chronam.csv (Virginia section)",
  },
  {
    lccn: "sn84024669",
    csvTitle: "Richmond Whig. [volume]Richmond, Va., 1862-1865",
    displayTitle: "Richmond Whig",
    place: "Richmond, Va.",
    state: "VA",
    run: "1862–1865",
    firstIssue: "1862-05-15",
    alignment: "confederate-aligned",
    alignmentNote:
      "Continuation of the Daily Richmond Whig; Confederate-side, frequently anti-administration.",
    csvLine: "chronam.csv (Virginia section)",
  },
  {
    lccn: "sn85025697",
    csvTitle: "The day book. [volume]Norfolk, Va., 1857-1867",
    displayTitle: "The Day Book (Norfolk)",
    place: "Norfolk, Va.",
    state: "VA",
    run: "1857–1867",
    firstIssue: "1857-10-05",
    lastIssue: "1866-11-02",
    alignment: "confederate-aligned",
    alignmentNote:
      "Secessionist Norfolk daily. Norfolk fell to Union forces in May 1862; the paper's history reflects occupied-city publishing.",
    csvLine: "chronam.csv (Virginia section)",
  },
  {
    lccn: "sn84024718",
    csvTitle: "Staunton spectator. [volume]Staunton, Va., 1849-1896",
    displayTitle: "Staunton Spectator",
    place: "Staunton, Va. (Augusta County)",
    state: "VA",
    run: "1849–1896",
    firstIssue: "1849-12-19",
    lastIssue: "1896-09-09",
    alignment: "unknown",
    alignmentNote:
      "Augusta County's Whig-tradition paper — the county documented by the Valley of the Shadow project. Its stance shifted across secession and war; read the columns rather than assuming from location.",
    csvLine: "chronam.csv (Virginia section)",
  },
  {
    lccn: "sn86069123",
    csvTitle: "The dollar weekly bulletin. [volume]Maysville, Ky., 1862-1864",
    displayTitle: "The Dollar Weekly Bulletin",
    place: "Maysville, Ky.",
    state: "KY",
    run: "1862–1864",
    firstIssue: "1862-06-19",
    lastIssue: "1864-04-28",
    alignment: "unknown",
    alignmentNote:
      "A wartime Kentucky weekly. Kentucky was deeply divided; this app records no loyalty for the paper because none is documented in the dataset. Location is not loyalty.",
    csvLine: "chronam.csv (Kentucky section)",
  },
  {
    lccn: "sn84038223",
    csvTitle: "Maysville weekly bulletin. [volume]Maysville, Ky., 1864-1866",
    displayTitle: "Maysville Weekly Bulletin",
    place: "Maysville, Ky.",
    state: "KY",
    run: "1864–1866",
    firstIssue: "1864-05-06",
    lastIssue: "1864-10-27",
    alignment: "unknown",
    alignmentNote:
      "Successor Maysville weekly; alignment not documented in the dataset.",
    csvLine: "chronam.csv (Kentucky section)",
  },
  {
    lccn: "sn82015050",
    csvTitle: "The examiner. [volume]Louisville, Ky., 1847-1849",
    displayTitle: "The Examiner (Louisville)",
    place: "Louisville, Ky.",
    state: "KY",
    run: "1847–1849",
    firstIssue: "1847-06-19",
    lastIssue: "1849-12-08",
    alignment: "abolitionist",
    alignmentNote:
      "An emancipationist paper published in a slave state before the war — evidence that antislavery argument existed inside Kentucky. Tagged abolitionist as the nearest available category; Kentucky\u2019s gradual-emancipation movement pointedly distinguished itself from abolitionism.",
    csvLine: "chronam.csv (Kentucky section)",
  },
  {
    lccn: "sn84038328",
    csvTitle: "The interior journal. [volume]Stanford, Ky., 1872-1881",
    displayTitle: "The Interior Journal",
    place: "Stanford, Ky.",
    state: "KY",
    run: "1872–1881",
    firstIssue: "1872-03-08",
    lastIssue: "1881-12-16",
    alignment: "unknown",
    alignmentNote: "Reconstruction-era Kentucky weekly.",
    csvLine: "chronam.csv (Kentucky section)",
  },
  {
    lccn: "sn86053570",
    csvTitle: "Daily national Republican. [volume]Washington, D.C., 1862-1866",
    displayTitle: "Daily National Republican",
    place: "Washington, D.C.",
    state: "DC",
    run: "1862–1866",
    firstIssue: "1862-11-10",
    lastIssue: "1866-03-31",
    alignment: "unionist",
    alignmentNote:
      "A Republican, pro-administration Washington daily, as its name announces.",
    csvLine: "chronam.csv (District of Columbia section)",
  },
  {
    lccn: "sn83045462",
    csvTitle: "Evening star. [volume]Washington, D.C., 1854-1972",
    displayTitle: "Evening Star",
    place: "Washington, D.C.",
    state: "DC",
    run: "1854–1972",
    firstIssue: "1854-10-09",
    alignment: "unknown",
    alignmentNote:
      "Major Washington daily through the war; editorial stance should be read from its columns.",
    csvLine: "chronam.csv (District of Columbia section)",
  },
  {
    lccn: "sn83045784",
    csvTitle: "Weekly national intelligencer. [volume]Washington [D.C.], 1841-1869",
    displayTitle: "Weekly National Intelligencer",
    place: "Washington, D.C.",
    state: "DC",
    run: "1841–1869",
    firstIssue: "1843-07-01",
    lastIssue: "1864-12-29",
    alignment: "unionist",
    alignmentNote:
      "Conservative Unionist paper — loyal to the Union while frequently critical of emancipation policy. Evidence that Union loyalty did not imply support for abolition.",
    csvLine: "chronam.csv (District of Columbia section)",
  },
  {
    lccn: "sn84026752",
    csvTitle: "The national era. [volume]Washington [D.C.], 1847-1860",
    displayTitle: "The National Era",
    place: "Washington, D.C.",
    state: "DC",
    run: "1847–1860",
    firstIssue: "1850-01-03",
    alignment: "abolitionist",
    alignmentNote:
      "The antislavery weekly that first serialized Uncle Tom's Cabin — abolitionist argument published at the capital, in the 1850s.",
    csvLine: "chronam.csv (District of Columbia section)",
  },
  {
    lccn: "sn84026753",
    csvTitle: "New national era. [volume]Washington, D.C., 1870-1874",
    displayTitle: "New National Era",
    place: "Washington, D.C.",
    state: "DC",
    run: "1870–1874",
    firstIssue: "1870-09-08",
    alignment: "abolitionist",
    alignmentNote:
      "Weekly edited by Frederick Douglass during Reconstruction — a leading Black-owned national paper. Tagged abolitionist as the nearest available category for its antislavery lineage; by 1870 its cause was Reconstruction-era civil rights.",
    social: ["free-black-resident", "newspaper-editor"],
    csvLine: "chronam.csv (District of Columbia section)",
  },
  {
    lccn: "sn83030313",
    csvTitle: "The New York herald. [volume]New York [N.Y.], 1840-1920",
    displayTitle: "The New York Herald",
    place: "New York, N.Y.",
    state: "NY",
    run: "1840–1920",
    firstIssue: "1842-01-01",
    lastIssue: "1920-01-31",
    alignment: "unknown",
    alignmentNote:
      "The country's largest-circulation daily: independent, sensational, supportive of the war but hostile to abolitionists — Northern print culture was not one voice.",
    csvLine: "chronam.csv (New York section)",
  },
  {
    lccn: "sn83030213",
    csvTitle: "New-York daily tribune. [volume]New-York [N.Y.], 1842-1866",
    displayTitle: "New-York Daily Tribune",
    place: "New York, N.Y.",
    state: "NY",
    run: "1842–1866",
    firstIssue: "1842-04-22",
    lastIssue: "1866-04-09",
    alignment: "unionist",
    alignmentNote:
      "Horace Greeley's strongly antislavery Republican paper — the paper to which Lincoln addressed his August 1862 letter on Union and slavery.",
    csvLine: "chronam.csv (New York section)",
  },
  {
    lccn: "sn83030272",
    csvTitle: "The sun. [volume]New York [N.Y.], 1833-1916",
    displayTitle: "The Sun (New York)",
    place: "New York, N.Y.",
    state: "NY",
    run: "1833–1916",
    firstIssue: "1859-10-01",
    alignment: "unknown",
    alignmentNote: "Penny daily with a mass working-class readership.",
    csvLine: "chronam.csv (New York section)",
  },
  {
    lccn: "sn83035487",
    csvTitle: "Anti-slavery bugle. [volume]New-Lisbon, Ohio, 1845-1861",
    displayTitle: "Anti-Slavery Bugle",
    place: "New Lisbon, Ohio",
    state: "OH",
    run: "1845–1861",
    firstIssue: "1845-06-20",
    lastIssue: "1861-05-04",
    alignment: "abolitionist",
    alignmentNote:
      "Garrisonian abolitionist weekly, as its title declares; published first at New-Lisbon and from late 1845 at Salem, Ohio. Its digitized run ends in May 1861, weeks into the war.",
    csvLine: "chronam.csv (Ohio section)",
  },
  {
    lccn: "sn85054845",
    csvTitle: "The Alleghanian. [volume]Ebensburg, Pa., 1859-1865",
    displayTitle: "The Alleghanian",
    place: "Ebensburg, Pa.",
    state: "PA",
    run: "1859–1865",
    firstIssue: "1859-09-01",
    lastIssue: "1865-02-16",
    alignment: "unknown",
    alignmentNote: "Cambria County weekly spanning the war years.",
    csvLine: "chronam.csv (Pennsylvania section)",
  },
  {
    lccn: "sn86071378",
    csvTitle: "Democrat and sentinel. [volume]Ebensburg, Pa., 1853-1866",
    displayTitle: "Democrat and Sentinel",
    place: "Ebensburg, Pa.",
    state: "PA",
    run: "1853–1866",
    firstIssue: "1853-08-26",
    lastIssue: "1866-12-20",
    alignment: "unknown",
    alignmentNote:
      "A Democratic party paper, as its name states. Wartime Democratic papers ranged from war-supporting to peace-advocating; read its columns before assigning a stance.",
    csvLine: "chronam.csv (Pennsylvania section)",
  },
  {
    lccn: "sn85025182",
    csvTitle: "The star of the north. [volume]Bloomsburg, Pa., 1849-1866",
    displayTitle: "The Star of the North",
    place: "Bloomsburg, Pa.",
    state: "PA",
    run: "1849–1866",
    firstIssue: "1850-01-17",
    lastIssue: "1866-02-21",
    alignment: "unknown",
    alignmentNote:
      "Democratic paper in a strongly Democratic Pennsylvania county; a place to look for Northern antiwar argument, but its stance must be documented from its pages.",
    csvLine: "chronam.csv (Pennsylvania section)",
  },
  {
    lccn: "sn85038443",
    csvTitle:
      "Union County star and Lewisburg chronicle. [volume]Lewisburg, Pa., 1859-1864",
    displayTitle: "Union County Star and Lewisburg Chronicle",
    place: "Lewisburg, Pa.",
    state: "PA",
    run: "1859–1864",
    firstIssue: "1859-05-06",
    lastIssue: "1864-12-30",
    alignment: "unknown",
    alignmentNote: "Central-Pennsylvania weekly through most of the war.",
    csvLine: "chronam.csv (Pennsylvania section)",
  },
  {
    lccn: "sn83025745",
    csvTitle: "The colored Tennessean. [volume]Nashville, Tenn., 1865-1866",
    displayTitle: "The Colored Tennessean",
    place: "Nashville, Tenn.",
    state: "TN",
    run: "1865–1866",
    firstIssue: "1865-08-12",
    lastIssue: "1866-03-31",
    alignment: "unionist",
    alignmentNote:
      "A Black-edited Nashville paper founded at emancipation, advocating the rights of freedpeople — a Southern-published Unionist voice.",
    social: ["free-black-resident", "newspaper-editor"],
    csvLine: "chronam.csv (Tennessee section)",
  },
];

function paperTitleRecord(p: PaperDef): SourceRecord {
  const url = `https://www.loc.gov/item/${p.lccn}/`;
  const firstYear = parseInt(p.firstIssue.slice(0, 4), 10);
  const sortYear = Math.max(firstYear, 1850);
  // A title-level entry locates a digitized run; it is a pointer to period
  // issues, not itself a document — classify it as an index entry.
  const classification = {
    evidenceClass: "index-or-finding-aid" as const,
    confidence: "high" as const,
    explanation:
      "A digitized-run entry for a newspaper title: it locates period issues but is not itself a document. Open an issue to reach contemporaneous evidence.",
    signals: ["title-level catalog entry", `digitized run ${p.run}`],
  };
  return {
    id: `demo:lccn-${p.lccn}`,
    provider: "demo",
    providerItemId: p.lccn,
    url,
    title: `${p.displayTitle} (${p.place}, ${p.run})`,
    creator: undefined,
    dates: {
      created: p.run,
      sortYear,
      display: `Published ${p.run}; digitized issues ${p.firstIssue}${p.lastIssue ? ` – ${p.lastIssue}` : " onward"}`,
    },
    place: p.place,
    state: p.state,
    format: "newspaper",
    formatLabel: "Newspaper title",
    collection: "Chronicling America",
    subjects: [`Newspapers — ${p.place}`],
    description: `Digitized run of ${p.displayTitle}, published at ${p.place.replace(/\.+$/, "")}. First digitized issue in the Library's dataset: ${p.firstIssue}${p.lastIssue ? `; last: ${p.lastIssue}` : ""}. ${p.alignmentNote}`,
    transcript: {
      available: false,
      isOcr: false,
      sourceNote:
        "Full-text search and page OCR are available on the Library of Congress site for this title.",
    },
    scanAvailable: true,
    thumbnailUrl: undefined,
    rights: {
      statement:
        "Chronicling America newspaper pages are generally in the public domain; consult the Library of Congress rights guidance for this title.",
      allowsRedistribution: false,
      link: url,
    },
    citation: {
      title: p.displayTitle,
      date: p.run,
      collection: "Chronicling America: Historic American Newspapers",
      archiveName: "Library of Congress",
      url,
      locator: `LCCN ${p.lccn}`,
      accessed: ACCESSED,
    },
    classification,
    perspective: {
      region: bandForState(p.state),
      state: p.state,
      place: p.place,
      socialPositions: p.social ?? ["newspaper-editor"],
      alignment: p.alignment,
      basis: "curated",
      note: p.alignmentNote,
    },
    raw: { csvTitle: p.csvTitle, lccn: p.lccn, firstIssue: p.firstIssue, lastIssue: p.lastIssue },
    provenance: `${CSV_PROV} Row: ${p.csvLine}. URL follows the verified loc.gov item pattern /item/{lccn}/.`,
  };
}

interface IssueDef {
  lccn: string;
  date: string;
  paper: PaperDef;
  note: string;
}

const ISSUES: IssueDef[] = [
  {
    lccn: "sn86071866",
    date: "1861-09-05",
    paper: PAPERS.find((p) => p.lccn === "sn86071866")!,
    note: "First digitized issue of the Daily Richmond Whig — a Confederate-capital daily five months into the war.",
  },
  {
    lccn: "sn84024669",
    date: "1862-05-15",
    paper: PAPERS.find((p) => p.lccn === "sn84024669")!,
    note: "First digitized issue of the continued Richmond Whig, printed during the Peninsula Campaign as the Union army approached Richmond.",
  },
  {
    lccn: "sn86069123",
    date: "1862-06-19",
    paper: PAPERS.find((p) => p.lccn === "sn86069123")!,
    note: "First digitized issue of a wartime Kentucky weekly, published in a border state that had rejected secession the year before.",
  },
  {
    lccn: "sn86053570",
    date: "1862-11-10",
    paper: PAPERS.find((p) => p.lccn === "sn86053570")!,
    note: "First digitized issue of the Daily National Republican — printed between the preliminary (Sept. 22, 1862) and final (Jan. 1, 1863) Emancipation Proclamations.",
  },
  {
    lccn: "sn83035487",
    date: "1861-05-04",
    paper: PAPERS.find((p) => p.lccn === "sn83035487")!,
    note: "Final digitized issue of the Anti-Slavery Bugle, printed three weeks after Fort Sumter.",
  },
  {
    lccn: "sn83025745",
    date: "1865-08-12",
    paper: PAPERS.find((p) => p.lccn === "sn83025745")!,
    note: "First digitized issue of the Colored Tennessean, a Black-edited paper founded as slavery collapsed in Tennessee.",
  },
];

function issueRecord(i: IssueDef): SourceRecord {
  const url = `https://www.loc.gov/resource/${i.lccn}/${i.date}/ed-1/?sp=1`;
  const sortYear = parseInt(i.date.slice(0, 4), 10);
  const classification = classifySource({
    format: "newspaper",
    formatLabel: "newspaper issue",
    title: `${i.paper.displayTitle}, ${i.date}`,
    description: i.note,
    dates: { created: i.date, sortYear, display: i.date },
    scanAvailable: true,
    provider: "demo",
  });
  return {
    id: `demo:${i.lccn}-${i.date}-ed-1`,
    provider: "demo",
    providerItemId: `${i.lccn}/${i.date}/ed-1`,
    url,
    title: `${i.paper.displayTitle} — issue of ${i.date}`,
    dates: { created: i.date, sortYear, display: i.date },
    place: i.paper.place,
    state: i.paper.state,
    format: "newspaper",
    formatLabel: "Newspaper issue (digitized)",
    collection: "Chronicling America",
    subjects: [`Newspapers — ${i.paper.place}`],
    description: `${i.note} The issue date is verified from the Library's digitized-run dataset; open the page scan and OCR text at the Library of Congress.`,
    transcript: {
      available: false,
      isOcr: true,
      ocrQualityNote:
        "Page OCR exists at the Library of Congress but is not bundled here; open the item to read and search it.",
      sourceNote:
        "Full page text (OCR) is in the full_text field of the loc.gov resource JSON, and on the item page.",
    },
    scanAvailable: true,
    rights: {
      statement:
        "Chronicling America newspaper pages are generally in the public domain; consult the Library of Congress rights guidance for this title.",
      allowsRedistribution: false,
      link: url,
    },
    citation: {
      title: i.paper.displayTitle,
      date: i.date,
      collection: "Chronicling America: Historic American Newspapers",
      archiveName: "Library of Congress",
      url,
      locator: `LCCN ${i.lccn}, ed. 1`,
      accessed: ACCESSED,
    },
    classification,
    perspective: {
      region: bandForState(i.paper.state),
      state: i.paper.state,
      place: i.paper.place,
      socialPositions: i.paper.social ?? ["newspaper-editor"],
      alignment: i.paper.alignment,
      basis: "curated",
      note: i.paper.alignmentNote,
    },
    raw: { lccn: i.lccn, issueDate: i.date, csvTitle: i.paper.csvTitle },
    provenance: `${CSV_PROV} This issue date is the first/last digitized issue recorded for the title. URL follows the verified loc.gov newspaper-page pattern /resource/{lccn}/{date}/ed-{n}/.`,
  };
}

// ─── Famous documents with verbatim-attested text ────────────────────────────

const DOCUMENTS: SourceRecord[] = [
  {
    id: "demo:emancipation-proclamation-1863",
    provider: "demo",
    providerItemId: "emancipation-proclamation-1863",
    url: "https://www.archives.gov/exhibits/featured-documents/emancipation-proclamation",
    title: "The Emancipation Proclamation",
    creator: "Abraham Lincoln (President of the United States)",
    dates: {
      created: "1863-01-01",
      eventDate: "1863-01-01",
      sortYear: 1863,
      display: "January 1, 1863",
    },
    place: "Washington, D.C.",
    state: "DC",
    format: "government-document",
    formatLabel: "Presidential proclamation",
    collection: "Record Group 11, General Records of the United States Government",
    subjects: ["Emancipation", "Slavery", "Presidential proclamations"],
    description:
      "Lincoln's proclamation declaring persons held as slaves in the states then in rebellion 'forever free,' authorizing Black enlistment, and framing the act as a war measure 'warranted by the Constitution, upon military necessity.' It exempted the loyal border states and specified occupied areas.",
    transcript: {
      available: true,
      text:
        "…all persons held as slaves within any State or designated part of a State, the people whereof shall then be in rebellion against the United States, shall be then, thenceforward, and forever free…\n\n…And upon this act, sincerely believed to be an act of justice, warranted by the Constitution, upon military necessity, I invoke the considerate judgment of mankind, and the gracious favor of Almighty God.",
      isOcr: false,
      isExcerpt: true,
      sourceNote:
        "Verbatim excerpts from the standard published text of the Emancipation Proclamation (National Archives transcription, RG 11). Ellipses mark omitted passages; nothing is paraphrased. Note: the ‘forever free’ sentence appears in the January 1 text as its quotation of the September 22 preliminary order; the January 1 operative words are ‘are, and henceforward shall be free.’",
    },
    scanAvailable: true,
    rights: {
      statement: "U.S. government record in the public domain.",
      allowsRedistribution: true,
      link: "https://www.archives.gov/exhibits/featured-documents/emancipation-proclamation",
    },
    citation: {
      creator: "Abraham Lincoln",
      title: "Emancipation Proclamation",
      date: "1863-01-01",
      collection: "Record Group 11, General Records of the United States Government",
      archiveName: "National Archives and Records Administration",
      url: "https://www.archives.gov/exhibits/featured-documents/emancipation-proclamation",
      accessed: ACCESSED,
    },
    classification: {
      evidenceClass: "official-record",
      confidence: "high",
      explanation:
        "An official presidential proclamation — a government record created in the course of executive action, contemporaneous with the events it governs.",
      signals: ["presidential proclamation", "created 1863-01-01"],
    },
    perspective: {
      region: "national",
      state: "DC",
      place: "Washington, D.C.",
      socialPositions: ["political-actor"],
      alignment: "unionist",
      basis: "curated",
      note: "Federal executive document; its reception differed sharply by region and politics.",
    },
    raw: {},
    provenance:
      "Document, date, and holding archive are established public record (original in NARA RG 11). Excerpt verbatim from the National Archives transcription. URL is NARA's long-standing featured-documents page; validate with scripts/validate-links.ts.",
  },
  {
    id: "demo:preliminary-emancipation-1862",
    provider: "demo",
    providerItemId: "preliminary-emancipation-1862",
    url: "https://www.loc.gov/collections/abraham-lincoln-papers/?q=preliminary+emancipation+proclamation",
    title: "Preliminary Emancipation Proclamation",
    creator: "Abraham Lincoln (President of the United States)",
    dates: {
      created: "1862-09-22",
      eventDate: "1862-09-22",
      sortYear: 1862,
      display: "September 22, 1862",
    },
    place: "Washington, D.C.",
    state: "DC",
    format: "government-document",
    formatLabel: "Presidential proclamation",
    subjects: ["Emancipation", "Slavery", "Presidential proclamations"],
    description:
      "Issued five days after Antietam: notice that unless the rebelling states returned to the Union by January 1, 1863, their slaves would be declared free. It reframed the war's stakes for readers North and South, and its hundred-day deadline structured public debate through the fall of 1862.",
    transcript: {
      available: true,
      text:
        "That on the first day of January, in the year of our Lord one thousand eight hundred and sixty-three, all persons held as slaves within any State, or designated part of a State, the people whereof shall then be in rebellion against the United States, shall be then, thenceforward, and forever free…",
      isOcr: false,
      isExcerpt: true,
      sourceNote:
        "Wording verbatim from the operative sentence of the September 22, 1862 preliminary proclamation as published (and later quoted in the January 1 proclamation); comma placement varies among transcriptions. Ellipsis marks the continuing sentence.",
    },
    scanAvailable: true,
    rights: {
      statement: "U.S. government record in the public domain.",
      allowsRedistribution: true,
    },
    citation: {
      creator: "Abraham Lincoln",
      title: "Preliminary Emancipation Proclamation",
      date: "1862-09-22",
      archiveName: "Library of Congress (Abraham Lincoln Papers) / National Archives",
      url: "https://www.loc.gov/collections/abraham-lincoln-papers/?q=preliminary+emancipation+proclamation",
      accessed: ACCESSED,
    },
    classification: {
      evidenceClass: "official-record",
      confidence: "high",
      explanation:
        "An official presidential proclamation, contemporaneous with the policy it announces.",
      signals: ["presidential proclamation", "created 1862-09-22"],
    },
    perspective: {
      region: "national",
      state: "DC",
      place: "Washington, D.C.",
      socialPositions: ["political-actor"],
      alignment: "unionist",
      basis: "curated",
      note: "Federal executive document; reactions in this period's press ran from celebration to fury.",
    },
    raw: {},
    provenance:
      "Document and date are established public record. Link is a search deep-link into the Library's Abraham Lincoln Papers collection using the verified /collections/{name}/?q= pattern (drafts of the proclamation are in that collection); validate with scripts/validate-links.ts.",
  },
  {
    id: "demo:lincoln-greeley-1862",
    provider: "demo",
    providerItemId: "lincoln-greeley-1862",
    url: "https://www.loc.gov/collections/abraham-lincoln-papers/?q=horace+greeley+paramount+object",
    title: "Abraham Lincoln to Horace Greeley (reply to 'The Prayer of Twenty Millions')",
    creator: "Abraham Lincoln",
    recipient: "Horace Greeley, editor, New-York Tribune",
    dates: {
      created: "1862-08-22",
      sortYear: 1862,
      display: "August 22, 1862",
    },
    place: "Washington, D.C.",
    state: "DC",
    format: "letter",
    formatLabel: "Public letter",
    subjects: ["Emancipation", "Union", "Slavery", "Press"],
    description:
      "Lincoln's public reply to Greeley's abolitionist editorial, written while the preliminary proclamation lay in his desk: a statement that his official duty was saving the Union, paired with a closing distinction between official duty and personal wish.",
    transcript: {
      available: true,
      text:
        "My paramount object in this struggle is to save the Union, and is not either to save or to destroy slavery. If I could save the Union without freeing any slave I would do it, and if I could save it by freeing all the slaves I would do it; and if I could save it by freeing some and leaving others alone I would also do that…\n\nI have here stated my purpose according to my view of official duty; and I intend no modification of my oft-expressed personal wish that all men everywhere could be free.",
      isOcr: false,
      isExcerpt: true,
      sourceNote:
        "Verbatim from the widely reprinted published text of the letter (it was released to the press and printed in the National Intelligencer and other papers in August 1862). Punctuation varies slightly among period printings; wording follows the standard text.",
    },
    scanAvailable: false,
    rights: {
      statement: "Published 1862; in the public domain.",
      allowsRedistribution: true,
    },
    citation: {
      creator: "Abraham Lincoln",
      title: "Letter to Horace Greeley",
      date: "1862-08-22",
      archiveName: "Library of Congress (Abraham Lincoln Papers)",
      url: "https://www.loc.gov/collections/abraham-lincoln-papers/?q=horace+greeley+paramount+object",
      accessed: ACCESSED,
    },
    classification: {
      evidenceClass: "public-argument",
      confidence: "high",
      explanation:
        "A letter written for publication — contemporaneous, but composed to persuade a public audience, and read alongside the policy Lincoln had already drafted privately.",
      signals: ["public letter to a newspaper editor", "created 1862-08-22"],
    },
    perspective: {
      region: "national",
      state: "DC",
      place: "Washington, D.C.",
      socialPositions: ["political-actor"],
      alignment: "unionist",
      basis: "curated",
    },
    raw: {},
    provenance:
      "Letter, date, and publication are established public record. Excerpt verbatim from the standard published text. Link is a search deep-link into the Abraham Lincoln Papers using the verified collection-search pattern.",
  },
  {
    id: "demo:sc-declaration-1860",
    provider: "demo",
    providerItemId: "sc-declaration-1860",
    url: "https://avalon.law.yale.edu/19th_century/csa_scarsec.asp",
    title:
      "Declaration of the Immediate Causes Which Induce and Justify the Secession of South Carolina",
    creator: "South Carolina Secession Convention",
    dates: {
      created: "1860-12-24",
      sortYear: 1860,
      display: "December 24, 1860",
    },
    place: "Charleston, S.C.",
    state: "SC",
    format: "government-document",
    formatLabel: "Convention declaration",
    subjects: ["Secession", "Slavery", "State conventions"],
    description:
      "The convention's official statement of its reasons for secession. It grounds the act explicitly in the defense of slavery and in Northern states' resistance to the Fugitive Slave Act — the seceding state's own contemporaneous explanation, in its own words.",
    transcript: {
      available: true,
      text:
        "…an increasing hostility on the part of the non-slaveholding States to the institution of slavery…\n\n…A geographical line has been drawn across the Union, and all the States north of that line have united in the election of a man to the high office of President of the United States, whose opinions and purposes are hostile to slavery.",
      isOcr: false,
      isExcerpt: true,
      sourceNote:
        "Verbatim excerpts from the declaration's published text (adopted December 24, 1860). Ellipses mark omissions; nothing is paraphrased.",
    },
    scanAvailable: false,
    rights: {
      statement: "Published 1860; in the public domain.",
      allowsRedistribution: true,
    },
    citation: {
      creator: "South Carolina Secession Convention",
      title:
        "Declaration of the Immediate Causes Which Induce and Justify the Secession of South Carolina from the Federal Union",
      date: "1860-12-24",
      archiveName: "Avalon Project, Yale Law School (transcription)",
      url: "https://avalon.law.yale.edu/19th_century/csa_scarsec.asp",
      accessed: ACCESSED,
    },
    classification: {
      evidenceClass: "official-record",
      confidence: "high",
      explanation:
        "An official act of a state convention — the seceding government's contemporaneous statement of its own reasons. It is also a public argument; read it as both.",
      signals: ["convention declaration", "created 1860-12-24"],
    },
    perspective: {
      region: "south",
      state: "SC",
      place: "Charleston, S.C.",
      socialPositions: ["political-actor"],
      alignment: "confederate-aligned",
      basis: "curated",
      note: "The convention speaks for the secessionist government, not for every South Carolinian — enslaved people — a majority of the state's population, about 57 percent in the 1860 census — had no voice in it.",
    },
    raw: {},
    provenance:
      "Document, date, and text are established public record. The Avalon Project URL is a long-stable scholarly transcription; validate with scripts/validate-links.ts.",
  },
  {
    id: "demo:ms-declaration-1861",
    provider: "demo",
    providerItemId: "ms-declaration-1861",
    url: "https://avalon.law.yale.edu/19th_century/csa_missec.asp",
    title:
      "A Declaration of the Immediate Causes which Induce and Justify the Secession of the State of Mississippi",
    creator: "Mississippi Secession Convention",
    dates: {
      created: "1861-01",
      sortYear: 1861,
      display: "January 1861",
    },
    place: "Jackson, Miss.",
    state: "MS",
    format: "government-document",
    formatLabel: "Convention declaration",
    subjects: ["Secession", "Slavery", "State conventions"],
    description:
      "Mississippi's official declaration of causes, opening with an unambiguous statement of what the convention believed was at stake.",
    transcript: {
      available: true,
      text:
        "Our position is thoroughly identified with the institution of slavery—the greatest material interest of the world.",
      isOcr: false,
      isExcerpt: true,
      sourceNote:
        "Verbatim opening of the declaration's second paragraph, as published (January 1861).",
    },
    scanAvailable: false,
    rights: {
      statement: "Published 1861; in the public domain.",
      allowsRedistribution: true,
    },
    citation: {
      creator: "Mississippi Secession Convention",
      title:
        "A Declaration of the Immediate Causes which Induce and Justify the Secession of the State of Mississippi from the Federal Union",
      date: "1861-01",
      archiveName: "Avalon Project, Yale Law School (transcription)",
      url: "https://avalon.law.yale.edu/19th_century/csa_missec.asp",
      accessed: ACCESSED,
    },
    classification: {
      evidenceClass: "official-record",
      confidence: "high",
      explanation:
        "An official act of a state convention — the seceding government's contemporaneous statement of its own reasons, and simultaneously a public argument.",
      signals: ["convention declaration", "created January 1861"],
    },
    perspective: {
      region: "south",
      state: "MS",
      place: "Jackson, Miss.",
      socialPositions: ["political-actor"],
      alignment: "confederate-aligned",
      basis: "curated",
      note: "Speaks for the secessionist convention; the majority of Mississippi's population was enslaved and unrepresented in it.",
    },
    raw: {},
    provenance:
      "Document, date, and text are established public record. Avalon Project URL is a long-stable scholarly transcription; validate with scripts/validate-links.ts.",
  },
  {
    id: "demo:magoffin-reply-1861",
    provider: "demo",
    providerItemId: "magoffin-reply-1861",
    url: "https://www.loc.gov/collections/chronicling-america/?qs=magoffin+furnish+no+troops&start_date=1861-04-15&end_date=1861-06-30",
    title:
      "Governor Beriah Magoffin's reply to the federal call for troops",
    creator: "Beriah Magoffin, Governor of Kentucky",
    recipient: "Simon Cameron, U.S. Secretary of War",
    dates: {
      created: "1861-04-15",
      sortYear: 1861,
      display: "April 15, 1861",
    },
    place: "Frankfort, Ky.",
    state: "KY",
    format: "letter",
    formatLabel: "Official telegram",
    subjects: ["Kentucky", "Neutrality", "Secession crisis", "Call for troops"],
    description:
      "Kentucky's governor refuses Lincoln's April 1861 call for troops, replying that Kentucky would furnish none for what he called the wicked purpose of subduing the seceded states. Widely reprinted, the reply marks the opening of Kentucky's armed-neutrality period: a slave state refusing to fight the Confederacy while also declining to secede.",
    transcript: {
      available: true,
      text:
        "Your dispatch is received. In answer I say emphatically Kentucky will furnish no troops for the wicked purpose of subduing her sister Southern States.",
      isOcr: false,
      isExcerpt: true,
      sourceNote:
        "Verbatim from Magoffin's April 15, 1861 reply to Secretary Cameron as printed in the Official Records of the War of the Rebellion (Series III, Volume 1). A popular variant (“not a man nor a dollar…”) circulates unsourced and is deliberately not used here.",
    },
    scanAvailable: false,
    rights: {
      statement: "Government correspondence of 1861; in the public domain.",
      allowsRedistribution: true,
    },
    citation: {
      creator: "Beriah Magoffin",
      title: "Reply to Secretary of War Simon Cameron",
      date: "1861-04-15",
      collection:
        "Official Records of the War of the Rebellion, Series III, Volume 1",
      archiveName: "U.S. War Department (published compilation)",
      url: "https://www.loc.gov/collections/chronicling-america/?qs=magoffin+furnish+no+troops&start_date=1861-04-15&end_date=1861-06-30",
      accessed: ACCESSED,
    },
    classification: {
      evidenceClass: "official-record",
      confidence: "high",
      explanation:
        "Official state-federal correspondence, contemporaneous with the crisis. This text is read from the later Official Records compilation: the telegram is 1861; the printing is postwar.",
      signals: ["official telegram", "created 1861-04-15", "printed in a later compilation"],
    },
    perspective: {
      region: "border",
      state: "KY",
      place: "Frankfort, Ky.",
      socialPositions: ["political-actor"],
      alignment: "divided-uncertain",
      basis: "curated",
      note: "Magoffin sympathized with the South but presided over a state that refused secession; historians read him variously. The refusal itself is the document — the loyalty question is exactly what Kentucky was fighting over.",
    },
    raw: {},
    provenance:
      "Telegram text and date are established public record (OR Ser. III, Vol. 1). The link is a Chronicling America search deep-link (verified URL pattern) for period reprintings in the weeks after April 15, 1861.",
  },
  {
    id: "demo:ky-neutrality-1861",
    provider: "demo",
    providerItemId: "ky-neutrality-1861",
    url: "https://www.loc.gov/collections/chronicling-america/?qs=kentucky+neutrality&start_date=1861-05-16&end_date=1861-08-31",
    title: "Kentucky's declaration of neutrality (May 1861)",
    creator: "Commonwealth of Kentucky (Governor and General Assembly)",
    dates: {
      created: "1861-05-20",
      eventDate: "1861-05-16",
      sortYear: 1861,
      display: "May 1861",
    },
    place: "Frankfort, Ky.",
    state: "KY",
    format: "government-document",
    formatLabel: "State proclamation / legislative resolution",
    subjects: ["Kentucky", "Neutrality", "Secession crisis"],
    description:
      "In May 1861 Kentucky's House resolved that the state should take no part in the war, and Governor Magoffin proclaimed neutrality, warning both belligerents off Kentucky soil. The policy held until September 1861, when Confederate forces entered the state and the legislature declared for the Union. No verbatim excerpt is bundled here; this entry links to period newspaper coverage of the proclamation.",
    transcript: {
      available: false,
      isOcr: false,
      sourceNote:
        "The resolution and proclamation texts are in Kentucky legislative journals and period newspapers; this reference entry deliberately includes no quotation rather than an unverified one.",
    },
    scanAvailable: false,
    rights: {
      statement: "State documents of 1861; in the public domain.",
      allowsRedistribution: true,
    },
    citation: {
      creator: "Commonwealth of Kentucky",
      title: "Proclamation of neutrality and associated resolutions",
      date: "1861-05",
      archiveName: "Kentucky legislative records (via period press)",
      url: "https://www.loc.gov/collections/chronicling-america/?qs=kentucky+neutrality&start_date=1861-05-16&end_date=1861-08-31",
      accessed: ACCESSED,
    },
    classification: {
      evidenceClass: "official-record",
      confidence: "medium",
      explanation:
        "State executive and legislative acts, contemporaneous with the crisis. This entry is a curated pointer to the documents rather than the documents themselves — treat it as a finding aid until you open the sources.",
      signals: ["state proclamation", "May 1861", "no bundled text"],
    },
    perspective: {
      region: "border",
      state: "KY",
      place: "Frankfort, Ky.",
      socialPositions: ["political-actor"],
      alignment: "divided-uncertain",
      basis: "curated",
      note: "Neutrality was Kentucky's own answer to the loyalty question — neither secession nor immediate war.",
    },
    raw: {},
    provenance:
      "The May 1861 neutrality policy and its September end are established public record. Dates given to month precision only. Link is a verified-pattern Chronicling America search for the period coverage.",
  },
  {
    id: "docsouth:douglass-narrative-1845",
    provider: "docsouth",
    providerItemId: "douglass-narrative-1845",
    url: "https://docsouth.unc.edu/neh/douglass/douglass.html",
    title:
      "Narrative of the Life of Frederick Douglass, an American Slave. Written by Himself.",
    creator: "Frederick Douglass",
    dates: {
      created: "1845",
      eventDate: "1818–1838",
      sortYear: 1845,
      display: "Published 1845, describing 1818–1838",
    },
    place: "Boston, Mass. (published); Maryland (events)",
    state: "MD",
    format: "narrative",
    formatLabel: "Autobiographical narrative",
    collection: "North American Slave Narratives (Documenting the American South)",
    subjects: ["Slavery", "Abolition", "Slave narratives", "Maryland"],
    description:
      "Douglass's first autobiography: a firsthand account of enslavement in Maryland, written roughly seven years after his escape and published as an abolitionist text. Both testimony and argument — its purposes are part of its evidence.",
    transcript: {
      available: true,
      text:
        "You have seen how a man was made a slave; you shall see how a slave was made a man.",
      isOcr: false,
      isExcerpt: true,
      sourceNote:
        "Verbatim from Chapter X of the 1845 first edition. The full text is on the Documenting the American South page for this title.",
    },
    scanAvailable: false,
    rights: {
      statement:
        "Published 1845; in the public domain. DocSouth requests scholarly citation of its electronic edition.",
      allowsRedistribution: true,
    },
    citation: {
      creator: "Frederick Douglass",
      title:
        "Narrative of the Life of Frederick Douglass, an American Slave. Written by Himself",
      date: "1845",
      collection: "North American Slave Narratives",
      archiveName: "Documenting the American South, University of North Carolina",
      url: "https://docsouth.unc.edu/neh/douglass/douglass.html",
      accessed: ACCESSED,
    },
    classification: {
      evidenceClass: "retrospective-firsthand",
      confidence: "high",
      explanation:
        "A firsthand account written years after the events it describes, and published to advance abolition. Powerful and essential evidence — but retrospective, and shaped by its purpose.",
      signals: ["autobiographical narrative", "published 1845 about 1818–1838"],
    },
    perspective: {
      region: "border",
      state: "MD",
      place: "Maryland (events); Boston (publication)",
      socialPositions: ["enslaved-person"],
      alignment: "abolitionist",
      basis: "curated",
      note: "The voice of a man who was enslaved in a border state and became the era's leading Black abolitionist.",
    },
    raw: {},
    provenance:
      "Author, title, publication year, and quoted sentence are established public record (1845 first edition). DocSouth URL is the standard cited address for this electronic edition; validate with scripts/validate-links.ts.",
  },
  {
    id: "docsouth:jacobs-incidents-1861",
    provider: "docsouth",
    providerItemId: "jacobs-incidents-1861",
    url: "https://docsouth.unc.edu/fpn/jacobs/jacobs.html",
    title: "Incidents in the Life of a Slave Girl. Written by Herself.",
    creator: "Harriet A. Jacobs (published under the pseudonym Linda Brent)",
    dates: {
      created: "1861",
      eventDate: "1813–1852",
      sortYear: 1861,
      display: "Published 1861, describing 1813–1852",
    },
    place: "Boston, Mass. (published); Edenton, N.C. (events)",
    state: "NC",
    format: "narrative",
    formatLabel: "Autobiographical narrative",
    collection: "First-Person Narratives of the American South (Documenting the American South)",
    subjects: ["Slavery", "Women", "Slave narratives", "North Carolina"],
    description:
      "Jacobs's account of enslavement in North Carolina, her seven years hidden in a garret, and her escape — published on the eve of the war and addressed especially to Northern women. The era's most important narrative of slavery's particular violence toward women.",
    transcript: {
      available: true,
      text: "Slavery is terrible for men; but it is far more terrible for women.",
      isOcr: false,
      isExcerpt: true,
      sourceNote:
        "Verbatim from the 1861 first edition (chapter 'The Trials of Girlhood'). Full text is on the Documenting the American South page for this title.",
    },
    scanAvailable: false,
    rights: {
      statement:
        "Published 1861; in the public domain. DocSouth requests scholarly citation of its electronic edition.",
      allowsRedistribution: true,
    },
    citation: {
      creator: "Harriet A. Jacobs",
      title: "Incidents in the Life of a Slave Girl. Written by Herself",
      date: "1861",
      collection: "First-Person Narratives of the American South",
      archiveName: "Documenting the American South, University of North Carolina",
      url: "https://docsouth.unc.edu/fpn/jacobs/jacobs.html",
      accessed: ACCESSED,
    },
    classification: {
      evidenceClass: "retrospective-firsthand",
      confidence: "high",
      explanation:
        "A firsthand account written years after the events, published in 1861 as an antislavery text. Retrospective testimony with a public purpose — read it as both.",
      signals: ["autobiographical narrative", "published 1861 about 1813–1852"],
    },
    perspective: {
      region: "south",
      state: "NC",
      place: "Edenton, N.C. (events)",
      socialPositions: ["enslaved-person", "woman-home-front"],
      alignment: "abolitionist",
      basis: "curated",
      note: "A Southern-born voice against slavery — geography and allegiance are not the same thing.",
    },
    raw: {},
    provenance:
      "Author, title, publication year, and quoted sentence are established public record (1861 first edition). DocSouth URL is the standard cited address for this electronic edition; validate with scripts/validate-links.ts.",
  },
  {
    id: "demo:jacobs-rebel-invasion-1864",
    provider: "demo",
    providerItemId: "jacobs-rebel-invasion-1864",
    url: "https://www.loc.gov/search/?q=jacobs+notes+rebel+invasion+gettysburg",
    title:
      "Notes on the Rebel Invasion of Maryland and Pennsylvania and the Battle of Gettysburg",
    creator: "Michael Jacobs (professor at Pennsylvania College, Gettysburg)",
    dates: {
      created: "1864",
      eventDate: "1863-06-15 – 1863-07-04",
      sortYear: 1864,
      display: "Published 1864, describing June–July 1863",
    },
    place: "Gettysburg, Pa. (events); Philadelphia (published)",
    state: "PA",
    format: "book",
    formatLabel: "Civilian eyewitness account (published 1864)",
    subjects: ["Gettysburg", "Civilians", "Pennsylvania", "Gettysburg campaign"],
    description:
      "An account of the Confederate invasion and the battle by a Gettysburg civilian — a Pennsylvania College professor who observed the fighting from the town — published by J. B. Lippincott in 1864, within a year of the events. One of the earliest civilian narratives of the battle. No excerpt is bundled here; the entry links to the Library of Congress catalog for the title.",
    transcript: {
      available: false,
      isOcr: false,
      sourceNote:
        "No text is bundled: this reference entry deliberately carries no quotation rather than an unverified one. The 1864 edition is widely held; see the archive link.",
    },
    scanAvailable: false,
    rights: {
      statement: "Published 1864; in the public domain.",
      allowsRedistribution: true,
    },
    citation: {
      creator: "Michael Jacobs",
      title:
        "Notes on the Rebel Invasion of Maryland and Pennsylvania and the Battle of Gettysburg",
      date: "1864",
      archiveName: "Library of Congress (catalog search)",
      url: "https://www.loc.gov/search/?q=jacobs+notes+rebel+invasion+gettysburg",
      locator: "Philadelphia: J. B. Lippincott, 1864",
      accessed: ACCESSED,
    },
    classification: {
      evidenceClass: "contemporaneous",
      confidence: "medium",
      explanation:
        "A civilian eyewitness account written and published within about a year of the battle — close in time, though composed after the outcome was known. Not equivalent to a diary kept during the fighting, and far closer than a postwar memoir.",
      signals: ["civilian eyewitness author", "published 1864 about July 1863"],
    },
    perspective: {
      region: "north",
      state: "PA",
      place: "Gettysburg, Pa.",
      socialPositions: ["civilian"],
      alignment: "unknown",
      basis: "curated",
      note:
        "A Gettysburg civilian's account; no political alignment is assigned beyond what the text itself argues.",
    },
    raw: {},
    provenance:
      "Author, title, publisher, and 1864 publication are established public record for this widely cited early account. URL is a verified-pattern loc.gov search deep link; validate with scripts/validate-links.ts.",
  },
  {
    id: "demo:alleman-at-gettysburg-1889",
    provider: "demo",
    providerItemId: "alleman-at-gettysburg-1889",
    url: "https://www.loc.gov/search/?q=alleman+at+gettysburg+what+a+girl+saw",
    title: "At Gettysburg, or What a Girl Saw and Heard of the Battle",
    creator: "Tillie Pierce Alleman",
    dates: {
      created: "1889",
      eventDate: "1863-06-26 – 1863-07-04",
      sortYear: 1889,
      display: "Published 1889, describing June–July 1863",
    },
    place: "Gettysburg, Pa. (events); New York (published)",
    state: "PA",
    format: "memoir",
    formatLabel: "Civilian memoir (published 1889)",
    subjects: ["Gettysburg", "Civilians", "Women", "Pennsylvania"],
    description:
      "The memoir of Tillie Pierce, a Gettysburg teenager during the battle, written and published twenty-six years later. A vivid civilian account — and a textbook case of retrospective firsthand evidence, shaped by decades of memory and the battle's later fame. Read it beside the 1864 Jacobs account of the same days.",
    transcript: {
      available: false,
      isOcr: false,
      sourceNote:
        "No text is bundled: this reference entry deliberately carries no quotation rather than an unverified one. See the archive link for the 1889 edition.",
    },
    scanAvailable: false,
    rights: {
      statement: "Published 1889; in the public domain.",
      allowsRedistribution: true,
    },
    citation: {
      creator: "Tillie Pierce Alleman",
      title: "At Gettysburg, or What a Girl Saw and Heard of the Battle",
      date: "1889",
      archiveName: "Library of Congress (catalog search)",
      url: "https://www.loc.gov/search/?q=alleman+at+gettysburg+what+a+girl+saw",
      locator: "New York: W. Lake Borland, 1889",
      accessed: ACCESSED,
    },
    classification: {
      evidenceClass: "retrospective-firsthand",
      confidence: "high",
      explanation:
        "A firsthand civilian account written twenty-six years after the events. Essential testimony about civilian experience — and retrospective: memory, later reading, and the battle's fame shape it.",
      signals: ["memoir", "published 1889 about July 1863"],
    },
    perspective: {
      region: "north",
      state: "PA",
      place: "Gettysburg, Pa.",
      socialPositions: ["civilian", "woman-home-front"],
      alignment: "unknown",
      basis: "curated",
      note: "A Gettysburg civilian's retrospective account.",
    },
    raw: {},
    provenance:
      "Author, title, publisher, and 1889 publication are established public record for this widely cited memoir. URL is a verified-pattern loc.gov search deep link; validate with scripts/validate-links.ts.",
  },
];

// ─── Archive index entries (Valley of the Shadow, DocSouth, LOC collections) ─

function indexEntry(opts: {
  id: string;
  url: string;
  title: string;
  description: string;
  archiveName: string;
  collection?: string;
  state?: string;
  place?: string;
  region: SourceRecord["perspective"]["region"];
  subjects: string[];
  locator?: string;
  provenance: string;
  social?: SocialPosition[];
  yearRange?: string;
  sortYear?: number;
}): SourceRecord {
  return {
    id: opts.id,
    provider: "demo",
    providerItemId: opts.id.replace(/^demo:/, ""),
    url: opts.url,
    title: opts.title,
    dates: {
      created: opts.yearRange,
      sortYear: opts.sortYear ?? 1861,
      display: opts.yearRange ?? "1850s–1870s",
    },
    place: opts.place,
    state: opts.state,
    format: "other",
    formatLabel: "Archive collection",
    collection: opts.collection,
    subjects: opts.subjects,
    description: opts.description,
    transcript: { available: false, isOcr: false },
    scanAvailable: false,
    rights: {
      statement: "See the archive's own rights guidance.",
      allowsRedistribution: false,
      link: opts.url,
    },
    citation: {
      title: opts.title,
      collection: opts.collection,
      archiveName: opts.archiveName,
      url: opts.url,
      locator: opts.locator,
      accessed: ACCESSED,
    },
    classification: {
      evidenceClass: "index-or-finding-aid",
      confidence: "high",
      explanation:
        "A curated pointer into an archive's collection — it locates original records but is not itself one. Open it to reach the documents.",
      signals: ["collection-level entry"],
    },
    perspective: {
      region: opts.region,
      state: opts.state,
      place: opts.place,
      socialPositions: opts.social ?? [],
      alignment: "unknown",
      basis: "curated",
      note: "Collection-level entry; the documents inside speak in many voices.",
    },
    raw: {},
    provenance: opts.provenance,
  };
}

const VALLEY_PROV =
  "The Valley of the Shadow project's two-county structure (Augusta County, Va. and Franklin County, Pa.) and its section names (Letters & Diaries, Newspapers, Public Records, Church Records, Soldiers' Records, Maps & Images) are established and documented by the University of Virginia Library. Deep item URLs could not be verified from this build sandbox (outbound network blocked), so entries link to the archive root; validate with scripts/validate-links.ts.";

const INDEXES: SourceRecord[] = [
  indexEntry({
    id: "valley:valley-augusta-letters",
    url: "https://valley.lib.virginia.edu/",
    title: "Valley of the Shadow — Augusta County, Va.: Letters & Diaries",
    description:
      "Transcribed letters and diaries from Augusta County, Virginia (county seat: Staunton), one of the two communities documented by the Valley of the Shadow project. Navigate: Valley of the Shadow → Letters & Diaries → Augusta County.",
    archiveName: "Valley of the Shadow, University of Virginia Library",
    collection: "Valley of the Shadow",
    state: "VA",
    place: "Augusta County, Va.",
    region: "south",
    subjects: ["Letters", "Diaries", "Virginia", "Shenandoah Valley"],
    locator: "Letters & Diaries → Augusta County",
    provenance: VALLEY_PROV,
    social: ["civilian", "woman-home-front", "enlisted-soldier"],
    yearRange: "1859–1870",
    sortYear: 1862,
  }),
  indexEntry({
    id: "valley:valley-franklin-letters",
    url: "https://valley.lib.virginia.edu/",
    title: "Valley of the Shadow — Franklin County, Pa.: Letters & Diaries",
    description:
      "Transcribed letters and diaries from Franklin County, Pennsylvania (county seat: Chambersburg) — the Northern community of the Valley project, directly on the route of the Gettysburg campaign and burned by Confederate cavalry in 1864. Navigate: Valley of the Shadow → Letters & Diaries → Franklin County.",
    archiveName: "Valley of the Shadow, University of Virginia Library",
    collection: "Valley of the Shadow",
    state: "PA",
    place: "Franklin County, Pa.",
    region: "north",
    subjects: ["Letters", "Diaries", "Pennsylvania", "Gettysburg campaign"],
    locator: "Letters & Diaries → Franklin County",
    provenance: VALLEY_PROV,
    social: ["civilian", "woman-home-front", "enlisted-soldier"],
    yearRange: "1859–1870",
    sortYear: 1863,
  }),
  indexEntry({
    id: "valley:valley-newspapers-augusta",
    url: "https://valley.lib.virginia.edu/",
    title: "Valley of the Shadow — Newspapers: Augusta County, Va. (Staunton)",
    description:
      "Full-text transcriptions of Staunton, Virginia newspapers, 1857\u20131870 \u2014 the Southern half of the Valley project's matched local press. Navigate: Valley of the Shadow \u2192 Newspapers \u2192 Augusta County.",
    archiveName: "Valley of the Shadow, University of Virginia Library",
    collection: "Valley of the Shadow",
    state: "VA",
    place: "Augusta County, Va.",
    region: "south",
    subjects: ["Newspapers", "Virginia", "Staunton"],
    locator: "Newspapers \u2192 Augusta County",
    provenance: VALLEY_PROV,
    social: ["newspaper-editor"],
    yearRange: "1857\u20131870",
    sortYear: 1861,
  }),
  indexEntry({
    id: "valley:valley-newspapers-franklin",
    url: "https://valley.lib.virginia.edu/",
    title: "Valley of the Shadow — Newspapers: Franklin County, Pa. (Chambersburg)",
    description:
      "Full-text transcriptions of Chambersburg / Franklin County, Pennsylvania newspapers, 1857\u20131870 \u2014 the Northern half of the Valley project's matched local press, printed on the route of the Gettysburg campaign. Navigate: Valley of the Shadow \u2192 Newspapers \u2192 Franklin County.",
    archiveName: "Valley of the Shadow, University of Virginia Library",
    collection: "Valley of the Shadow",
    state: "PA",
    place: "Franklin County, Pa.",
    region: "north",
    subjects: ["Newspapers", "Pennsylvania", "Chambersburg", "Gettysburg campaign"],
    locator: "Newspapers \u2192 Franklin County",
    provenance: VALLEY_PROV,
    social: ["newspaper-editor"],
    yearRange: "1857\u20131870",
    sortYear: 1863,
  }),
  indexEntry({
    id: "valley:valley-soldiers-augusta",
    url: "https://valley.lib.virginia.edu/",
    title: "Valley of the Shadow — Soldiers' Records: Augusta County, Va.",
    description:
      "Compiled service dossiers for soldiers from Augusta County, Virginia, linking men to units, engagements, and fates. Navigate: Valley of the Shadow \u2192 Soldiers' Records \u2192 Augusta County.",
    archiveName: "Valley of the Shadow, University of Virginia Library",
    collection: "Valley of the Shadow",
    state: "VA",
    place: "Augusta County, Va.",
    region: "south",
    subjects: ["Soldiers", "Rosters", "Military records"],
    locator: "Soldiers' Records \u2192 Augusta County",
    provenance: VALLEY_PROV,
    social: ["enlisted-soldier", "officer"],
    yearRange: "1861\u20131865",
    sortYear: 1862,
  }),
  indexEntry({
    id: "valley:valley-soldiers-franklin",
    url: "https://valley.lib.virginia.edu/",
    title: "Valley of the Shadow — Soldiers' Records: Franklin County, Pa.",
    description:
      "Compiled service dossiers for soldiers from Franklin County, Pennsylvania, linking men to units, engagements, and fates. Navigate: Valley of the Shadow \u2192 Soldiers' Records \u2192 Franklin County.",
    archiveName: "Valley of the Shadow, University of Virginia Library",
    collection: "Valley of the Shadow",
    state: "PA",
    place: "Franklin County, Pa.",
    region: "north",
    subjects: ["Soldiers", "Rosters", "Military records"],
    locator: "Soldiers' Records \u2192 Franklin County",
    provenance: VALLEY_PROV,
    social: ["enlisted-soldier", "officer"],
    yearRange: "1861\u20131865",
    sortYear: 1862,
  }),
  indexEntry({
    id: "docsouth:docsouth-neh",
    url: "https://docsouth.unc.edu/neh/",
    title: "Documenting the American South — North American Slave Narratives",
    description:
      "The most complete collection of published North American slave narratives: full-text autobiographies and narratives of enslaved and formerly enslaved people, including Douglass and Jacobs. Browse by author or date at the collection page.",
    archiveName: "Documenting the American South, University of North Carolina",
    collection: "North American Slave Narratives",
    region: "south",
    subjects: ["Slave narratives", "Slavery", "Autobiography"],
    provenance:
      "Collection name and scope are established public record; /neh/ is DocSouth's standard collection path, widely cited. Validate with scripts/validate-links.ts.",
    social: ["enslaved-person", "free-black-resident"],
    yearRange: "1740–1920s (publications)",
    sortYear: 1861,
  }),
  indexEntry({
    id: "docsouth:docsouth-fpn",
    url: "https://docsouth.unc.edu/fpn/",
    title:
      "Documenting the American South — First-Person Narratives of the American South",
    description:
      "Diaries, autobiographies, memoirs, and travel accounts by Southerners — with particular attention to women, enslaved people, laborers, and others less often represented in print. Full text, browsable by author.",
    archiveName: "Documenting the American South, University of North Carolina",
    collection: "First-Person Narratives of the American South",
    region: "south",
    subjects: ["Diaries", "Memoirs", "Southern life"],
    provenance:
      "Collection name and scope are established public record; /fpn/ is DocSouth's standard collection path, widely cited. Validate with scripts/validate-links.ts.",
    social: ["civilian", "woman-home-front", "enslaved-person"],
    yearRange: "1770s–1920s (publications)",
    sortYear: 1863,
  }),
  indexEntry({
    id: "demo:loc-lincoln-papers",
    url: "https://www.loc.gov/collections/abraham-lincoln-papers/",
    title: "Abraham Lincoln Papers at the Library of Congress",
    description:
      "Roughly 40,000 documents from Lincoln's White House years and before: incoming correspondence from every region and rank, drafts of speeches and proclamations. Searchable full text for much of the collection.",
    archiveName: "Library of Congress",
    collection: "Abraham Lincoln Papers",
    state: "DC",
    place: "Washington, D.C.",
    region: "national",
    subjects: ["Lincoln", "Presidency", "Correspondence"],
    provenance:
      "Collection and its loc.gov address use the verified /collections/{slug}/ pattern; the Abraham Lincoln Papers are a flagship digitized LOC collection. Validate with scripts/validate-links.ts.",
    social: ["political-actor"],
    yearRange: "1833–1916",
    sortYear: 1862,
  }),
];

// ─── Assembled set ───────────────────────────────────────────────────────────

export const DEMO_RECORDS: SourceRecord[] = [
  ...PAPERS.map(paperTitleRecord),
  ...ISSUES.map(issueRecord),
  ...DOCUMENTS,
  ...INDEXES,
];

export function demoRecordById(id: string): SourceRecord | undefined {
  return DEMO_RECORDS.find((r) => r.id === id);
}
