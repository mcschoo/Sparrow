import process from "process";
import { useCallback, useState } from "react";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (typeof window === "undefined" ? "http://api:8000" : "http://localhost:8000");

type FetchOptions = Parameters<typeof globalThis.fetch>[1];

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

export default function Home() {
  const [healthResult, setHealthResult] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] = useState<string | null>(null);
  const [isHealthLoading, setHealthLoading] = useState(false);
  const [isDispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  const callApi = useCallback(async (path: string, init?: FetchOptions) => {
    const response = await globalThis.fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`${response.status} ${response.statusText}: ${message}`);
    }

    return response.json();
  }, []);

  const handleHealthCheck = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);

    try {
      const payload = await callApi("/healthz");
      setHealthResult(pretty(payload));
    } catch (error) {
      setHealthError(error instanceof Error ? error.message : String(error));
      setHealthResult(null);
    } finally {
      setHealthLoading(false);
    }
  }, [callApi]);

  const handleDispatch = useCallback(async () => {
    setDispatchLoading(true);
    setDispatchError(null);

    const requestPayload = {
      message: "ping",
      sentAt: new Date().toISOString(),
    };

    try {
      const payload = await callApi("/dispatch", {
        method: "POST",
        body: JSON.stringify(requestPayload),
      });

      setDispatchResult(pretty({ request: requestPayload, response: payload }));
    } catch (error) {
      setDispatchError(error instanceof Error ? error.message : String(error));
      setDispatchResult(null);
    } finally {
      setDispatchLoading(false);
    }
  }, [callApi]);

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "60rem" }}>
      <h1>RAG Platform Frontend</h1>
      <p>Trigger basic health and dispatch calls to validate service wiring.</p>

      <section style={{ marginTop: "2rem" }}>
        <h2>API Health</h2>
        <button onClick={handleHealthCheck} disabled={isHealthLoading}>
          {isHealthLoading ? "Checking..." : "Call /healthz"}
        </button>
        {healthError && <p style={{ color: "#b91c1c" }}>{healthError}</p>}
        {healthResult && (
          <pre
            style={{
              background: "#f3f4f6",
              padding: "1rem",
              borderRadius: "0.5rem",
              marginTop: "1rem",
              overflowX: "auto",
            }}
          >
            {healthResult}
          </pre>
        )}
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Coordinator Dispatch</h2>
        <button onClick={handleDispatch} disabled={isDispatchLoading}>
          {isDispatchLoading ? "Dispatching..." : "Call /dispatch"}
        </button>
        {dispatchError && <p style={{ color: "#b91c1c" }}>{dispatchError}</p>}
        {dispatchResult && (
          <pre
            style={{
              background: "#f3f4f6",
              padding: "1rem",
              borderRadius: "0.5rem",
              marginTop: "1rem",
              overflowX: "auto",
            }}
          >
            {dispatchResult}
          </pre>
        )}
      </section>
    </main>
  );
}
