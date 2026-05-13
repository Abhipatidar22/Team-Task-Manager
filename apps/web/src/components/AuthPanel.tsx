import { useMemo, useState } from "react";
import { api, setToken } from "../api";
import type { User } from "../types";

type Props = {
  onAuth: (token: string, user: User) => void;
};

export function AuthPanel({ onAuth }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password.trim()) return false;
    if (mode === "signup" && !name.trim()) return false;
    return true;
  }, [email, password, mode, name]);

  async function submit() {
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const result = await api<{ token: string; user: User }>("/auth/signup", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        setToken(result.token);
        onAuth(result.token, result.user);
      } else {
        const result = await api<{ token: string; user: User }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setToken(result.token);
        onAuth(result.token, result.user);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <h1>Team Task Manager</h1>

      <div className="tabs">
        <button
          type="button"
          className={mode === "login" ? "tab active" : "tab"}
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          type="button"
          className={mode === "signup" ? "tab active" : "tab"}
          onClick={() => setMode("signup")}
        >
          Signup
        </button>
      </div>

      {mode === "signup" ? (
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </label>
      ) : null}

      <label className="field">
        <span>Email</span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </label>

      {error ? <p className="error">{error}</p> : null}

      <button type="button" className="primary" disabled={!canSubmit || loading} onClick={submit}>
        {loading ? "Please wait…" : mode === "login" ? "Login" : "Create account"}
      </button>

      <p className="hint">After signup, create a project and invite members by email.</p>
    </div>
  );
}
