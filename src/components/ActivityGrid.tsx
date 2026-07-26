"use client";

import { useMemo, useState } from "react";
import type { Entry } from "@/types/entry";
import { dayKey, formatMinutes, RECORD_START } from "@/lib/format";

type ActivityGridProps = {
  entries: Entry[];
  onSelectDay?: (dateKey: string) => void;
  selectedDayKey?: string | null;
};

export function ActivityGrid({ entries, onSelectDay, selectedDayKey }: ActivityGridProps) {
  const [hoveredDay, setHoveredDay] = useState<{ dateStr: string; minutes: number; count: number; titles?: string[] } | null>(null);

  const { gridDays, stats } = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    // Map entries by date key YYYY-MM-DD
    const entryMap = new Map<string, { minutes: number; count: number }>();
    entries.forEach((entry) => {
      if (entry.isSample || entry.status === "active") return;
      const key = dayKey(entry.startedAt);
      const existing = entryMap.get(key) || { minutes: 0, count: 0 };
      entryMap.set(key, {
        minutes: existing.minutes + entry.durationMinutes,
        count: existing.count + 1,
      });
    });

    // Generate grid for past 52 weeks (364 days)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    // Align start to nearest previous Sunday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const days: Array<{
      key: string;
      date: Date;
      minutes: number;
      count: number;
      level: 0 | 1 | 2 | 3;
      entries: Entry[];
    }> = [];

    const cursor = new Date(startDate);
    let currentStreak = 0;
    let longestStreak = 0;
    let activeDaysCount = 0;
    let totalMinutesCount = 0;

    let tempStreak = 0;

    while (cursor <= today) {
      const key = dayKey(cursor);
      const data = entryMap.get(key) || { minutes: 0, count: 0 };
      const dayEntries = entries.filter((e) => !e.isSample && e.status !== "active" && dayKey(e.startedAt) === key);
      const minutes = data.minutes;
      const count = data.count;

      let level: 0 | 1 | 2 | 3 = 0;
      if (minutes > 120) level = 3;
      else if (minutes > 60) level = 2;
      else if (minutes > 0) level = 1;

      if (minutes > 0 && key >= RECORD_START) {
        activeDaysCount++;
        totalMinutesCount += minutes;
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else if (key >= RECORD_START) {
        tempStreak = 0;
      }

      days.push({
        key,
        date: new Date(cursor),
        minutes,
        count,
        level,
        entries: dayEntries,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    // Compute current active streak starting from today going back
    const todayKey = dayKey(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = dayKey(yesterday);

    let streakCursor = entryMap.has(todayKey) ? today : entryMap.has(yesterdayKey) ? yesterday : null;
    if (streakCursor) {
      const checkDate = new Date(streakCursor);
      while (true) {
        const k = dayKey(checkDate);
        if ((entryMap.get(k)?.minutes || 0) > 0) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return {
      gridDays: days,
      stats: {
        currentStreak,
        longestStreak,
        activeDaysCount,
        totalMinutesCount,
      },
    };
  }, [entries]);

  // Group days into columns of 7 days
  const weeks = useMemo(() => {
    const result: typeof gridDays[] = [];
    for (let i = 0; i < gridDays.length; i += 7) {
      result.push(gridDays.slice(i, i + 7));
    }
    return result;
  }, [gridDays]);

  return (
    <div className="activity-grid-card">
      <header className="activity-grid-header">
        <div>
          <span>YEAR AT A GLANCE</span>
          <h2>Consistency Matrix</h2>
        </div>
        <div className="activity-grid-stats">
          <div className="stat-box">
            <strong>{stats.currentStreak}</strong>
            <small>DAY STREAK</small>
          </div>
          <div className="stat-box">
            <strong>{stats.longestStreak}</strong>
            <small>BEST STREAK</small>
          </div>
          <div className="stat-box">
            <strong>{stats.activeDaysCount}</strong>
            <small>ACTIVE DAYS</small>
          </div>
        </div>
      </header>

      <div className="activity-matrix-wrapper">
        <div className="activity-matrix">
          {weeks.map((week, wIndex) => (
            <div key={wIndex} className="matrix-column">
              {week.map((day) => {
                const isSelected = selectedDayKey === day.key;
                return (
                  <button
                    key={day.key}
                    type="button"
                    className={`matrix-tile level-${day.level} ${isSelected ? "is-selected" : ""}`}
                    onClick={() => onSelectDay?.(day.key)}
                    onMouseEnter={() =>
                      setHoveredDay({
                        dateStr: day.date.toLocaleDateString("en", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        }),
                        minutes: day.minutes,
                        count: day.count,
                        titles: day.entries.map((e) => e.title),
                      })
                    }
                    onMouseLeave={() => setHoveredDay(null)}
                    aria-label={`${day.key}: ${formatMinutes(day.minutes)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <footer className="activity-grid-footer">
        <div className="hover-tooltip">
          {hoveredDay ? (
            <div className="tooltip-content">
              <div className="tooltip-head">
                <strong>{hoveredDay.dateStr}:</strong> {hoveredDay.minutes ? formatMinutes(hoveredDay.minutes) : "No work recorded"} ({hoveredDay.count} {hoveredDay.count === 1 ? "session" : "sessions"})
              </div>
              {hoveredDay.titles && hoveredDay.titles.length > 0 && (
                <div className="tooltip-titles">
                  {hoveredDay.titles.map((t, idx) => (
                    <span key={idx} className="tooltip-title-item">• {t}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="tooltip-hint">Hover or click any square to inspect that day</span>
          )}
        </div>
        <div className="matrix-legend">
          <span>Less</span>
          <i className="level-0" />
          <i className="level-1" />
          <i className="level-2" />
          <i className="level-3" />
          <span>More</span>
        </div>
      </footer>
    </div>
  );
}
