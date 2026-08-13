import { defineTool } from "@lovable.dev/mcp-js";
import { SOURCES } from "@/lib/risk";

export default defineTool({
  name: "list_sources",
  title: "参考ガイドライン・出典",
  description: "判定ロジックが参照しているガイドライン・研究の出典一覧を返します。",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [
      {
        type: "text",
        text: SOURCES.map(
          (s) =>
            `【${s.title}】${(s as { org?: string }).org ?? ""}\n${s.description ?? ""}\n${(s as { url?: string }).url ?? ""}`,
        ).join("\n\n"),
      },
    ],
    structuredContent: { sources: SOURCES },
  }),
});
