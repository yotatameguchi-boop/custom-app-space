import { defineMcp } from "@lovable.dev/mcp-js";
import assessBoneLoadTool from "./tools/assess-bone-load";
import listSportsTool from "./tools/list-sports";
import listSourcesTool from "./tools/list-sources";
import lookupTermTool from "./tools/lookup-term";

export default defineMcp({
  name: "my-app-mcp",
  title: "骨端線チェッカー",
  version: "0.1.0",
  instructions:
    "成長期アスリートの骨（骨端線）への負担を評価するツール群です。assess_bone_load で年齢・性別・体格・練習量・用具から負担スコアを算出し、list_sports で対応競技、lookup_term で専門用語、list_sources で参照ガイドラインを確認できます。医学的診断ではありません。",
  tools: [assessBoneLoadTool, listSportsTool, lookupTermTool, listSourcesTool],
});
