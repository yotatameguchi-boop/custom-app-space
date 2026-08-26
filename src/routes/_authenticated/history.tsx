import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  deleteAssessment,
  listAssessments,
  setAssessmentShare,
} from "@/lib/assessments.functions";
import { SPORT_LABELS, type Sport } from "@/lib/risk";
import { AppNav } from "@/components/AppNav";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "判定履歴 | 骨端線チェッカー" },
      { name: "description", content: "保存した骨への負担チェックの履歴と推移を確認できます。" },
      { property: "og:title", content: "判定履歴 | 骨端線チェッカー" },
      { property: "og:description", content: "保存した骨への負担チェックの履歴と推移を確認できます。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

const LEVEL_BG: Record<string, string> = {
  low: "bg-risk-low",
  mid: "bg-risk-mid",
  high: "bg-risk-high",
  crit: "bg-risk-crit",
};

function HistoryPage() {
  const fetchList = useServerFn(listAssessments);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["assessments"],
    queryFn: () => fetchList(),
  });

  const share = useMutation({
    mutationFn: useServerFn(setAssessmentShare),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["assessments"] });
      if (row?.is_shared) {
        const url = `${window.location.origin}/share/${row.share_token}`;
        navigator.clipboard?.writeText(url).catch(() => {});
        toast.success("共有リンクをコピーしました", { description: url });
      } else {
        toast.success("共有を停止しました");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: useServerFn(deleteAssessment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments"] });
      toast.success("削除しました");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-2xl font-bold">判定履歴</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          保存したチェック結果の一覧です。共有をオンにすると、リンクを知っている人だけが結果を閲覧できます。
        </p>

        {isLoading && <p className="mt-8 text-sm text-muted-foreground">読み込み中…</p>}

        {!isLoading && (data?.length ?? 0) === 0 && (
          <div className="mt-8 rounded-2xl border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">まだ履歴がありません。</p>
            <Link
              to="/bone"
              className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              チェックを始める
            </Link>
          </div>
        )}

        <ul className="mt-6 space-y-3">
          {data?.map((row) => (
            <li key={row.id} className="rounded-2xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold">
                    {(row as { athletes?: { name: string } | null }).athletes?.name ?? "名前なし"}
                    <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                      {SPORT_LABELS[row.sport as Sport] ?? row.sport} / {row.age}歳
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {new Date(row.created_at).toLocaleString("ja-JP")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tabular-nums">{row.total_score}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${
                      LEVEL_BG[row.level] ?? "bg-primary"
                    }`}
                  >
                    {row.level_label}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => share.mutate({ data: { id: row.id, isShared: !row.is_shared } })}
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-muted"
                >
                  {row.is_shared ? "共有を停止" : "共有リンクを作成"}
                </button>
                {row.is_shared && (
                  <a
                    href={`/share/${row.share_token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-muted"
                  >
                    共有ページを開く
                  </a>
                )}
                <button
                  onClick={() => remove.mutate({ data: { id: row.id } })}
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-risk-crit transition hover:bg-muted"
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
