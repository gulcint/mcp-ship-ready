export interface ToolsListResult {
  resultType: "complete";
  tools: unknown[];
  ttlMs: number;
  cacheScope: "public" | "private";
}

export function handleToolsList(): ToolsListResult {
  return { resultType: "complete", tools: [], ttlMs: 60_000, cacheScope: "public" };
}
