// 骨端線負荷リスク推定ロジック
// 出典・参考: 全日本野球協会 育成年代投球制限ガイドライン、
// 日本臨床スポーツ医学会 学童・思春期のスポーツ活動指針、
// 各種オーバーユース障害（Little League Elbow, Osgood-Schlatter, Sever, Sinding-Larsen等）の一般的目安。
// ※本推定はスクリーニング目的の目安であり、医学的診断ではありません。

export type Sport =
  | "baseball"
  | "running"
  | "soccer"
  | "basketball"
  | "tennis"
  | "swimming"
  | "gymnastics"
  | "other";

export const SPORT_LABELS: Record<Sport, string> = {
  baseball: "野球（投球あり）",
  running: "陸上・ランニング",
  soccer: "サッカー",
  basketball: "バスケットボール",
  tennis: "テニス・バドミントン",
  swimming: "水泳",
  gymnastics: "体操・新体操",
  other: "その他",
};

export interface Input {
  age: number;            // 歳
  height: number;         // cm
  weight: number;         // kg
  sport: Sport;
  hoursPerWeek: number;   // 練習時間/週
  daysPerWeek: number;    // 練習日数/週
  restDaysPerWeek: number;// 完全休養日/週
  pitchesPerDay?: number; // 野球のみ: 1日投球数
  hasPain: boolean;       // 痛みや違和感あり
  recentGrowthSpurt: boolean; // 直近半年で急激な身長増加
}

export type RiskLevel = "low" | "mid" | "high" | "crit";

export interface Factor {
  label: string;
  score: number;     // 加点
  detail: string;
}

export interface Result {
  totalScore: number;
  level: RiskLevel;
  levelLabel: string;
  headline: string;
  factors: Factor[];
  recommendations: string[];
  vulnerableSites: string[]; // 骨端線部位
  bmi: number;
}

const AGE_PITCH_LIMIT: { max: number; day: number; week: number }[] = [
  { max: 8,  day: 50,  week: 200 },
  { max: 10, day: 60,  week: 250 },
  { max: 12, day: 70,  week: 350 },
  { max: 15, day: 85,  week: 500 },
  { max: 18, day: 100, week: 700 },
];

function pitchLimit(age: number) {
  return AGE_PITCH_LIMIT.find((r) => age <= r.max) ?? AGE_PITCH_LIMIT[AGE_PITCH_LIMIT.length - 1];
}

const VULNERABLE_BY_SPORT: Record<Sport, string[]> = {
  baseball: ["上腕骨内側上顆（野球肘）", "上腕骨近位骨端線（リトルリーグ肩）"],
  running: ["脛骨粗面（オスグッド）", "踵骨骨端（シーバー病）"],
  soccer: ["脛骨粗面（オスグッド）", "踵骨骨端（シーバー病）", "下前腸骨棘"],
  basketball: ["脛骨粗面（オスグッド）", "膝蓋骨下極（シンディング・ラーセン）"],
  tennis: ["上腕骨外側上顆", "橈骨遠位骨端線"],
  swimming: ["肩関節周囲（水泳肩）"],
  gymnastics: ["橈骨遠位骨端線（体操手関節）", "腰椎分離"],
  other: ["主な使用関節の骨端線"],
};

