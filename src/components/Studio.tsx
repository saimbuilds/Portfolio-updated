"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Category, Entry } from "@/types/entry";
import { categories } from "@/types/entry";
import { dayKey, formatMinutes, totalMinutes } from "@/lib/format";

function localDateTime() {
  const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000);
  return now.toISOString().slice(0, 16);
}

export function Studio({ initialEntries }: { initialEntries: Entry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [category, setCategory] = useState<Category>("learn");
  const [duration, setDuration] = useState(60);
  const [startedAt, setStartedAt] = useState(localDateTime());
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const todayEntries = useMemo(() => entries.filter((entry) => dayKey(entry.startedAt) === dayKey(new Date())), [entries]);
  const todayTotal = totalMinutes(todayEntries);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setStatus("");
    const response = await fetch("/api/entries", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ startedAt: new Date(startedAt).toISOString(), durationMinutes: duration, category, title, detail, evidenceUrl }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) { setStatus(data.error || "Could not save that entry."); return; }
    setEntries((current) => [data, ...current]);
    setTitle(""); setDetail(""); setEvidenceUrl(""); setStartedAt(localDateTime());
    setStatus("Recorded. That block now exists outside your memory.");
  }

  async function remove(id: string) {
    if (!window.confirm("Remove this entry from the record?")) return;
    const response = await fetch(`/api/entries?id=${id}`, { method: "DELETE", headers: { "x-admin-key": adminKey } });
    if (response.ok) setEntries((current) => current.filter((entry) => entry.id !== id));
    else setStatus("Could not remove it. Check the studio key.");
  }

  return (
    <div className="studio-shell shell">
      <section className="studio-intro"><div><p className="overline">Friday / live session</p><h1>What did you<br /><em>give your time to?</em></h1></div><div className="studio-total"><div className="time-ring" style={{ "--progress": `${Math.min(todayTotal / 480, 1) * 360}deg` } as React.CSSProperties}><span>{formatMinutes(todayTotal)}</span><small>of 8h intention</small></div><p>Today is not a score.<br />It is a record.</p></div></section>

      <section className="capture">
        <div className="capture-heading"><span>New time block</span><span>01 / capture</span></div>
        <form onSubmit={submit}>
          <div className="category-picker">{categories.map((item) => <button className={category === item ? "active" : ""} type="button" key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
          <div className="field title-field"><label htmlFor="title">What moved?</label><input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="A clear, honest sentence" required maxLength={100} /></div>
          <div className="capture-grid">
            <div className="field"><label htmlFor="startedAt">Started</label><input id="startedAt" type="datetime-local" value={startedAt} onChange={(event) => setStartedAt(event.target.value)} required /></div>
            <div className="field duration-field"><label htmlFor="duration">Time invested</label><input id="duration" type="number" min="1" max="1440" value={duration} onChange={(event) => setDuration(Number(event.target.value))} required /><span>minutes</span></div>
          </div>
          <div className="field"><label htmlFor="detail">What changed in your understanding?</label><textarea id="detail" value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="Optional, but this is the part your future self will value." maxLength={500} /></div>
          <div className="capture-grid last-row">
            <div className="field"><label htmlFor="evidence">Evidence / link</label><input id="evidence" type="url" value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} placeholder="GitHub, photo, note..." /></div>
            <div className="field"><label htmlFor="key">Studio key</label><input id="key" type="password" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} placeholder="Only needed when deployed" /></div>
          </div>
          <div className="form-submit"><p className={status ? "visible" : ""}>{status || "Entry status"}</p><button type="submit" disabled={saving}>{saving ? "Recording..." : "Commit this block"}<span>↗</span></button></div>
        </form>
      </section>

      <section className="today-list"><div className="capture-heading"><span>Today’s trail</span><span>{todayEntries.length.toString().padStart(2, "0")} moments / {formatMinutes(todayTotal)}</span></div>{todayEntries.length === 0 ? <p className="studio-empty">The page is quiet. Add the first honest block.</p> : todayEntries.map((entry) => <article key={entry.id}><time>{new Date(entry.startedAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</time><span className={`category category-${entry.category}`}>{entry.category}</span><div><h3>{entry.title}</h3>{entry.detail && <p>{entry.detail}</p>}</div><strong>{formatMinutes(entry.durationMinutes)}</strong><button onClick={() => remove(entry.id)} aria-label={`Delete ${entry.title}`}>×</button></article>)}</section>
    </div>
  );
}
