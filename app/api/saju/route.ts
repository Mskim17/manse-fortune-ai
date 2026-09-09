import { NextRequest, NextResponse } from "next/server";
import { solarToLunar, lunarToSolar, calculateSaju } from "@fullstackfamily/manseryeok";

export async function POST(req: NextRequest) {
  const { birthYear, birthMonth, birthDay, birthHour, unknownHour, isLunar, isLeapMonth, targetDate } = await req.json();

  // 입력값 검증
  if (!birthYear || !birthMonth || !birthDay) {
    return NextResponse.json({ error: "생년월일을 모두 입력해주세요." }, { status: 400 });
  }

  if (typeof targetDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    return NextResponse.json({ error: "운세 날짜(targetDate)는 YYYY-MM-DD 형식이어야 해요." }, { status: 400 });
  }

  const year = Number(birthYear);
  const month = Number(birthMonth);
  const day = Number(birthDay);

  if (year < 1900 || year > 2050) {
    return NextResponse.json({ error: "지원 범위는 1900~2050년이에요." }, { status: 400 });
  }

  // 음력이면 양력으로 변환
  let solarYear = year;
  let solarMonth = month;
  let solarDay = day;

  // 음력 → 양력 변환.
  // 윤달은 호출자가 isLeapMonth로 명시해야 한다. 평달과 윤달은 양력 날짜가 한 달가량 차이나므로
  // "평달로 해보고 실패하면 윤달로 재시도"는 사용자 의도와 무관한 날짜를 만들어낸다.
  // lunarToSolar는 윤달이 없는 달에 isLeapMonth=true를 주면 InvalidDateError를 던진다.
  const wantsLeapMonth = Boolean(isLeapMonth);
  if (isLunar) {
    try {
      const converted = lunarToSolar(year, month, day, wantsLeapMonth);
      solarYear = converted.solar.year;
      solarMonth = converted.solar.month;
      solarDay = converted.solar.day;
    } catch {
      if (wantsLeapMonth) {
        return NextResponse.json({
          error: `음력 ${year}년에는 윤${month}월이 없어요. '윤달이에요' 체크를 해제하고 다시 시도해주세요.`
        }, { status: 400 });
      }
      return NextResponse.json({
        error: "이 날짜는 음력 변환이 어려워요. 네이버 '음양력변환'에서 양력으로 변환 후 양력으로 입력해주세요."
      }, { status: 400 });
    }
  }

  // 오늘 일진 계산
  const [tYear, tMonth, tDay] = targetDate.split("-").map(Number);
  const dayInfo = solarToLunar(tYear, tMonth, tDay);

  // 사주 계산
  const saju = unknownHour
    ? calculateSaju(solarYear, solarMonth, solarDay, 0, 0)
    : calculateSaju(solarYear, solarMonth, solarDay, Number(birthHour) || 0, 0);

  return NextResponse.json({
    dayPillar: dayInfo.gapja.dayPillar,
    monthPillar: dayInfo.gapja.monthPillar,
    yearPillar: dayInfo.gapja.yearPillar,
    unknownHour,
    isLunar,
    convertedSolar: isLunar ? { year: solarYear, month: solarMonth, day: solarDay } : null,
    saju: {
      year: saju.yearPillar,
      month: saju.monthPillar,
      day: saju.dayPillar,
      hour: unknownHour ? "-" : saju.hourPillar,
    }
  });
}