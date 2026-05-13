import { useEffect, useState } from "react";
import { api } from "../api";
import type { TaskStatus } from "../types";

type DashboardResponse = {
  counts: Record<TaskStatus, number>;
  overdueCount: number;
  tasks: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    dueDate: string | null;
    project: { id: string; name: string };
  }>;
};

export function Dashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api<DashboardResponse>("/dashboard")
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load dashboard");
      });
    return () => {
      alive = false;
    };
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading…</p>;

  return (
    <div className="stack">
      <h2>Dashboard</h2>

      <div className="cards">
        <div className="card">
          <div className="cardTitle">TODO</div>
          <div className="cardValue">{data.counts.TODO}</div>
        </div>
        <div className="card">
          <div className="cardTitle">In Progress</div>
          <div className="cardValue">{data.counts.IN_PROGRESS}</div>
        </div>
        <div className="card">
          <div className="cardTitle">Done</div>
          <div className="cardValue">{data.counts.DONE}</div>
        </div>
        <div className="card">
          <div className="cardTitle">Overdue</div>
          <div className="cardValue">{data.overdueCount}</div>
        </div>
      </div>

      <h3 className="subheading">My assigned tasks</h3>
      <div className="list">
        {data.tasks.length === 0 ? <div className="muted">No tasks assigned.</div> : null}
        {data.tasks.map((t) => (
          <div key={t.id} className="listRow">
            <div className="listMain">
              <div className="listTitle">{t.title}</div>
              <div className="muted">
                {t.project.name}
                {t.dueDate ? ` • Due ${new Date(t.dueDate).toLocaleDateString()}` : ""}
              </div>
            </div>
            <div className="pill">{t.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
