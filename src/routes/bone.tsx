import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  SPORT_LABELS,
  calculateRisk,
  type Equipment,
  type Input,
  type RiskLevel,
  type Sport,
} from "@/lib/risk";

export const Route = createFileRoute("/bone")({
  component: Page,
});

const RISK_BG: Record<RiskLevel, string> = {
  low: "bg-risk-low",
  mid: "bg-risk-mid",
  high: "bg-risk-high",
  crit: "bg-risk-crit",
};

const RISK_TEXT: Record<RiskLevel, string> = {
  low: "text-risk-low",
  mid: "text-risk-mid",
  high: "text-risk-high",
  crit: "text-risk-crit",
};

type StepId = "profile" | "equipment" | "training" | "signals" | "result";
const STEPS: { id: StepId; label: string; title: string; sub: string }[] = [
  { id: "profile", label: "01", title: "お子さまの基本情報", sub: "年齢・体格・スポーツを入力してください" },
  { id: "equipment", label: "02", title: "使用している道具", sub: "道具の種類・重量が骨端線負荷に影響します" },
  { id: "training", label: "03", title: "練習量", sub: "週あたりの負荷を確認します" },
  { id: "signals", label: "04", title: "身体のサイン", sub: "痛みや成長スパートの有無" },
  { id: "result", label: "05", title: "リスク結果", sub: "スコアと推奨アクション" },
];

