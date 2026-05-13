import { useEffect, useState } from "react";
import { api } from "../api";
import type { ProjectSummary, User } from "../types";
import { ProjectDetail } from "./ProjectDetail";

type Props = {
  me: User;
};

export function Projects({ me }: Props) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<ProjectSummary | null>(null);

  async function refresh() {
    setError(null);
    const data = await api<{ projects: ProjectSummary[] }>("/projects");
    setProjects(data.projects);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await refresh();
        if (alive) setLoading(false);
      } catch (e) {
        if (alive) {
          setError(e instanceof Error ? e.message : "Failed to load projects");
          setLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function createProject() {
    setError(null);
    try {
      await api<{ project: ProjectSummary }>("/projects", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setName("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create project");
    }
  }

  if (selected) {
    return (
      <ProjectDetail
        projectId={selected.id}
        me={me}
        onBack={async () => {
          setSelected(null);
          await refresh();
        }}
      />
    );
  }

  return (
    <div className="stack">
      <h2>Projects</h2>

      <div className="row">
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New project name"
        />
        <button type="button" className="primary" disabled={!name.trim()} onClick={createProject}>
          Create
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="muted">Loading…</p> : null}

      <div className="list">
        {projects.length === 0 && !loading ? <div className="muted">No projects yet.</div> : null}
        {projects.map((p) => (
          <button key={p.id} type="button" className="listRowButton" onClick={() => setSelected(p)}>
            <div className="listMain">
              <div className="listTitle">{p.name}</div>
              <div className="muted">
                {p.memberCount} members • {p.taskCount} tasks
              </div>
            </div>
            <div className="chev">›</div>
          </button>
        ))}
      </div>
    </div>
  );
}
