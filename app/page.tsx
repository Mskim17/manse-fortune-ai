"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

interface BirthInfo {
  year: number | "";
  month: number | "";
  day: number | "";
  hour: number | "";
  minute: number | "";
  name: string;
  unknownHour: boolean;
  isLunar: boolean;
  // 음력 생일이 윤달인지 여부. 평달과 윤달은 양력 날짜가 완전히 달라진다.
  isLeapMonth?: boolean;
}

interface FortuneResult {
  dayPillar: string;
  monthPillar: string;
  yearPillar: string;
  unknownHour: boolean;
  isLunar: boolean;
  convertedSolar: { year: number; month: number; day: number } | null;
  saju: { year: string; month: string; day: string; hour: string };
  analysis: {
    tenGod: string;
    jiTenGod: string;
    jiTenGodDesc: string;
    jijiRelation: { type: string; desc: string } | null;
    energy: string;
    colors: { name: string; hex: string; desc: string }[];
    direction: string;
    colorBasis: string;
    colorBaseEl: string;
    subColor: { basis: string; color: { name: string; hex: string }; direction: string } | null;
    dayPoint: { element: string; role: string; colors: { name: string; hex: string; desc: string }[]; direction: string; reason: string } | null;
    advice: string;
    caution: string;
    activity: string;
    elementScore: {
      scores: { 목: number; 화: number; 토: number; 금: number; 수: number };
      total: number;
      dominant: string | null;
      tripleChar: string | null;
      percentage: Record<string, number>;
    };
    dominantText: string | null;
    tripleText: string | null;
    johu: {
      status: "극열" | "극한" | "평이" | "풍습" | "조조" | "토중" | "냉금";
      label: string;
      yongsin: string;
      solution: string[];
    };
    strength: {
      strength: "신강" | "신약" | "중화";
      score: number;
      level: "극약" | "태약" | "신약" | "중화신약" | "중화신강" | "신강" | "태강" | "극왕";
      desc: string;
      natal: { strength: "신강" | "신약" | "중화"; level: "극약" | "태약" | "신약" | "중화신약" | "중화신강" | "신강" | "태강" | "극왕"; score: number };
    };
    geokkuk: {
      name: string;
      tenGod: string;
      desc: string;
      yongsin: string;
      yongsinEl: string;
    };
    yongsin: {
      yongsinEl: string;
      yongsin: string;
      heesinEl: string;
      heesin: string;
      gisinEl: string;
      gisин: string;
      gusinEl: string;
      gusin: string;
      hansinEl: string;
      hansin: string;
      desc: string;
    };
    finalYongsin: {
      finalYongsinEl: string;
      finalYongsin: string;
      confidence: "유력" | "경합" | "불확실";
      reason: string;
      candidates: { el: string; name: string; votes: string[]; rootPct: number; rootless: boolean }[];
    };
  };
}

interface PartnerInfo {
  id: string;
  name: string;
  year: number | "";
  month: number | "";
  day: number | "";
  hour: number | "";
  unknownHour: boolean;
  isLunar: boolean;
  isLeapMonth?: boolean;
}

// ── 오행 매핑 ──
const ganToElement: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};

const jiToElement: Record<string, string> = {
  자: "수", 축: "토", 인: "목", 묘: "목", 진: "토",
  사: "화", 오: "화", 미: "토", 신: "금", 유: "금",
  술: "토", 해: "수",
};

// ── 오행별 색상 ──
const elementColorCodes: Record<string, { name: string; hex: string; desc: string }[]> = {
  목: [
    { name: "포레스트그린", hex: "#2D5A1B", desc: "목 기운 강화. 메인" },
    { name: "올리브·카키", hex: "#6B6B2A", desc: "土와 조화. 서브" },
    { name: "크림·베이지", hex: "#F5F0E8", desc: "포인트. 소품" },
  ],
  화: [
    { name: "버건디·레드", hex: "#8B1A1A", desc: "화 기운 강화. 메인" },
    { name: "오렌지·핑크", hex: "#C8640A", desc: "활동 에너지. 서브" },
    { name: "아이보리", hex: "#FFFFF0", desc: "균형. 포인트" },
  ],
  토: [
    { name: "머스타드·옐로", hex: "#C9A020", desc: "토 기운 강화. 메인" },
    { name: "브라운·카멜", hex: "#7B4B2A", desc: "안정감. 서브" },
    { name: "크림·베이지", hex: "#F5F0E8", desc: "포인트. 소품" },
  ],
  금: [
    { name: "실버·라이트그레이", hex: "#C0C0C0", desc: "금 기운 강화. 메인" },
    { name: "화이트·오프화이트", hex: "#F8F8F8", desc: "청결함. 서브" },
    { name: "다크네이비", hex: "#1a3a5c", desc: "포인트" },
  ],
  수: [
    { name: "다크네이비·블랙", hex: "#1a3a5c", desc: "수 기운 강화. 메인" },
    { name: "차콜·다크그레이", hex: "#2D2D2D", desc: "깊이감. 서브" },
    { name: "실버·그레이", hex: "#C0C0C0", desc: "균형. 포인트" },
  ],
};

// ── 오행별 방향 ──
const elementDirection: Record<string, string> = {
  목: "동쪽·동남쪽",
  화: "남쪽·동남쪽",
  토: "중앙·남서쪽",
  금: "서쪽·북서쪽",
  수: "북쪽·북서쪽",
};

const helpContents: Record<string, { title: string; content: string }> = {
  일진: {
    title: "일진 (日辰) 이란?",
    content: `일진은 오늘 날짜의 천간(天干)과 지지(地支) 조합이에요.

- 세운(歲運): 올해 연도의 간지 → 1년 전체 운의 흐름
- 월건(月建): 이번 달의 간지 → 한 달 운의 흐름  
- 일진(日辰): 오늘의 간지 → 하루 운의 흐름

천간 10개(갑을병정무기경신임계)와 지지 12개(자축인묘진사오미신유술해)가 조합되어 60갑자를 이뤄요.`,
  },
  사주원국: {
    title: "사주 원국 (四柱原局) 이란?",
    content: `사주(四柱)는 태어난 년·월·일·시의 네 기둥을 말해요.

- 년주(年柱): 태어난 해의 간지
- 월주(月柱): 태어난 달의 간지
- 일주(日柱): 태어난 날의 간지 → 일간(日干)이 나 자신
- 시주(時柱): 태어난 시간의 간지

각 기둥은 천간(위)과 지지(아래)로 이루어져 있어요.
일간(일주의 천간)이 사주 분석의 기준점이에요.`,
  },
  오행점수: {
    title: "오행 점수 란?",
    content: `사주 원국과 오늘 일진의 오행(목·화·토·금·수) 분포를 점수로 나타낸 거예요.

- 월지(月支)에 해당하는 오행은 3배 가중치
- 나머지 천간·지지는 기본 점수

오행이 한쪽으로 치우치면 그 오행이 과다해져 부작용이 생길 수 있어요.

- 용신 💎: 나에게 가장 필요한 오행
- 희신 ✨: 용신을 도와주는 오행
- 기신 ⚠️: 나에게 해로운 오행
- 구신 🔻: 기신을 도와주는 오행
- 한신 ➖: 중립 오행`,
  },
  신강신약: {
    title: "신강·신약 (身强·身弱) 이란?",
    content: `일간(나 자신)의 기운이 강한지 약한지를 나타내요.

- 신강(身强): 일간을 도와주는 비겁·인성 기운이 강한 상태
  → 에너지가 넘치지만 고집이 세질 수 있어요
  → 설기(식상·재성·관성)로 에너지를 발산해야 해요

- 신약(身弱): 일간을 설기·극하는 기운이 강한 상태
  → 체력이 약해지기 쉬워요
  → 인성·비겁으로 충전이 필요해요

- 중화(中和): 강약이 균형 잡힌 상태
  → 가장 이상적인 상태예요

점수 50% 기준으로 70% 이상이면 신강, 30% 이하면 신약이에요.
화면에는 더 잘게 나눈 8단계로 보여드려요.

- 극약 10 미만 · 태약 10~20 · 신약 20~30
- 중화신약 30~50 · 중화신강 50~70
- 신강 70~80 · 태강 80~90 · 극왕 90 이상

오늘의 강약은 타고난 사주에 오늘 일진을 더해 계산해서 날마다 달라져요.
용신과 추천 색상·방향도 오늘의 강약을 따라가요.`,
  },
  억부용신: {
    title: "억부용신 (抑扶用神) 이란?",
    content: `신강·신약을 기준으로 일간의 균형을 맞추는 오행이에요.

- 신강 → 억(抑): 강한 기운을 눌러줘야
  식상·재성·관성이 용신 후보

- 신약 → 부(扶): 약한 기운을 도와줘야
  인성·비겁이 용신 후보

- 용신 💎: 가장 필요한 오행 → 이 색상·방향 활용
- 희신 ✨: 용신을 생해주는 오행 → 보조 활용
- 기신 ⚠️: 용신을 극하는 오행 → 피해야
- 구신 🔻: 기신을 생해주는 오행 → 조심
- 한신 ➖: 중립 오행

억부 후보가 여럿이면 태어난 계절(조후)에도 맞는 오행을 먼저 골라요.
오늘의 강약이 극왕(90 이상)·극약(10 미만)이면 균형을 맞추지 않고 쏠린 기운을 따르는 방식(종격)으로 봐요.

추천 색상·방향은 억부용신이 기준이에요.
다만 신강이면서 조후가 급한 사주는 조후를 기준으로 하고 억부용신은 보조색으로 보여드려요.`,
  },
  최종용신: {
    title: "최종 용신 이란?",
    content: `억부용신·격국용신·조후용신을 종합해서 확정한 최종 용신이에요.

- 확실: 세 가지 용신이 일치 → 매우 강한 용신
- 보통: 두 가지가 일치 → 신뢰할 수 있는 용신
- 참고: 세 가지가 모두 다름 → 억부용신 우선, 나머지 참고

추천 색상·방향은 억부용신 기준이고, 신강이면서 조후가 급한 사주만 조후 기준으로 보여드려요.

⚠️ 사주는 통계적 경향성이며 절대적인 운명이 아니에요.`,
  },
  십신: {
    title: "십신 (十神) 이란?",
    content: `일간(나 자신)을 기준으로 오늘 일진 천간과의 관계를 10가지로 분류한 거예요.

- 비견·겁재: 일간과 같은 오행 → 자신감·경쟁심
- 식신·상관: 일간이 생하는 오행 → 창의·표현
- 편재·정재: 일간이 극하는 오행 → 재물·활동
- 편관·정관: 일간을 극하는 오행 → 도전·명예
- 편인·정인: 일간을 생하는 오행 → 학습·충전

음양이 같으면 편(偏), 다르면 정(正)이에요.`,
  },
};

// ── 추천 색상 계산 ──
const getColors = (
  sajuDay: string,
  strength: { strength: "신강" | "신약" | "중화"; score: number },
  johu: { status: string; yongsinEl: string },
  dayPillar: string,
  yongsin?: { yongsinEl: string; heesinEl: string },
) => {
  const dayEl = ganToElement[sajuDay[0]];
  const dayPillarEl = ganToElement[dayPillar[0]];

  let targetEl = dayPillarEl;
  let basis = "일진 기준";

  // 1순위: 억부용신
  if (yongsin?.yongsinEl) {
    targetEl = yongsin.yongsinEl;
    basis = "억부용신 기준";
  } else if (strength.strength === "신약") {
    const insungEl: Record<string, string> = {
      목: "수", 화: "목", 토: "화", 금: "토", 수: "금",
    };
    targetEl = insungEl[dayEl];
    basis = "신약 기준";
  } else if (strength.strength === "신강") {
    const setGi: Record<string, string> = {
      목: "화", 화: "토", 토: "금", 금: "수", 수: "목",
    };
    targetEl = setGi[dayEl];
    basis = "신강 기준";
  }

  // 2순위: 억부용신이 없을 때만 극열·극한 조후로 대체
  // 냉금·조조도 조후가 급한 상태라 대체 대상에 포함한다.
  if (!yongsin?.yongsinEl && ["극열", "극한", "냉금", "조조"].includes(johu.status) && johu.yongsinEl) {
    targetEl = johu.yongsinEl;
    basis = `조후(${johu.status}) 기준`;
  }

  // 중화이면서 억부용신 없으면 조후
  if (strength.strength === "중화" && !yongsin?.yongsinEl) {
    if (johu.yongsinEl && johu.status !== "평이") {
      targetEl = johu.yongsinEl;
      basis = `조후(${johu.status}) 기준`;
    } else {
      targetEl = dayPillarEl;
      basis = "일진 기준";
    }
  }

  return {
    colors: elementColorCodes[targetEl] || elementColorCodes["금"],
    direction: elementDirection[targetEl],
    element: targetEl,
    basis,
  };
};

// ── 오늘의 색상·방향 ──
// 기본 색상·방향은 억부용신으로 고정이라 날마다 같다.
// 오늘의 색상·방향은 오늘 일진 천간 오행이 기준 오행(baseEl)에 대해 무엇인지에 따라 달라진다.
// baseEl은 보통 억부용신이고, 신강이면서 조후가 급한 사주는 조후용신이다.
const getDayPoint = (
  dayPillar: string,
  baseEl: string,
  basisPrefix = "",
  roles?: { heesinEl: string; gisinEl: string; gusinEl: string },
) => {
  const dayEl = ganToElement[dayPillar[0]];
  if (!dayEl || !baseEl) return null;

  // 나를 극하는 오행
  const controlledBy: Record<string, string> = {
    목: "금", 화: "수", 토: "목", 금: "화", 수: "토",
  };
  // 나를 생하는 오행
  const generatedBy: Record<string, string> = {
    목: "수", 화: "목", 토: "화", 금: "토", 수: "금",
  };
  // 억부용신과 같은 방식: 희신 = 용신을 생, 기신 = 용신을 극, 구신 = 기신을 생
  // 종격처럼 역할이 일반 규칙과 다른 날은 roles로 넘겨받은 값을 쓴다.
  const gisinEl = roles?.gisinEl ?? controlledBy[baseEl];
  const yongsin = {
    yongsinEl: baseEl,
    heesinEl: roles?.heesinEl ?? generatedBy[baseEl],
    gisinEl,
    gusinEl: roles?.gusinEl ?? generatedBy[gisinEl],
  };

  let role = "한신";
  let targetEl = yongsin.heesinEl;
  let reason = `${basisPrefix}오늘 일진 ${dayEl} 기운은 중립(한신)이라 희신 ${targetEl} 색으로 용신을 도와요.`;

  if (dayEl === yongsin.yongsinEl || dayEl === yongsin.heesinEl) {
    role = dayEl === yongsin.yongsinEl ? "용신" : "희신";
    targetEl = dayEl;
    reason = `${basisPrefix}오늘 일진 ${dayEl} 기운이 ${role}이에요. 들어온 좋은 기운을 그대로 활용해요.`;
  } else if (dayEl === yongsin.gisinEl || dayEl === yongsin.gusinEl) {
    role = dayEl === yongsin.gisinEl ? "기신" : "구신";
    targetEl = controlledBy[dayEl];
    reason = `${basisPrefix}오늘 일진 ${dayEl} 기운이 ${role}이에요. ${dayEl} 기운을 눌러주는 ${targetEl} 색으로 균형을 잡아요.`;
  }

  return {
    element: targetEl,
    role,
    colors: elementColorCodes[targetEl] || elementColorCodes["금"],
    direction: elementDirection[targetEl],
    reason,
  };
};

