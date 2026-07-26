"use client";

import { useState } from "react";
import type { Entry, Goal } from "@/types/entry";
import { WeeklyGoals } from "@/components/WeeklyGoals";
import { ActivityGrid } from "@/components/ActivityGrid";
import { JourneyArchive } from "@/components/JourneyArchive";

type ArchiveDay = { key: string; records: Entry[] };

type JourneyDashboardProps = {
  goals: Goal[];
  entries: Entry[];
  days: ArchiveDay[];
};

export function JourneyDashboard({ goals, entries, days }: JourneyDashboardProps) {
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const handleDaySelect = (key: string) => {
    setSelectedDayKey(key);
    window.setTimeout(() => {
      const el = document.getElementById(`day-${key}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <div className="journey-dashboard-wrapper">
      {/* 1. Public Weekly Goals */}
      <section className="dashboard-section ledger-shell">
        <WeeklyGoals goals={goals} entries={entries} />
      </section>

      {/* 2. 365-Day Consistency Heatmap */}
      <section className="dashboard-visuals ledger-shell">
        <div className="visual-card activity-matrix-card">
          <ActivityGrid
            entries={entries}
            selectedDayKey={selectedDayKey}
            onSelectDay={handleDaySelect}
          />
        </div>
      </section>

      {/* 3. Detailed Day History Archive */}
      <JourneyArchive days={days} selectedDayKey={selectedDayKey} />
    </div>
  );
}
