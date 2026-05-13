import { useEffect, useState } from "react";
import "./App.css";
import { api, getToken, setToken } from "./api";
import { AuthPanel } from "./components/AuthPanel";
import { Dashboard } from "./components/Dashboard";
import { Projects } from "./components/Projects";
import type { User } from "./types";

type MeResponse = { user: User };

function App() {
  const [tokenState, setTokenState] = useState<string | null>(() => getToken());
  const [me, setMe] = useState<User | null>(null);
  const [tab, setTab] = useState<"dashboard" | "projects">("dashboard");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenState) {
      setMe(null);
      return;
    }

    let alive = true;
    api<MeResponse>("/auth/me", {}, tokenState)
      .then((r) => {
        if (alive) setMe(r.user);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Authentication failed");
        setToken(null);
        setTokenState(null);
      });

    return () => {
      alive = false;
    };
  }, [tokenState]);

  if (!tokenState) {
    return (
      <AuthPanel
        onAuth={(t, user) => {
          setError(null);
          setTokenState(t);
          setMe(user);
        }}
      />
    );
  }

  if (!me) {
    return (
      <div className="panel">
        <h1>Team Task Manager</h1>
        <p className="muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Team Task Manager</div>
        <nav className="nav">
          <button
            type="button"
            className={tab === "dashboard" ? "navBtn active" : "navBtn"}
            onClick={() => setTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={tab === "projects" ? "navBtn active" : "navBtn"}
            onClick={() => setTab("projects")}
          >
            Projects
          </button>
        </nav>

        <div className="topRight">
          <div className="muted">{me.name}</div>
          <button
            type="button"
            className="link"
            onClick={() => {
              setToken(null);
              setTokenState(null);
              setMe(null);
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <main className="content">
        {tab === "dashboard" ? <Dashboard /> : <Projects me={me} />}
      </main>
    </div>
  );
}

export default App;
