// 骨端線負荷リスク推定ロジック
// ※本推定はスクリーニング目的の目安であり、医学的診断ではありません。

export interface Source {
  title: string;
  organization: string;
  url?: string;
  description: string;
}

export const SOURCES: Source[] = [
  {
    title: "育成年代投球制限ガイドライン",
    organization: "全日本野球協会（野球日本代表 侍ジャパン）",
    url: "https://www.japan-baseball.jp/",
    description: "年齢別の1日・週間投球数上限、硬式・軟式ボールの使用区分、変化球導入時期などを参考にしています。",
  },
  {
    title: "学童・思春期のスポーツ活動指針",
    organization: "日本臨床スポーツ医学会",
    url: "https://www.jsmclinic.org/",
    description: "成長期の骨端線への負荷、週間練習量・休養日の目安、オーバーユース障害の予防指針などを参考にしています。",
  },
  {
    title: "小児・思春期スポーツ障害に関する知見",
    organization: "日本小児整形外科学会・日本スポーツ整形外科学会等の公開情報",
    description: "Little League Elbow、Osgood-Schlatter、Sever、Sinding-Larsen-Johansson など、骨端線周囲のオーバーユース障害の臨床目安を参考にしています。",
  },
  {
    title: "各競技のジュニア指導・用具規格",
    organization: "日本陸上競技連盟、日本サッカー協会、日本バスケットボール協会、日本テニス協会、日本水泳連盟、日本体操協会等の公開ガイドライン",
    description: "ボール・バット・ラケット・シューズ・パドルなど、年齢に応じた用具選定と負荷軽減の指針を参考にしています。",
  },
  {
    title: "IOC Consensus Statement on Relative Energy Deficiency in Sport (REDs) 2023",
    organization: "International Olympic Committee (Br J Sports Med 2023;57:1073-1097)",
    url: "https://bjsm.bmj.com/content/57/17/1073",
    description: "女性アスリートの相対的エネルギー不足（REDs）、無月経、骨密度低下、疲労骨折リスクの上昇について性差を定量的に示した国際的コンセンサス。",
  },
  {
    title: "ACL損傷の性差に関する疫学研究（Hewett TE ほか）",
    organization: "American Journal of Sports Medicine / NATA Position Statement",
    url: "https://journals.sagepub.com/doi/10.1177/0363546504269591",
    description: "サッカー・バスケットボール等のカッティング競技で、女性は男性の2〜8倍のACL損傷リスクがあることを示す一連の研究。Q角・ホルモン・神経筋制御の性差に起因。",
  },
  {
    title: "成長期の骨端線閉鎖時期に関する骨年齢研究（Greulich-Pyle / TW3法）",
    organization: "日本小児内分泌学会・日本整形外科学会",
    url: "https://jspe.umin.jp/",
    description: "女子は男子より約2年早く思春期・成長スパートを迎え、骨端線閉鎖も1.5〜2年早い（女子14〜16歳、男子16〜18歳）。脆弱年齢帯が性別で異なる。",
  },
  {
    title: "女性アスリートの三主徴（Female Athlete Triad）診療指針",
    organization: "日本産科婦人科学会・日本臨床スポーツ医学会",
    url: "https://www.jsog.or.jp/",
    description: "利用可能エネルギー不足・無月経・骨粗鬆症の三主徴。中高生女性アスリートで疲労骨折リスクが男性の約2〜4倍に上昇することを報告。",
  },
];

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
  ballType?: "softM" | "softJ" | "semi" | "hard"; // 軟式M/軟式J/準硬式/硬式
  batWeightG?: number;                             // バット重量 g
  batType?: "wood" | "metal" | "composite";        // 木製 / 金属 / 複合（カーボン）
  throwsBreakingBall?: boolean;                    // 変化球を投げる
  // 陸上
  runningShoe?: "cushioned" | "normal" | "minimal" | "spike"; // クッション種別
  runningSurface?: "track" | "road" | "trail" | "concrete";   // 走行路面
  shoeWear?: "new" | "normal" | "worn";                        // シューズ摩耗
  // サッカー
  soccerStud?: "turf" | "firm" | "soft" | "ag";  // スタッド種別
  soccerStudMaterial?: "rubber" | "plastic" | "metal"; // スタッド材質
  soccerBallSize?: 3 | 4 | 5;
  // バスケ
  basketballBallSize?: 5 | 6 | 7;
  basketballBallMaterial?: "rubber" | "composite" | "leather"; // ボール材質
  basketballShoe?: "cushioned" | "normal" | "worn"; // すり減り含む
  courtSurface?: "wood" | "rubber" | "concrete" | "asphalt";
  // テニス・バドミントン
  racketWeightG?: number;               // ラケット重量 g
  stringTensionLb?: number;             // ガット張力 lb
  stringMaterial?: "gut" | "nylon" | "poly"; // ストリング素材
  // 水泳
  usesPaddles?: boolean;                // パドル使用
  paddleSize?: "small" | "large";       // パドルサイズ（大は肩負荷大）
  usesFins?: boolean;                   // フィン使用
  // 体操
  gymApparatus?: "floor" | "vault" | "bars" | "beam" | "rings" | "rhythmic";
  usesGrips?: boolean;                  // 手掌プロテクター（グリップ）使用
  // 共通: 道具のサイズが体格に合っていないと感じるか
  equipmentFitsPoorly?: boolean;
}

