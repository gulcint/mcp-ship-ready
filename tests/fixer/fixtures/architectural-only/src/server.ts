export function handleRequest(headers: Record<string, string>): void {
  const sessionId = headers["Mcp-Session-Id"];
  if (!sessionId) {
    throw new Error("missing Mcp-Session-Id");
  }
}
