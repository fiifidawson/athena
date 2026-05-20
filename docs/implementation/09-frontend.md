# 09 · Frontend Integration

We already have a marketing landing page at `frontend/`. The **app** (signed-in dashboard) lives behind it, gated by a router.

This page wires:

1. An `/app` route that requires a session.
2. A 4-card dashboard mirroring `references/dashboard_2.jpg` (Model | Dataset | Parameters | Training).
3. The HF model/dataset pickers backed by your `/api/hf/...` endpoints.
4. A live-streaming training panel that consumes SSE from `/api/runs/{id}/events`.
5. A **Code** side-panel that fetches `/api/runs/{id}/snippets` and renders syntax-highlighted Python.

## Dependencies to add

```bash
cd frontend
npm install @tanstack/react-router @tanstack/react-query zod recharts shiki
```

| Lib | Why |
|---|---|
| `@tanstack/react-router` | File-based-style routing with type-safe params. The marketing site can stay as a root route; app routes nest under `/app`. |
| `@tanstack/react-query` | Server state, caching, retries. Replace ad-hoc `useEffect`+`fetch`. |
| `zod` | Parse API responses. Don't trust the wire format. |
| `recharts` | The loss-curve chart. |
| `shiki` | Syntax highlighting for the snippets panel. Same library Unsloth uses (see `references/unsloth/frontend/src/components/assistant-ui/code-plugin.ts`). |

## API client

`frontend/src/lib/api.ts`:

```ts
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(public status: number, public body: unknown, message: string) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: {
      ...(json !== undefined ? { "content-type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : (init.body as BodyInit | null | undefined),
    ...rest,
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new ApiError(res.status, body, `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
```

Add to `frontend/.env.local`:

```
VITE_API_URL=http://localhost:8000
```

## Auth context

`frontend/src/features/auth/use-session.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { z } from "zod";

const SessionSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  has_hf_token: z.boolean(),
});

export type Session = z.infer<typeof SessionSchema>;

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return SessionSchema.parse(await api("/api/auth/me"));
      } catch (e) {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRequestMagicLink() {
  return useMutation({
    mutationFn: (email: string) =>
      api("/api/auth/request-link", { method: "POST", json: { email } }),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api("/api/auth/logout", { method: "POST" }),
    onSuccess: () => qc.setQueryData(["session"], null),
  });
}
```

## Routing

Convert `App.tsx` to a router. Create `frontend/src/router.tsx`:

```tsx
import {
  Outlet,
  RootRoute,
  Route,
  Router,
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import LandingPage from "./pages/LandingPage";          // existing App.tsx contents
import AuthCallback from "./pages/AuthCallback";
import AppShell from "./pages/AppShell";
import DashboardPage from "./pages/DashboardPage";
import RunDetailPage from "./pages/RunDetailPage";

const queryClient = new QueryClient();

const rootRoute = new RootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  ),
});

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const authCallbackRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "auth/callback",
  component: AuthCallback,
});

const appRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "app",
  component: AppShell,
});

const appIndexRoute = new Route({
  getParentRoute: () => appRoute,
  path: "/",
  component: DashboardPage,
});

const runDetailRoute = new Route({
  getParentRoute: () => appRoute,
  path: "runs/$runId",
  component: RunDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  authCallbackRoute,
  appRoute.addChildren([appIndexRoute, runDetailRoute]),
]);