export function calculateRisk(i: Input): Result {
  const factors: Factor[] = [];
  const recs: string[] = [];
  const bmi = i.weight / Math.pow(i.height / 100, 2);

  // 年齢: 8-14歳が骨端線最脆弱期
  if (i.age >= 9 && i.age <= 14) {
    factors.push({
      label: "骨端線が最も脆弱な年齢帯",
      score: 15,
      detail: `${i.age}歳は成長軟骨が活発でオーバーユース障害が起こりやすい時期です。`,
    });
  } else if (i.age >= 7 && i.age <= 16) {
    factors.push({ label: "成長期にあたる年齢", score: 8, detail: "骨端線閉鎖前で配慮が必要です。" });
  }

  // 練習時間
  const ageHourGuide = i.age < 12 ? 10 : 16; // 週あたり目安
  if (i.hoursPerWeek > ageHourGuide) {
    const over = i.hoursPerWeek - ageHourGuide;
    const score = Math.min(30, Math.round(over * 2.5));
    factors.push({
      label: "週あたり練習時間が多い",
      score,
      detail: `目安 ${ageHourGuide} 時間/週に対し ${i.hoursPerWeek} 時間。超過分でオーバーユースリスク増。`,
    });
    recs.push(`週の練習時間を目安の ${ageHourGuide} 時間以内に近づけましょう。`);
  }

  // 休養日 (AAP推奨: 週1-2日以上)
  if (i.restDaysPerWeek < 1) {
    factors.push({
      label: "完全休養日がない",
      score: 20,
      detail: "完全休養日ゼロは骨端線への慢性負荷を蓄積させます。",
    });
    recs.push("週に最低1日、できれば2日の完全休養日を設けてください。");
  } else if (i.restDaysPerWeek < 2) {
    factors.push({ label: "休養日が少ない", score: 8, detail: "週2日の休養が推奨されます。" });
  }

  // 練習日数
  if (i.daysPerWeek >= 6) {
    factors.push({ label: "ほぼ毎日練習", score: 10, detail: "同一動作の反復で局所疲労が蓄積します。" });
  }

  // 野球の投球数
  if (i.sport === "baseball" && i.pitchesPerDay != null) {
    const lim = pitchLimit(i.age);
    if (i.pitchesPerDay > lim.day) {
      const over = i.pitchesPerDay - lim.day;
      factors.push({
        label: "1日投球数が制限超過",
        score: Math.min(35, 15 + Math.round(over / 5) * 2),
        detail: `${i.age}歳の1日投球目安は ${lim.day} 球。現在 ${i.pitchesPerDay} 球。`,
      });
      recs.push(`1日投球数を ${lim.day} 球以内に抑えてください。`);
    } else if (i.pitchesPerDay > lim.day * 0.8) {
      factors.push({
        label: "1日投球数が制限に近い",
        score: 8,
        detail: `目安 ${lim.day} 球に近い投球数です。`,
      });
    }
    const weekPitch = i.pitchesPerDay * Math.max(1, i.daysPerWeek - i.restDaysPerWeek);
    if (weekPitch > lim.week) {
      factors.push({
        label: "週間投球数が過多",
        score: 15,
        detail: `推定週間 ${weekPitch} 球（目安 ${lim.week} 球）。`,
      });
      recs.push("投球日を週内で分散し、投球後は最低1日休養してください。");
    }
  }

  // 痛み
  if (i.hasPain) {
    factors.push({
      label: "痛み・違和感がある",
      score: 30,
      detail: "痛みは骨端線障害の初期サイン。放置は変形・成長障害の恐れ。",
    });
    recs.push("直ちに練習を中止し、整形外科（できればスポーツ整形）を受診してください。");
  }

  // 成長スパート
  if (i.recentGrowthSpurt) {
    factors.push({
      label: "急激な身長増加期",
      score: 12,
      detail: "成長スパート中は骨と筋腱のバランスが崩れ、骨端線障害リスクが上昇します。",
    });
    recs.push("この時期はストレッチと柔軟性維持を意識し、負荷を段階的に調整しましょう。");
  }

  // BMI
  if (bmi >= 25) {
    factors.push({ label: "体格指数がやや高い", score: 8, detail: `BMI ${bmi.toFixed(1)}。関節への機械的負荷が増加。` });
  }

  const totalScore = factors.reduce((s, f) => s + f.score, 0);

  let level: RiskLevel;
  let levelLabel: string;
  let headline: string;
  if (totalScore >= 60) {
    level = "crit";
    levelLabel = "要注意（受診推奨）";
    headline = "骨端線への過剰な負荷が疑われます。専門医の受診を強く推奨します。";
  } else if (totalScore >= 35) {
    level = "high";
    levelLabel = "高リスク";
    headline = "オーバーユース障害のリスクが高い状態です。練習量と休養を見直してください。";
  } else if (totalScore >= 15) {
    level = "mid";
    levelLabel = "中リスク";
    headline = "現状は許容範囲ですが、いくつか改善余地があります。";
  } else {
    level = "low";
    levelLabel = "低リスク";
    headline = "現状は適切な範囲です。この調子でケアを続けましょう。";
  }

  // デフォルト推奨
  if (recs.length === 0) {
    recs.push("練習前後のウォームアップとクールダウンを継続してください。");
  }
  recs.push("週1回、痛みチェック（押して痛む場所がないか）を行いましょう。");
  recs.push("十分な睡眠（小学生9-11時間、中高生8-10時間）とタンパク質・カルシウム摂取を意識してください。");

  return {
    totalScore,
    level,
    levelLabel,
    headline,
    factors,
    recommendations: recs,
    vulnerableSites: VULNERABLE_BY_SPORT[i.sport],
    bmi,
  };
}
