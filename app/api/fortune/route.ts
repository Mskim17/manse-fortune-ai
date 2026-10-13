import { createHash } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 300;

// ── 캐시 ──
// 같은 날짜 + 같은 사주 조합이면 이미 생성한 문장을 그대로 재사용한다.
// 프로세스 메모리 캐시라 서버 인스턴스마다 따로 쌓이고 재배포 시 비워진다.
// 여러 인스턴스에 걸쳐 공유하려면 Redis 등 외부 스토어로 바꾸면 된다.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;

type CacheEntry = { text: string; expiresAt: number };
const cache = new Map<string, CacheEntry>();

function cacheGet(key: string): string | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  // 재삽입해서 LRU 순서 갱신 (Map은 삽입 순서를 유지한다)
  cache.delete(key);
  cache.set(key, hit);
  return hit.text;
}

function cacheSet(key: string, text: string) {
  cache.set(key, { text, expiresAt: Date.now() + CACHE_TTL_MS });
  // 만료된 항목 정리 후에도 넘치면 가장 오래된 것부터 제거
  for (const [k, v] of cache) {
    if (v.expiresAt <= Date.now()) cache.delete(k);
  }
  while (cache.size > CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next();
    if (oldest.done) break;
    cache.delete(oldest.value);
  }
}

// ── 요청 타입 ──
// 계산은 하지 않는다. app/api/saju 와 page.tsx 가 이미 만들어 둔 결과값만 받는다.
type Pillars = { year: string; month: string; day: string; hour: string };

type FortuneRequest = {
  targetDate: string;
  saju: Pillars;
  dayPillar: string;
  monthPillar: string;
  yearPillar: string;
  analysis: {
    tenGod: string;
    jiTenGod?: string;
    energy?: string;
    jijiRelation: { type: string; desc: string } | null;
    direction?: string;
    colors?: { name: string }[];
    elementScore: { percentage: Record<string, number>; dominant: string | null; tripleChar: string | null };
    strength: { strength: string; score: number };
    geokkuk: { name: string; tenGod: string };
    johu: { status: string; label: string; yongsin: string };
    finalYongsin: {
      finalYongsin: string;
      confidence: string;
      reason?: string;
      candidates?: { name: string; votes: string[]; rootless: boolean }[];
    };
  };
};

function isPillars(v: unknown): v is Pillars {
  if (typeof v !== "object" || v === null) return false;
  const p = v as Record<string, unknown>;
  return ["year", "month", "day", "hour"].every((k) => typeof p[k] === "string");
}

// 캐시 키는 Claude에 실제로 보내는 프롬프트 문자열을 그대로 해시해서 만든다.
// 키와 프롬프트를 따로 조립하면 키에는 없고 프롬프트에만 들어가는 필드가 생겨,
// 누군가 그 필드에 임의 문구를 넣어 만든 응답이 같은 사주의 다른 사용자에게 캐시로 나갈 수 있다.
// 프롬프트에는 색상 hex 같은 표현용 값이 들어가지 않으므로 같은 사주·날짜면 키도 같다.
function buildCacheKey(prompt: string): string {
  // 작성 규칙(SYSTEM_PROMPT)이 바뀌면 예전 규칙으로 만든 응답이 재사용되지 않도록 함께 해시한다.
  return createHash("sha256").update(SYSTEM_PROMPT).update(prompt).digest("hex");
}

// 분량 주의: 응답은 max_tokens 300으로 잘린다. 한국어는 토큰을 많이 먹어서
// 300토큰이면 대략 200자 안팎이다. 아래 분량 지시를 늘리면 문장이 중간에 끊긴다.
const SYSTEM_PROMPT = `당신은 한국 전통 명리학(사주)에 정통한 상담가입니다.
이미 계산이 끝난 만세력 데이터를 받아 "오늘의 운세"를 한국어로 씁니다.

형식(정확히 3줄, 각 줄 사이 빈 줄 없음):
[오늘의 기운] (한 문장)
[이렇게 해보세요] (한 문장)
[이건 조심하세요] (한 문장)

작성 규칙:
- 반드시 "~해요" 체로 씁니다. "~습니다", "~입니다" 는 쓰지 않습니다.
- 세 줄 합쳐 180자 이내. 반드시 세 줄을 모두 끝맺습니다. 길이보다 완결이 우선입니다.
- 주어진 데이터(천간·지지 십신, 신강·신약, 격국, 용신, 조후, 오행 분포, 지지 관계)에 근거해서 씁니다.
- 데이터에 없는 사실(건강, 금전, 연애의 구체적 사건, 숫자로 된 예언)은 지어내지 않습니다.
- 만세력은 과거 통계에 기반한 경향값이지 확정된 미래가 아닙니다. 단정적인 예언("~할 것입니다",
  "~하게 됩니다") 대신 가능성과 경향("~한 흐름이에요", "~하기 좋아요")으로만 씁니다.
- 용신 신뢰도가 '경합'이나 '불확실'이면 단정하지 말고 "~쪽 기운이 무난해 보여요" 처럼 여지를 둡니다.
- 용신이 원국에 없다(무근)고 표시되면 그 기운을 강하게 권하지 않습니다.
- 천간, 지지, 십신 이름(비견·겁재·식신·상관·편재·정재·편관·정관·편인·정인), 용신, 신강·신약 같은 명리 용어는
  문장에 쓰지 않습니다. "자신감", "승부욕", "겉으로 드러나는 기운", "속마음" 처럼 누구나 아는 쉬운 말로 풀어 씁니다.
- 마크다운 기호(#, *, -)는 쓰지 않습니다.`;

