import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { ProjectMember, ProjectRole, Task, TaskStatus, User } from "../types";

type Props = {
  projectId: string;
  me: User;
  onBack: () => void | Promise<void>;
};

type MembersResponse = { members: ProjectMember[] };
type TasksResponse = { tasks: Task[] };

type ProjectResponse = {
  project: {
    id: string;
    name: string;
    memberCount: number;
    taskCount: number;
  } | null;
};

const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

export function ProjectDetail({ projectId, me, onBack }: Props) {
  const [projectName, setProjectName] = useState<string>("");
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  const myRole: ProjectRole | null = useMemo(() => {
    const m = members.find((x) => x.user.id === me.id);
    return m?.role ?? null;
  }, [members, me.id]);

  async function refresh() {
    setError(null);
    const [p, m, t] = await Promise.all([
      api<ProjectResponse>(`/projects/${projectId}`),
      api<MembersResponse>(`/projects/${projectId}/members`),
      api<TasksResponse>(`/projects/${projectId}/tasks`),
    ]);

    setProjectName(p.project?.name ?? "(unknown)");
    setMembers(m.members);
    setTasks(t.tasks);
  }

  useEffect(() => {
    let alive = true;
    refresh().catch((e) => {
      if (alive) setError(e instanceof Error ? e.message : "Failed to load project");
    });
    return () => {
      alive = false;
    };
  }, [projectId]);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [assignedToId, setAssignedToId] = useState<string>("");

  async function createTask() {
    setError(null);
    try {
      const payload: any = { title: taskTitle };
      if (taskDueDate) payload.dueDate = new Date(taskDueDate).toISOString();

      if (myRole === "ADMIN") {
        payload.assignedToId = assignedToId || null;
      } else {
        payload.assignedToId = me.id;
      }

      await api(`/projects/${projectId}/tasks`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setTaskTitle("");
      setTaskDueDate("");
      setAssignedToId("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create task");
    }
  }

  async function updateTask(taskId: string, patch: Partial<{ status: TaskStatus; assignedToId: string | null }>) {
    setError(null);
    try {
      await api(`/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update task");
    }
  }

  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<ProjectRole>("MEMBER");

  async function addMember() {
    setError(null);
    try {
      await api(`/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify({ email: memberEmail, role: memberRole }),
      });
      setMemberEmail("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add member");
    }
  }

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <button type="button" className="link" onClick={onBack}>
          ← Back
        </button>
        <div className="muted">Role: {myRole ?? "…"}</div>
      </div>

      <h2>{projectName}</h2>

      {error ? <p className="error">{error}</p> : null}

      <div className="section">
        <h3 className="subheading">Create task</h3>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <input
            className="input"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Task title"
          />
          <input
            className="input"
            value={taskDueDate}
            onChange={(e) => setTaskDueDate(e.target.value)}
            placeholder="Due date (optional)"
            type="date"
          />
          {myRole === "ADMIN" ? (
            <select className="input" value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name} ({m.role})
                </option>
              ))}
            </select>
          ) : null}
          <button type="button" className="primary" disabled={!taskTitle.trim()} onClick={createTask}>
            Add
          </button>
        </div>
      </div>

      <div className="section">
        <h3 className="subheading">Tasks</h3>
        <div className="list">
          {tasks.length === 0 ? <div className="muted">No tasks yet.</div> : null}
          {tasks.map((t) => (
            <div key={t.id} className="listRow">
              <div className="listMain">
                <div className="listTitle">{t.title}</div>
                <div className="muted">
                  {t.assignedTo ? `Assigned to ${t.assignedTo.name}` : "Unassigned"}
                  {t.dueDate ? ` • Due ${new Date(t.dueDate).toLocaleDateString()}` : ""}
                </div>
              </div>

              <select
                className="smallSelect"
                value={t.status}
                onChange={(e) => updateTask(t.id, { status: e.target.value as TaskStatus })}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {myRole === "ADMIN" ? (
                <select
                  className="smallSelect"
                  value={t.assignedTo?.id ?? ""}
                  onChange={(e) => updateTask(t.id, { assignedToId: e.target.value || null })}
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h3 className="subheading">Team</h3>

        {myRole === "ADMIN" ? (
          <div className="row" style={{ flexWrap: "wrap" }}>
            <input
              className="input"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="member@email.com"
            />
            <select className="input" value={memberRole} onChange={(e) => setMemberRole(e.target.value as ProjectRole)}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button type="button" className="primary" disabled={!memberEmail.trim()} onClick={addMember}>
              Add member
            </button>
          </div>
        ) : null}

        <div className="list">
          {members.map((m) => (
            <div key={m.id} className="listRow">
              <div className="listMain">
                <div className="listTitle">
                  {m.user.name}
                  {m.user.id === me.id ? " (you)" : ""}
                </div>
                <div className="muted">{m.user.email}</div>
              </div>
              <div className="pill">{m.role}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
