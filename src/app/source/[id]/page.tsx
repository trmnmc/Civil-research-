import { SourceWorkspace } from "@/components/app/SourceWorkspace";

export default async function SourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-5xl">
      <SourceWorkspace recordId={decodeURIComponent(id)} />
    </div>
  );
}