// ── 오행 점수 계산 ──
interface ElementScore {
  목: number; 화: number; 토: number; 금: number; 수: number;
}

const calcElementScore = (
  saju: { year: string; month: string; day: string; hour: string },
  dayPillar: string,
  monthPillar: string,
) => {
  const scores: ElementScore = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const monthJi = monthPillar[1] || "";
  const monthJiElement = jiToElement[monthJi] || "";
  const allPillars = [saju.year, saju.month, saju.day, saju.hour, dayPillar];
  const allChars: string[] = [];

  allPillars.forEach((pillar) => {
    // 시주 미상일 때 API는 "-", 내부 계산에서는 "미상"을 쓰므로 둘 다 거른다.
    if (!pillar || pillar === "미상" || pillar === "-") return;
    if (pillar[0]) allChars.push(pillar[0]);
    if (pillar[1]) allChars.push(pillar[1]);
  });

  allChars.forEach((char) => {
    const el = ganToElement[char] || jiToElement[char];
    if (!el) return;
    const isMonthJi = jiToElement[char] === monthJiElement && !!jiToElement[char];
    scores[el as keyof ElementScore] += isMonthJi ? 30 : 10;
  });

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const percentage: Record<string, number> = {};
  Object.entries(scores).forEach(([k, v]) => {
    percentage[k] = Math.round((v / total) * 100);
  });

  const dominant = Object.entries(percentage).find(([, v]) => v >= 45)?.[0] || null;

  const jiChars = allPillars
    .filter((p) => p && p !== "미상" && p !== "-")
    .map((p) => p[1])
    .filter(Boolean);
  const jiCount: Record<string, number> = {};
  jiChars.forEach((j) => { jiCount[j] = (jiCount[j] || 0) + 1; });
  const tripleChar = Object.entries(jiCount).find(([, v]) => v >= 3)?.[0] || null;

  return { scores, total, dominant, tripleChar, percentage };
};

// ── 신강/신약 판단 ──
// todayPillar를 넘기면 원국 네 기둥에 오늘 일진을 한 기둥으로 더해 "오늘의 강약"을 계산한다.
const calcStrength = (
  saju: { year: string; month: string; day: string; hour: string },
  dayPillar: string,
  monthPillar: string,
  todayPillar?: string,
): {
  strength: "신강" | "신약" | "중화";
  level: "극약" | "태약" | "신약" | "중화신약" | "중화신강" | "신강" | "태강" | "극왕";
  score: number;
  desc: string;
} => {
  const dayGan = dayPillar[0];
  const dayEl = ganToElement[dayGan];

  // 인성 오행 (나를 생해주는 오행)
  const insungEl: Record<string, string> = {
    목: "수", 화: "목", 토: "화", 금: "토", 수: "금",
  };
  const sameEl = dayEl;
  const inEl = insungEl[dayEl];

  // ── 지장간 테이블 ──
  const jiJangGan: Record<string, { gan: string; ratio: number }[]> = {
    자: [{ gan: "계", ratio: 1.0 }],
    축: [{ gan: "기", ratio: 0.6 }, { gan: "신", ratio: 0.3 }, { gan: "계", ratio: 0.1 }],
    인: [{ gan: "갑", ratio: 0.6 }, { gan: "병", ratio: 0.3 }, { gan: "무", ratio: 0.1 }],
    묘: [{ gan: "을", ratio: 1.0 }],
    진: [{ gan: "무", ratio: 0.6 }, { gan: "을", ratio: 0.3 }, { gan: "계", ratio: 0.1 }],
    사: [{ gan: "병", ratio: 0.6 }, { gan: "경", ratio: 0.3 }, { gan: "무", ratio: 0.1 }],
    오: [{ gan: "정", ratio: 0.7 }, { gan: "기", ratio: 0.3 }],
    미: [{ gan: "기", ratio: 0.6 }, { gan: "을", ratio: 0.3 }, { gan: "정", ratio: 0.1 }],
    신: [{ gan: "경", ratio: 0.6 }, { gan: "임", ratio: 0.3 }, { gan: "무", ratio: 0.1 }],
    유: [{ gan: "신", ratio: 1.0 }],
    술: [{ gan: "무", ratio: 0.6 }, { gan: "신", ratio: 0.3 }, { gan: "정", ratio: 0.1 }],
    해: [{ gan: "임", ratio: 0.6 }, { gan: "갑", ratio: 0.4 }],
  };
  
  const monthJi = monthPillar[1] || "";
  const monthJiEl = jiToElement[monthJi] || "";

  let supportScore = 0;
  let weakenScore = 0;

  const allPillars = [saju.year, saju.month, saju.day, saju.hour, todayPillar ?? ""];

  allPillars.forEach((pillar, pillarIdx) => {
    if (!pillar || pillar === "미상" || pillar === "-") return;
    const gan = pillar[0];
    const ji = pillar[1];

    // 천간 계산
    if (gan) {
      const el = ganToElement[gan];
      // 일간 자체는 비교 기준점이므로 점수에서 제외한다.
      // 단 일지(득지)는 신강·신약의 핵심 변수라 반드시 계산해야 하므로,
      // 여기서 pillar 전체를 건너뛰면 안 된다.
      const isDayGan = pillarIdx === 2 && gan === dayGan;
      if (el && !isDayGan) {
        // 월지 해당 오행이면 가중치 1.5배
        const isMonthJiEl = el === monthJiEl;
        const point = isMonthJiEl ? 1.5 : 1;

        if (el === sameEl || el === inEl) {
          supportScore += point;
        } else {
          weakenScore += point;
        }
      }
    }
    
    // 지지 계산 (지장간 비율 반영)
    if (ji && jiJangGan[ji]) {
      const isMonthJi = ji === monthJi;
      const basePoint = isMonthJi ? 3 : 1;  // 월지 3배 가중치

      jiJangGan[ji].forEach(({ gan: jgGan, ratio }) => {
        const el = ganToElement[jgGan];
        if (!el) return;
        const point = basePoint * ratio;
        if (el === sameEl || el === inEl) {
          supportScore += point;
        } else {
          weakenScore += point;
        }
      });
    }
  });
  
  const total = supportScore + weakenScore;
  const ratio = supportScore / total;
  const score = parseFloat((ratio * 100).toFixed(1));

  let strength: "신강" | "신약" | "중화";
  let desc: string;

  // 일진 한 기둥으로 신강과 중화를 오갈 수 있게 중화 구간을 30~70으로 넓게 잡는다.
  if (ratio >= 0.70) {
    strength = "신강";
    desc = "일간의 기운이 강해요. 오늘은 에너지가 넘치지만 지나치게 고집스러워질 수 있어요. 설기(식상·재성) 활동으로 에너지를 발산하는 게 좋아요.";
  } else if (ratio <= 0.30) {
    strength = "신약";
    desc = "일간의 기운이 약해요. 오늘은 체력 소모에 주의하고 무리한 계획보다 내실 있는 하루를 보내세요. 인성·비겁 기운으로 충전이 필요해요.";
  } else {
    strength = "중화";
    desc = "일간의 기운이 균형 잡혀 있어요. 오늘은 어떤 활동도 무난하게 소화할 수 있는 안정적인 날이에요.";
  }

  // 화면 표시용 8단계. 30·70 경계는 위 3단계와 같아서 용신·색상 계산에는 영향을 주지 않는다.
  const level =
    ratio < 0.10 ? "극약"
    : ratio < 0.20 ? "태약"
    : ratio <= 0.30 ? "신약"
    : ratio < 0.50 ? "중화신약"
    : ratio < 0.70 ? "중화신강"
    : ratio < 0.80 ? "신강"
    : ratio < 0.90 ? "태강"
    : "극왕";

  return { strength, level, score, desc };
};

// ── 격국 판단 ──
const calcGeokkuk = (
  saju: { year: string; month: string; day: string; hour: string },
  dayPillar: string,
  monthPillar: string,
): {
  name: string;
  tenGod: string;
  desc: string;
  yongsin: string;
  yongsinEl: string;
} => {

  const jiJangGan: Record<string, { gan: string; ratio: number }[]> = {
    자: [{ gan: "계", ratio: 1.0 }],
    축: [{ gan: "기", ratio: 0.6 }, { gan: "신", ratio: 0.3 }, { gan: "계", ratio: 0.1 }],
    인: [{ gan: "갑", ratio: 0.6 }, { gan: "병", ratio: 0.3 }, { gan: "무", ratio: 0.1 }],
    묘: [{ gan: "을", ratio: 1.0 }],
    진: [{ gan: "무", ratio: 0.6 }, { gan: "을", ratio: 0.3 }, { gan: "계", ratio: 0.1 }],
    사: [{ gan: "병", ratio: 0.6 }, { gan: "경", ratio: 0.3 }, { gan: "무", ratio: 0.1 }],
    오: [{ gan: "정", ratio: 0.7 }, { gan: "기", ratio: 0.3 }],
    미: [{ gan: "기", ratio: 0.6 }, { gan: "을", ratio: 0.3 }, { gan: "정", ratio: 0.1 }],
    신: [{ gan: "경", ratio: 0.6 }, { gan: "임", ratio: 0.3 }, { gan: "무", ratio: 0.1 }],
    유: [{ gan: "신", ratio: 1.0 }],
    술: [{ gan: "무", ratio: 0.6 }, { gan: "신", ratio: 0.3 }, { gan: "정", ratio: 0.1 }],
    해: [{ gan: "임", ratio: 0.6 }, { gan: "갑", ratio: 0.4 }],
  };

  const dayGan = dayPillar[0];
  const monthJi = monthPillar[1] || "";
  const monthJiGans = jiJangGan[monthJi] || [];

  // 사주 천간 전체 수집 (일간 제외)
  const allGans = [
    saju.year[0], saju.month[0], saju.hour[0],
  ].filter(Boolean);

  // 투간 여부 확인 (월지 지장간이 사주 천간에 있는지)
  let formatGan: string | null = null;
  for (const { gan } of monthJiGans) {
    if (allGans.includes(gan)) {
      formatGan = gan;
      break;
    }
  }

  // 투간 없으면 월지 본기(가장 비율 높은 지장간) 사용
  if (!formatGan) {
    formatGan = monthJiGans[0]?.gan || "";
  }

  // 격국 천간 기준 십신 계산
  const formatEl = ganToElement[formatGan] || "";
  const dayEl = ganToElement[dayGan] || "";
  const dayYin = ["을", "정", "기", "신", "계"].includes(dayGan);
  const formatYin = ["을", "정", "기", "신", "계"].includes(formatGan);

  const gen: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
  const con: Record<string, string> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };

  let tenGod = "기타";
  if (formatEl === dayEl) {
    tenGod = dayYin === formatYin ? "비견" : "겁재";
  } else if (gen[dayEl] === formatEl) {
    tenGod = dayYin === formatYin ? "식신" : "상관";
  } else if (gen[formatEl] === dayEl) {
    tenGod = dayYin === formatYin ? "편인" : "정인";
  } else if (con[dayEl] === formatEl) {
    tenGod = dayYin === formatYin ? "편재" : "정재";
  } else if (con[formatEl] === dayEl) {
    tenGod = dayYin === formatYin ? "편관" : "정관";
  }

  // 격국명
  const geokkukName: Record<string, string> = {
    비견: "건록격(建祿格)",
    겁재: "양인격(羊刃格)",
    식신: "식신격(食神格)",
    상관: "상관격(傷官格)",
    편재: "편재격(偏財格)",
    정재: "정재격(正財格)",
    편관: "편관격(偏官格)",
    정관: "정관격(正官格)",
    편인: "편인격(偏印格)",
    정인: "정인격(正印格)",
  };

  // 격국별 용신 (신강 기준 기본값)
  // 실제로는 신강/신약 결합해서 판단해야 함
  const geokkukYongsin: Record<string, { yongsin: string; yongsinEl: string; desc: string }> = {
    식신격: {
      yongsin: "재성(財星)",
      yongsinEl: con[formatEl] || "",
      desc: "식신이 재성을 생해 재물과 표현력이 강한 격이에요. 창의적 활동과 수익 창출에 유리해요.",
    },
    상관격: {
      yongsin: "재성(財星) 또는 인성(印星)",
      yongsinEl: con[formatEl] || "",
      desc: "상관이 강해 표현력과 반골 기질이 강한 격이에요. 예술·기술·자유업에 유리하나 관성을 극하므로 주의가 필요해요.",
    },
    편재격: {
      yongsin: "식상(食傷)",
      yongsinEl: gen[dayEl] || "",
      desc: "편재가 강해 활동력과 재물 운이 강한 격이에요. 사업·투자·영업에 유리해요.",
    },
    정재격: {
      yongsin: "식상(食傷) 또는 관성(官星)",
      yongsinEl: gen[dayEl] || "",
      desc: "정재가 강해 성실하고 안정적인 재물 운을 가진 격이에요. 꼼꼼한 재무 관리에 탁월해요.",
    },
    편관격: {
      yongsin: "식신(食神)",
      yongsinEl: gen[dayEl] || "",
      desc: "편관이 강해 도전·극복 기질이 강한 격이에요. 군·경·법조·리더십 분야에 유리해요.",
    },
    정관격: {
      yongsin: "재성(財星) 또는 인성(印星)",
      yongsinEl: con[dayEl] || "",
      desc: "정관이 강해 명예와 책임감이 강한 격이에요. 공직·관리직·조직 생활에 유리해요.",
    },
    편인격: {
      yongsin: "재성(財星)",
      yongsinEl: con[formatEl] || "",
      desc: "편인이 강해 직관과 학문적 기질이 강한 격이에요. 연구·철학·종교·예술 분야에 유리해요.",
    },
    정인격: {
      yongsin: "관성(官星)",
      yongsinEl: con[dayEl] || "",
      desc: "정인이 강해 학습과 내면 정리 능력이 뛰어난 격이에요. 교육·문화·학문 분야에 유리해요.",
    },
    건록격: {
      yongsin: "재성(財星) 또는 관성(官星)",
      yongsinEl: con[dayEl] || "",
      desc: "일간과 같은 오행이 강해 독립심과 자립 기질이 강한 격이에요. 자영업·리더십에 유리해요.",
    },
    양인격: {
      yongsin: "관성(官星)",
      yongsinEl: con[dayEl] || "",
      desc: "겁재가 강해 추진력과 경쟁심이 강한 격이에요. 강한 에너지를 관성으로 제어해야 해요.",
    },
  };

  const name = geokkukName[tenGod] || "잡격(雜格)";
  const yongsinInfo = geokkukYongsin[name.split("(")[0]] || {
    yongsin: "균형",
    yongsinEl: "",
    desc: "복합적인 구조로 개인 상황에 따라 용신이 달라져요.",
  };

  return {
    name,
    tenGod,
    desc: yongsinInfo.desc,
    yongsin: yongsinInfo.yongsin,
    yongsinEl: yongsinInfo.yongsinEl,
  };
};