export const router = new Router({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return <RouterProvider router={router} />;
}
```

Update `frontend/src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./router";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Move the existing `App.tsx` contents to `frontend/src/pages/LandingPage.tsx`.

## Auth callback

`frontend/src/pages/AuthCallback.tsx`:

```tsx
import { useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { api } from "@/lib/api";

export default function AuthCallback() {
  const search = useSearch({ strict: false }) as { token?: string };
  const nav = useNavigate();

  useEffect(() => {
    if (!search.token) return;
    api(`/api/auth/callback?token=${encodeURIComponent(search.token)}`).then(() =>
      nav({ to: "/app" }),
    );
  }, [search.token, nav]);

  return <div className="p-8 text-athena-text">Signing you in…</div>;
}
```

## App shell + dashboard

`frontend/src/pages/AppShell.tsx`:

```tsx
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession, useLogout } from "@/features/auth/use-session";

export default function AppShell() {
  const { data: session, isLoading } = useSession();
  const nav = useNavigate();
  const logout = useLogout();

  useEffect(() => {
    if (!isLoading && session === null) nav({ to: "/" });
  }, [isLoading, session, nav]);

  if (isLoading || !session) return null;

  return (
    <div className="min-h-screen bg-athena-dark text-athena-text-bright">
      <header className="flex items-center justify-between border-b border-athena-border px-6 py-4">
        <Link to="/app" className="flex items-center gap-2">
          <img src="/logo.svg" className="h-7 w-7" />
          <span className="font-bold">athena.</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-athena-text">{session.email}</span>
          <button onClick={() => logout.mutate()} className="text-athena-amber hover:underline">
            Log out
          </button>
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
```

`frontend/src/pages/DashboardPage.tsx` — the 4-card configure layout (mirror of `dashboard_2.jpg`):

```tsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";
import { HuggingFaceModelPicker } from "@/features/hf/ModelPicker";
import { HuggingFaceDatasetPicker } from "@/features/hf/DatasetPicker";

export default function DashboardPage() {
  const [model, setModel] = useState<string>("lightgbm");
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [hp, setHp] = useState({ n_estimators: 200, learning_rate: 0.05, num_leaves: 31 });
  const nav = useNavigate();

  const startRun = useMutation({
    mutationFn: () =>
      api<{ id: string }>("/api/runs", {
        method: "POST",
        json: { dataset_id: datasetId, base_model: model, hyperparameters: hp },
      }),
    onSuccess: (r) => nav({ to: "/app/runs/$runId", params: { runId: r.id } }),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">AutoML Studio</h1>
        <p className="text-athena-text">Configure and start a training run</p>
      </header>

      <Card title="Model" subtitle="Select base model and training method">
        <HuggingFaceModelPicker value={model} onChange={setModel} />
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Dataset" subtitle="Select or upload training data">
          <HuggingFaceDatasetPicker value={datasetId} onChange={setDatasetId} />
        </Card>
        <Card title="Parameters" subtitle="Configure training hyperparameters">
          <Hyperparams value={hp} onChange={setHp} />
        </Card>
        <Card title="Training" subtitle="Monitor and control training">
          <button
            disabled={!datasetId || startRun.isPending}
            onClick={() => startRun.mutate()}
            className="w-full rounded-xl bg-athena-amber py-3 font-medium text-white disabled:opacity-50"
          >
            {startRun.isPending ? "Starting…" : "Start Training"}
          </button>
          {!datasetId && (
            <p className="mt-2 text-xs text-athena-red">Pick a dataset first.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-athena-border bg-athena-card p-5">
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mb-4 text-xs text-athena-text">{subtitle}</p>
      {children}
    </div>
  );
}

function Hyperparams({ value, onChange }: { value: { n_estimators: number; learning_rate: number; num_leaves: number }; onChange: (v: any) => void }) {
  return (
    <div className="space-y-3 text-sm">
      <Field label="n_estimators" type="number" value={value.n_estimators}
        onChange={(v) => onChange({ ...value, n_estimators: Number(v) })} />
      <Field label="learning_rate" type="number" step="0.01" value={value.learning_rate}
        onChange={(v) => onChange({ ...value, learning_rate: Number(v) })} />
      <Field label="num_leaves" type="number" value={value.num_leaves}
        onChange={(v) => onChange({ ...value, num_leaves: Number(v) })} />
    </div>
  );
}

function Field({ label, value, onChange, ...rest }: any) {
  return (
    <label className="block">
      <span className="text-athena-text">{label}</span>
      <input
        className="mt-1 w-full rounded-lg border border-athena-border bg-athena-dark px-3 py-2 text-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </label>
  );
}
```

## HF model/dataset pickers

`frontend/src/features/hf/ModelPicker.tsx`:

```tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type Model = { id: string; pipeline_tag: string | null; downloads: number };

export function HuggingFaceModelPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [q, setQ] = useState("");
  const { data: results, isLoading } = useQuery({
    queryKey: ["hf-models", q],
    queryFn: () => api<Model[]>(`/api/hf/models/search?q=${encodeURIComponent(q)}`),
    enabled: q.length >= 2,
  });

  return (
    <div>
      <input
        className="w-full rounded-lg border border-athena-border bg-athena-dark px-3 py-2 text-white"
        placeholder="Search HuggingFace models…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {isLoading && <p className="mt-2 text-xs text-athena-text">Searching…</p>}
      {results && (
        <ul className="mt-2 max-h-60 overflow-auto rounded-lg border border-athena-border bg-athena-dark text-sm">
          {results.map((m) => (
            <li
              key={m.id}
              onClick={() => onChange(`hf://${m.id}`)}
              className={`cursor-pointer px-3 py-2 hover:bg-athena-card ${value === `hf://${m.id}` ? "bg-athena-card" : ""}`}
            >
              <div className="text-white">{m.id}</div>
              <div className="text-xs text-athena-text">
                {m.pipeline_tag ?? "—"} · {m.downloads.toLocaleString()} downloads
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-athena-text">
        Selected: <code className="text-white">{value}</code>
      </p>
    </div>
  );
}
```

`DatasetPicker.tsx` follows the same shape — search input, list, cascading dropdowns for `config` and `split` (use `GET /api/hf/datasets/{owner}/{name}`). I'll spare you the duplicate code.

## Run detail page

`frontend/src/pages/RunDetailPage.tsx`:

```tsx
import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";
import { SnippetPanel } from "@/features/snippets/SnippetPanel";

