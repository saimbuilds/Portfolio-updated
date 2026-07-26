import Link from "next/link";
import type { CSSProperties } from "react";
import { JourneyMotion } from "@/components/JourneyMotion";
import { JourneyDashboard } from "@/components/JourneyDashboard";
import { SoundControl } from "@/components/SoundControl";
import { getEntries } from "@/lib/entries";
import { getGoals } from "@/lib/goals";
import { dayKey, formatMinutes, RECORD_START, totalMinutes } from "@/lib/format";

export const dynamic = "force-dynamic";

function dateFromKey(key: string) {
  return new Date(`${key}T12:00:00+05:00`);
}

export default async function JourneyPage() {
  const entries = (await getEntries()).filter((entry) => !entry.isSample && dayKey(entry.startedAt) >= RECORD_START);
  const goals = await getGoals();
  const grouped = new Map<string, typeof entries>();
  entries.forEach((entry) => grouped.set(dayKey(entry.startedAt), [...(grouped.get(dayKey(entry.startedAt)) || []), entry]));

  const todayKey = dayKey(new Date());
  const today = grouped.get(todayKey) || [];
  const recentKeys = Array.from({ length: 7 }, (_, index) => {
    const date = dateFromKey(todayKey);
    date.setDate(date.getDate() - index);
    return date.toISOString().slice(0, 10);
  }).filter((key) => key >= RECORD_START);
  const allKeys = [...new Set([...recentKeys, ...grouped.keys()])].sort((a, b) => b.localeCompare(a));
  const days = allKeys.map((key) => ({ key, records: grouped.get(key) || [] }));
  const recentDays = recentKeys.map((key) => ({ key, records: grouped.get(key) || [] }));
  const lifetime = totalMinutes(entries);
  const weekTotal = totalMinutes(recentDays.flatMap((day) => day.records));
  const activeDays = [...grouped.values()].filter((records) => records.length > 0).length;

  return <main className="ledger-page">
    <JourneyMotion />
    <header className="ledger-nav">
      <Link href="/">S.</Link>
      <span>LIVING WORK RECORD<br/><b>UPDATES FROM STUDIO</b></span>
      <nav><a href="#history">HISTORY</a><Link href="/">PORTFOLIO ↗</Link><SoundControl /></nav>
    </header>

    <section className="record-intro ledger-shell">
      <div className="record-intro-copy">
        <span className="record-eyebrow"><i/> LIVE / {todayKey}</span>
        <h1>What I did.<br/><em>Day by day.</em></h1>
        <p>This page updates when I finish a session in Studio. No polished story, just what I worked on, how long I spent, and when it happened.</p>
        <a href="#history">SEE THE FULL HISTORY ↓</a>
      </div>

      <aside className="today-card">
        <header><div><span>TODAY</span><time>{dateFromKey(todayKey).toLocaleDateString("en", { weekday: "long", day: "2-digit", month: "long" })}</time></div><strong>{formatMinutes(totalMinutes(today))}</strong></header>
        <div className="today-sessions">
          {today.length ? today.map((entry) => <article key={entry.id}><span className={`record-dot record-dot-${entry.category}`}/><div><small>{entry.category} · {formatMinutes(entry.durationMinutes)}</small><h2>{entry.title}</h2>{entry.detail && <p>{entry.detail}</p>}</div></article>) : <div className="today-empty"><span>00</span><div><strong>Nothing logged yet.</strong><p>Today stays empty until the work is done.</p></div></div>}
        </div>
      </aside>
    </section>

    <section className="record-numbers ledger-shell" aria-label="Record summary">
      <div><span>ALL TIME</span><strong>{formatMinutes(lifetime)}</strong><small>Total focused time</small></div>
      <div><span>LAST 7 DAYS</span><strong>{formatMinutes(weekTotal)}</strong><small>Recent focused time</small></div>
      <div><span>RECORDED DAYS</span><strong>{activeDays}</strong><small>Days with completed work</small></div>
      <div><span>DAY ZERO</span><strong>{new Date(`${RECORD_START}T12:00:00+05:00`).toLocaleDateString("en", { day: "2-digit", month: "short" })}</strong><small>Where this record began</small></div>
    </section>

    <JourneyDashboard goals={goals} entries={entries} days={days} />
    <footer className="ledger-footer ledger-shell"><span>MUHAMMAD SAIM / LIVING RECORD</span><Link href="/">RETURN TO PORTFOLIO ↗</Link></footer>
  </main>;
}