// ── 억부용신 계산 ──
const calcYongsin = (
  strength: { strength: "신강" | "신약" | "중화"; score: number; level?: string },
  geokkuk: { name: string; tenGod: string; yongsinEl: string },
  dayPillar: string,
  monthPillar: string,
  natalPercentage?: Record<string, number>,
  johu?: { status: string; yongsinEl: string },
): {
  yongsinEl: string;
  yongsin: string;
  heesinEl: string;
  heesin: string;
  gisinEl: string;
  gisин: string;
  gusinEl: string;   // 추가
  gusin: string;     // 추가
  hansinEl: string;  // 추가
  hansin: string;    // 추가
  desc: string;
} => {
  const dayGan = dayPillar[0];
  const dayEl = ganToElement[dayGan];

  const gen: Record<string, string> = {
    목: "화", 화: "토", 토: "금", 금: "수", 수: "목",
  };
  const con: Record<string, string> = {
    목: "토", 화: "금", 토: "수", 금: "목", 수: "화",
  };
  const insungEl: Record<string, string> = {
    목: "수", 화: "목", 토: "화", 금: "토", 수: "금",
  };

  const elName: Record<string, string> = {
    목: "목(木)", 화: "화(火)", 토: "토(土)", 금: "금(金)", 수: "수(水)",
  };

  let yongsinEl = "";
  let gisinEl = "";
  let heesinEl = "";
  let desc = "";

  const { tenGod } = geokkuk;
  // 조후가 급한 사주에서 조후가 가리키는 오행. 억부 후보 안에 있으면 그쪽을 우선한다.
  const johuEl = johu && ["극열", "극한", "냉금", "조조"].includes(johu.status) ? johu.yongsinEl : "";
  const inNatal = (el: string) => !natalPercentage || (natalPercentage[el] ?? 0) > 0;
  // 일간을 극하는 오행(관성)
  const gwanOfDay = Object.keys(con).find((el) => con[el] === dayEl) || "";

  if (strength.strength === "신강") {
    // 신강 → 설기·극 오행이 용신
    // 격국별 세분화
    if (["식신", "상관"].includes(tenGod)) {
      // 식신격·상관격 신강 → 재성 용신
      yongsinEl = con[dayEl];
      heesinEl = gen[dayEl];  // 식상 (희신 - 재성 생해줌)
      gisinEl = insungEl[dayEl];  // 인성 (기신 - 식상 극함)
      desc = `${geokkuk.name} 신강 사주예요. 식상이 강하니 재성(${elName[con[dayEl]]})으로 에너지를 흘려보내는 것이 좋아요. 창의력을 재물로 연결하는 활동이 유리해요.`;
    } else if (["편재", "정재"].includes(tenGod)) {
      // 재격 신강 → 관성 용신
      yongsinEl = con[con[dayEl]];  // 재성을 극하는 관성
      heesinEl = con[dayEl];  // 재성 (희신)
      gisinEl = insungEl[dayEl];  // 인성 (기신)
      desc = `${geokkuk.name} 신강 사주예요. 재성이 강하니 관성(${elName[con[con[dayEl]]]})으로 균형을 잡아야 해요. 책임감과 규율로 재물을 관리하는 것이 유리해요.`;
    } else if (["편관", "정관"].includes(tenGod)) {
      // 관격 신강 → 식신 용신 (관 제어)
      yongsinEl = gen[dayEl];
      heesinEl = con[dayEl];  // 재성 (희신 - 관 생해줌)
      gisinEl = insungEl[dayEl];  // 인성 (기신)
      desc = `${geokkuk.name} 신강 사주예요. 관성의 압박을 식상(${elName[gen[dayEl]]})으로 제어해야 해요. 창의적 표현으로 스트레스를 해소하는 것이 좋아요.`;
    } else if (["편인", "정인"].includes(tenGod)) {
      // 인격 신강 → 재성 용신 (인성 제어)
      yongsinEl = con[insungEl[dayEl]];  // 인성을 극하는 재성
      heesinEl = con[dayEl];
      gisinEl = insungEl[dayEl];
      desc = `${geokkuk.name} 신강 사주예요. 인성이 과다하니 재성(${elName[con[insungEl[dayEl]]]})으로 균형을 잡아야 해요. 학습한 것을 실용적으로 활용하는 것이 좋아요.`;
    } else {
      // 건록격·양인격 신강
      yongsinEl = con[dayEl];  // 재성
      heesinEl = gen[dayEl];
      gisinEl = insungEl[dayEl];
      desc = `${geokkuk.name} 신강 사주예요. 강한 기운을 재성(${elName[con[dayEl]]})이나 관성으로 설기해야 해요. 활동적이고 도전적인 일에 에너지를 쏟는 것이 좋아요.`;
    }

    // 격국이 지목한 용신이 원국에 한 글자도 없으면(무근) 쓸 실체가 없다.
    // 이때는 식상·재성·관성 중 원국에 실제로 있는 오행으로 바꾼다.
    // 비중이 같으면 극하는 것보다 흘려보내는 쪽이 순해서 식상 → 재성 → 관성 순으로 본다.
    if (natalPercentage && !natalPercentage[yongsinEl]) {
      const gwanEl = Object.keys(con).find((el) => con[el] === dayEl) || "";
      const present = [
        { el: gen[dayEl], label: "식상" },
        { el: con[dayEl], label: "재성" },
        { el: gwanEl, label: "관성" },
      ]
        .filter((c) => (natalPercentage[c.el] ?? 0) > 0)
        .sort((a, b) => natalPercentage[b.el] - natalPercentage[a.el]);
      if (present.length > 0) {
        const missing = elName[yongsinEl];
        yongsinEl = present[0].el;
        desc = `${geokkuk.name} 신강 사주예요. 격국으로는 ${missing}이 용신이지만 원국에 없어서, 원국에 있는 ${present[0].label}(${elName[yongsinEl]})으로 강한 기운을 풀어주는 것이 좋아요.`;
      }
    }
  } else if (strength.strength === "신약") {
    // 신약 → 비겁·인성이 용신
    if (["편관", "정관"].includes(tenGod)) {
      // 관격 신약 → 인성 용신 (관이 인성 생하게)
      yongsinEl = insungEl[dayEl];
      heesinEl = dayEl;  // 비겁 (희신)
      gisinEl = con[dayEl];  // 재성 (기신 - 인성 극함)
      desc = `${geokkuk.name} 신약 사주예요. 관성의 압박이 강하니 인성(${elName[insungEl[dayEl]]})으로 일간을 보강해야 해요. 학습과 내실을 다지는 활동이 유리해요.`;
    } else if (["식신", "상관"].includes(tenGod)) {
      // 식상격 신약 → 비겁 용신 (설기 막기)
      yongsinEl = dayEl;  // 비겁
      heesinEl = insungEl[dayEl];  // 인성 (희신)
      gisinEl = gen[dayEl];  // 식상 (기신 - 설기함)
      desc = `${geokkuk.name} 신약 사주예요. 식상이 일간을 설기하니 비겁(${elName[dayEl]})으로 기운을 보강해야 해요. 무리한 표현·활동보다 충전하는 날로 쓰는 것이 좋아요.`;
    } else if (["편재", "정재"].includes(tenGod)) {
      // 재격 신약 → 비겁 용신
      yongsinEl = dayEl;  // 비겁
      heesinEl = insungEl[dayEl];  // 인성
      gisinEl = con[dayEl];  // 재성 (기신)
      desc = `${geokkuk.name} 신약 사주예요. 재성이 일간을 극하니 비겁(${elName[dayEl]})으로 기운을 보강해야 해요. 무리한 지출·투자보다 내실을 다지는 것이 좋아요.`;
    } else {
      // 인격·기타 신약 → 인성 용신
      yongsinEl = insungEl[dayEl];
      heesinEl = dayEl;  // 비겁
      gisinEl = con[insungEl[dayEl]];  // 재성 (인성 극함)
      desc = `${geokkuk.name} 신약 사주예요. 인성(${elName[insungEl[dayEl]]})으로 일간을 보강하는 것이 좋아요. 학습·휴식·내면 충전에 집중하는 날이에요.`;
    }
  } else {
    // 중화 → 격국 용신 따름
    yongsinEl = geokkuk.yongsinEl || dayEl;
    heesinEl = insungEl[yongsinEl] || "";
    gisinEl = con[yongsinEl] || "";
    desc = `${geokkuk.name} 중화 사주예요. 격국 용신인 ${elName[yongsinEl] || "균형"}을 활용하는 것이 좋아요. 균형 잡힌 하루를 보낼 수 있어요.`;

    // 격국 용신이 원국에 없으면 강한 쪽으로 기울었을 땐 식상·재성·관성,
    // 약한 쪽으로 기울었을 땐 인성·비겁 중 원국에 있는 오행으로 바꾼다.
    if (natalPercentage && !natalPercentage[yongsinEl]) {
      const gwanEl = Object.keys(con).find((el) => con[el] === dayEl) || "";
      const present = (strength.score >= 50 ? [gen[dayEl], con[dayEl], gwanEl] : [insungEl[dayEl], dayEl])
        .filter((el) => (natalPercentage[el] ?? 0) > 0)
        .sort((a, b) => natalPercentage[b] - natalPercentage[a]);
      if (present.length > 0) {
        const missing = elName[yongsinEl];
        yongsinEl = present[0];
        desc = `${geokkuk.name} 중화 사주예요. 격국으로는 ${missing}이 용신이지만 원국에 없어서, 원국에 있는 ${elName[yongsinEl]} 기운을 쓰는 것이 좋아요.`;
      }
    }
  }

  // 억부 후보(신강: 식상·재성·관성 / 신약: 인성·비겁) 중 조후와 같은 오행이 원국에 있으면 그것을 쓴다.
  // 중화인 날은 조후를 끌어오지 않고 억부 그대로 둔다.
  // 억부와 조후가 같은 오행을 가리키는 용신이 가장 확실하기 때문이다.
  if (johuEl && johuEl !== yongsinEl && strength.strength !== "중화") {
    const candidates = strength.strength === "신강"
      ? [gen[dayEl], con[dayEl], gwanOfDay]
      : [insungEl[dayEl], dayEl];
    if (candidates.includes(johuEl) && inNatal(johuEl)) {
      yongsinEl = johuEl;
      desc = `${geokkuk.name} ${strength.strength} 사주예요. ${strength.strength === "신강" ? "강한 기운을 다루는" : "약한 기운을 돕는"} 방법 가운데 태어난 계절(조후)에도 맞는 ${elName[yongsinEl]} 기운을 용신으로 잡았어요.`;
    }
  }

  let gusinEl = "";
  if (strength.level === "극왕") {
    // 종격(극왕): 일간 오행이 압도적이라 누르지 않고 그 기운을 따른다.
    // 용신·희신은 일간 오행과 그것이 흘러가는 식상, 기신은 일간을 극하는 관성, 구신은 관성을 생하는 재성.
    const hasSiksang = inNatal(gen[dayEl]);
    yongsinEl = hasSiksang ? gen[dayEl] : dayEl;
    heesinEl = hasSiksang ? dayEl : insungEl[dayEl];
    gisinEl = gwanOfDay;
    gusinEl = con[dayEl];
    desc = `오늘은 ${elName[dayEl]} 기운이 한쪽으로 완전히 쏠린 날이에요. 이럴 땐 거스르기보다 그 기운을 따르는 편이 좋아요. ${elName[yongsinEl]} 기운을 쓰고 ${elName[gisinEl]}·${elName[gusinEl]} 기운은 피하세요.`;
  } else if (strength.level === "극약") {
    // 종격(극약): 일간이 버틸 힘이 없어 원국에서 가장 강한 세력(식상·재성·관성)을 따른다.
    // 희신은 그 세력을 키워주는 쪽, 기신은 일간을 어설프게 살리는 인성, 구신은 비겁.
    const forces = [gen[dayEl], con[dayEl], gwanOfDay];
    const strongest = [...forces].sort((a, b) => (natalPercentage?.[b] ?? 0) - (natalPercentage?.[a] ?? 0))[0];
    yongsinEl = strongest;
    heesinEl = forces.includes(insungEl[strongest]) ? insungEl[strongest] : gen[strongest];
    gisinEl = insungEl[dayEl];
    gusinEl = dayEl;
    desc = `오늘은 내 기운이 아주 약하고 ${elName[yongsinEl]} 기운이 판을 이끄는 날이에요. 이럴 땐 버티기보다 그 흐름을 따르는 편이 좋아요. ${elName[yongsinEl]}·${elName[heesinEl]} 기운을 쓰고 ${elName[gisinEl]}·${elName[gusinEl]} 기운은 피하세요.`;
  } else {
    // 희신 = 용신을 생해주는 오행
    heesinEl = insungEl[yongsinEl] || heesinEl;
    // 기신 = 용신을 극하는 오행 (con은 "내가 극하는 오행"이라 역방향으로 찾는다)
    gisinEl = Object.keys(con).find((el) => con[el] === yongsinEl) || gisinEl;
    // 구신 = 기신을 생해주는 오행 (기신 강화)
    gusinEl = insungEl[gisinEl] || "";
  }
  // 한신 = 용신·기신 어느쪽도 아닌 중립
  const allEl = ["목", "화", "토", "금", "수"];
  const hansinEl = allEl.find(
    (el) => el !== yongsinEl && el !== heesinEl && el !== gisinEl && el !== gusinEl
  ) || "";

  return {
    yongsinEl,
    yongsin: elName[yongsinEl] || "균형",
    heesinEl,
    heesin: elName[heesinEl] || "",
    gisinEl,
    gisин: elName[gisinEl] || "",
    gusinEl,
    gusin: elName[gusinEl] || "",
    hansinEl,
    hansin: elName[hansinEl] || "",
    desc,
  };
};

