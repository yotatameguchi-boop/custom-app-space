import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "ログイン | 骨端線チェッカー" },
      { name: "description", content: "判定履歴の保存や選手プロフィール管理のためにログインします。" },
      { property: "og:title", content: "ログイン | 骨端線チェッカー" },
      { property: "og:description", content: "判定履歴の保存や選手プロフィール管理のためにログインします。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/history" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/history" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/history` },
        });
        if (error) throw error;
        toast.success("確認メールを送信しました。メール内のリンクから登録を完了してください。");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    try {
      await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Googleログインに失敗しました");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-14">
      <div className="w-full max-w-sm">
        <Link to="/" className="text-[11px] font-bold tracking-wide text-primary">
          ← トップへ
        </Link>
        <h1 className="mt-4 text-2xl font-bold">
          {mode === "signin" ? "ログイン" : "新規登録"}
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          ログインすると、判定結果の履歴保存・選手ごとの管理・結果の共有リンク発行が使えます。
        </p>

        <button
          onClick={google}
          className="mt-6 w-full rounded-xl border bg-card px-4 py-3 text-sm font-semibold transition hover:bg-muted"
        >
          Googleで続ける
        </button>

        <div className="my-5 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />または<span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード（6文字以上）"
            className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {mode === "signin" ? "ログイン" : "登録する"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-xs text-muted-foreground underline"
        >
          {mode === "signin" ? "アカウントをお持ちでない方はこちら" : "すでにアカウントをお持ちの方はこちら"}
        </button>
      </div>
    </div>
  );
}
