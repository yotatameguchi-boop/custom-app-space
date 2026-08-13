import { defineTool } from "@lovable.dev/mcp-js";
import { SPORT_LABELS } from "@/lib/risk";

export default defineTool({
  name: "list_sports",
  title: "対応競技の一覧",
  description: "判定ツールで指定できる競技コードと日本語名の一覧を返します。",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const sports = Object.entries(SPORT_LABELS).map(([code, label]) => ({ code, label }));
    return {
      content: [
        { type: "text", text: sports.map((s) => `${s.code}: ${s.label}`).join("\n") },
      ],
      structuredContent: { sports },
    };
  },
});