// ── 최종 용신 확정 ──
// 만세력은 절대적 정답이 아니라 과거 통계에 기반한 경향값이다.
// 그래서 하나의 용신을 단정하지 않고, 세 관점(억부·격국·조후)이 각각 어떤 오행을
// 지목하는지 표로 모은 뒤 "얼마나 겹치는가 + 그 오행이 원국에 실제로 있는가"로
// 신뢰도를 매긴다. 원국에 없는 오행(무근)은 지목이 겹쳐도 신뢰도를 낮춘다.
const calcFinalYongsin = (
  yongsin: { yongsinEl: string; yongsin: string; heesinEl: string; heesin: string; gisinEl: string; gusinEl: string; },
  geokkuk: { yongsinEl: string; },
  johu: { yongsinEl: string; status: string; },
  elementPercentage?: Record<string, number>,
): {
  finalYongsinEl: string;
  finalYongsin: string;
  confidence: "유력" | "경합" | "불확실";
  reason: string;
  candidates: { el: string; name: string; votes: string[]; rootPct: number; rootless: boolean }[];
} => {
  const elName: Record<string, string> = {
    목: "목(木)", 화: "화(火)", 토: "토(土)", 금: "금(金)", 수: "수(水)",
  };

  const 억부 = yongsin.yongsinEl;
  const 격국 = geokkuk.yongsinEl;
  const 조후 = johu.yongsinEl;

  // 조후가 급한 계절 상태. 이 경우 조후 의견의 무게를 억부와 동등하게 본다.
  const johuUrgent = ["극열", "극한", "냉금", "조조"].includes(johu.status);

  // 1) 세 관점의 지목을 오행별로 집계
  const votes = new Map<string, string[]>();
  const addVote = (el: string, who: string) => {
    if (!el) return;
    votes.set(el, [...(votes.get(el) ?? []), who]);
  };
  addVote(억부, "억부");
  addVote(격국, "격국");
  addVote(조후, johuUrgent ? `조후(${johu.status})` : "조후");

  const pct = elementPercentage ?? {};
  const candidates = [...votes.entries()]
    .map(([el, who]) => {
      const rootPct = pct[el] ?? 0;
      return {
        el,
        name: elName[el] ?? el,
        votes: who,
        rootPct,
        // 무근(無根): 원국에 해당 오행이 한 글자도 없으면 용신으로 삼아도 쓸 실체가 없다
        rootless: elementPercentage ? rootPct === 0 : false,
      };
    })
    // 표 많은 순 → 원국 비중 높은 순
    .sort((a, b) => b.votes.length - a.votes.length || b.rootPct - a.rootPct);

  // 2) 대표 후보 선정. 조후가 급한데 억부 후보가 무근이면 조후 후보로 넘긴다.
  let top = candidates[0] ?? {
    el: 억부, name: elName[억부] ?? "균형", votes: ["억부"], rootPct: 0, rootless: false,
  };
  const johuCand = candidates.find((c) => c.el === 조후);
  if (johuUrgent && johuCand && top.rootless && !johuCand.rootless) {
    top = johuCand;
  }

  // 3) 신뢰도: 관점이 얼마나 겹치는지 + 그 오행이 원국에 실재하는지
  let confidence: "유력" | "경합" | "불확실";
  if (top.votes.length >= 2 && !top.rootless) {
    confidence = "유력";
  } else if (top.votes.length >= 2 || (!top.rootless && candidates.length <= 2)) {
    confidence = "경합";
  } else {
    confidence = "불확실";
  }
  // 조후가 급한 계절인데 대표 후보가 조후와 다르면 최소 '경합'으로 내린다
  if (confidence === "유력" && johuUrgent && 조후 && top.el !== 조후) {
    confidence = "경합";
  }

  // 4) 근거 문장 — 단정 대신 경향으로 서술
  const parts: string[] = [];
  parts.push(
    candidates
      .map((c) => `${c.votes.join("·")} → ${c.name}${c.rootless ? "(원국에 없음)" : ` ${c.rootPct}%`}`)
      .join(" / "),
  );
  if (top.votes.length >= 2) {
    parts.push(`${top.votes.length}개 관점이 ${top.name}에 모여요.`);
  } else {
    parts.push(`관점마다 지목이 갈려요. 우선 후보는 ${top.name}입니다.`);
  }
  if (top.rootless) {
    parts.push(`다만 ${top.name}은 원국에 한 글자도 없어 실제로 쓸 기운이 약해요.`);
  }
  if (johuUrgent && 조후 && top.el !== 조후) {
    parts.push(`계절이 ${johu.status} 상태라 조후 ${elName[조후]} 쪽도 함께 보세요.`);
  }
  parts.push("만세력은 과거 통계에 기반한 경향이라 참고 범위로만 활용하세요.");

  return {
    finalYongsinEl: top.el,
    finalYongsin: top.name,
    confidence,
    reason: parts.join(" "),
    candidates,
  };
};

// ── 궁합 분석 ──
// 궁합은 점수가 아니라 경향으로 표기한다. 순조 > 무난 > 조율필요.
type Tendency = "순조" | "무난" | "조율필요";

const calcCompatibility = (
  mySaju: { year: string; month: string; day: string; hour: string },
  myDayPillar: string,
  partnerSaju: { year: string; month: string; day: string; hour: string },
  partnerDayPillar: string,
): {
  dayPillarRelation: { type: string; desc: string } | null;
  axes: { key: string; label: string; tendency: Tendency; detail: string; desc: string }[];
  overall: string;
  agreement: "일치" | "엇갈림" | "제각각";
  summary: string;
} => {
  const hanja: Record<string, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };
  const elLabel = (el: string) => (el ? `${el}(${hanja[el] ?? "?"})` : "알 수 없음");

  // ── 축 1. 일주 지지 관계 ──
  const dayPillarRelation = getJijiRelation(myDayPillar[1], partnerDayPillar[1]);
  let jiTendency: Tendency = "무난";
  let jiDetail = "특별한 관계 없음";
  if (dayPillarRelation) {
    jiDetail = dayPillarRelation.type;
    if (/육합|삼합/.test(dayPillarRelation.type)) jiTendency = "순조";
    else if (/충|형/.test(dayPillarRelation.type)) jiTendency = "조율필요";
  }
  const jiDesc = dayPillarRelation?.desc ?? "일주 지지 간 합충형 관계가 없어요. 서로 강하게 끌리지도, 부딪히지도 않는 편이에요.";

  // ── 축 2. 일간 오행 관계 ──
  const gen: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
  const con: Record<string, string> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };
  const myEl = ganToElement[myDayPillar[0]];
  const partnerEl = ganToElement[partnerDayPillar[0]];

  let elTendency: Tendency = "무난";
  let elDetail = "알 수 없음";
  let elDesc = "일간 오행을 확인할 수 없어 오행 관계는 생략했어요.";
  if (myEl && partnerEl) {
    if (myEl === partnerEl) {
      elTendency = "무난";
      elDetail = `둘 다 ${elLabel(myEl)}`;
      elDesc = `두 사람 모두 ${elLabel(myEl)} 기운이에요. 비슷한 성향이라 공감대는 높지만 같은 자리를 두고 경쟁심이 생길 수 있어요.`;
    } else if (gen[myEl] === partnerEl) {
      elTendency = "순조";
      elDetail = `${myEl}→${partnerEl} 상생`;
      elDesc = `내가 상대를 생해주는 관계예요 (${elLabel(myEl)}→${elLabel(partnerEl)}). 내가 베풀고 상대가 받는 흐름이 자연스러워요.`;
    } else if (gen[partnerEl] === myEl) {
      elTendency = "순조";
      elDetail = `${partnerEl}→${myEl} 상생`;
      elDesc = `상대가 나를 생해주는 관계예요 (${elLabel(partnerEl)}→${elLabel(myEl)}). 상대에게 지원을 받는 흐름이에요.`;
    } else if (con[myEl] === partnerEl) {
      elTendency = "조율필요";
      elDetail = `${myEl}→${partnerEl} 상극`;
      elDesc = `내가 상대를 극하는 관계예요 (${elLabel(myEl)}→${elLabel(partnerEl)}). 의도치 않게 상대에게 압박을 줄 수 있어요.`;
    } else if (con[partnerEl] === myEl) {
      elTendency = "조율필요";
      elDetail = `${partnerEl}→${myEl} 상극`;
      elDesc = `상대가 나를 극하는 관계예요 (${elLabel(partnerEl)}→${elLabel(myEl)}). 상대로부터 자극과 긴장을 받는 편이에요.`;
    }
  }

  // ── 축 3. 신강·신약 조합 ──
  // calcStrength의 3번째 인자는 '월주'다. 일주를 넘기면 월령 가중치가 엉뚱한 지지에 걸려
  // 같은 사람이 운세 탭과 다른 판정을 받는다.
  const myS = calcStrength(mySaju, myDayPillar, mySaju.month).strength;
  const partnerS = calcStrength(partnerSaju, partnerDayPillar, partnerSaju.month).strength;

  let stTendency: Tendency = "무난";
  let stDesc: string;
  if (myS === "중화" && partnerS === "중화") {
    stTendency = "순조";
    stDesc = "두 사람 모두 중화예요. 균형 잡힌 에너지끼리라 서로 맞춰가기 수월한 편이에요.";
  } else if ((myS === "신강" && partnerS === "신약") || (myS === "신약" && partnerS === "신강")) {
    stTendency = "순조";
    stDesc = `내가 ${myS}, 상대가 ${partnerS}예요. 한쪽이 이끌고 한쪽이 받쳐주는 형태라 역할이 잘 나뉘는 편이에요.`;
  } else if (myS === "신강" && partnerS === "신강") {
    stTendency = "조율필요";
    stDesc = "두 사람 모두 신강이에요. 에너지가 강한 쪽끼리라 주도권에서 부딪히기 쉬워요.";
  } else if (myS === "신약" && partnerS === "신약") {
    stTendency = "무난";
    stDesc = "두 사람 모두 신약이에요. 서로 의지하는 따뜻함은 있지만 결정을 미루기 쉬운 편이에요.";
  } else {
    stTendency = "무난";
    stDesc = `내가 ${myS}, 상대가 ${partnerS}예요. 에너지 크기가 달라 서로 보완할 여지가 있어요.`;
  }

  const axes = [
    { key: "지지", label: "일주 지지", tendency: jiTendency, detail: jiDetail, desc: jiDesc },
    { key: "오행", label: "일간 오행", tendency: elTendency, detail: elDetail, desc: elDesc },
    { key: "강약", label: "신강·신약", tendency: stTendency, detail: `${myS} ↔ ${partnerS}`, desc: stDesc },
  ];

  // ── 종합: 가중 평균 대신 세 축의 다수결 + 일치도 ──
  // 가중치(35/35/30)나 등급 컷(80/65/50)은 근거 없는 임의값이라 쓰지 않는다.
  const count = (t: Tendency) => axes.filter((a) => a.tendency === t).length;
  const majority = (["순조", "조율필요", "무난"] as Tendency[]).find((t) => count(t) >= 2);
  const top = majority ?? "무난";
  const agreement: "일치" | "엇갈림" | "제각각" =
    count(top) === 3 ? "일치" : majority ? "엇갈림" : "제각각";

  const overall =
    top === "순조" ? "순조로운 편" : top === "조율필요" ? "조율이 필요한 편" : "무난한 편";

  const summaryBy: Record<string, string> = {
    일치: `세 관점이 모두 같은 방향을 가리켜요. 그만큼 이 경향이 뚜렷하게 나타나는 조합이에요.`,
    엇갈림: `세 관점 중 둘이 같은 방향이고 하나가 달라요. 대체로 ${overall}이지만 예외가 있는 조합이에요.`,
    제각각: `세 관점이 제각각이에요. 한마디로 정리하기 어려운 조합이라 참고 정도로만 보세요.`,
  };
  const summary = `${summaryBy[agreement]} 만세력 궁합은 과거 통계에 기반한 경향이지 관계의 성패를 정하지 않아요.`;

  return { dayPillarRelation, axes, overall, agreement, summary };
};

// ── 조후 판단 ──
const getJohu = (
  monthPillar: string,
  dayPillar: string,
  scores: ElementScore,
  total: number,
) => {
  const monthJi = monthPillar[1] || "";

  const summerJi = ["사", "오", "미"];
  const winterJi = ["해", "자", "축"];
  const springJi = ["인", "묘"];
  const autumnJi = ["신", "유"];
  const changeJi = ["진", "미", "술", "축"];

  const isSummer = summerJi.includes(monthJi);
  const isWinter = winterJi.includes(monthJi);
  const isSpring = springJi.includes(monthJi);
  const isAutumn = autumnJi.includes(monthJi);
  const isChange = changeJi.includes(monthJi);

  // 오행 비율 계산
  const ratio = {
    목: scores.목 / total,
    화: scores.화 / total,
    토: scores.토 / total,
    금: scores.금 / total,
    수: scores.수 / total,
  };

  // 35% 이상인 과다 오행들을 크기순으로 정렬하여 추출
  const overElements = Object.entries(ratio)
    .filter(([, v]) => v >= 0.35)
    .sort(([, a], [, b]) => b - a)
    .map(([k]) => k);

  const topElement = overElements[0] || null;
  const subElement = overElements[1] || null;

  // 과다 오행이 없으면 평이 (조후 안정)
  if (!topElement) {
    return {
      status: "평이" as const,
      label: "균형 ☯️",
      yongsin: "",
      yongsinEl: "",
      solution: ["조후가 안정적이에요. 원하시는 활동을 자유롭게 진행하셔도 좋아요."],
      colors: null,
      direction: null,
    };
  }

  // 1. 상태(Status) 및 라벨(Label) 결정 로직 (계절 및 복합 조건 우선)
  let status: "극열" | "조조" | "극한" | "냉금" | "풍습" | "토중" | "균형" = "균형";
  let label = "균형 ☯️";
  let yongsinEl = "토"; // 기본값 초기화

  // 기본 억부 상극 관계 정의
  const baseControl: Record<string, string> = {
    목: "금", 화: "수", 토: "목", 금: "화", 수: "토",
  };
  yongsinEl = baseControl[topElement];

  // 상세 조건 분기 분리
  if (isSummer) {
    // 여름철 화금상쟁 복합 과다 케이스
    if ((topElement === "화" && subElement === "금") || (topElement === "금" && subElement === "화")) {
      status = "조조";
      label = "燥熱 (조열) 🌞 [화금상쟁]";
      yongsinEl = "토"; 
    } else if (topElement === "화") {
      status = "극열";
      label = "極熱 (극열) 🔥";
      yongsinEl = "수";
    } else if (topElement === "금") {
      status = "조조";
      label = "燥熱 (조열) 🌞 [여름금다]";
      yongsinEl = "수"; // 🔥 [수정] 여름 조열 사주의 금 과다는 화가 아닌 수로 식혀야 함
    }
  } else if (isWinter) {
    if (topElement === "수") {
      status = "극한";
      label = "極寒 (극한) ❄️";
      yongsinEl = "화";
    } else if (topElement === "금") {
      status = "냉금";
      label = "冷金 (냉금) 🌨️";
      yongsinEl = "화";
    }
  } else if (isSpring && topElement === "목") {
    status = "풍습";
    label = "風濕 (풍습) 🌿";
    yongsinEl = "금";
  } else if (isAutumn && topElement === "금") {
    status = "조조";
    label = "燥熱 (조조) 🍂";
    yongsinEl = "화"; // 가을 숙살지기는 화로 제련
  } else if (isChange && topElement === "토") {
    status = "토중";
    label = "土重 (토중) 🌍";
    yongsinEl = "목";
  } else {
    // 계절 특수성이 없는 일반 과다
    const generalMap: Record<string, { status: "극열" | "극한" | "풍습" | "조조" | "토중" | "냉금" | "균형"; label: string }> = {
      화: { status: "극열", label: "火多 (화다) 🔥" },
      수: { status: "극한", label: "水多 (수다) 💧" },
      목: { status: "풍습", label: "木多 (목다) 🌳" },
      금: { status: "조조", label: "金多 (금다) ⚙️" },
      토: { status: "토중", label: "土多 (토다) 🌍" },
    };
    status = generalMap[topElement].status;
    label = generalMap[topElement].label;
  }

  // 데이터 맵 정의 (색상, 방향 등)
  const elementColorMap: Record<string, { name: string; hex: string; desc: string }[]> = {
    목: [{ name: "포레스트그린", hex: "#2D5A1B", desc: "목 기운 강화" }, { name: "올리브", hex: "#6B6B2A", desc: "서브" }, { name: "베이지", hex: "#F5F0E8", desc: "포인트" }],
    화: [{ name: "버건디·레드", hex: "#8B1A1A", desc: "화 기운 강화" }, { name: "오렌지", hex: "#C8640A", desc: "서브" }, { name: "아이보리", hex: "#FFFFF0", desc: "포인트" }],
    토: [{ name: "머스타드·옐로", hex: "#C9A020", desc: "토 기운 강화" }, { name: "브라운", hex: "#7B4B2A", desc: "서브" }, { name: "베이지", hex: "#F5F0E8", desc: "포인트" }],
    금: [{ name: "실버·그레이", hex: "#C0C0C0", desc: "금 기운 강화" }, { name: "화이트", hex: "#F8F8F8", desc: "서브" }, { name: "네이비", hex: "#1a3a5c", desc: "포인트" }],
    수: [{ name: "다크네이비·블랙", hex: "#1a3a5c", desc: "수 기운 강화" }, { name: "차콜", hex: "#2D2D2D", desc: "서브" }, { name: "실버", hex: "#C0C0C0", desc: "포인트" }],
  };

  const elementDirectionMap: Record<string, string> = {
    목: "동쪽·동남쪽", 화: "남쪽·동남쪽", 토: "중앙·남서쪽", 금: "서쪽·북서쪽", 수: "북쪽·북서쪽",
  };

  const yongsinName: Record<string, string> = {
    목: "목(木)", 화: "화(火)", 토: "토(土)", 금: "금(金)", 수: "수(水)",
  };

  // 용신 맞춤형 최종 동적 솔루션 매칭
  const yongsinSolutions: Record<string, string[]> = {
    수: ["수(水) 기운으로 균형 — 검은색·네이비 의상 착용", "수분을 충분히 보충하세요", "조급함과 열감을 식히고 잠시 멈추어 호흡하세요", "직사광선과 고온의 환경을 피하고 서늘함을 유지하세요"],
    화: ["화(火) 기운으로 균형 — 붉은색·오렌지 의상 착용", "따뜻한 음식이나 미온수를 소량 자주 섭취하세요", "활동량을 늘리거나 밝고 채광이 좋은 공간에 머무르세요", "위축되기 쉬운 날이니 자신감 있는 표현을 의식해보세요"],
    목: ["목(木) 기운으로 균형 — 초록색·청색 의상 착용", "과도한 정체나 생각의 정체를 깨고 몸을 움직이세요", "새로운 계획을 구상하거나 가벼운 산책으로 기운을 뚫어주세요", "소화기계 부담을 줄이도록 가볍게 식사하세요"],
    금: ["금(金) 기운으로 균형 — 흰색·실버 의상 착용", "맺고 끊음을 명확히 하고 주변 환경을 미니멀하게 정돈하세요", "감정적 과잉을 가라앉히고 객관적인 사실에 집중해보세요", "가벼운 스트레칭으로 신체 긴장을 이완하세요"],
    토: ["토(土) 기운으로 균형 — 노란색·브라운·베이지 의상 착용", "대립적인 기운을 중재하고 완충할 수 있는 유연성을 유지하세요", "완벽주의적 강박에서 벗어나 마음의 중심을 잡으세요", "주변 환경을 차분하고 아늑하게 조성하세요"],
  };

  const solution = [...yongsinSolutions[yongsinEl]];

  // 계절 특이사항 코멘트 추가
  if (isSummer && topElement === "화") solution.unshift("여름 극열 — 서늘한 환경 유지가 특히 중요해요");
  if (isSummer && topElement === "금") solution.unshift("여름 조열 — 메마른 환경이므로 수분 공급과 휴식이 최우선입니다");
  if (isWinter && topElement === "수") solution.unshift("겨울 극한 — 체온 유지와 활발한 움직임이 필요해요");
  if (isSpring && topElement === "목") solution.unshift("봄 풍습 — 몸이 무겁고 습해지기 쉬운 시기예요");
  if (isAutumn && topElement === "금") solution.unshift("가을 건조 — 기운이 날카로우니 언행의 포용력을 의식하세요");
  if (isChange && topElement === "토") solution.unshift("환절기 토중 — 기운 정체가 가장 심한 시기예요");

  return {
    status: status as "극열" | "극한" | "풍습" | "조조" | "토중",  // ← status 변수 사용
    label,
    yongsin: yongsinName[yongsinEl],
    yongsinEl,
    solution,
    colors: elementColorMap[yongsinEl],
    direction: elementDirectionMap[yongsinEl],
  };
};

