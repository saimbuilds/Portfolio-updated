"use client";

import type { Entry, Goal } from "@/types/entry";
import { computeGoalProgress } from "@/lib/goalUtils";
import { formatMinutes } from "@/lib/format";

type WeeklyGoalsProps = {
  goals: Goal[];
  entries: Entry[];
};

export function WeeklyGoals({ goals, entries }: WeeklyGoalsProps) {
  if (!goals.length) {
    return (
      <section className="weekly-goals-card empty-goals">
        <header>
          <span>WEEKLY TARGETS</span>
          <h2>Public Accountability Goals</h2>
        </header>
        <p>No active weekly goals set. Add goals in Studio to track public progress here.</p>
      </section>
    );
  }

  return (
    <section className="weekly-goals-card">
      <header className="weekly-goals-header">
        <div>
          <span>THIS WEEK'S COMMITMENTS</span>
          <h2>Weekly Goals & Progress</h2>
        </div>
        <p className="weekly-goals-sub">
          Target metrics backed by verified focus sessions. Resets weekly.
        </p>
      </header>

      <div className="goals-grid">
        {goals.map((goal) => {
          const current = computeGoalProgress(goal, entries);
          const isMinutes = goal.metric === "minutes";
          const progressPercent = Math.min(100, Math.round((current / goal.target) * 100));
          const isAchieved = current >= goal.target;

          const currentLabel = isMinutes ? formatMinutes(current) : String(current);
          const targetLabel = isMinutes ? formatMinutes(goal.target) : String(goal.target);

          return (
            <article key={goal.id} className={`goal-item ${isAchieved ? "is-achieved" : ""}`}>
              <div className="goal-item-top">
                <div>
                  <span className={`goal-badge category-${goal.category || "general"}`}>
                    {goal.category || goal.metric}
                  </span>
                  <h3>{goal.title}</h3>
                </div>
                <div className="goal-status">
                  {isAchieved ? (
                    <span className="badge-achieved">✓ ACHIEVED</span>
                  ) : (
                    <span className="badge-percent">{progressPercent}%</span>
                  )}
                </div>
              </div>

              <div className="goal-progress-bar">
                <div
                  className="goal-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="goal-item-bottom">
                <span>
                  <strong>{currentLabel}</strong> / {targetLabel}
                </span>
                <small>{goal.period.toUpperCase()} TARGET</small>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