export type Sex = "male" | "female";

export const SEX_LABELS: Record<Sex, string> = {
  male: "男子",
  female: "女子",
};

export interface Input {
  age: number;            // 歳
  sex: Sex;               // 性別（生物学的性）
  height: number;         // cm
  weight: number;         // kg
  sport: Sport;
  hoursPerWeek: number;   // 練習時間/週
  daysPerWeek: number;    // 練習日数/週
  restDaysPerWeek: number;// 完全休養日/週
  pitchesPerDay?: number; // 野球のみ: 1日投球数
  hasPain: boolean;       // 痛みや違和感あり
  recentGrowthSpurt: boolean; // 直近半年で急激な身長増加
  menstrualIrregularity?: boolean; // 女子: 無月経/月経不順（3か月以上）
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

// ============================================================
// 用語集（クリックで説明を表示するための辞書）
// キーはUI本文中に現れる正確な表記。長いキーから優先マッチする。
// ============================================================
export const GLOSSARY: Record<string, string> = {
  骨端線:
    "成長期の骨の端にある軟骨層（成長板）。ここで骨が伸びる。強い衝撃や反復負荷で損傷すると成長障害や変形の原因になる。",
  オーバーユース:
    "同じ動作を過剰に繰り返すことで、骨・軟骨・腱に微小損傷が蓄積し痛みや障害を起こす状態。",
  成長スパート:
    "身長が急激に伸びる時期（男子12〜14歳、女子10〜12歳頃）。骨の伸びに筋腱が追いつかず、骨端線障害が起こりやすい。",
  BMI:
    "体重(kg) ÷ 身長(m)²。体格の指標。高すぎると関節への機械的負荷が増える。",

  // 野球
  野球肘:
    "投球動作の繰り返しで肘の内側（上腕骨内側上顆）の骨端線に牽引・圧迫が加わり生じる障害。放置で離断性骨軟骨炎に進行することも。",
  上腕骨内側上顆:
    "肘の内側の骨のふくらみ。前腕屈筋群が付着し、投球時に強い牽引力を受ける。",
  リトルリーグ肩:
    "投球の繰り返しで上腕骨近位（肩側）の骨端線が離開する障害。10〜14歳に多い。",
  上腕骨近位骨端線:
    "肩に近い上腕骨の成長板。投球のねじれ負荷が集中する部位。",
  変化球:
    "カーブ・スライダー等、前腕の回内外や強い手首のひねりを伴う投球。成長期の肘に高負荷。",
  軟式M: "中学生以上で使う一般軟式球。J号よりやや大きく重い。",
  軟式J: "小学生用の軟式球。M号より小さく軽い。",
  準硬式: "硬式に近い構造の軟式球（H号）。反発が強く肘・肩への負荷は硬式に近い。",

  // ランニング／サッカー
  オスグッド:
    "膝下（脛骨粗面）の骨端に牽引力が繰り返し加わり、痛み・隆起を起こす障害。ジャンプ・ダッシュを繰り返す10〜15歳に多い。",
  脛骨粗面: "膝のすぐ下、脛骨前面のふくらみ。大腿四頭筋の腱（膝蓋腱）が付着する。",
  シーバー病:
    "踵骨（かかと）の骨端に、アキレス腱の牽引と着地衝撃が繰り返し加わる障害。8〜12歳の活動的な子に多い。",
  踵骨骨端: "かかとの骨の成長板。アキレス腱が付着する部位。",
  下前腸骨棘:
    "骨盤前面の突起。大腿直筋が付着し、キック動作の繰り返しで剥離骨折を起こすことがある。",

  // バスケ
  シンディング・ラーセン:
    "膝蓋骨の下端（下極）の骨端に牽引が繰り返し加わり痛みを起こす障害。ジャンプ競技に多い。",
  膝蓋骨下極: "膝のお皿（膝蓋骨）の下端。膝蓋腱が付着する部位。",

  // テニス・体操
  上腕骨外側上顆:
    "肘の外側の骨のふくらみ。前腕伸筋群が付着し、テニスのバックハンド等で牽引される（テニス肘）。",
  橈骨遠位骨端線:
    "手首側の橈骨（前腕の親指側の骨）の成長板。体操の跳躍・支持動作で圧迫される（体操手関節）。",
  水泳肩:
    "反復するストロークで肩関節周囲に炎症・インピンジメントを起こす障害。パドル使用で顕著に悪化する。",
  腰椎分離:
    "腰椎の後方部（椎弓）に反復ストレスで疲労骨折が生じる障害。反り動作の多い競技で好発。",

  // 道具用語
  スパイク: "靴底に突起（スタッド／ピン）がある競技靴。グリップは強いが着地衝撃が増える。",
  スタッド: "サッカーシューズの靴底突起。FG=固い天然芝、SG=軟弱ピッチ、AG=人工芝、TF=トレーニング用の分類がある。",
  ミニマル: "ソールが薄くクッションの少ないシューズ。地面反力が直接下肢に伝わる。",
  ポリエステルストリング:
    "テニスの高剛性ストリング（いわゆるポリ）。ボールの喰い付きは良いが振動吸収が悪く肘・手関節への衝撃が大きい。",
  グリップ:
    "体操競技で鉄棒・段違い・つり輪で手掌に着ける保護具。手のひらの摩擦・水泡を減らし手関節負荷も軽減する。",
};

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

// 野球ボール種別の負荷係数（軟式Jを基準1.0とした相対）
const BALL_LOAD: Record<NonNullable<Equipment["ballType"]>, { score: number; label: string; detail: string }> = {
  softJ: { score: 0, label: "軟式J号球", detail: "小学生用軟式球。反発・質量とも最小で骨端線負荷は最も低い。" },
  softM: { score: 3, label: "軟式M号球", detail: "中学生以上の一般軟式球。J号より一回り大きく反発もやや強い。" },
  semi:  { score: 10, label: "準硬式球（H号）", detail: "硬式に近い反発と質量。中学以上向けで肘・肩負荷は硬式に迫る。" },
  hard:  { score: 15, label: "硬式球", detail: "反発と質量が大きく、投球あたりの肘・肩の骨端線への衝撃が顕著に増加する。" },
};

function evaluateEquipment(i: Input, factors: Factor[], recs: string[]) {
  const eq = i.equipment;
  if (!eq) return;

  // 野球
  if (i.sport === "baseball") {
    if (eq.ballType) {
      const b = BALL_LOAD[eq.ballType];
      // 12歳以下 × 硬式/準硬式は追加リスク
      const ageBoost = i.age <= 12 && (eq.ballType === "hard" || eq.ballType === "semi") ? 5 : 0;
      if (b.score + ageBoost > 0) {
        factors.push({
          label: `${b.label}の使用${ageBoost ? "（12歳以下）" : ""}`,
          score: b.score + ageBoost,
          detail: b.detail + (ageBoost ? " 小学生年代では原則軟式球が推奨される。" : ""),
        });
        if (ageBoost) recs.push("小学生年代では軟式（J号/M号）の使用を推奨します。");
      }
    }
    if (eq.throwsBreakingBall && i.age <= 15) {
      factors.push({
        label: "変化球の投球",
        score: i.age <= 12 ? 15 : 8,
        detail: "変化球は前腕の回内・強いひねりを伴い、成長期の肘（上腕骨内側上顆）への負荷が大きい。",
      });
      recs.push("骨端線閉鎖前（概ね中学生まで）はストレート中心の練習を推奨します。");
    }
    if (eq.batWeightG != null && eq.batWeightG > 0) {
      const rec = recommendedBatWeight(i.age);
      const over = eq.batWeightG - rec;
      if (over > 80) {
        factors.push({
          label: "バットが体格に対して重い",
          score: Math.min(15, 6 + Math.round(over / 40)),
          detail: `${i.age}歳の目安 ${rec}g に対し ${eq.batWeightG}g。スイングで腰椎・手関節・肘への負荷が増える。`,
        });
        recs.push(`バット重量を目安 ${rec}g 前後に見直してください。`);
      }
    }
    if (eq.batType === "metal" && i.age <= 12) {
      factors.push({
        label: "金属バットの打球衝撃",
        score: 4,
        detail: "金属バットは打球衝撃が手・手関節の骨端線（橈骨遠位骨端線）に伝わりやすい。",
      });
    } else if (eq.batType === "composite" && i.age <= 12) {
      factors.push({
        label: "複合（カーボン）バットの反発",
        score: 6,
        detail: "複合バットは反発係数が高く、スイング時のしなりと打球衝撃で手関節・肘への負荷が金属より大きい傾向。",
      });
    } else if (eq.batType === "wood" && i.age <= 10) {
      factors.push({
        label: "木製バットの重量負荷",
        score: 3,
        detail: "木製バットは重量バランスが手元寄りで、幼年齢では手関節を痛めやすい。",
      });
    }
  }

  // 陸上
  if (i.sport === "running") {
    if (eq.runningShoe === "minimal") {
      factors.push({
        label: "薄底・ミニマルシューズ",
        score: 10,
        detail: "クッション性が低く、踵骨骨端（シーバー病）や脛骨のストレスが増加する。",
      });
      recs.push("成長期はクッション性のあるジュニア用シューズを推奨します。");
    } else if (eq.runningShoe === "spike") {
      factors.push({
        label: i.age <= 12 ? "スパイクの常用（12歳以下）" : "スパイクの常用",
        score: i.age <= 12 ? 10 : 5,
        detail: "スパイクはピンによる着地衝撃の集中と前足部荷重の増加で、アキレス腱・踵骨骨端への衝撃が強い。",
      });
    } else if (eq.runningShoe === "normal") {
      factors.push({
        label: "クッション標準のシューズ",
        score: 2,
        detail: "特別高くも低くもないが、ジュニア用の厚めクッションの方が骨端線には優しい。",
      });
    }
    if (eq.shoeWear === "worn") {
      factors.push({
        label: "シューズの摩耗",
        score: 8,
        detail: "ミッドソールが潰れたシューズは衝撃吸収が失われ、下肢骨端線への衝撃が直接伝わる。",
      });
      recs.push("走行距離500〜800kmを目安にシューズを交換してください。");
    }
    if (eq.runningSurface === "concrete") {
      factors.push({
        label: "コンクリート路面での走行",
        score: 10,
        detail: "コンクリートは最も硬く、着地衝撃の吸収がほぼない。下肢骨端線への負荷が最大級。",
      });
      recs.push("週の一定割合はトラックや土・芝など柔らかい路面に置き換えましょう。");
    } else if (eq.runningSurface === "road") {
      factors.push({
        label: "舗装路（アスファルト）での走行",
        score: 6,
        detail: "コンクリートよりはわずかに柔らかいが、繰り返しの着地で下肢骨端線に負荷が蓄積する。",
      });
    }
  }

  // サッカー
  if (i.sport === "soccer") {
    if (eq.soccerStud === "soft" || eq.soccerStud === "firm") {
      factors.push({
        label: eq.soccerStud === "soft" ? "SGスパイク（軟弱ピッチ用）" : "FGスパイク（固い天然芝用）",
        score: eq.soccerStud === "soft" ? 8 : 6,
        detail: "固定スタッドは接地面積が小さくスタッドが刺さるため、踵・膝への突き上げが強く、シーバー病・オスグッドのリスクが増加する。",
      });
      recs.push("普段練習では人工芝用（AG）やトレシュー（TF）を検討してください。");
    } else if (eq.soccerStud === "ag") {
      factors.push({
        label: "AGスパイク（人工芝用）",
        score: 2,
        detail: "多点接地でFG/SGより衝撃分散に優れるが、TFよりは硬い。",
      });
    }
    if (eq.soccerStudMaterial === "metal") {
      factors.push({
        label: "金属スタッド",
        score: 8,
        detail: "金属スタッドは変形せず衝撃をそのまま骨端線に伝える。成長期は原則非推奨。",
      });
      recs.push("成長期のジュニアには樹脂スタッドを推奨します。");
    }
    if (eq.soccerBallSize === 5 && i.age <= 11) {
      factors.push({
        label: "5号球の使用（11歳以下）",
        score: 8,
        detail: "5号球は体格に対して重く、キック時の股関節・下前腸骨棘・膝への負荷が大きい。",
      });
      recs.push(`${i.age}歳では4号球の使用が推奨されます。`);
    } else if (eq.soccerBallSize === 4 && i.age <= 7) {
      factors.push({
        label: "4号球の使用（7歳以下）",
        score: 4,
        detail: "低学年では3号球の方が体格に合う。",
      });
    }
  }

  // バスケ
  if (i.sport === "basketball") {
    if (eq.basketballBallSize === 7 && i.age <= 11) {
      factors.push({
        label: "7号球の使用（11歳以下）",
        score: 6,
        detail: "7号球は重く、手関節・指の骨端線（橈骨遠位骨端線）への負荷が増える。",
      });
      recs.push(`${i.age}歳では5号または6号球が推奨されます。`);
    }
    if (eq.basketballBallMaterial === "leather") {
      factors.push({
        label: "天然皮革ボール",
        score: 3,
        detail: "天然皮革は重く反発も強め。指・手関節への突き指リスクや骨端線負荷がやや高い。",
      });
    } else if (eq.basketballBallMaterial === "rubber") {
      factors.push({
        label: "ゴムボール（屋外用）",
        score: 4,
        detail: "ゴムボールは硬く反発が強い。屋外の硬い床面と合わさると衝撃が指・手関節に集中する。",
      });
    }
    if (eq.basketballShoe === "worn") {
      factors.push({
        label: "シューズのすり減り",
        score: 8,
        detail: "クッションが劣化したシューズはジャンプ着地衝撃が膝・踵に直接伝わる（シンディング・ラーセン、シーバー病）。",
      });
      recs.push("ミッドソールが潰れたシューズは早めに交換してください。");
    }
    if (eq.courtSurface === "concrete" || eq.courtSurface === "asphalt") {
      factors.push({
        label: eq.courtSurface === "concrete" ? "コンクリート床面" : "アスファルト床面",
        score: 10,
        detail: "屋外の硬い床面はジャンプ着地衝撃の吸収がほぼなく、膝蓋骨下極・脛骨粗面へのストレスが大きい。",
      });
      recs.push("週に数回は体育館などの木製床面での練習を確保してください。");
    } else if (eq.courtSurface === "rubber") {
      factors.push({
        label: "ゴム系床面",
        score: 3,
        detail: "木製床より硬めだがアスファルトよりは緩衝性がある。",
      });
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
          detail: `${i.age}歳の目安 ${rec}g に対し ${eq.racketWeightG}g。上腕骨外側上顆・手関節への負荷が増加する。`,
        });
        recs.push(`ラケット重量を目安 ${rec}g 前後、またはジュニア用モデルに変更してください。`);
      }
    }
    if (eq.stringTensionLb != null && eq.stringTensionLb >= 55) {
      factors.push({
        label: "ガット張力が高い",
        score: 6,
        detail: `${eq.stringTensionLb}lb は成長期には硬く、肘・手関節への衝撃が増える。`,
      });
      recs.push("成長期はガット張力を 45–52lb 程度に緩めることを推奨します。");
    }
    if (eq.stringMaterial === "poly") {
      factors.push({
        label: "ポリエステルストリング",
        score: 10,
        detail: "ポリは反発と喰い付きが強いが振動吸収が悪く、上腕骨外側上顆（テニス肘）への衝撃が顕著。成長期は非推奨。",
      });
      recs.push("成長期はナチュラルガットまたはナイロン系ストリングを推奨します。");
    } else if (eq.stringMaterial === "gut") {
      factors.push({
        label: "ナチュラルガット",
        score: -3,
        detail: "振動吸収に優れ、肘・手関節への衝撃が最も小さい（軽減要因）。",
      });
    }
  }

  // 水泳
  if (i.sport === "swimming") {
    if (eq.usesPaddles) {
      const large = eq.paddleSize === "large";
      factors.push({
        label: large ? "大型パドル使用" : "パドル使用",
        score: large ? 15 : 10,
        detail: "パドルは水を掴む面積を拡げ肩へのトルクを大幅に増加させる。大型ほど水泳肩リスクが高い。",
      });
      recs.push("成長期のパドル使用は短時間・低頻度、可能なら小型に留めてください。");
    }
    if (eq.usesFins) {
      factors.push({
        label: "フィン使用",
        score: 4,
        detail: "フィンは足関節・膝への負荷を増やす。使用時間を管理する。",
      });
    }
  }

  // 体操
  if (i.sport === "gymnastics") {
    if (eq.gymApparatus === "vault" || eq.gymApparatus === "bars" || eq.gymApparatus === "rings") {
      factors.push({
        label: "手関節高負荷種目",
        score: 12,
        detail: "跳馬・鉄棒・つり輪は橈骨遠位骨端線への衝撃・圧迫が大きい種目。",
      });
      recs.push("種目後の手関節ケア（アイシング・ストレッチ）と週内での種目分散を行ってください。");
      if (!eq.usesGrips && (eq.gymApparatus === "bars" || eq.gymApparatus === "rings")) {
        factors.push({
          label: "グリップ（手掌プロテクター）未使用",
          score: 5,
          detail: "グリップは手掌摩擦・水泡だけでなく手関節への剪断負荷も軽減する。鉄棒・つり輪では原則使用が推奨される。",
        });
      } else if (eq.usesGrips) {
        factors.push({
          label: "グリップ使用",
          score: -3,
          detail: "手掌保護と手関節負荷の軽減効果あり（軽減要因）。",
        });
      }
    } else if (eq.gymApparatus === "floor") {
      factors.push({
        label: "床運動の反復",
        score: 6,
        detail: "着地衝撃が下肢骨端線に繰り返し加わる。",
      });
    }
  }

  // 共通
  if (eq.equipmentFitsPoorly) {
    factors.push({
      label: "道具が体格に合っていない",
      score: 8,
      detail: "サイズ不適合な道具は不自然なフォームを誘発し、局所への偏った負荷を生む。",
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

  const totalScore = Math.max(0, factors.reduce((s, f) => s + f.score, 0));

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
