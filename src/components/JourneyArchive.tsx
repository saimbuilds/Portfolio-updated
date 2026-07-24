"use client";

import { useMemo, useState } from "react";
import type { Category, Entry } from "@/types/entry";
import { dayKey, formatMinutes, RECORD_START, totalMinutes } from "@/lib/format";

type ArchiveDay = { key: string; records: Entry[] };
type Filter = "all" | Category;

function evidenceHref(value: string) {
  return value.startsWith("http") ? value : `/api/evidence?path=${encodeURIComponent(value)}`;
}

export function JourneyArchive({ days }: { days: ArchiveDay[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const today = dayKey(new Date());
  const lastDay = days[0]?.key || today;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return days.map(({ key, records }) => ({
      key,
      records: records.filter((entry) => (filter === "all" || entry.category === filter) && (!needle || `${entry.title} ${entry.detail} ${entry.category}`.toLowerCase().includes(needle))),
    })).filter(({ records }) => records.length || (!needle && filter === "all"));
  }, [days, filter, query]);

  const jumpTo = (key: string) => {
    if (!key) return;
    setFilter("all");
    setQuery("");
    window.setTimeout(() => document.getElementById(`day-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  return <section className="ledger-archive ledger-shell" id="history">
    <header><span>COMPLETE HISTORY</span><div><h2>Go to any day.</h2><p>Choose a date for a direct jump, or narrow the record by the kind of work you want to see.</p></div></header>

    <div className="archive-navigator" aria-label="Timeline navigator">
      <div className="navigator-top">
        <div><span>JUMP TO DATE</span><input aria-label="Jump to a date" type="date" min={RECORD_START} max={lastDay} onChange={(event) => jumpTo(event.target.value)}/></div>
        <button type="button" onClick={() => jumpTo(today)}><i/>BACK TO TODAY</button>
      </div>
      <div className="navigator-bottom">
        <label><span>FIND A WORD OR PROJECT</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search TypeScript, Vexilot…" type="search" /></label>
        <div className="filter-pills" aria-label="Filter by activity">
          {(["all", "build", "read", "watch"] as Filter[]).map((value) => <button type="button" key={value} className={filter === value ? "is-active" : ""} onClick={() => setFilter(value)}>{value === "all" ? "Everything" : value}</button>)}
        </div>
      </div>
    </div>

    <div className="archive-result-line"><p aria-live="polite">{visible.length} {visible.length === 1 ? "day" : "days"} shown</p>{(query || filter !== "all") && <button type="button" onClick={() => { setQuery(""); setFilter("all"); }}>CLEAR FILTERS ×</button>}</div>

    {visible.length ? visible.map(({ key, records }) => <article key={key} id={`day-${key}`} data-day-reveal className={!records.length ? "is-empty-day" : ""}>
      <div><time>{new Date(`${key}T12:00:00+05:00`).toLocaleDateString("en",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}</time><strong>{formatMinutes(totalMinutes(records))}</strong>{key === today && <span className="today-marker">TODAY</span>}</div>
      <section>{records.length ? records.map((entry) => <div key={entry.id} className={entry.status === "interrupted" ? "interrupted" : ""}>
        <span>{entry.category}</span><h3>{entry.title}</h3>{entry.detail && <p>{entry.detail}</p>}
        <footer><b>{formatMinutes(entry.durationMinutes)}</b>{entry.status === "interrupted" && <i>INTERRUPTED / HONESTLY CLOSED</i>}{entry.evidenceUrls?.[0] && <a href={evidenceHref(entry.evidenceUrls[0])} target="_blank" rel="noreferrer">EVIDENCE ↗</a>}</footer>
      </div>) : <div className="day-empty-message"><h3>No work recorded.</h3><p>An empty day is part of the record too.</p></div>}</section>
    </article>) : <div className="ledger-empty">Nothing matches that filter. Clear it to return to the complete record.</div>}
  </section>;
}