type Metric = { step: number; name: string; value: number };

export default function RunDetailPage() {
  const { runId } = useParams({ from: "/app/runs/$runId" });
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [status, setStatus] = useState("queued");
  const [showSnippets, setShowSnippets] = useState(false);

  useEffect(() => {
    const es = new EventSource(`${import.meta.env.VITE_API_URL}/api/runs/${runId}/events`, {
      withCredentials: true,
    });
    es.addEventListener("status", (e) => setStatus(e.data));
    es.addEventListener("metric", (e) => {
      const m = JSON.parse(e.data) as Metric;
      setMetrics((prev) => [...prev, m]);
    });
    return () => es.close();
  }, [runId]);

  const run = useQuery({
    queryKey: ["run", runId],
    queryFn: () => api<{ base_model: string }>(`/api/runs/${runId}`),
  });

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Run {runId.slice(0, 8)}</h1>
          <p className="text-athena-text">Model: {run.data?.base_model} · Status: {status}</p>
        </div>
        <button
          onClick={() => setShowSnippets(true)}
          className="rounded-xl border border-athena-border px-4 py-2 hover:border-athena-amber"
        >
          {"</> View code"}
        </button>
      </header>

      <div className="rounded-2xl border border-athena-border bg-athena-card p-6">
        <h2 className="mb-4 font-semibold">Training loss</h2>
        <div style={{ height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={metrics}>
              <XAxis dataKey="step" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#0ea5e9" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {showSnippets && <SnippetPanel runId={runId} onClose={() => setShowSnippets(false)} />}
    </div>
  );
}
```

## Snippet panel with Shiki

`frontend/src/features/snippets/SnippetPanel.tsx`:

```tsx
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { codeToHtml } from "shiki";
import { api } from "@/lib/api";

type Snippet = { order: number; title: string; language: string; code: string };

export function SnippetPanel({ runId, onClose }: { runId: string; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ["snippets", runId],
    queryFn: () => api<Snippet[]>(`/api/runs/${runId}/snippets`),
    refetchInterval: 3000, // poll while run is in progress
  });

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-y-auto border-l border-athena-border bg-athena-darker p-6 shadow-2xl">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Code for this run</h2>
        <button onClick={onClose} className="text-athena-text hover:text-white">×</button>
      </header>
      <p className="mb-6 text-sm text-athena-text">
        Every step the platform took, as Python you can copy into a notebook.
      </p>
      <ol className="space-y-6">
        {data?.map((s) => (
          <li key={s.order}>
            <h3 className="mb-2 font-semibold text-white">{s.title}</h3>
            <Code code={s.code} language={s.language} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function Code({ code, language }: { code: string; language: string }) {
  const [html, setHtml] = useState("");
  useEffect(() => {
    codeToHtml(code, { lang: language as any, theme: "github-dark" }).then(setHtml);
  }, [code, language]);
  return (
    <div className="overflow-x-auto rounded-lg border border-athena-border bg-[#0d1117] text-sm">
      <div className="flex items-center justify-between border-b border-athena-border px-3 py-1.5 text-xs text-athena-text">
        <span>{language}</span>
        <button
          onClick={() => navigator.clipboard.writeText(code)}
          className="hover:text-white"
        >
          Copy
        </button>
      </div>
      <div className="p-3" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
```

## Definition of done

- [ ] Visiting `/auth/callback?token=...` signs you in and redirects to `/app`.
- [ ] `/app` shows the 4-card layout; search for an HF model and see results.
- [ ] Clicking "Start Training" routes you to `/app/runs/<id>` and the loss curve updates live.
- [ ] Clicking "View code" opens the snippet panel; copy-pasting one block into a Python REPL runs without `NameError`.

Next: **[10 · Deploy →](10-deploy.md)**
