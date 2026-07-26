import type { Entry } from "@/types/entry";
import { formatMinutes, longDate } from "@/lib/format";

export function PublicFeed({ entries }: { entries: Entry[] }) {
  return (
    <div className="public-feed">
      {entries.length === 0 ? (
        <p className="empty-copy">Nothing logged yet. Honesty also means starting at zero.</p>
      ) : entries.slice(0, 8).map((entry, index) => (
        <article className="feed-entry" key={entry.id} data-reveal>
          <div className="feed-rail"><span>{String(index + 1).padStart(2, "0")}</span><i /></div>
          <div className="feed-time"><time>{longDate(entry.startedAt)}</time><span>{new Date(entry.startedAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</span></div>
          <div className="feed-body">
            <div className="feed-label"><span className={`category category-${entry.category}`}>{entry.category}</span><span>{formatMinutes(entry.durationMinutes)} invested</span>{entry.isSample && <span className="sample-label">sample: replace in studio</span>}</div>
            <h3>{entry.title}</h3>
            {entry.detail && <p>{entry.detail}</p>}
            {entry.evidenceUrl && <a href={entry.evidenceUrl} target="_blank" rel="noreferrer">evidence ↗</a>}
          </div>
        </article>
      ))}
    </div>
  );
}
