import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function AppNav() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b bg-background/85 backdrop-blur">
      <nav className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-3 text-xs font-semibold">
        <Link to="/" className="text-primary">
          ジュニア負荷チェッカー
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <Link to="/bone" className="text-muted-foreground hover:text-foreground">
            チェック
          </Link>
          {user ? (
            <>
              <Link to="/history" className="text-muted-foreground hover:text-foreground">
                履歴
              </Link>
              <Link to="/athletes" className="text-muted-foreground hover:text-foreground">
                選手
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/" });
                }}
                className="rounded-lg border px-2.5 py-1 text-muted-foreground hover:bg-muted"
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="rounded-lg bg-primary px-3 py-1.5 text-primary-foreground"
            >
              ログイン
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