function Page() {
  const [form, setForm] = useState<Input>({
    age: 11,
    height: 145,
    weight: 38,
    sport: "baseball",
    hoursPerWeek: 12,
    daysPerWeek: 5,
    restDaysPerWeek: 1,
    pitchesPerDay: 60,
    hasPain: false,
    recentGrowthSpurt: false,
    equipment: {
      ballType: "soft",
      batType: "metal",
      batWeightG: 650,
      equipmentFitsPoorly: false,
    },
  });
  const [step, setStep] = useState(0);
  const result = useMemo(() => calculateRisk(form), [form]);
  const set = <K extends keyof Input>(k: K, v: Input[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const setEq = <K extends keyof Equipment>(k: K, v: Equipment[K]) =>
    setForm((f) => ({ ...f, equipment: { ...(f.equipment ?? {}), [k]: v } }));

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="bg-hero text-primary-foreground">
        <div className="mx-auto max-w-2xl px-5 pt-12 pb-14 md:pt-16 md:pb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-medium tracking-wide backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--ocean-light)]" />
            ジュニア負荷チェッカー
          </div>
          <h1 className="mt-5 text-3xl leading-[1.2] md:text-5xl">
            成長期の骨端線を、
            <br />
            <span className="text-[color:var(--ocean-light)]">数値で見守る。</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 md:text-base">
            日本臨床スポーツ医学会・投球制限ガイドラインに基づき、
            オーバーユースのリスクを段階的にチェックします。
          </p>
        </div>
      </header>

      {/* Stepper */}
      <div className="sticky top-0 z-10 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-2xl px-5 py-4">
          <div className="flex items-center justify-between text-[11px] font-semibold tracking-wide text-muted-foreground">
            <span className="text-primary">STEP {current.label}</span>
            <span>{step + 1} / {STEPS.length}</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-accent-grad transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <main className="mx-auto max-w-2xl px-5 pt-8 pb-20">
        <div>
          <h2 className="text-2xl md:text-3xl">{current.title}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{current.sub}</p>
        </div>

        <section className="mt-6 rounded-2xl border bg-card p-5 shadow-soft md:p-7">
          {current.id === "profile" && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="年齢" suffix="歳">
                <input type="number" min={4} max={18} value={form.age}
                  onChange={(e) => set("age", +e.target.value)} className={inputCls} />
              </Field>
              <Field label="スポーツ">
                <select value={form.sport}
                  onChange={(e) => set("sport", e.target.value as Sport)} className={inputCls}>
                  {Object.entries(SPORT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="身長" suffix="cm">
                <input type="number" min={90} max={200} value={form.height}
                  onChange={(e) => set("height", +e.target.value)} className={inputCls} />
              </Field>
              <Field label="体重" suffix="kg">
                <input type="number" min={15} max={120} value={form.weight}
                  onChange={(e) => set("weight", +e.target.value)} className={inputCls} />
              </Field>
              <div className="sm:col-span-2 rounded-xl bg-secondary/70 p-3 text-xs text-secondary-foreground">
                現在の BMI: <span className="font-bold">{result.bmi.toFixed(1)}</span>
              </div>
            </div>
          )}

          {current.id === "equipment" && (
            <EquipmentSection sport={form.sport} eq={form.equipment ?? {}} setEq={setEq} />
          )}

          {current.id === "training" && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="週の練習時間" suffix="時間">
                <input type="number" min={0} max={60} value={form.hoursPerWeek}
                  onChange={(e) => set("hoursPerWeek", +e.target.value)} className={inputCls} />
              </Field>
              <Field label="週の練習日数" suffix="日">
                <input type="number" min={0} max={7} value={form.daysPerWeek}
                  onChange={(e) => set("daysPerWeek", +e.target.value)} className={inputCls} />
              </Field>
              <Field label="完全休養日" suffix="日/週">
                <input type="number" min={0} max={7} value={form.restDaysPerWeek}
                  onChange={(e) => set("restDaysPerWeek", +e.target.value)} className={inputCls} />
              </Field>
              {form.sport === "baseball" && (
                <Field label="1日投球数" suffix="球">
                  <input type="number" min={0} max={300} value={form.pitchesPerDay ?? 0}
                    onChange={(e) => set("pitchesPerDay", +e.target.value)} className={inputCls} />
                </Field>
              )}
            </div>
          )}

          {current.id === "signals" && (
            <div className="space-y-3">
              <Toggle
                label="痛みや違和感がある"
                sub="肘・肩・膝・かかとなどに練習中/後の痛みがある"
                checked={form.hasPain}
                onChange={(v) => set("hasPain", v)}
              />
              <Toggle
                label="直近半年で急激な身長増加があった"
                sub="いわゆる成長スパート期"
                checked={form.recentGrowthSpurt}
                onChange={(v) => set("recentGrowthSpurt", v)}
              />
            </div>
          )}

          {current.id === "result" && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-hero p-5 text-primary-foreground">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold tracking-wide text-white/75">
                    総合リスクスコア
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${RISK_BG[result.level]}`}>
                    {result.levelLabel}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-6xl font-black tabular-nums">{result.totalScore}</span>
                  <span className="text-sm text-white/70">/ 100</span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                  <div className={`h-full ${RISK_BG[result.level]} transition-all`}
                    style={{ width: `${Math.min(100, result.totalScore)}%` }} />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/90">{result.headline}</p>
              </div>

              <div>
                <h3 className="text-sm font-bold">このスポーツで注意すべき骨端線</h3>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {result.vulnerableSites.map((s) => (
                    <li key={s} className="flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2 text-sm">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--ocean-mid)]" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold">スコアの内訳</h3>
                {result.factors.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    加点要因は検出されませんでした。良好な状態です。
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {result.factors.map((f) => (
                      <li key={f.label} className="rounded-xl border bg-card p-3">
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-sm font-semibold">{f.label}</span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${RISK_BG[result.level]}`}>
                            +{f.score}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{f.detail}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border-l-4 border-[color:var(--ocean-mid)] bg-secondary/60 p-4">
                <h3 className={`text-sm font-bold ${RISK_TEXT[result.level]}`}>推奨アクション</h3>
                <ul className="mt-3 space-y-2.5">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-3 text-sm text-secondary-foreground">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        {/* Nav */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-xl border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition disabled:opacity-40 hover:bg-muted"
          >
            戻る
          </button>
          {!isLast ? (
            <button
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="flex-1 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-soft transition hover:opacity-90"
            >
              次へ進む
            </button>
          ) : (
            <button
              onClick={() => setStep(0)}
              className="flex-1 rounded-xl bg-accent-grad px-5 py-3 text-sm font-bold text-primary-foreground shadow-soft transition hover:opacity-90"
            >
              最初からやり直す
            </button>
          )}
        </div>

        <p className="mx-auto mt-10 max-w-md text-center text-[11px] leading-relaxed text-muted-foreground">
          本アプリはスクリーニング目的の目安を提供するもので、医学的診断ではありません。
          痛みや違和感がある場合は速やかに整形外科（スポーツ整形）を受診してください。
        </p>
      </main>
    </div>
  );
}

const inputCls =
  "mt-1.5 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25";

function Field({
  label, suffix, children,
}: { label: string; suffix?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-foreground">{label}</span>
        {suffix && <span className="text-[11px] text-muted-foreground">{suffix}</span>}
      </div>
      {children}
    </label>
  );
}

function Toggle({
  label, sub, checked, onChange,
}: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition ${
        checked ? "border-primary bg-primary/5" : "hover:bg-muted/50"
      }`}
    >
      <div>
        <div className="text-sm font-semibold">{label}</div>
        {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
      </div>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function EquipmentSection({
  sport, eq, setEq,
}: {
  sport: Sport;
  eq: Equipment;
  setEq: <K extends keyof Equipment>(k: K, v: Equipment[K]) => void;
}) {
  return (
    <div className="space-y-5">
      {sport === "baseball" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="ボール種別">
            <select value={eq.ballType ?? "soft"}
              onChange={(e) => setEq("ballType", e.target.value as "soft" | "hard")} className={inputCls}>
              <option value="soft">軟式</option>
              <option value="hard">硬式</option>
            </select>
          </Field>
          <Field label="バット種別">
            <select value={eq.batType ?? "metal"}
              onChange={(e) => setEq("batType", e.target.value as "wood" | "metal" | "composite")} className={inputCls}>
              <option value="wood">木製</option>
              <option value="metal">金属</option>
              <option value="composite">複合（カーボン等）</option>
            </select>
          </Field>
          <Field label="バット重量" suffix="g">
            <input type="number" min={300} max={1200} value={eq.batWeightG ?? 0}
              onChange={(e) => setEq("batWeightG", +e.target.value)} className={inputCls} />
          </Field>
        </div>
      )}

      {sport === "running" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="シューズ種別">
            <select value={eq.runningShoe ?? "normal"}
              onChange={(e) => setEq("runningShoe", e.target.value as NonNullable<Equipment["runningShoe"]>)} className={inputCls}>
              <option value="cushioned">クッション厚め</option>
              <option value="normal">標準</option>
              <option value="minimal">薄底・ミニマル</option>
              <option value="spike">スパイク</option>
            </select>
          </Field>
          <Field label="主な走行路面">
            <select value={eq.runningSurface ?? "track"}
              onChange={(e) => setEq("runningSurface", e.target.value as NonNullable<Equipment["runningSurface"]>)} className={inputCls}>
              <option value="track">トラック（タータン）</option>
              <option value="trail">土・芝・トレイル</option>
              <option value="road">舗装路（アスファルト）</option>
              <option value="concrete">コンクリート</option>
            </select>
          </Field>
        </div>
      )}

      {sport === "soccer" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="スパイク種別">
            <select value={eq.soccerStud ?? "ag"}
              onChange={(e) => setEq("soccerStud", e.target.value as NonNullable<Equipment["soccerStud"]>)} className={inputCls}>
              <option value="turf">トレシュー（TF）</option>
              <option value="ag">人工芝用（AG）</option>
              <option value="firm">FG（固定式・土/天然芝）</option>
              <option value="soft">SG（軟弱ピッチ）</option>
            </select>
          </Field>
          <Field label="ボールサイズ">
            <select value={eq.soccerBallSize ?? 4}
              onChange={(e) => setEq("soccerBallSize", +e.target.value as 3 | 4 | 5)} className={inputCls}>
              <option value={3}>3号球</option>
              <option value={4}>4号球</option>
              <option value={5}>5号球</option>
            </select>
          </Field>
        </div>
      )}

      {sport === "basketball" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="ボールサイズ">
            <select value={eq.basketballBallSize ?? 5}
              onChange={(e) => setEq("basketballBallSize", +e.target.value as 5 | 6 | 7)} className={inputCls}>
              <option value={5}>5号球</option>
              <option value={6}>6号球</option>
              <option value={7}>7号球</option>
            </select>
          </Field>
          <Field label="シューズ状態">
            <select value={eq.basketballShoe ?? "normal"}
              onChange={(e) => setEq("basketballShoe", e.target.value as NonNullable<Equipment["basketballShoe"]>)} className={inputCls}>
              <option value="cushioned">クッション良好</option>
              <option value="normal">標準</option>
              <option value="worn">すり減り・へたり</option>
            </select>
          </Field>
        </div>
      )}

      {sport === "tennis" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="ラケット重量" suffix="g">
            <input type="number" min={180} max={360} value={eq.racketWeightG ?? 0}
              onChange={(e) => setEq("racketWeightG", +e.target.value)} className={inputCls} />
          </Field>
          <Field label="ガット張力" suffix="lb">
            <input type="number" min={30} max={70} value={eq.stringTensionLb ?? 0}
              onChange={(e) => setEq("stringTensionLb", +e.target.value)} className={inputCls} />
          </Field>
        </div>
      )}

      {sport === "swimming" && (
        <div className="space-y-3">
          <Toggle label="パドルを使用する" sub="肩トルクが大幅に増加します"
            checked={!!eq.usesPaddles} onChange={(v) => setEq("usesPaddles", v)} />
          <Toggle label="フィンを使用する" sub="足関節・膝の負荷が増えます"
            checked={!!eq.usesFins} onChange={(v) => setEq("usesFins", v)} />
        </div>
      )}

      {sport === "gymnastics" && (
        <Field label="主な種目">
          <select value={eq.gymApparatus ?? "floor"}
            onChange={(e) => setEq("gymApparatus", e.target.value as NonNullable<Equipment["gymApparatus"]>)} className={inputCls}>
            <option value="floor">床</option>
            <option value="vault">跳馬</option>
            <option value="bars">鉄棒・段違い平行棒</option>
            <option value="beam">平均台</option>
            <option value="rings">つり輪</option>
            <option value="rhythmic">新体操</option>
          </select>
        </Field>
      )}

      {sport === "other" && (
        <p className="text-sm text-muted-foreground">
          このスポーツでは道具別の追加評価は行いません。下の共通項目のみ入力してください。
        </p>
      )}

      <Toggle
        label="道具のサイズが体格に合っていない"
        sub="重すぎる・大きすぎる・グリップが太いなど"
        checked={!!eq.equipmentFitsPoorly}
        onChange={(v) => setEq("equipmentFitsPoorly", v)}
      />
    </div>
  );
}