// ── 지지 합충형 ──
const getJijiRelation = (dayJi: string, targetJi: string) => {
  const liuHe: Record<string, string> = {
    자: "축", 축: "자", 인: "해", 해: "인",
    묘: "술", 술: "묘", 진: "유", 유: "진",
    사: "신", 신: "사", 오: "미", 미: "오",
  };
  const chong: Record<string, string> = {
    자: "오", 오: "자", 축: "미", 미: "축",
    인: "신", 신: "인", 묘: "유", 유: "묘",
    진: "술", 술: "진", 사: "해", 해: "사",
  };
  const sanHe: Record<string, string[]> = {
    신: ["자", "진"], 자: ["신", "진"], 진: ["신", "자"],
    인: ["오", "술"], 오: ["인", "술"], 술: ["인", "오"],
    해: ["묘", "미"], 묘: ["해", "미"], 미: ["해", "묘"],
    사: ["유", "축"], 유: ["사", "축"], 축: ["사", "유"],
  };
  const xing: Record<string, string> = {
    인: "사", 사: "신", 신: "인",
    축: "술", 술: "미", 미: "축",
    자: "묘", 묘: "자",
  };

  if (liuHe[dayJi] === targetJi) return { type: "육합 ✨", desc: "지지가 합을 이뤄 조화롭고 안정적인 에너지예요." };
  if (chong[dayJi] === targetJi) return { type: "충 ⚡", desc: "지지가 충돌해 변화와 긴장이 생기는 날이에요. 무리한 결정은 피하세요." };
  if (sanHe[dayJi]?.includes(targetJi)) return { type: "삼합 🌟", desc: "지지가 삼합을 이뤄 강한 시너지 에너지예요." };
  if (xing[dayJi] === targetJi) return { type: "형 ⚠️", desc: "지지가 형을 이뤄 갈등과 마찰이 생길 수 있어요. 인간관계에 주의하세요." };
  return null;
};

// ── 지지 추출 ──
const pillarToJi = (pillar: string) => pillar[1] || "";

// ── 십신 계산 ──
const getTenGod = (dayGan: string, targetGan: string): string => {
  const dayEl = ganToElement[dayGan];
  const targetEl = ganToElement[targetGan];
  const dayYin = ["을", "정", "기", "신", "계"].includes(dayGan);
  const targetYin = ["을", "정", "기", "신", "계"].includes(targetGan);

  if (dayEl === targetEl) return dayYin === targetYin ? "비견" : "겁재";

  const gen: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
  const con: Record<string, string> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };

  if (gen[dayEl] === targetEl) return dayYin === targetYin ? "식신" : "상관";
  if (gen[targetEl] === dayEl) return dayYin === targetYin ? "편인" : "정인";
  if (con[dayEl] === targetEl) return dayYin === targetYin ? "편재" : "정재";
  if (con[targetEl] === dayEl) return dayYin === targetYin ? "편관" : "정관";
  return "기타";
};

// ── 지지 십신 ──
// 일진 지지는 그 안의 대표 천간(지장간 본기)으로 바꿔 천간과 같은 규칙으로 십신을 본다.
// 천간 십신이 겉으로 드러나는 기운이라면 지지 십신은 속에 깔린 기운이다.
const jiMainGan: Record<string, string> = {
  자: "계", 축: "기", 인: "갑", 묘: "을", 진: "무", 사: "병",
  오: "정", 미: "기", 신: "경", 유: "신", 술: "무", 해: "임",
};

// 화면에는 십신 이름 대신 쉬운 말을 쓴다. 천간은 "겉", 지지는 "속"으로 부른다.
const tenGodPlain: Record<string, string> = {
  비견: "자신감", 겁재: "승부욕", 식신: "여유·표현", 상관: "재치·말솜씨", 편재: "활동·기회",
  정재: "실속·안정", 편관: "압박·도전", 정관: "책임·원칙", 편인: "직관·생각", 정인: "배움·보살핌",
};

const jiTenGodLine: Record<string, string> = {
  비견: "속으로는 내 방식대로 밀고 나가려는 힘이 받쳐줘요.",
  겁재: "속으로는 지기 싫은 마음과 승부욕이 올라와요.",
  식신: "속으로는 여유롭게 즐기고 표현하고 싶은 마음이 받쳐줘요.",
  상관: "속으로는 재치와 하고 싶은 말이 꿈틀대요.",
  편재: "속으로는 움직이고 기회를 잡고 싶은 마음이 앞서요.",
  정재: "속으로는 실속과 안정을 챙기려는 마음이 받쳐줘요.",
  편관: "속으로는 긴장감과 압박이 은근히 따라와요.",
  정관: "속으로는 책임감과 원칙이 중심을 잡아줘요.",
  편인: "속으로는 생각이 많아지고 촉이 예민해져요.",
  정인: "속으로는 배우고 보살핌 받는 든든함이 깔려 있어요.",
};

// 십신 100가지 조합을 따로 쓰지 않고 "속 기운 한 줄 + 겉·속 관계 한 줄"로 조립한다.
const getJiTenGod = (dayGan: string, todayPillar: string) => {
  const ganTenGod = getTenGod(dayGan, todayPillar[0]);
  const jiTenGod = getTenGod(dayGan, jiMainGan[todayPillar[1]] || "");
  if (!jiTenGodLine[jiTenGod]) return { jiTenGod: "", jiTenGodDesc: "" };

  // 십신 계열은 비겁 → 식상 → 재성 → 관성 → 인성 → 비겁 순으로 생하고, 한 칸 건너 극한다.
  const groupOf: Record<string, number> = {
    비견: 0, 겁재: 0, 식신: 1, 상관: 1, 편재: 2, 정재: 2, 편관: 3, 정관: 3, 편인: 4, 정인: 4,
  };
  const g = groupOf[ganTenGod];
  const j = groupOf[jiTenGod];

  let relation = "";
  if (ganTenGod === jiTenGod) {
    relation = `겉과 속이 같은 기운(${tenGodPlain[jiTenGod]})이라 평소보다 훨씬 강하게 드러나요.`;
  } else if (g === j) {
    relation = `겉(${tenGodPlain[ganTenGod]})과 속(${tenGodPlain[jiTenGod]})이 비슷한 성격의 기운이라 한층 강해져요.`;
  } else if ((j + 1) % 5 === g) {
    relation = "속마음이 겉으로 하는 일을 밀어줘서 힘이 실려요.";
  } else if ((g + 1) % 5 === j) {
    relation = "겉으로 시작한 일이 속마음이 원하는 쪽으로 자연스럽게 이어져요.";
  } else if ((j + 2) % 5 === g) {
    relation = "겉으로는 하고 싶어도 속에서 제동이 걸릴 수 있어요.";
  } else if ((g + 2) % 5 === j) {
    relation = "의욕이 앞서 속마음을 누르기 쉬우니 속도를 조절하세요.";
  }

  return { jiTenGod, jiTenGodDesc: `${jiTenGodLine[jiTenGod]} ${relation}`.trim() };
};

// ── 십신 설명 ──
const tenGodDesc: Record<string, { energy: string; advice: string; caution: string; activity: string }> = {
  비견: { energy: "자신감·독립심이 강해지는 날", advice: "일간과 같은 오행이 만나 본연의 기운이 강해져요. 주도적으로 나서고 새로운 프로젝트를 시작하기에 좋은 에너지예요. 평소보다 결단력이 올라와 중요한 선택을 하기에 유리해요.", caution: "고집이 세지고 타인 의견을 흘려듣기 쉬워요. 협업 상황에서 독단적으로 흐를 수 있으니 한 번 더 주변 목소리를 들어보세요.", activity: "외부 활동·운동 에너지가 좋아요. 수영이나 등산 같은 본인 취미 활동 하기에 좋은 날이에요." },
  겁재: { energy: "경쟁심·추진력이 강해지는 날", advice: "빠른 결단과 실행력이 살아나요. 협업보다 단독 작업에서 강점이 나와요. 경쟁적인 상황에서 유리하게 작용할 수 있어요.", caution: "충동적 지출이나 즉흥적 결정을 조심하세요. 승부욕이 과해지면 인간관계에서 갈등이 생길 수 있어요.", activity: "활동적인 외부 일정이 잘 맞아요. 새로운 사람을 만나거나 네트워킹하기 좋은 날이에요." },
  식신: { energy: "창작·표현·여유의 기운이 강한 날", advice: "머릿속 아이디어가 자연스럽게 흘러나오는 날이에요. 글쓰기·코딩·디자인 등 무언가를 만들어내는 창작 활동에 집중력이 최고조로 올라와요.", caution: "여유로움이 지나쳐 게으름으로 이어질 수 있어요. 적당한 긴장감을 유지하고 하루 하나만이라도 실행에 옮기는 게 중요해요.", activity: "실내 창작 활동이 딱 맞아요. 피아노 치거나 책 읽기 좋고, 가벼운 산책 정도는 기분 전환에 좋아요." },
  상관: { energy: "표현욕·반항심이 강해지는 날", advice: "말과 글로 표현하는 것에 탁월해지는 날이에요. 발표·강의·소통이 필요한 자리에서 빛을 발해요. 틀을 깨는 창의적 아이디어가 나오기 쉬운 날이기도 해요.", caution: "비판적 성향이 강해지고 날이 선 말이 나올 수 있어요. 중요한 대화에서는 말의 온도를 낮추고 감정 조절에 신경 쓰세요.", activity: "소통이 많은 외부 활동이 잘 맞아요. 강의·발표·미팅 등 사람들 앞에 서는 일정에 좋은 날이에요." },
  편재: { energy: "활동·재물·외부 에너지가 강한 날", advice: "적극적으로 나서고 움직이기 좋아요. 영업·네트워킹·외부 미팅에 좋은 에너지예요. 재성이 활성화되는 날이라 수익과 연결된 활동을 추진하기에 유리해요.", caution: "충동적 지출과 과도한 낙관이 생길 수 있어요. 큰 투자나 지출 결정은 한 번 더 검토하고 신중하게 진행하세요.", activity: "외부 활동·사람 만나기 최고의 날이에요. 오전에 중요한 약속을 잡으면 좋아요." },
  정재: { energy: "성실·안정·재물의 기운이 강한 날", advice: "꼼꼼하고 성실하게 일을 처리하기 좋아요. 계획적인 저축·지출 관리 등 재무 관련 일에 집중하기 좋은 날이에요.", caution: "너무 보수적이 되거나 변화를 두려워할 수 있어요. 안정을 추구하되 새로운 시도도 조금은 열어두세요.", activity: "실내에서 차분하게 집중하는 날이에요. 루틴을 지키고 정해진 계획대로 움직이는 게 좋아요." },
  편관: { energy: "도전·극복·강한 자극의 기운이 강한 날", advice: "어려운 과제를 돌파하고 강한 의지력이 살아나는 날이에요. 평소 미뤄왔던 힘든 일을 오늘 밀고 나가면 생각보다 잘 돼요.", caution: "스트레스와 긴장감이 높아질 수 있어요. 몸에 무리가 가지 않도록 적절한 휴식을 챙기세요.", activity: "강도 높은 운동이나 도전적 활동이 잘 맞아요. 등산·수영·격한 운동에서 좋은 에너지가 나와요." },
  정관: { energy: "질서·책임감·명예의 기운이 강한 날", advice: "원칙대로 일을 처리하고 책임감이 강해지는 날이에요. 공식적인 자리·면접·발표에서 신뢰감 있는 인상을 줄 수 있어요.", caution: "지나치게 경직되거나 융통성이 없어질 수 있어요. 원칙 안에서도 유연함을 잃지 마세요.", activity: "공식적인 외부 일정이 잘 맞아요. 이력서 제출이나 취업 활동을 하기에 좋은 날이에요." },
  편인: { energy: "학습·직관·독창성이 강한 날", advice: "혼자 공부하거나 새로운 것을 배우기 좋아요. 직관이 날카로워지고 남들이 보지 못하는 것을 보는 통찰력이 올라와요.", caution: "고립되거나 혼자만의 세계에 빠지기 쉬워요. 적당한 사람 교류로 현실 감각을 유지하세요.", activity: "실내 학습·연구·명상이 잘 맞아요. 새로운 기술이나 언어를 공부하기 좋은 날이에요." },
  정인: { energy: "학습·휴식·내면 정리의 기운이 강한 날", advice: "차분하게 공부하거나 생각을 정리하기 좋아요. 몸과 마음을 충전하는 날로 쓰기에 딱 맞아요.", caution: "너무 수동적이 되거나 의존적이 될 수 있어요. 작은 행동이라도 직접 실천하는 습관을 유지하세요.", activity: "여유로운 실내 활동이 잘 맞아요. 피아노 치거나 책 읽기 딱 좋고, 외출은 가벼운 산책 정도가 어울려요." },
};

