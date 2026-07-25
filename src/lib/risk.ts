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

// 競技ごとの道具情報（すべて任意）
export interface Equipment {
  // 野球
  ballType?: "soft" | "hard";           // 軟式 / 硬式
  batWeightG?: number;                  // バット重量 g
  batType?: "wood" | "metal" | "composite"; // 木製 / 金属 / 複合
  // 陸上
  runningShoe?: "cushioned" | "normal" | "minimal" | "spike"; // クッション種別
  runningSurface?: "track" | "road" | "trail" | "concrete";   // 走行路面
  // サッカー
  soccerStud?: "turf" | "firm" | "soft" | "ag";  // スタッド種別
  soccerBallSize?: 3 | 4 | 5;
  // バスケ
  basketballBallSize?: 5 | 6 | 7;
  basketballShoe?: "cushioned" | "normal" | "worn"; // すり減り含む
  // テニス・バドミントン
  racketWeightG?: number;               // ラケット重量 g
  stringTensionLb?: number;             // ガット張力 lb
  // 水泳
  usesPaddles?: boolean;                // パドル使用
  usesFins?: boolean;                   // フィン使用
  // 体操
  gymApparatus?: "floor" | "vault" | "bars" | "beam" | "rings" | "rhythmic";
  // 共通: 道具のサイズが体格に合っていないと感じるか
  equipmentFitsPoorly?: boolean;
}

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
  equipment?: Equipment;
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

// 年齢に応じた推奨バット重量（g）目安
function recommendedBatWeight(age: number): number {
  if (age <= 8) return 480;
  if (age <= 10) return 560;
  if (age <= 12) return 650;
  if (age <= 15) return 780;
  return 900;
}

// 年齢に応じた推奨ラケット重量（g）目安（硬式テニス）
function recommendedRacketWeight(age: number): number {
  if (age <= 8) return 220;
  if (age <= 10) return 240;
  if (age <= 12) return 260;
  if (age <= 15) return 280;
  return 300;
}

