import Link from "next/link";
import { getEntries } from "@/lib/entries";
import { Studio } from "@/components/Studio";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const entries = await getEntries();
  return (
    <main className="studio-page">
      <header className="studio-nav shell"><Link href="/" className="wordmark">SAIM<span>/</span></Link><span>Private working surface</span><Link href="/">View public record ↗</Link></header>
      <Studio initialEntries={entries} />
    </main>
  );
}
