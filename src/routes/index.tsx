import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "アプリ一覧" },
      { name: "description", content: "骨端線チェッカーの入口です。" },
      { property: "og:title", content: "アプリ一覧" },
      { property: "og:description", content: "骨端線チェッカーの入口です。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Hub,
});

function Hub() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-3xl md:text-4xl">アプリ一覧</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          使いたいアプリを選んでください。
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            to="/bone"
            className="group block rounded-2xl border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <div className="text-[11px] font-bold tracking-wide text-primary">骨端線チェック</div>
            <h2 className="mt-2 text-lg font-bold">骨端線チェッカー</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              成長期の子供のスポーツ活動から、骨端線への負荷リスクをガイドラインに基づいてチェックします。
            </p>
            <div className="mt-4 text-xs font-bold text-primary">開く →</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
