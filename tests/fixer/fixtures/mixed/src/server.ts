export function handleRequest(headers: Record<string, string>): { code: number } {
  const sessionId = headers["Mcp-Session-Id"];
  if (!sessionId) {
    return { code: -32002 };
  }
  return { code: 0 };
}
