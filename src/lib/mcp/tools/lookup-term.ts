import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { GLOSSARY } from "@/lib/risk";

export default defineTool({
  name: "lookup_term",
  title: "専門用語を調べる",
  description:
    "「骨端線」「オーバーユース」「REDs」などアプリ内で使われる専門用語の説明を返します。termを省略すると全用語を一覧します。",
  inputSchema: {
    term: z.string().optional().describe("調べたい用語（部分一致可）。省略で全件"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ term }) => {
    const entries = Object.entries(GLOSSARY).filter(([key]) =>
      term ? key.includes(term) : true,
    );
    if (entries.length === 0) {
      return {
        content: [{ type: "text", text: `「${term}」に一致する用語は見つかりませんでした。` }],
        isError: true,
      };
    }
    return {
      content: [
        { type: "text", text: entries.map(([k, v]) => `【${k}】${v}`).join("\n\n") },
      ],
      structuredContent: { terms: entries.map(([term, definition]) => ({ term, definition })) },
    };
  },
});