// ── 날짜별 분석 ──
// 격국·조후는 원국만으로 정하고, 강약은 원국에 그날 일진을 더해 정한다.
// 억부용신·최종 용신·색상 기준은 그날의 강약을 따라가므로 날마다 달라질 수 있다.
// 운세 화면과 달력이 같은 값을 쓰도록 한곳에서 계산한다.
const calcDaily = (
  saju: { year: string; month: string; day: string; hour: string },
  todayPillar: string,
) => {
  const natalElement = calcElementScore(saju, "", saju.month);
  const johu = getJohu(saju.month, saju.day, natalElement.scores, natalElement.total);
  const natalStrength = calcStrength(saju, saju.day, saju.month);
  const todayStrength = calcStrength(saju, saju.day, saju.month, todayPillar);
  const geokkuk = calcGeokkuk(saju, saju.day, saju.month);
  const yongsin = calcYongsin(todayStrength, geokkuk, saju.day, saju.month, natalElement.percentage, johu);
  const finalYongsin = calcFinalYongsin(yongsin, geokkuk, johu, natalElement.percentage);

  const colorInfo = getColors(
    saju.day,
    todayStrength,
    johu,
    todayPillar,
    { yongsinEl: yongsin.yongsinEl, heesinEl: yongsin.heesinEl },
  );
  // 색상·방향의 기준 오행.
  // 신약·중화는 일간을 살리는 게 먼저라 억부용신을 쓰고,
  // 신강은 버틸 힘이 있으니 조후가 급한 계절이면 조후용신을 기준으로 삼는다.
  const johuUrgent = ["극열", "극한", "냉금", "조조"].includes(johu.status) && !!johu.yongsinEl;
  const johuDiffers = johuUrgent && johu.yongsinEl !== colorInfo.element;
  // 극왕은 종격이라 조후로 넘기지 않고 억부용신 카드의 체계를 그대로 쓴다.
  const useJohu = todayStrength.strength === "신강" && todayStrength.level !== "극왕" && johuDiffers;
  const colorBaseEl = useJohu ? johu.yongsinEl : colorInfo.element;
  const colorBasis = useJohu ? `조후(${johu.status}) 기준` : colorInfo.basis;
  const subEl = useJohu ? colorInfo.element : johuDiffers ? johu.yongsinEl : "";

  return {
    johu,
    strength: { ...todayStrength, natal: { strength: natalStrength.strength, level: natalStrength.level, score: natalStrength.score } },
    geokkuk,
    yongsin,
    finalYongsin,
    colors: elementColorCodes[colorBaseEl] || colorInfo.colors,
    direction: elementDirection[colorBaseEl] || colorInfo.direction,
    colorBasis,
    colorBaseEl,
    // 억부와 조후가 다른 오행을 가리키면 기준이 되지 않은 쪽을 보조색으로 함께 보여준다
    subColor: subEl
      ? { basis: useJohu ? colorInfo.basis : `조후(${johu.status}) 기준`, color: elementColorCodes[subEl][0], direction: elementDirection[subEl] }
      : null,
    dayPoint: getDayPoint(
      todayPillar,
      colorBaseEl,
      useJohu ? `${colorBasis}으로 보면 ` : "",
      !useJohu && colorBaseEl === yongsin.yongsinEl ? yongsin : undefined,
    ),
  };
};

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [helpModal, setHelpModal] = useState<{ title: string; content: string } | null>(null);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() + 1 };
  });
  const [monthData, setMonthData] = useState<{ date: string; dayPillar: string }[]>([]);
  const [monthLoading, setMonthLoading] = useState(false);

  const [birth, setBirth] = useState<BirthInfo>({
    year: "", month: "", day: "", hour: "", minute: "",
    name: "", unknownHour: false, isLunar: false, isLeapMonth: false,
  });
  const [targetDate, setTargetDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [result, setResult] = useState<FortuneResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiFortune, setAiFortune] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"fortune" | "birth" | "compatibility">("fortune");
  
  const [partners, setPartners] = useState<PartnerInfo[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<PartnerInfo | null>(null);
  const [compatResult, setCompatResult] = useState<any>(null);
  const [compatLoading, setCompatLoading] = useState(false);
  const [addingPartner, setAddingPartner] = useState(false);
  const [newPartner, setNewPartner] = useState<PartnerInfo>({
    id: "", name: "", year: "", month: "", day: "", hour: "",
    unknownHour: false, isLunar: false, isLeapMonth: false,
  });

  useEffect(() => {
    const savedBirth = localStorage.getItem("birth-info");
    if (savedBirth) {
      const parsedBirth = JSON.parse(savedBirth);
      setBirth(parsedBirth);
      setSaved(true);
    }

    // 파트너 목록 불러오기 추가
    const savedPartners = localStorage.getItem("partners");
    if (savedPartners) {
      setPartners(JSON.parse(savedPartners));
    }

    // 시간대 자동 테마는 기존 그대로
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return;

    const checkTimeTheme = () => {
      const seoulTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" });
      const hour = new Date(seoulTime).getHours();
      const isDayTime = hour >= 6 && hour < 18;
      setTheme(isDayTime ? "light" : "dark");
    };
    checkTimeTheme();
    const interval = setInterval(checkTimeTheme, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (saved && !result) {
      analyze();
    }
  }, [saved]);

  const saveBirth = () => {
    localStorage.setItem("birth-info", JSON.stringify(birth));
    setSaved(true);
    setActiveTab("fortune");
    analyze();
  };

  const analyzeCompatibility = async (partner: PartnerInfo) => {
    if (!saved || !partner.year || !partner.month || !partner.day) return;
    setCompatLoading(true);
    setCompatResult(null);

    try {
      // 내 사주 API 호출
      const myRes = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthYear: birth.year, birthMonth: birth.month, birthDay: birth.day,
          birthHour: birth.hour, unknownHour: birth.unknownHour,
          isLunar: birth.isLunar, isLeapMonth: birth.isLeapMonth, targetDate: targetDate,
        }),
      });
      const myData = await myRes.json();
      if (!myRes.ok) { alert(myData.error || "내 사주를 계산하지 못했어요."); return; }

      // 상대방 사주 API 호출
      const partnerRes = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthYear: partner.year, birthMonth: partner.month, birthDay: partner.day,
          birthHour: partner.hour, unknownHour: partner.unknownHour,
          isLunar: partner.isLunar, isLeapMonth: partner.isLeapMonth, targetDate: targetDate,
        }),
      });
      const partnerData = await partnerRes.json();
      if (!partnerRes.ok) { alert(partnerData.error || `${partner.name || "상대방"}의 사주를 계산하지 못했어요.`); return; }

      // 궁합 계산
      const compat = calcCompatibility(
        myData.saju, myData.saju.day,
        partnerData.saju, partnerData.saju.day,
      );

      setCompatResult({
        compat,
        mySaju: myData.saju,
        myDayPillar: myData.saju.day,
        partnerSaju: partnerData.saju,
        partnerDayPillar: partnerData.saju.day,
        partnerName: partner.name,
      });

    } catch {
      alert("궁합 분석 중 오류가 발생했어요.");
    } finally {
      setCompatLoading(false);
    }
  };

  const savePartner = () => {
    if (!newPartner.name || !newPartner.year || !newPartner.month || !newPartner.day) {
      alert("이름과 생년월일을 입력해주세요.");
      return;
    }
    const partner = { ...newPartner, id: Date.now().toString() };
    const updated = [...partners, partner];
    setPartners(updated);
    localStorage.setItem("partners", JSON.stringify(updated));
    setNewPartner({ id: "", name: "", year: "", month: "", day: "", hour: "", unknownHour: false, isLunar: false, isLeapMonth: false });
    setAddingPartner(false);
    setSelectedPartner(partner);
    analyzeCompatibility(partner);
  };

  const deletePartner = (id: string) => {
    const updated = partners.filter((p) => p.id !== id);
    setPartners(updated);
    localStorage.setItem("partners", JSON.stringify(updated));
    if (selectedPartner?.id === id) {
      setSelectedPartner(null);
      setCompatResult(null);
    }
  };

  const fetchMonthData = async (year: number, month: number) => {
    setMonthLoading(true);
    try {
      const res = await fetch("/api/saju/month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });
      const data = await res.json();
      setMonthData(data.days || []);
    } catch {
      setMonthData([]);
    } finally {
      setMonthLoading(false);
    }
  };

  useEffect(() => {
    if (calendarOpen) {
      fetchMonthData(calendarMonth.year, calendarMonth.month);
    }
  }, [calendarOpen, calendarMonth]);

  const analyze = async (dateOverride?: string) => {
    setLoading(true);
    setResult(null);
    try {
      const useDate = dateOverride || targetDate;  

      const res = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthYear: birth.year, birthMonth: birth.month, birthDay: birth.day,
          birthHour: birth.hour, unknownHour: birth.unknownHour,
          isLunar: birth.isLunar, isLeapMonth: birth.isLeapMonth, targetDate: useDate, 
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "분석 중 오류가 발생했어요."); return; }

      const dayGan = data.saju.day[0];
      const dayJi = pillarToJi(data.saju.day);
      const dayPillarGan = data.dayPillar[0];
      const dayPillarJi = pillarToJi(data.dayPillar);

      const tenGod = getTenGod(dayGan, dayPillarGan);
      const { jiTenGod, jiTenGodDesc } = getJiTenGod(dayGan, data.dayPillar);
      const jijiRelation = getJijiRelation(dayJi, dayPillarJi);
      const desc = tenGodDesc[tenGod] || tenGodDesc["비견"];
      // 십신·지지관계는 "원국 일간 vs 오늘 일진"이고, 오행 점수 카드도 오늘 일진을 포함해 보여준다.
      // 강약·용신·색상은 calcDaily에서 계산한다.
      const elementResult = calcElementScore(data.saju, data.dayPillar, data.saju.month);
      const daily = calcDaily(data.saju, data.dayPillar);

      const tripleText = elementResult.tripleChar
        ? `⚠️ 지지 삼중첩(${elementResult.tripleChar}${elementResult.tripleChar}${elementResult.tripleChar}) 감지 — 해당 오행이 극도로 강해져 편중된 에너지가 작용해요. 오늘은 특히 균형에 주의하세요.`
        : null;

      const fortuneResult: FortuneResult = {
        ...data,
        analysis: {
          tenGod, jiTenGod, jiTenGodDesc, jijiRelation,
          energy: desc.energy,
          colors: daily.colors,
          direction: daily.direction,
          colorBasis: daily.colorBasis,
          colorBaseEl: daily.colorBaseEl,
          subColor: daily.subColor,
          dayPoint: daily.dayPoint,
          advice: desc.advice,
          caution: desc.caution,
          activity: desc.activity,
          elementScore: elementResult,
          tripleText,
          johu: daily.johu,
          strength: daily.strength,
          geokkuk: daily.geokkuk,
          yongsin: daily.yongsin,
          finalYongsin: daily.finalYongsin,
        },
      };

      setResult(fortuneResult);
      // 계산은 위에서 끝났고, 아래는 그 결과값을 넘겨 해석 문장만 받아온다.
      fetchAiFortune(fortuneResult, useDate);
    } catch { alert("분석 중 오류가 발생했어요."); }
    finally { setLoading(false); }
  };

  // 만세력 계산 결과를 Claude에게 넘겨 오늘의 운세 문장을 생성한다.
  const fetchAiFortune = async (data: FortuneResult, useDate: string) => {
    setAiLoading(true);
    setAiFortune(null);
    setAiError(null);
    try {
      const res = await fetch("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDate: useDate,
          saju: data.saju,
          dayPillar: data.dayPillar,
          monthPillar: data.monthPillar,
          yearPillar: data.yearPillar,
          analysis: {
            tenGod: data.analysis.tenGod,
            jiTenGod: data.analysis.jiTenGod,
            energy: data.analysis.energy,
            jijiRelation: data.analysis.jijiRelation,
            direction: data.analysis.dayPoint?.direction ?? data.analysis.direction,
            colors: data.analysis.dayPoint?.colors ?? data.analysis.colors,
            elementScore: {
              percentage: data.analysis.elementScore.percentage,
              dominant: data.analysis.elementScore.dominant,
              tripleChar: data.analysis.elementScore.tripleChar,
            },
            strength: data.analysis.strength,
            geokkuk: data.analysis.geokkuk,
            johu: data.analysis.johu,
            finalYongsin: {
              finalYongsin: data.analysis.finalYongsin.finalYongsin,
              confidence: data.analysis.finalYongsin.confidence,
              candidates: data.analysis.finalYongsin.candidates?.map((c) => ({
                name: c.name, votes: c.votes, rootless: c.rootless,
              })),
            },
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAiError(json.error || "운세 생성에 실패했어요.");
        return;
      }
      setAiFortune(json.text);
    } catch {
      setAiError("운세 생성 중 네트워크 오류가 발생했어요.");
    } finally {
      setAiLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--input-bg)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 15,
    width: "100%",
    fontFamily: "inherit",
    WebkitAppearance: "none",
    appearance: "none",
    boxSizing: "border-box",
  };

  const HelpButton = ({ id }: { id: string }) => (
    <button
      onClick={() => setHelpModal(helpContents[id])}
      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--muted)", padding: "0 4px", lineHeight: 1 }}>
      🔍
    </button>
  );
  
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "Pretendard, -apple-system, sans-serif" }}>
      {/* 도움말 팝업 */}
      {helpModal && (
        <div
          onClick={() => setHelpModal(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--bg2)", borderRadius: 16, padding: 24, maxWidth: 400, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{helpModal.title}</h3>
              <button
                onClick={() => setHelpModal(null)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--muted)" }}>✕</button>
            </div>
            <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.9, whiteSpace: "pre-line" }}>
              {helpModal.content}
            </div>
          </div>
        </div>
      )}

      {calendarOpen && (
        <div
          onClick={() => setCalendarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--bg2)", borderRadius: 16, padding: 20, maxWidth: 420, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <button
                onClick={() => setCalendarMonth((m) => {
                  const newMonth = m.month === 1 ? 12 : m.month - 1;
                  const newYear = m.month === 1 ? m.year - 1 : m.year;
                  return { year: newYear, month: newMonth };
                })}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text)", padding: 6 }}>‹</button>

              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                {calendarMonth.year}년 {calendarMonth.month}월
              </h3>

              <button
                onClick={() => setCalendarMonth((m) => {
                  const newMonth = m.month === 12 ? 1 : m.month + 1;
                  const newYear = m.month === 12 ? m.year + 1 : m.year;
                  return { year: newYear, month: newMonth };
                })}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text)", padding: 6 }}>›</button>
            </div>

            {monthLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 14 }}>불러오는 중...</div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
                  {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
                    <div key={d} style={{ textAlign: "center", fontSize: 11, color: i === 0 ? "#ff6b6b" : i === 6 ? "#6c63ff" : "var(--muted)", fontWeight: 600 }}>{d}</div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                  {(() => {
                    const firstDay = new Date(calendarMonth.year, calendarMonth.month - 1, 1).getDay();
                    const blanks = Array.from({ length: firstDay }, (_, i) => <div key={`blank-${i}`} />);

                    const dayCells = monthData.map((d) => {
                      const dayNum = Number(d.date.split("-")[2]);
                      const todayStr = (() => {
                        const t = new Date();
                        return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
                      })();
                      const isToday = d.date === todayStr;
                      const isSelected = d.date === targetDate;

                      let dotColor = "var(--muted)";
                      if (saved && birth.year) {
                        const ji = d.dayPillar[0];
                        const elColorMap: Record<string, string> = {
                          갑: "#3B6D11", 을: "#3B6D11",
                          병: "#D85A30", 정: "#D85A30",
                          무: "#BA7517", 기: "#BA7517",
                          경: "#888780", 신: "#888780",
                          임: "#185FA5", 계: "#185FA5",
                        };
                        dotColor = elColorMap[ji] || "var(--muted)";
                      }
                      // 운세를 한 번 조회했으면(사주가 계산돼 있으면) 그날의 추천 색상으로 표시한다
                      const dayPoint = result ? calcDaily(result.saju, d.dayPillar).dayPoint : null;
                      if (dayPoint) dotColor = dayPoint.colors[0].hex;

                      return (
                        <button
                          key={d.date}
                          onClick={() => {
                            setTargetDate(d.date);
                            setCalendarOpen(false);
                            analyze(d.date);
                          }}
                          style={{
                            background: isSelected ? "#6c63ff" : isToday ? "var(--card)" : "transparent",
                            border: isToday && !isSelected ? "1px solid var(--accent)" : "1px solid transparent",
                            borderRadius: 8,
                            padding: "10px 4px",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 5,
                          }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: isSelected ? "white" : "var(--text)" }}>{dayNum}</span>
                          <span style={{ fontSize: 11, color: isSelected ? "rgba(255,255,255,0.85)" : "var(--muted)" }}>{d.dayPillar}</span>
                          <div style={{
                            width: 16,
                            height: 7,
                            borderRadius: 2,
                            background: dotColor,  // 선택 여부와 무관하게 항상 그날의 색상 유지
                          }} />
                        </button>
                      );
                    });

                    return [...blanks, ...dayCells];
                  })()}
                </div>

                <button
                  onClick={() => {
                    const today = new Date();
                    const y = today.getFullYear(), m = String(today.getMonth() + 1).padStart(2, "0"), d = String(today.getDate()).padStart(2, "0");
                    setTargetDate(`${y}-${m}-${d}`);
                    setCalendarMonth({ year: y, month: today.getMonth() + 1 });
                    setCalendarOpen(false);
                  }}
                  style={{ width: "100%", marginTop: 16, padding: "10px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  오늘로 이동
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {/* 헤더 */}
      <div style={{ padding: "2px 20px 0", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>🌙 만세력 운세</h1>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 2 }}>사주 기반 일일 운세 분석</p>
            <p style={{ fontSize: 11, color: "var(--caution)", marginBottom: 20 }}>사주는 통계적 경향성일 뿐, 하루를 결정하는 것은 당신의 선택입니다.</p>
          </div>
          {mounted && (
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              style={{ position: "relative", width: 48, height: 26, borderRadius: 999, background: theme === "dark" ? "#6c63ff" : "#ccc", border: "none", cursor: "pointer", transition: "background 0.3s", flexShrink: 0, marginTop: 4 }}>
              <div style={{ position: "absolute", top: 3, left: theme === "dark" ? 25 : 3, width: 20, height: 20, borderRadius: "50%", background: "white", transition: "left 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
            </button>
          )}
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "var(--bg2)", borderRadius: 10, padding: 4 }}>
          {[["fortune", "운세"], ["compatibility", "궁합"], ["birth", "내 정보"]].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)}
              style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", background: activeTab === tab ? "#6c63ff" : "transparent", color: activeTab === tab ? "white" : "var(--muted)", transition: "all 0.2s" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 40px" }}>

        {/* ── 내 정보 탭 ── */}
        {activeTab === "birth" && (
          <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 20, overflow: "hidden" }}>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>생년월일시를 입력하면 자동으로 사주를 계산해요.</p>

            <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>이름 (선택)</label>
            <input value={birth.name} onChange={(e) => setBirth({ ...birth, name: e.target.value })}
              placeholder="이름 입력" style={{ ...inputStyle, marginBottom: 14 }} />

            {/* 양력/음력 */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "var(--bg)", borderRadius: 8, padding: 4 }}>
              {[["solar", "양력"], ["lunar", "음력"]].map(([val, label]) => (
                <button key={val} onClick={() => setBirth({ ...birth, isLunar: val === "lunar", isLeapMonth: val === "lunar" && birth.isLeapMonth })}
                  style={{ flex: 1, padding: "8px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", background: (val === "lunar") === birth.isLunar ? "var(--accent)" : "transparent", color: (val === "lunar") === birth.isLunar ? "white" : "var(--muted)", transition: "all 0.2s" }}>
                  {label}
                </button>
              ))}
            </div>

            {birth.isLunar && (
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={!!birth.isLeapMonth}
                  onChange={(e) => setBirth({ ...birth, isLeapMonth: e.target.checked })}
                  style={{ width: 16, height: 16, marginTop: 2, accentColor: "var(--accent)", cursor: "pointer", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
                  윤달이에요
                  <span style={{ display: "block", fontSize: 12, color: "var(--muted)" }}>
                    같은 음력 날짜라도 윤달이면 양력 날짜가 달라져요. 윤달이 아니면 체크하지 마세요.
                  </span>
                </span>
              </label>
            )}

            {birth.isLunar && (
              <div style={{ background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--accent)", marginBottom: 14, lineHeight: 1.6 }}>
                💡 음력 변환이 안 될 경우{" "}
                <a href="https://search.naver.com/search.naver?query=음양력변환" target="_blank" style={{ color: "var(--accent2)" }}>
                  네이버 음양력변환 →
                </a>
                {" "}에서 양력으로 변환 후 입력해주세요.
              </div>
            )}

            {/* 년월일 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[["년", "year", 1900, 2050], ["월", "month", 1, 12], ["일", "day", 1, 31]].map(([label, key, min, max]) => (
                <div key={key as string}>
                  <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>{label}</label>
                  <input type="number" min={min as number} max={max as number}
                    value={birth[key as keyof BirthInfo] as any}
                    onChange={(e) => setBirth({ ...birth, [key as string]: e.target.value === "" ? "" : Number(e.target.value) })}
                    style={inputStyle} />
                </div>
              ))}
            </div>

            {/* 시간 모름 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <input type="checkbox" id="unknownHour" checked={birth.unknownHour}
                onChange={(e) => setBirth({ ...birth, unknownHour: e.target.checked })}
                style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#6c63ff" }} />
              <label htmlFor="unknownHour" style={{ fontSize: 13, color: "var(--muted)", cursor: "pointer" }}>
                태어난 시간을 모릅니다
              </label>
            </div>

            {/* 시/분 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {[["시 (0~23)", "hour", 0, 23], ["분", "minute", 0, 59]].map(([label, key, min, max]) => (
                <div key={key as string}>
                  <label style={{ fontSize: 12, color: birth.unknownHour ? "var(--border)" : "var(--muted)", display: "block", marginBottom: 6 }}>{label}</label>
                  <input type="number" min={min as number} max={max as number}
                    value={birth[key as keyof BirthInfo] as any}
                    onChange={(e) => setBirth({ ...birth, [key as string]: e.target.value === "" ? "" : Number(e.target.value) })}
                    disabled={birth.unknownHour}
                    style={{ ...inputStyle, opacity: birth.unknownHour ? 0.4 : 1, cursor: birth.unknownHour ? "not-allowed" : "text" }} />
                </div>
              ))}
            </div>

            <button onClick={saveBirth}
              style={{ width: "100%", padding: "14px", background: "#6c63ff", color: "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              저장하고 운세 보기
            </button>
          </div>
        )}

        {/* ── 운세 탭 ── */}
        {activeTab === "fortune" && (
          <div>
            {!saved && (
              <div style={{ background: "#1a1a2e", border: "1px solid rgba(108,99,255,0.3)", borderRadius: 12, padding: 16, marginBottom: 16, textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "#a0a0ff", marginBottom: 10 }}>먼저 내 정보를 입력해주세요 😊</p>
                <button onClick={() => setActiveTab("birth")}
                  style={{ padding: "8px 20px", background: "#6c63ff", color: "white", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  내 정보 입력하기
                </button>
              </div>
            )}

            {/* 날짜 선택 */}
            <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 8 }}>운세 날짜</label>
              <button
                onClick={() => setCalendarOpen(true)}
                style={{ ...inputStyle, textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{targetDate}</span>
                <span>📅 날짜 선택</span>
              </button>
            </div>

            {/* ── 결과 ── */}
            {result && (
              <div>
                {/* 사주 원국 + 오늘 일진 (요약) */}
                <div style={{ background: "var(--bg2)", borderRadius: 12, padding: "12px 16px", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "var(--muted)", minWidth: 30 }}>사주</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "0.02em" }}>
                      {[result.saju.year, result.saju.month, result.saju.day, result.saju.hour].join(" ")}
                    </span>
                    <HelpButton id="사주원국" />
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span style={{ fontSize: 11, color: "var(--muted)", minWidth: 30 }}>오늘</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#00d4aa" }}>{result.dayPillar}</span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>
                      겉 {tenGodPlain[result.analysis.tenGod] ?? result.analysis.tenGod}
                      {result.analysis.jiTenGod ? ` · 속 ${tenGodPlain[result.analysis.jiTenGod]}` : ""}
                      {result.analysis.jijiRelation ? ` · ${result.analysis.jijiRelation.type}` : ""}
                    </span>
                    <HelpButton id="일진" />
                  </div>
                  {result.isLunar && result.convertedSolar && (
                    <div style={{ fontSize: 12, color: "var(--accent2)", marginTop: 8 }}>
                      음력 → 양력 변환: {result.convertedSolar.year}년 {result.convertedSolar.month}월 {result.convertedSolar.day}일
                    </div>
                  )}
                </div>

                {/* 오늘의 해석 (Claude) */}
                <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>// 오늘의 해석 <HelpButton id="십신" /></p>
                  {/* Claude 해석 — 위 계산 결과를 넘겨 생성한 문장 */}
                  {aiLoading && (
                    <div style={{ background: "var(--card)", borderRadius: 8, padding: "14px 16px" }}>
                      <div style={{ fontSize: 11, color: "#00d4aa", marginBottom: 8 }}>✦ 해석을 쓰는 중…</div>
                      {[92, 100, 74].map((w, i) => (
                        <div key={i} style={{ height: 10, width: `${w}%`, background: "var(--card2)", borderRadius: 5, marginBottom: 8, opacity: 0.6 }} />
                      ))}
                    </div>
                  )}

                  {!aiLoading && aiFortune && (
                    <div style={{ background: "var(--card)", borderRadius: 8, padding: "14px 16px" }}>
                      <div style={{ fontSize: 11, color: "#00d4aa", marginBottom: 8 }}>✦ 오늘의 해석</div>
                      <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.9, whiteSpace: "pre-line" }}>
                        {aiFortune}
                      </div>
                    </div>
                  )}

                  {/* 생성 실패 시에는 기존 십신 기본 설명으로 대체 */}
                  {!aiLoading && !aiFortune && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {aiError && (
                        <div style={{ fontSize: 12, color: "#f59e0b", lineHeight: 1.6 }}>
                          {aiError} 기본 해석을 보여드릴게요.
                        </div>
                      )}
                      {[
                        { color: "#00d4aa", icon: "✦ 좋은 흐름", text: result.analysis.advice },
                        { color: "#f59e0b", icon: "⚠ 주의사항", text: result.analysis.caution },
                        { color: "#a78bfa", icon: "🏃 외부활동", text: result.analysis.activity },
                        ...(result.analysis.jiTenGod
                          ? [{ color: "#6c63ff", icon: `◈ 속에 깔린 기운 · ${tenGodPlain[result.analysis.jiTenGod]}`, text: result.analysis.jiTenGodDesc }]
                          : []),
                      ].map((item) => (
                        <div key={item.icon} style={{ background: "var(--card)", borderRadius: 8, padding: "12px 14px" }}>
                          <div style={{ fontSize: 11, color: item.color, marginBottom: 6 }}>{item.icon}</div>
                          <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{item.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* 신강/신약 */}
                <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>// 오늘의 강약 <HelpButton id="신강신약" /></p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{
                      padding: "6px 16px", borderRadius: 20, fontWeight: 700, fontSize: 15,
                      background: result.analysis.strength.strength === "신강"
                        ? "rgba(216,90,48,0.15)"
                        : result.analysis.strength.strength === "신약"
                        ? "rgba(24,95,165,0.15)"
                        : "rgba(108,99,255,0.15)",
                      color: result.analysis.strength.strength === "신강"
                        ? "#D85A30"
                        : result.analysis.strength.strength === "신약"
                        ? "#185FA5"
                        : "#6c63ff",
                      border: `1px solid ${result.analysis.strength.strength === "신강"
                        ? "rgba(216,90,48,0.3)"
                        : result.analysis.strength.strength === "신약"
                        ? "rgba(24,95,165,0.3)"
                        : "rgba(108,99,255,0.3)"}`,
                    }}>
                      {result.analysis.strength.level}
                    </div>
                    {/* 강약 게이지 */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
                        <span>신약</span>
                        <span>중화</span>
                        <span>신강</span>
                      </div>
                      <div style={{ height: 8, background: "var(--card)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                        <div style={{
                          height: "100%",
                          width: `${result.analysis.strength.score}%`,
                          background: result.analysis.strength.strength === "신강"
                            ? "linear-gradient(90deg, #6c63ff, #D85A30)"
                            : result.analysis.strength.strength === "신약"
                            ? "linear-gradient(90deg, #185FA5, #6c63ff)"
                            : "linear-gradient(90deg, #6c63ff, #00d4aa)",
                          borderRadius: 4,
                          transition: "width 0.5s",
                        }} />
                        {/* 중화 기준선 */}
                        <div style={{ position: "absolute", top: 0, left: "50%", width: 2, height: "100%", background: "rgba(255,255,255,0.3)" }} />
                      </div>
                      <div style={{ textAlign: "right", fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                        오늘 {result.analysis.strength.score}점
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>
                    {result.analysis.strength.desc}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                    타고난 강약 {result.analysis.strength.natal.level} {result.analysis.strength.natal.score}점 → 오늘 일진({result.dayPillar}) 반영 {result.analysis.strength.level} {result.analysis.strength.score}점
                  </p>
                </div>
                
                {/* 오행 점수 */}
                <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>// 오행 점수 <HelpButton id="오행점수" /></p>
                  {Object.entries(result.analysis.elementScore.scores).map(([el, score]) => {
                    const pct = result.analysis.elementScore.percentage[el];
                    const elColor: Record<string, string> = {
                      목: "#3B6D11", 화: "#D85A30", 토: "#BA7517", 금: "#888780", 수: "#185FA5"
                    };
                    const isDominant = result.analysis.elementScore.dominant === el;
                    const isYongsin = result.analysis.yongsin?.yongsinEl === el;
                    const isHeesin = result.analysis.yongsin?.heesinEl === el;
                    const isGisin = result.analysis.yongsin?.gisinEl === el;
                    const isGusin = result.analysis.yongsin?.gusinEl === el;

                    const tag = isYongsin ? "용신 💎"
                      : isHeesin ? "희신 ✨"
                      : isGisin ? "기신 ⚠️"
                      : isGusin ? "구신 🔻"
                      : isDominant ? "과다 ⚡"
                      : "";

                    const tagColor = isYongsin ? "#00d4aa"
                      : isHeesin ? "#a78bfa"
                      : isGisin ? "#ff6b6b"
                      : isGusin ? "#f59e0b"
                      : isDominant ? "#ff6b6b"
                      : "var(--muted)";

                    return (
                      <div key={el} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: "var(--text)", fontWeight: tag ? 700 : 400 }}>{el}</span>
                            {tag && (
                              <span style={{ fontSize: 10, color: tagColor, background: `${tagColor}20`, padding: "1px 6px", borderRadius: 10 }}>
                                {tag}
                              </span>
                            )}
                          </div>
                          <span style={{ color: "var(--muted)" }}>{score}점 ({pct}%)</span>
                        </div>
                        <div style={{ height: 6, background: "var(--card)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: elColor[el], borderRadius: 3, transition: "width 0.5s", opacity: isGisin || isGusin ? 0.5 : 1 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 최종 용신 */}
                {result.analysis.finalYongsin && (
                  <div style={{
                    background: result.analysis.finalYongsin.confidence === "유력"
                      ? "rgba(0,212,170,0.1)"
                      : result.analysis.finalYongsin.confidence === "경합"
                      ? "rgba(108,99,255,0.1)"
                      : "rgba(245,158,11,0.1)",
                    border: `1px solid ${result.analysis.finalYongsin.confidence === "유력"
                      ? "rgba(0,212,170,0.3)"
                      : result.analysis.finalYongsin.confidence === "경합"
                      ? "rgba(108,99,255,0.3)"
                      : "rgba(245,158,11,0.3)"}`,
                    borderRadius: 12, padding: 16, marginBottom: 12
                  }}>
                    <p style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>// 최종 용신 <HelpButton id="최종용신" /></p>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{
                        fontSize: 22, fontWeight: 700,
                        color: result.analysis.finalYongsin.confidence === "유력" ? "#00d4aa"
                          : result.analysis.finalYongsin.confidence === "경합" ? "#6c63ff"
                          : "#f59e0b"
                      }}>
                        {result.analysis.finalYongsin.finalYongsin}
                      </div>
                      <div style={{
                        fontSize: 11, padding: "3px 10px", borderRadius: 12, fontWeight: 600,
                        background: result.analysis.finalYongsin.confidence === "유력"
                          ? "rgba(0,212,170,0.2)"
                          : result.analysis.finalYongsin.confidence === "경합"
                          ? "rgba(108,99,255,0.2)"
                          : "rgba(245,158,11,0.2)",
                        color: result.analysis.finalYongsin.confidence === "유력" ? "#00d4aa"
                          : result.analysis.finalYongsin.confidence === "경합" ? "#6c63ff"
                          : "#f59e0b",
                      }}>
                        {result.analysis.finalYongsin.confidence}
                      </div>
                    </div>
                    {/* 관점별 지목 — 하나로 단정하지 않고 후보를 나란히 보여준다 */}
                    {result.analysis.finalYongsin.candidates?.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                        {result.analysis.finalYongsin.candidates.map((c) => (
                          <div key={c.el} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--card)", borderRadius: 8, padding: "8px 12px" }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", minWidth: 52 }}>{c.name}</span>
                            <span style={{ fontSize: 11, color: "var(--muted)", flex: 1 }}>{c.votes.join(" · ")}</span>
                            <span style={{ fontSize: 11, color: c.rootless ? "#f59e0b" : "var(--muted)" }}>
                              {c.rootless ? "원국에 없음" : `원국 ${c.rootPct}%`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>
                      {result.analysis.finalYongsin.reason}
                    </p>
                  </div>
                )}

                {/* 억부용신 */}
                {result.analysis.yongsin && (
                  <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                    <p style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>// 억부용신 <HelpButton id="억부용신" /></p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                      <div style={{ background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.3)", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#00d4aa", marginBottom: 4 }}>용신 💎</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#00d4aa" }}>{result.analysis.yongsin.yongsin}</div>
                      </div>
                      <div style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#a78bfa", marginBottom: 4 }}>희신 ✨</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#a78bfa" }}>{result.analysis.yongsin.heesin}</div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                      <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#ff6b6b", marginBottom: 4 }}>기신 ⚠️</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#ff6b6b" }}>{result.analysis.yongsin.gisин}</div>
                      </div>
                      <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#f59e0b", marginBottom: 4 }}>구신 🔻</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{result.analysis.yongsin.gusin}</div>
                      </div>
                      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>한신 ➖</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)" }}>{result.analysis.yongsin.hansin}</div>
                      </div>
                    </div>

                    <div style={{ background: "var(--card)", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, color: "var(--accent2)", marginBottom: 6 }}>✦ 용신 해설</div>
                      <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{result.analysis.yongsin.desc}</div>
                    </div>
                  </div>
                )}

                {/* 추천 색상 + 길한 방향 — 위는 일진 반영(매일 바뀜), 아래는 억부용신 기본색(고정) */}
                {(() => {
                  const today = result.analysis.dayPoint;
                  const colors = today?.colors ?? result.analysis.colors;
                  const direction = today?.direction ?? result.analysis.direction;
                  return (
                    <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <p style={{ fontSize: 11, color: "#6c63ff", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>// 오늘 추천 색상·방향</p>
                        <span style={{ fontSize: 11, color: "var(--muted)", background: "var(--card)", padding: "3px 8px", borderRadius: 10 }}>
                          {today ? `${result.dayPillar}일 · ${today.role}` : result.analysis.colorBasis}
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
                        {colors.map((c) => (
                          <div key={c.name} style={{ background: "var(--card)", borderRadius: 8, padding: "12px 8px", textAlign: "center", border: "1px solid var(--border)" }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: c.hex, margin: "0 auto 8px", border: "2px solid rgba(0,0,0,0.1)", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }} />
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.desc}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--card)", borderRadius: 8, padding: "12px 14px" }}>
                        <div style={{ fontSize: 24 }}>🧭</div>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>길한 방향</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent2)" }}>{direction}</div>
                        </div>
                      </div>

                      {today && (
                        <>
                          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, marginTop: 10 }}>{today.reason}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--muted)" }}>
                            <span>오늘의 기준색 ({result.analysis.colorBasis})</span>
                            <span style={{ width: 12, height: 12, borderRadius: "50%", background: result.analysis.colors[0].hex, border: "1px solid rgba(0,0,0,0.15)", flexShrink: 0 }} />
                            <span style={{ color: "var(--text)" }}>{result.analysis.colors[0].name} · {result.analysis.direction}</span>
                          </div>
                          {result.analysis.subColor && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
                              <span>보조색 ({result.analysis.subColor.basis})</span>
                              <span style={{ width: 12, height: 12, borderRadius: "50%", background: result.analysis.subColor.color.hex, border: "1px solid rgba(0,0,0,0.15)", flexShrink: 0 }} />
                              <span style={{ color: "var(--text)" }}>{result.analysis.subColor.color.name} · {result.analysis.subColor.direction}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── 궁합 탭 ── */}
        {activeTab === "compatibility" && (
          <div>
            {!saved && (
              <div style={{ background: "#1a1a2e", border: "1px solid rgba(108,99,255,0.3)", borderRadius: 12, padding: 16, marginBottom: 16, textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "#a0a0ff", marginBottom: 10 }}>먼저 내 정보를 입력해주세요 😊</p>
                <button onClick={() => setActiveTab("birth")}
                  style={{ padding: "8px 20px", background: "#6c63ff", color: "white", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  내 정보 입력하기
                </button>
              </div>
            )}

            {saved && (
              <>
                {/* 상대방 목록 */}
                <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>상대방 목록</p>
                    <button
                      onClick={() => setAddingPartner(true)}
                      style={{ background: "#6c63ff", color: "white", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                      + 추가
                    </button>
                  </div>

                  {partners.length === 0 && !addingPartner && (
                    <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", padding: "16px 0" }}>
                      상대방 정보를 추가해주세요
                    </p>
                  )}

                  {/* 파트너 카드 목록 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {partners.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => { setSelectedPartner(p); analyzeCompatibility(p); }}
                        style={{
                          background: selectedPartner?.id === p.id ? "rgba(108,99,255,0.15)" : "var(--card)",
                          border: `1px solid ${selectedPartner?.id === p.id ? "rgba(108,99,255,0.5)" : "var(--border)"}`,
                          borderRadius: 8, padding: "12px 14px", cursor: "pointer",
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>
                            {p.year}년 {p.month}월 {p.day}일 {p.unknownHour ? "" : `${p.hour}시`}
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deletePartner(p.id); }}
                          style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 16 }}>✕</button>
                      </div>
                    ))}
                  </div>

                  {/* 파트너 추가 폼 */}
                  {addingPartner && (
                    <div style={{ marginTop: 12, padding: 14, background: "var(--card)", borderRadius: 8, border: "1px solid var(--border)" }}>
                      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>상대방 정보 입력</p>

                      <input
                        value={newPartner.name}
                        onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                        placeholder="이름"
                        style={{ ...inputStyle, marginBottom: 10 }}
                      />

                      {/* 양력/음력 */}
                      <div style={{ display: "flex", gap: 4, marginBottom: 10, background: "var(--bg)", borderRadius: 8, padding: 4 }}>
                        {[["solar", "양력"], ["lunar", "음력"]].map(([val, label]) => (
                          <button key={val}
                            onClick={() => setNewPartner({ ...newPartner, isLunar: val === "lunar", isLeapMonth: val === "lunar" && newPartner.isLeapMonth })}
                            style={{ flex: 1, padding: "6px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", background: (val === "lunar") === newPartner.isLunar ? "var(--accent)" : "transparent", color: (val === "lunar") === newPartner.isLunar ? "white" : "var(--muted)" }}>
                            {label}
                          </button>
                        ))}
                      </div>

                      {newPartner.isLunar && (
                        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer" }}>
                          <input type="checkbox" checked={!!newPartner.isLeapMonth}
                            onChange={(e) => setNewPartner({ ...newPartner, isLeapMonth: e.target.checked })}
                            style={{ width: 15, height: 15, accentColor: "var(--accent)", cursor: "pointer", flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: "var(--text)" }}>윤달이에요</span>
                        </label>
                      )}

                      {/* 년월일 */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                        {[["년", "year"], ["월", "month"], ["일", "day"]].map(([label, key]) => (
                          <div key={key}>
                            <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>{label}</label>
                            <input type="number"
                              value={newPartner[key as keyof PartnerInfo] as any}
                              onChange={(e) => setNewPartner({ ...newPartner, [key]: e.target.value === "" ? "" : Number(e.target.value) })}
                              style={inputStyle} />
                          </div>
                        ))}
                      </div>

                      {/* 시간 모름 */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <input type="checkbox" checked={newPartner.unknownHour}
                          onChange={(e) => setNewPartner({ ...newPartner, unknownHour: e.target.checked })}
                          style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#6c63ff" }} />
                        <label style={{ fontSize: 13, color: "var(--muted)" }}>태어난 시간을 모릅니다</label>
                      </div>

                      {!newPartner.unknownHour && (
                        <div style={{ marginBottom: 10 }}>
                          <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>시 (0~23)</label>
                          <input type="number" min={0} max={23}
                            value={newPartner.hour}
                            onChange={(e) => setNewPartner({ ...newPartner, hour: e.target.value === "" ? "" : Number(e.target.value) })}
                            style={inputStyle} />
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={savePartner}
                          style={{ flex: 1, padding: "10px", background: "#6c63ff", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                          저장하고 궁합보기
                        </button>
                        <button onClick={() => setAddingPartner(false)}
                          style={{ padding: "10px 16px", background: "var(--card)", color: "var(--muted)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 궁합 결과 */}
                {compatLoading && (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 14 }}>분석 중...</div>
                )}

                {compatResult && !compatLoading && (
                  <div>
                    {/* 종합 경향 — 점수·등급 대신 세 축의 일치도로 표기 */}
                    {(() => {
                      const tone = compatResult.compat.overall === "순조로운 편"
                        ? { c: "#00d4aa", bg: "rgba(0,212,170,0.1)", bd: "rgba(0,212,170,0.3)" }
                        : compatResult.compat.overall === "조율이 필요한 편"
                        ? { c: "#f59e0b", bg: "rgba(245,158,11,0.1)", bd: "rgba(245,158,11,0.3)" }
                        : { c: "#6c63ff", bg: "rgba(108,99,255,0.1)", bd: "rgba(108,99,255,0.3)" };
                      return (
                        <div style={{ background: tone.bg, border: `1px solid ${tone.bd}`, borderRadius: 12, padding: 16, marginBottom: 12, textAlign: "center" }}>
                          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                            {birth.name || "나"} ↔ {compatResult.partnerName}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
                            <span style={{ fontSize: 24, fontWeight: 700, color: tone.c }}>{compatResult.compat.overall}</span>
                            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, fontWeight: 600, background: `${tone.c}30`, color: tone.c }}>
                              세 관점 {compatResult.compat.agreement}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
                            {compatResult.compat.summary}
                          </div>
                        </div>
                      );
                    })()}

                    {/* 일주 비교 */}
                    <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                      <p style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>// 일주 비교</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center", marginBottom: 12 }}>
                        <div style={{ background: "var(--card)", borderRadius: 8, padding: "12px", textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{birth.name || "나"}</div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: "#00d4aa" }}>{compatResult.myDayPillar}</div>
                        </div>
                        <div style={{ fontSize: 20, color: "var(--muted)" }}>↔</div>
                        <div style={{ background: "var(--card)", borderRadius: 8, padding: "12px", textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{compatResult.partnerName}</div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: "#a78bfa" }}>{compatResult.partnerDayPillar}</div>
                        </div>
                      </div>

                      {compatResult.compat.dayPillarRelation ? (
                        <div style={{ background: "var(--card)", borderRadius: 8, padding: "12px 14px" }}>
                          <div style={{ fontSize: 12, color: "var(--accent2)", marginBottom: 4 }}>
                            지지 관계 — {compatResult.compat.dayPillarRelation.type}
                          </div>
                          <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>
                            {compatResult.compat.dayPillarRelation.desc}
                          </div>
                        </div>
                      ) : (
                        <div style={{ background: "var(--card)", borderRadius: 8, padding: "12px 14px" }}>
                          <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>
                            일주 지지 간 특별한 합충형 관계는 없어요.
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 관점별 경향 — 임의 가중치 없이 세 축을 나란히 */}
                    <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                      <p style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>// 관점별 경향</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {compatResult.compat.axes.map((ax: { key: string; label: string; tendency: string; detail: string; desc: string }) => {
                          const c = ax.tendency === "순조" ? "#00d4aa" : ax.tendency === "조율필요" ? "#f59e0b" : "#6c63ff";
                          return (
                            <div key={ax.key} style={{ background: "var(--card)", borderRadius: 8, padding: "12px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{ax.label}</span>
                                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 600, background: `${c}25`, color: c }}>{ax.tendency}</span>
                                <span style={{ fontSize: 11, color: "var(--muted)" }}>{ax.detail}</span>
                              </div>
                              <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{ax.desc}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}