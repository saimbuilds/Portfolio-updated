import { getEntries } from "@/lib/entries";
import { Studio } from "@/components/Studio";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const entries = await getEntries();
  return (
    <main className="studio-page">
      <Studio initialEntries={entries} />
    </main>
  );
}