function buildUserPrompt(body: FortuneRequest): string {
  const a = body.analysis;
  const pct = ["목", "화", "토", "금", "수"]
    .map((el) => `${el} ${a.elementScore.percentage?.[el] ?? 0}%`)
    .join(", ");

  const lines = [
    `[대상 날짜] ${body.targetDate}`,
    `[오늘 간지] 세운 ${body.yearPillar} / 월건 ${body.monthPillar} / 일진 ${body.dayPillar}`,
    `[사주 원국] 년 ${body.saju.year} / 월 ${body.saju.month} / 일 ${body.saju.day} / 시 ${body.saju.hour}`,
    `[일간 대비 오늘 일진의 십신] ${a.tenGod}${a.energy ? ` (${a.energy})` : ""}`,
    ...(a.jiTenGod ? [`[일간 대비 오늘 일진 지지의 십신] ${a.jiTenGod} (지지 본기 기준. 천간 십신이 겉으로 드러나는 기운이라면 이쪽은 바탕에 깔린 기운)`] : []),
    `[지지 관계] ${a.jijiRelation ? `${a.jijiRelation.type} — ${a.jijiRelation.desc}` : "특이 관계 없음"}`,
    // "[신강·신약] 중화" 처럼 쓰면 모델이 "중화된 신약" 으로 뭉개는 경우가 있어 라벨을 분리한다.
    `[일간 강약 판정] ${a.strength.strength} (신강/신약/중화 중 하나, 지지율 ${a.strength.score}%)`,
    `[격국] ${a.geokkuk.name} (${a.geokkuk.tenGod})`,
    `[조후] ${a.johu.label} / 조후용신 ${a.johu.yongsin || "없음"}`,
    `[최종 용신] ${a.finalYongsin.finalYongsin} (신뢰도 ${a.finalYongsin.confidence})`,
    ...(a.finalYongsin.candidates?.length
      ? [`[용신 후보 비교] ${a.finalYongsin.candidates
          .map((c) => `${c.name}←${c.votes.join("·")}${c.rootless ? "(원국에 없음)" : ""}`)
          .join(" / ")}`]
      : []),
    `[오행 분포] ${pct}`,
  ];

  if (a.elementScore.dominant) lines.push(`[과다 오행] ${a.elementScore.dominant}`);
  if (a.elementScore.tripleChar) lines.push(`[지지 삼중첩] ${a.elementScore.tripleChar}`);
  if (a.direction) lines.push(`[길한 방향] ${a.direction}`);
  if (a.colors?.length) lines.push(`[행운의 색] ${a.colors.map((c) => c.name).join(", ")}`);

  lines.push("", "위 데이터를 바탕으로 오늘의 운세를 작성해주세요.");
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  let body: FortuneRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  // ── 입력값 검증 ──
  if (typeof body?.targetDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.targetDate)) {
    return NextResponse.json({ error: "targetDate는 YYYY-MM-DD 형식이어야 해요." }, { status: 400 });
  }
  if (!isPillars(body.saju)) {
    return NextResponse.json({ error: "사주 원국(saju) 값이 필요해요." }, { status: 400 });
  }
  if (typeof body.dayPillar !== "string" || !body.dayPillar) {
    return NextResponse.json({ error: "일진(dayPillar) 값이 필요해요." }, { status: 400 });
  }
  const a = body.analysis;
  if (!a?.tenGod || !a.strength || !a.geokkuk || !a.johu || !a.finalYongsin || !a.elementScore) {
    return NextResponse.json({ error: "분석(analysis) 결과가 필요해요." }, { status: 400 });
  }

  // ── 캐시 조회 ──
  const userPrompt = buildUserPrompt(body);
  const cacheKey = buildCacheKey(userPrompt);
  const cached = cacheGet(cacheKey);
  if (cached) {
    return NextResponse.json({ text: cached, cached: true, model: MODEL });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY가 설정되지 않았어요. .env.local에 키를 추가해주세요." },
      { status: 503 },
    );
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    if (!text) {
      return NextResponse.json({ error: "운세 문장을 생성하지 못했어요. 잠시 후 다시 시도해주세요." }, { status: 502 });
    }

    // max_tokens에 걸려 문장이 끊긴 경우에도 캐시에 넣는다.
    // (같은 입력이면 어차피 같은 결과라 재호출해도 개선되지 않는다)
    const truncated = response.stop_reason === "max_tokens";
    cacheSet(cacheKey, text);

    return NextResponse.json({
      text,
      cached: false,
      truncated,
      model: MODEL,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "API 키가 올바르지 않아요." }, { status: 502 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "요청이 많아요. 잠시 후 다시 시도해주세요." }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error("[fortune] Anthropic API error", error.status, error.message);
      return NextResponse.json({ error: "운세 생성 중 오류가 발생했어요." }, { status: 502 });
    }
    console.error("[fortune] unexpected error", error);
    return NextResponse.json({ error: "운세 생성 중 오류가 발생했어요." }, { status: 500 });
  }
}
