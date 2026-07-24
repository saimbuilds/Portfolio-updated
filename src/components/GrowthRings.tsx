"use client";

import { useMemo, useState } from "react";
import type { Category, Entry } from "@/types/entry";
import { dayKey, formatMinutes, RECORD_START } from "@/lib/format";

const colors: Record<Category, string> = { build: "#b7472a", read: "#9c7428", watch: "#52777d" };

function point(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle - 90) * Math.PI / 180; return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function arc(r: number, start: number, end: number) {
  const a = point(300, 300, r, end); const b = point(300, 300, r, start);
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${end - start <= 180 ? 0 : 1} 0 ${b.x} ${b.y}`;
}

export function GrowthRings({ entries }: { entries: Entry[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const days = useMemo(() => {
    const start = new Date(`${RECORD_START}T00:00:00+05:00`); const today = new Date();
    const count = Math.max(1, Math.ceil((today.getTime() - start.getTime()) / 86_400_000) + 1);
    return Array.from({ length: count }, (_, index) => {
      const date = new Date(start); date.setDate(date.getDate() + index); const key = dayKey(date);
      const records = entries.filter((entry) => dayKey(entry.startedAt) === key);
      return { key, date, records, minutes: records.reduce((n, entry) => n + entry.durationMinutes, 0), index };
    });
  }, [entries]);
  const weekCount = Math.max(8, Math.ceil(days.length / 7));
  const active = days.find((day) => day.key === selected) || days[days.length - 1];

  return <div className="growth-system">
    <div className="growth-canvas">
      <svg viewBox="0 0 600 600" role="img" aria-label="Focused-time growth rings, one arc per day">
        <defs><filter id="ringGlow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        {Array.from({ length: weekCount }, (_, week) => <circle key={week} cx="300" cy="300" r={90 + week * 19} className="ring-guide" />)}
        {days.map((day) => {
          const week = Math.floor(day.index / 7); const weekday = day.index % 7; const start = weekday * (360 / 7) + 2; const end = (weekday + 1) * (360 / 7) - 2;
          const radius = 90 + week * 19; let offset = 0;
          return <g key={day.key} className={selected === day.key ? "is-selected" : ""} onClick={() => setSelected(day.key)} tabIndex={0} role="button" aria-label={`${day.key}, ${formatMinutes(day.minutes)}`}>
            {(["build", "read", "watch"] as Category[]).map((category) => {
              const minutes = day.records.filter((e) => e.category === category).reduce((n, e) => n + e.durationMinutes, 0); if (!minutes) return null;
              const width = Math.min(15, 4 + minutes / 24); const path = <path key={category} d={arc(radius + offset, start, end)} stroke={colors[category]} strokeWidth={width} className="day-arc" filter={day.key === selected ? "url(#ringGlow)" : undefined} />; offset += width * .3; return path;
            })}
            {!day.minutes && <path d={arc(radius, start, end)} className="empty-arc" />}
          </g>;
        })}
        <circle cx="300" cy="300" r="63" className="ring-core"/><text x="300" y="292" textAnchor="middle" className="ring-core-title">DAY {days.length}</text><text x="300" y="318" textAnchor="middle" className="ring-core-time">{formatMinutes(entries.reduce((n,e)=>n+e.durationMinutes,0))}</text>
      </svg>
      <span className="ring-axis ring-axis-top">05:00 / DAYS BEGIN</span><span className="ring-axis ring-axis-bottom">24 JUL 2026 / ORIGIN</span>
    </div>
    <aside className="growth-inspector"><span>SELECTED DAY / {active?.key}</span><strong>{formatMinutes(active?.minutes || 0)}</strong><p>{active?.records.length ? `${active.records.length} approved ${active.records.length === 1 ? "record" : "records"}` : "No approved evidence. The gap remains visible."}</p><div>{(["build","read","watch"] as Category[]).map((category)=><i key={category}><b style={{background:colors[category]}}/>{category}<em>{formatMinutes(active?.records.filter(e=>e.category===category).reduce((n,e)=>n+e.durationMinutes,0)||0)}</em></i>)}</div></aside>
  </div>;
}
