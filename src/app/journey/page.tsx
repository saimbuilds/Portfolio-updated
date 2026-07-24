import Link from "next/link";
import { JourneyMotion } from "@/components/JourneyMotion";
import { getEntries } from "@/lib/entries";
import { dayKey, formatMinutes, totalMinutes } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function JourneyPage() {
  const entries = (await getEntries()).filter((entry) => !entry.isSample);
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    const key = dayKey(date);
    const dayEntries = entries.filter((entry) => dayKey(entry.startedAt) === key);
    return { date, key, entries: dayEntries, minutes: totalMinutes(dayEntries) };
  });

  return (
    <main className="journey-page">
      <JourneyMotion />
      <header className="journey-page-nav">
        <Link href="/" className="journey-home">S.</Link>
        <span>THE PUBLIC JOURNEY<br /><b>ROLLING 14-DAY WINDOW</b></span>
        <Link href="/studio">ADD TODAY ↗</Link>
      </header>

      <section className="journey-hero">
        <div className="journey-shell">
          <div className="journey-overline"><span>STARTING NOW</span><span>{days[0].date.toLocaleDateString("en", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase()}</span></div>
          <h1><span>Fourteen days.</span><span><em>Nothing edited out.</em></span></h1>
          <p>This page moves with me. Every day enters at the top; every quiet day stays visible. Come back later and rewind what I actually did—not what I remember doing.</p>

          <nav className="journey-calendar" aria-label="Choose a day">
            {days.map((day, index) => (
              <a key={day.key} href={`#day-${day.key}`} className={day.entries.length ? "has-evidence" : ""}>
                <span>{String(14 - index).padStart(2, "0")}</span>
                <time>{day.date.toLocaleDateString("en", { day: "2-digit", month: "short" })}</time>
                <i>{day.entries.length || "·"}</i>
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="journey-days journey-shell">
        {days.map((day, index) => (
          <article className={`journey-day ${day.entries.length ? "has-entries" : "is-empty"}`} id={`day-${day.key}`} key={day.key}>
            <header data-day-reveal>
              <span>DAY {String(14 - index).padStart(2, "0")}</span>
              <time>{day.date.toLocaleDateString("en", { weekday: "long", day: "2-digit", month: "long" })}</time>
              <strong>{formatMinutes(day.minutes)}</strong>
            </header>
            {day.entries.length ? (
              <div className="journey-entry-list">
                {day.entries.map((entry) => (
                  <div key={entry.id} data-day-reveal>
                    <time>{new Date(entry.startedAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</time>
                    <span>{entry.category}</span>
                    <div><h2>{entry.title}</h2>{entry.detail && <p>{entry.detail}</p>}</div>
                    <strong>{formatMinutes(entry.durationMinutes)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="journey-empty" data-day-reveal><strong>—</strong><p>No evidence recorded.<br />The blank remains part of the story.</p></div>
            )}
          </article>
        ))}
      </section>

      <footer className="journey-page-footer journey-shell"><Link href="/">BACK TO THE PRODUCT STORY ←</Link><span>THE WINDOW MOVES EVERY DAY</span></footer>
    </main>
  );
}
