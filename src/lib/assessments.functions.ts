import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type AthleteInput = {
  id?: string;
  name: string;
  birth_date?: string | null;
  sex: string;
  sport: string;
  height?: number | null;
  weight?: number | null;
  note?: string | null;
};

export const listAthletes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("athletes")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveAthlete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AthleteInput) => {
    if (!input.name?.trim()) throw new Error("名前を入力してください");
    return input;
  })
  .handler(async ({ data, context }) => {
    const row = {
      name: data.name.trim(),
      birth_date: data.birth_date || null,
      sex: data.sex,
      sport: data.sport,
      height: data.height ?? null,
      weight: data.weight ?? null,
      note: data.note ?? null,
      user_id: context.userId,
    };
    const query = data.id
      ? context.supabase.from("athletes").update(row).eq("id", data.id).select().single()
      : context.supabase.from("athletes").insert(row).select().single();
    const { data: saved, error } = await query;
    if (error) throw new Error(error.message);
    return saved;
  });

export const deleteAthlete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("athletes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type SaveAssessmentInput = {
  athleteId?: string | null;
  sport: string;
  sex: string;
  age: number;
  totalScore: number;
  level: string;
  levelLabel: string;
  bmi: number;
  input: unknown;
  result: unknown;
};

export const listAssessments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("assessments")
      .select("*, athletes(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: SaveAssessmentInput) => input)
  .handler(async ({ data, context }) => {
    const { data: saved, error } = await context.supabase
      .from("assessments")
      .insert({
        user_id: context.userId,
        athlete_id: data.athleteId ?? null,
        sport: data.sport,
        sex: data.sex,
        age: data.age,
        total_score: data.totalScore,
        level: data.level,
        level_label: data.levelLabel,
        bmi: data.bmi,
        input: data.input as never,
        result: data.result as never,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const deleteAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("assessments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setAssessmentShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; isShared: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { data: updated, error } = await context.supabase
      .from("assessments")
      .update({ is_shared: data.isShared })
      .eq("id", data.id)
      .select("id, is_shared, share_token")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

export const getSharedAssessment = createServerFn({ method: "GET" })
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data }) => {
    const url = process.env["SUPABASE_URL"]!;
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const supabasePublic = createClient<Database>(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data: row, error } = await supabasePublic
      .from("assessments")
      .select("id, sport, sex, age, total_score, level, level_label, bmi, result, created_at")
      .eq("share_token", data.token)
      .eq("is_shared", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });
