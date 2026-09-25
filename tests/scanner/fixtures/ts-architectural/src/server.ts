export function handleRequest(headers: Record<string, string>): void {
  const sessionId = headers["Mcp-Session-Id"];
  if (!sessionId) {
    throw new Error("missing Mcp-Session-Id");
  }
}

export function handleInitialized(): void {
  // Pre-2026-07-28 session/initialize handshake.
  send({ method: "notifications/initialized" });
}

declare function send(message: unknown): void;
