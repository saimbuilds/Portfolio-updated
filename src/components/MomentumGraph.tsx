"use client";

import { useMemo, useState } from "react";
import type { Entry } from "@/types/entry";
import { dayKey, formatMinutes, RECORD_START } from "@/lib/format";

type Period = "daily" | "weekly" | "monthly" | "yearly";

type MomentumGraphProps = {
  entries: Entry[];
  onSelectDay?: (key: string) => void;
  selectedDayKey?: string | null;
};

type DayPoint = {
  key: string;        // YYYY-MM-DD
  dayLabel: string;   // "Mon, Jul 20"
  periodLabel: string; // group label e.g. "Jul 20 – Jul 26" or "July 2026"
  minutes: number;
  count: number;
  titles: string[];
  x: number;
  y: number;
};

export function MomentumGraph({ entries, onSelectDay, selectedDayKey }: MomentumGraphProps) {
  const [period, setPeriod] = useState<Period>("daily");
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const W = 900, H = 280, PX = 52, PY = 40;
  const chartW = W - PX * 2;
  const chartH = H - PY * 2;
  const baseline = H - PY;

  const { points, pathD, areaD, maxMinutes, avgMinutes, peakDay, xLabels } = useMemo(() => {
    const now = new Date();
    const todayPKT = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    todayPKT.setUTCHours(23, 59, 59, 999);

    const start = new Date(`${RECORD_START}T00:00:00+05:00`);

    // Entry map by PKT day key
    const entryMap = new Map<string, Entry[]>();
    entries.forEach((e) => {
      if (e.isSample || e.status === "active") return;
      const k = dayKey(e.startedAt);
      entryMap.set(k, [...(entryMap.get(k) ?? []), e]);
    });

    // Build full day list from start to today (one dot per day always)
    const days: Array<{ key: string; date: Date; minutes: number; titles: string[]; count: number }> = [];
    const cursor = new Date(start);
    while (cursor <= todayPKT) {
      const k = dayKey(cursor);
      const dayEntries = entryMap.get(k) ?? [];
      days.push({
        key: k,
        date: new Date(cursor),
        minutes: dayEntries.reduce((s, e) => s + e.durationMinutes, 0),
        titles: dayEntries.map((e) => e.title),
        count: dayEntries.length,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    if (days.length === 0) {
      return { points: [] as DayPoint[], pathD: "", areaD: "", maxMinutes: 0, avgMinutes: 0, peakDay: null, xLabels: [] as { x: number; label: string }[] };
    }

    const maxMins = Math.max(60, ...days.map((d) => d.minutes));
    const avgMins = Math.round(days.reduce((s, d) => s + d.minutes, 0) / days.length);
    const peakD = days.reduce((best, d) => (d.minutes > best.minutes ? d : best), days[0]);

    // Compute per-day period label based on selected period
    function getPeriodLabel(date: Date, idx: number): string {
      if (period === "daily") {
        return date.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
      } else if (period === "weekly") {
        // Find Monday of this day's week
        const dow = date.getDay();
        const mon = new Date(date);
        mon.setDate(date.getDate() - (dow === 0 ? 6 : dow - 1));
        const sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);
        return `${mon.toLocaleDateString("en", { month: "short", day: "numeric" })} – ${sun.toLocaleDateString("en", { month: "short", day: "numeric" })}`;
      } else if (period === "monthly") {
        return date.toLocaleDateString("en", { month: "long", year: "numeric" });
      } else {
        return String(date.getFullYear());
      }
      return String(idx);
    }

    // Filter which days to actually show as dots based on period zoom
    // In all modes, we ALWAYS show individual day dots
    // but in weekly/monthly/yearly we space them proportionally
    // and show grouped x-axis labels
    const totalDays = days.length;
    const pts: DayPoint[] = days.map((d, i) => {
      const x = totalDays === 1
        ? PX + chartW / 2
        : PX + (i / (totalDays - 1)) * chartW;
      const y = baseline - (d.minutes / maxMins) * chartH;
      return {
        key: d.key,
        dayLabel: d.date.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" }),
        periodLabel: getPeriodLabel(d.date, i),
        minutes: d.minutes,
        count: d.count,
        titles: d.titles,
        x,
        y,
      };
    });

    // Smooth cubic bezier curve through all points
    let path = "";
    if (pts.length === 1) {
      path = `M ${pts[0].x} ${pts[0].y}`;
    } else {
      path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        // Catmull-Rom to cubic bezier control points
        const prev = pts[Math.max(0, i - 1)];
        const next = pts[Math.min(pts.length - 1, i + 2)];
        const cp1x = p0.x + (p1.x - prev.x) / 6;
        const cp1y = p0.y + (p1.y - prev.y) / 6;
        const cp2x = p1.x - (next.x - p0.x) / 6;
        const cp2y = p1.y - (next.y - p0.y) / 6;
        path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
      }
    }

    const areaPath = pts.length > 1
      ? `${path} L ${pts[pts.length - 1].x.toFixed(1)} ${baseline} L ${pts[0].x.toFixed(1)} ${baseline} Z`
      : "";

    // Build x-axis group labels (show at period boundaries)
    const labelsMap = new Map<string, number>();
    pts.forEach((pt) => {
      if (!labelsMap.has(pt.periodLabel)) {
        labelsMap.set(pt.periodLabel, pt.x);
      }
    });
    const xLabels = Array.from(labelsMap.entries()).map(([label, x]) => ({ label, x }));

    return { points: pts, pathD: path, areaD: areaPath, maxMinutes: maxMins, avgMinutes: avgMins, peakDay: peakD, xLabels };
  }, [entries, period, PX, chartW, chartH, baseline]);

  const hovered = hoveredKey ? points.find((p) => p.key === hoveredKey) ?? null : null;

  return (
    <div className="momentum-graph-card">
      <header className="momentum-header">
        <div>
          <span>FULL JOURNEY · WORK VELOCITY</span>
          <h2>Momentum Curve</h2>
        </div>
        <div className="momentum-controls">
          <div className="period-pills" aria-label="Select graph period">
            {(["daily", "weekly", "monthly", "yearly"] as Period[]).map((p) => (
              <button key={p} type="button" className={period === p ? "is-active" : ""} onClick={() => setPeriod(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <div className="momentum-stats">
            <div className="stat-box">
              <strong>{formatMinutes(avgMinutes)}</strong>
              <small>DAILY AVG</small>
            </div>
            <div className="stat-box">
              <strong>{formatMinutes(maxMinutes)}</strong>
              <small>PEAK DAY</small>
            </div>
          </div>
        </div>
      </header>

      <div className="momentum-canvas-wrapper">
        <svg viewBox={`0 0 ${W} ${H}`} className="momentum-svg" role="img" aria-label="Work Velocity Curve">
          <defs>
            <linearGradient id="momentumAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a14335" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#a14335" stopOpacity="0.02" />
            </linearGradient>
            <filter id="nodeGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Horizontal guides */}
          <line x1={PX} y1={PY} x2={W - PX} y2={PY} className="graph-guide-line" />
          <line x1={PX} y1={PY + chartH * 0.5} x2={W - PX} y2={PY + chartH * 0.5} className="graph-guide-line" />
          <line x1={PX} y1={baseline} x2={W - PX} y2={baseline} className="graph-base-line" />

          {/* Y-axis labels */}
          <text x={PX - 6} y={PY + 4} className="graph-axis-label" textAnchor="end">{formatMinutes(maxMinutes)}</text>
          <text x={PX - 6} y={PY + chartH * 0.5 + 4} className="graph-axis-label" textAnchor="end">{formatMinutes(maxMinutes / 2)}</text>
          <text x={PX - 6} y={baseline + 4} className="graph-axis-label" textAnchor="end">0</text>

          {/* X-axis period group labels */}
          {xLabels.map(({ label, x }) => (
            <text key={label} x={x} y={H - 6} className="graph-axis-label" textAnchor="middle">{label}</text>
          ))}

          {/* Area fill */}
          {areaD && <path d={areaD} fill="url(#momentumAreaGrad)" />}

          {/* Curved line */}
          {pathD && <path d={pathD} fill="none" stroke="#a14335" strokeWidth="2" className="momentum-curve-line" />}

          {/* Per-day dots: always visible */}
          {points.map((pt) => {
            const isSelected = selectedDayKey === pt.key;
            const isHovered = hoveredKey === pt.key;
            const big = isHovered || isSelected;
            return (
              <g
                key={pt.key}
                className={`graph-node${isSelected ? " is-selected" : ""}${isHovered ? " is-hovered" : ""}`}
                onClick={() => onSelectDay?.(pt.key)}
                onMouseEnter={() => setHoveredKey(pt.key)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                {/* Invisible hit target */}
                <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />
                {/* Visible dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={big ? 7 : (pt.minutes > 0 ? 4 : 2.5)}
                  className="node-circle"
                  opacity={pt.minutes === 0 ? 0.4 : 1}
                  filter={isHovered ? "url(#nodeGlow)" : undefined}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover tooltip */}
      <footer className="momentum-footer">
        {hovered ? (
          <div className="tooltip-content">
            <div className="tooltip-head">
              <strong>{hovered.dayLabel}</strong>
              {period !== "daily" && <span className="tooltip-period-group"> · {hovered.periodLabel}</span>}
              &ensp;{hovered.minutes ? formatMinutes(hovered.minutes) : "No work recorded"}&ensp;
              ({hovered.count} {hovered.count === 1 ? "session" : "sessions"})
            </div>
            {hovered.titles.length > 0 && (
              <div className="tooltip-titles">
                {Array.from(new Set<string>(hovered.titles)).slice(0, 5).map((t, i) => (
                  <span key={i} className="tooltip-title-item">• {t}</span>
                ))}
                {hovered.titles.length > 5 && (
                  <small className="more-titles">+{hovered.titles.length - 5} more</small>
                )}
              </div>
            )}
          </div>
        ) : (
          <span className="tooltip-hint">
            Hover any dot to inspect that day: peaks show heavy work, dips show lighter days
          </span>
        )}
      </footer>
    </div>
  );
}