function evaluateEquipment(i: Input, factors: Factor[], recs: string[]) {
  const eq = i.equipment;
  if (!eq) return;

  // 野球
  if (i.sport === "baseball") {
    if (eq.ballType === "hard" && i.age <= 12) {
      factors.push({
        label: "硬式球の使用（12歳以下）",
        score: 15,
        detail: "硬式球は反発と質量が大きく、肘・肩の骨端線に加わる衝撃が軟式より顕著に増加します。",
      });
      recs.push("小学生年代では原則軟式球の使用が推奨されます。硬式使用時は投球数をさらに抑えてください。");
    } else if (eq.ballType === "hard") {
      factors.push({
        label: "硬式球の使用",
        score: 5,
        detail: "硬式球は投球あたりの関節負荷が大きいため管理が重要です。",
      });
    }
    if (eq.batWeightG != null && eq.batWeightG > 0) {
      const rec = recommendedBatWeight(i.age);
      const over = eq.batWeightG - rec;
      if (over > 80) {
        factors.push({
          label: "バットが体格に対して重い",
          score: Math.min(15, 6 + Math.round(over / 40)),
          detail: `${i.age}歳の目安 ${rec}g に対し ${eq.batWeightG}g。スイングで腰椎・手関節・肘への負荷が増えます。`,
        });
        recs.push(`バット重量を目安 ${rec}g 前後に見直してください。`);
      }
    }
    if (eq.batType === "metal" && i.age <= 12) {
      factors.push({
        label: "金属バットによる反発負荷",
        score: 4,
        detail: "金属バットは打球衝撃が手・手関節の骨端線に伝わりやすい傾向があります。",
      });
    }
  }

  // 陸上
  if (i.sport === "running") {
    if (eq.runningShoe === "minimal") {
      factors.push({
        label: "薄底・ミニマルシューズ",
        score: 10,
        detail: "クッション性が低く、踵骨骨端（シーバー病）や脛骨のストレスが増加します。",
      });
      recs.push("成長期はクッション性のあるジュニア用シューズを推奨します。");
    } else if (eq.runningShoe === "spike" && i.age <= 12) {
      factors.push({
        label: "スパイクの常用（12歳以下）",
        score: 8,
        detail: "スパイクはアキレス腱・踵骨骨端への衝撃が強くなります。",
      });
    }
    if (eq.runningSurface === "concrete" || eq.runningSurface === "road") {
      factors.push({
        label: "硬い路面での走行",
        score: 8,
        detail: "コンクリート・アスファルトは衝撃吸収が少なく下肢骨端線への負荷が大きくなります。",
      });
      recs.push("週の一定割合はトラックや土・芝など柔らかい路面での練習に置き換えましょう。");
    }
  }

  // サッカー
  if (i.sport === "soccer") {
    if (eq.soccerStud === "soft" || eq.soccerStud === "firm") {
      factors.push({
        label: "固定式スタッド（FG/SG）",
        score: 6,
        detail: "固定スタッドは踵・膝への突き上げが強く、シーバー病・オスグッドのリスクが増加します。",
      });
      recs.push("普段練習では人工芝用（AG）やターフシューズを検討してください。");
    }
    if (eq.soccerBallSize === 5 && i.age <= 11) {
      factors.push({
        label: "5号球の使用（11歳以下）",
        score: 8,
        detail: "5号球は体格に対して重く、股関節・下前腸骨棘・膝への負荷が大きくなります。",
      });
      recs.push(`${i.age}歳では4号球の使用が推奨されます。`);
    }
  }

  // バスケ
  if (i.sport === "basketball") {
    if (eq.basketballBallSize === 7 && i.age <= 11) {
      factors.push({
        label: "7号球の使用（11歳以下）",
        score: 6,
        detail: "7号球は重く、手関節・指の骨端線への負荷が増えます。",
      });
      recs.push(`${i.age}歳では5号または6号球が推奨されます。`);
    }
    if (eq.basketballShoe === "worn") {
      factors.push({
        label: "シューズのすり減り",
        score: 8,
        detail: "クッションが劣化したシューズはジャンプ着地衝撃が膝・踵に直接伝わります。",
      });
      recs.push("ミッドソールが潰れたシューズは早めに交換してください。");
    }
  }

  // テニス
  if (i.sport === "tennis") {
    if (eq.racketWeightG != null && eq.racketWeightG > 0) {
      const rec = recommendedRacketWeight(i.age);
      const over = eq.racketWeightG - rec;
      if (over > 20) {
        factors.push({
          label: "ラケットが体格に対して重い",
          score: Math.min(15, 6 + Math.round(over / 15)),
          detail: `${i.age}歳の目安 ${rec}g に対し ${eq.racketWeightG}g。上腕骨外側上顆・手関節への負荷が増加します。`,
        });
        recs.push(`ラケット重量を目安 ${rec}g 前後、またはジュニア用モデルに変更してください。`);
      }
    }
    if (eq.stringTensionLb != null && eq.stringTensionLb >= 55) {
      factors.push({
        label: "ガット張力が高い",
        score: 6,
        detail: `${eq.stringTensionLb}lb は成長期には硬く、肘・手関節への衝撃が増えます。`,
      });
      recs.push("成長期はガット張力を 45–52lb 程度に緩めることを推奨します。");
    }
  }

  // 水泳
  if (i.sport === "swimming") {
    if (eq.usesPaddles) {
      factors.push({
        label: "パドル使用",
        score: 10,
        detail: "パドルは肩へのトルクを大幅に増やし、成長期の水泳肩リスクを高めます。",
      });
      recs.push("成長期のパドル使用は短時間・低頻度に留めてください。");
    }
    if (eq.usesFins) {
      factors.push({
        label: "フィン使用",
        score: 4,
        detail: "フィンは足関節・膝への負荷を増やします。使用時間を管理してください。",
      });
    }
  }

  // 体操
  if (i.sport === "gymnastics") {
    if (eq.gymApparatus === "vault" || eq.gymApparatus === "bars" || eq.gymApparatus === "rings") {
      factors.push({
        label: "手関節高負荷種目",
        score: 12,
        detail: "跳馬・鉄棒・つり輪は橈骨遠位骨端線への衝撃・圧迫が大きい種目です。",
      });
      recs.push("種目後の手関節ケア（アイシング・ストレッチ）と週内での種目分散を行ってください。");
    } else if (eq.gymApparatus === "floor") {
      factors.push({
        label: "床運動の反復",
        score: 6,
        detail: "着地衝撃が下肢骨端線に繰り返し加わります。",
      });
    }
  }

  // 共通
  if (eq.equipmentFitsPoorly) {
    factors.push({
      label: "道具が体格に合っていない",
      score: 8,
      detail: "サイズ不適合な道具は不自然なフォームを誘発し、局所への偏った負荷を生みます。",
    });
    recs.push("成長に合わせて年1回は道具のサイズ・重量を見直してください。");
  }
}

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
  const ageHourGuide = i.age < 12 ? 10 : 16;
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

  if (i.daysPerWeek >= 6) {
    factors.push({ label: "ほぼ毎日練習", score: 10, detail: "同一動作の反復で局所疲労が蓄積します。" });
  }

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

  if (i.hasPain) {
    factors.push({
      label: "痛み・違和感がある",
      score: 30,
      detail: "痛みは骨端線障害の初期サイン。放置は変形・成長障害の恐れ。",
    });
    recs.push("直ちに練習を中止し、整形外科（できればスポーツ整形）を受診してください。");
  }

  if (i.recentGrowthSpurt) {
    factors.push({
      label: "急激な身長増加期",
      score: 12,
      detail: "成長スパート中は骨と筋腱のバランスが崩れ、骨端線障害リスクが上昇します。",
    });
    recs.push("この時期はストレッチと柔軟性維持を意識し、負荷を段階的に調整しましょう。");
  }

  if (bmi >= 25) {
    factors.push({ label: "体格指数がやや高い", score: 8, detail: `BMI ${bmi.toFixed(1)}。関節への機械的負荷が増加。` });
  }

  // 道具評価
  evaluateEquipment(i, factors, recs);

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
