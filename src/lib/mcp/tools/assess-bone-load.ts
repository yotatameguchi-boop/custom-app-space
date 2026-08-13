import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { calculateRisk, SPORT_LABELS, type Input } from "@/lib/risk";

const sportEnum = z.enum([
  "baseball",
  "running",
  "soccer",
  "basketball",
  "tennis",
  "swimming",
  "gymnastics",
  "other",
]);

const equipmentSchema = z
  .object({
    ballType: z.enum(["softM", "softJ", "semi", "hard"]).optional(),
    batWeightG: z.number().optional(),
    batType: z.enum(["wood", "metal", "composite"]).optional(),
    throwsBreakingBall: z.boolean().optional(),
    runningShoe: z.enum(["cushioned", "normal", "minimal", "spike"]).optional(),
    runningSurface: z.enum(["track", "road", "trail", "concrete"]).optional(),
    shoeWear: z.enum(["new", "normal", "worn"]).optional(),
    soccerStud: z.enum(["turf", "firm", "soft", "ag"]).optional(),
    soccerStudMaterial: z.enum(["rubber", "plastic", "metal"]).optional(),
    soccerBallSize: z.union([z.literal(3), z.literal(4), z.literal(5)]).optional(),
    basketballBallSize: z.union([z.literal(5), z.literal(6), z.literal(7)]).optional(),
    basketballBallMaterial: z.enum(["rubber", "composite", "leather"]).optional(),
    basketballShoe: z.enum(["cushioned", "normal", "worn"]).optional(),
    courtSurface: z.enum(["wood", "rubber", "concrete", "asphalt"]).optional(),
    racketWeightG: z.number().optional(),
    stringTensionLb: z.number().optional(),
    stringMaterial: z.enum(["gut", "nylon", "poly"]).optional(),
    usesPaddles: z.boolean().optional(),
    paddleSize: z.enum(["small", "large"]).optional(),
    usesFins: z.boolean().optional(),
    gymApparatus: z
      .enum(["floor", "vault", "bars", "beam", "rings", "rhythmic"])
      .optional(),
    usesGrips: z.boolean().optional(),
    equipmentFitsPoorly: z.boolean().optional(),
  })
  .optional()
  .describe("競技ごとの用具情報（すべて任意）");

export default defineTool({
  name: "assess_bone_load",
  title: "成長期の骨負担を判定",
  description:
    "年齢・性別・体格・練習量・用具情報から、成長期アスリートの骨端線（成長板）への負担スコアとリスクレベル、要因の内訳、推奨アクションを返します。医学的診断ではありません。",
  inputSchema: {
    age: z.number().min(5).max(25).describe("年齢（歳）"),
    sex: z.enum(["male", "female"]).describe("生物学的性別"),
    height: z.number().min(80).max(230).describe("身長 cm"),
    weight: z.number().min(15).max(200).describe("体重 kg"),
    sport: sportEnum.describe("競技"),
    hoursPerWeek: z.number().min(0).max(60).describe("週あたりの練習時間"),
    daysPerWeek: z.number().min(0).max(7).describe("週あたりの練習日数"),
    restDaysPerWeek: z.number().min(0).max(7).describe("週あたりの完全休養日数"),
    pitchesPerDay: z.number().min(0).max(400).optional().describe("野球のみ: 1日の投球数"),
    hasPain: z.boolean().describe("痛みや違和感があるか"),
    recentGrowthSpurt: z.boolean().describe("直近半年で急激に身長が伸びたか"),
    menstrualIrregularity: z
      .boolean()
      .optional()
      .describe("女子のみ: 3か月以上の無月経・月経不順があるか"),
    equipment: equipmentSchema,
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (input) => {
    const result = calculateRisk(input as Input);
    const text = [
      `競技: ${SPORT_LABELS[input.sport]}`,
      `スコア: ${result.totalScore}（${result.levelLabel}）`,
      `BMI: ${result.bmi}`,
      result.headline,
      "",
      "■ 要因",
      ...result.factors.map((f) => `・${f.label}（+${f.score}）: ${f.detail}`),
      "",
      "■ 注意したい骨端線部位",
      ...result.vulnerableSites.map((s) => `・${s}`),
      "",
      "■ 推奨アクション",
      ...result.recommendations.map((r) => `・${r}`),
      "",
      "※ スクリーニング用の目安であり、医学的診断ではありません。痛みがある場合は整形外科を受診してください。",
    ].join("\n");

    return {
      content: [{ type: "text", text }],
      structuredContent: { ...result },
    };
  },
});
