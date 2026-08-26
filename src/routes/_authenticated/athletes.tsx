import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { deleteAthlete, listAthletes, saveAthlete } from "@/lib/assessments.functions";
import { SEX_LABELS, SPORT_LABELS, type Sex, type Sport } from "@/lib/risk";
import { AppNav } from "@/components/AppNav";

export const Route = createFileRoute("/_authenticated/athletes")({
  head: () => ({
    meta: [
      { title: "選手プロフィール | 骨端線チェッカー" },
      { name: "description", content: "お子さま・選手を登録して、それぞれの負担チェック履歴を管理します。" },
      { property: "og:title", content: "選手プロフィール | 骨端線チェッカー" },
      { property: "og:description", content: "お子さま・選手を登録して、それぞれの負担チェック履歴を管理します。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AthletesPage,
});

const empty = {
  name: "",
  birth_date: "",
  sex: "male" as Sex,
  sport: "baseball" as Sport,
  height: 145,
  weight: 38,
  note: "",
};

const inputCls =
  "mt-1.5 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25";

function AthletesPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listAthletes);
  const save = useServerFn(saveAthlete);
  const del = useServerFn(deleteAthlete);
  const [form, setForm] = useState({ ...empty, id: "" });

  const { data, isLoading } = useQuery({ queryKey: ["athletes"], queryFn: () => fetchList() });

  const saveMut = useMutation({
    mutationFn: (v: typeof form) =>
      save({
        data: {
          id: v.id || undefined,
          name: v.name,
          birth_date: v.birth_date || null,
          sex: v.sex,
          sport: v.sport,
          height: Number(v.height) || null,
          weight: Number(v.weight) || null,
          note: v.note || null,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["athletes"] });
      setForm({ ...empty, id: "" });
      toast.success("保存しました");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["athletes"] });
      toast.success("削除しました");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-2xl font-bold">選手プロフィール</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          お子さま・選手を登録しておくと、チェック時に呼び出して履歴を人ごとに管理できます。
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMut.mutate(form);
          }}
          className="mt-6 rounded-2xl border bg-card p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold">名前</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold">生年月日</span>
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold">性別</span>
              <select
                value={form.sex}
                onChange={(e) => setForm({ ...form, sex: e.target.value as Sex })}
                className={inputCls}
              >
                {Object.entries(SEX_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold">競技</span>
              <select
                value={form.sport}
                onChange={(e) => setForm({ ...form, sport: e.target.value as Sport })}
                className={inputCls}
              >
                {Object.entries(SPORT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold">身長 (cm)</span>
              <input
                type="number"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold">体重 (kg)</span>
              <input
                type="number"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
                className={inputCls}
              />
            </label>
          </div>
          <label className="mt-4 block">
            <span className="text-xs font-semibold">メモ</span>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className={inputCls}
              rows={2}
            />
          </label>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saveMut.isPending}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              {form.id ? "更新する" : "登録する"}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={() => setForm({ ...empty, id: "" })}
                className="rounded-xl border px-4 py-2.5 text-sm font-semibold"
              >
                キャンセル
              </button>
            )}
          </div>
        </form>

        {isLoading && <p className="mt-6 text-sm text-muted-foreground">読み込み中…</p>}

        <ul className="mt-6 space-y-3">
          {data?.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4">
              <div>
                <div className="text-sm font-bold">{a.name}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {SPORT_LABELS[a.sport as Sport] ?? a.sport} / {SEX_LABELS[a.sex as Sex] ?? a.sex}
                  {a.height ? ` / ${a.height}cm` : ""}
                  {a.weight ? ` / ${a.weight}kg` : ""}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setForm({
                      id: a.id,
                      name: a.name,
                      birth_date: a.birth_date ?? "",
                      sex: a.sex as Sex,
                      sport: a.sport as Sport,
                      height: Number(a.height ?? 0),
                      weight: Number(a.weight ?? 0),
                      note: a.note ?? "",
                    })
                  }
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  編集
                </button>
                <button
                  onClick={() => delMut.mutate(a.id)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-risk-crit hover:bg-muted"
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
