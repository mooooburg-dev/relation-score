import { GoogleGenAI, Type, ApiError } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GENAI_API_KEY });

// 관계 유형별 분석 포커스
const RELATION_FOCUS: Record<string, string> = {
  연인: "설렘, 애정 표현, 다툼 후 화해, 장기적 안정감",
  친구: "취향 공유, 같이 노는 케미, 솔직함, 오래가는 우정",
  직장동료: "협업 스타일, 거리감, 회식 케미, 업무 외 친밀도",
  가족: "이해와 갈등, 잔소리 내성, 정서적 지지, 명절 케미",
  소개팅: "첫인상, 대화 흐름, 애프터 가능성, 다음 만남 기대치",
  썸: "밀당, 연락 빈도, 진도 속도, 고백 타이밍",
};

interface Person {
  mbti: string;
  gender?: string;
  age?: string;
  blood?: string;
  star?: string;
}

interface AnalyzeBody {
  myMbti: string;
  myGender?: string;
  myAge?: string;
  myBlood?: string;
  myStar?: string;
  otherMbti: string;
  otherGender?: string;
  otherAge?: string;
  otherBlood?: string;
  otherStar?: string;
  relation: string;
}

// 입력 한 사람을 한 줄 텍스트로 정리
function describePerson(label: string, p: Person) {
  const parts = [
    `MBTI ${p.mbti}`,
    p.gender && `성별 ${p.gender}`,
    p.age && `나이 ${p.age}`,
    p.blood && `혈액형 ${p.blood}`,
    p.star && `별자리 ${p.star}`,
  ].filter(Boolean);
  return `${label}: ${parts.join(", ")}`;
}

// 구조화 출력 스키마 (점수 범위는 프롬프트로 안내)
const RESULT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER, description: "총 궁합 점수 0~100" },
    tag: { type: Type.STRING, description: "한 줄 제목, B급 감성" },
    summary: { type: Type.STRING, description: "2~3문장 밈 느낌 분석" },
    mbti_score: { type: Type.INTEGER, description: "MBTI 궁합 0~100" },
    comm_score: { type: Type.INTEGER, description: "소통 스타일 0~100" },
    emotion_score: { type: Type.INTEGER, description: "감성 케미 0~100" },
    longterm_score: { type: Type.INTEGER, description: "장기 관계 0~100" },
  },
  required: [
    "score",
    "tag",
    "summary",
    "mbti_score",
    "comm_score",
    "emotion_score",
    "longterm_score",
  ],
  propertyOrdering: [
    "score",
    "tag",
    "summary",
    "mbti_score",
    "comm_score",
    "emotion_score",
    "longterm_score",
  ],
};

export async function POST(request: Request) {
  let body: AnalyzeBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식이야" }, { status: 400 });
  }

  if (!body.myMbti || !body.otherMbti || !body.relation) {
    return Response.json(
      { error: "MBTI랑 관계 유형은 필수야" },
      { status: 400 },
    );
  }

  const me: Person = {
    mbti: body.myMbti,
    gender: body.myGender,
    age: body.myAge,
    blood: body.myBlood,
    star: body.myStar,
  };
  const other: Person = {
    mbti: body.otherMbti,
    gender: body.otherGender,
    age: body.otherAge,
    blood: body.otherBlood,
    star: body.otherStar,
  };

  const focus = RELATION_FOCUS[body.relation] ?? "전반적인 케미";

  const prompt = `두 사람의 ${body.relation} 궁합을 분석해줘.

${describePerson("나", me)}
${describePerson("상대방", other)}

이 관계 유형(${body.relation})에서는 특히 다음을 중점적으로 봐: ${focus}

작성 지침:
- 톤은 B급 감성, 밈스럽고 가볍게. 절대 진지충처럼 굴지 마.
- tag는 짧고 임팩트 있는 한 줄 제목 (예: "이 조합 실화냐?", "운명까진 아니고 그냥 잘 맞음").
- summary는 2~3문장. 인터넷 밈/드립 느낌으로, 읽으면 피식하게.

점수는 도파민이 터지게 "극단적으로" 갈라줘. 애매한 중간 점수(50~70대)에 몰아넣지 말 것:
- 궁합이 좋은 조합이면 화끈하게 올려줘 (88~100, 진짜 잘 맞으면 99~100도 OK).
- 궁합이 안 좋은 조합이면 가차없이 깎아줘 (10~45, 답 없으면 한 자릿수도 OK).
- 0~100 범위를 넓고 과감하게 써. 비슷비슷한 점수만 나오면 노잼이야.
- 점수에 따라 텐션도 맞춰: 고득점이면 "소울메이트/운명" 급으로 띄워주고, 저득점이면 시원하게 팩폭·디스 날려.
- score는 4개 세부 점수를 종합한 총점이되, 좋으면 더 좋게 나쁘면 더 나쁘게 살짝 증폭해.
- 모든 점수는 0~100 사이 정수.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "너는 B급 감성의 MBTI 궁합 분석가야. 진지하지 않고 밈스럽게, 한국어로 답해.",
        responseMimeType: "application/json",
        responseSchema: RESULT_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) {
      return Response.json({ error: "분석 결과를 못 받았어" }, { status: 502 });
    }

    const result = JSON.parse(text);
    return Response.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("Gemini API error:", error.status, error.message);
    } else {
      console.error("analyze error:", error);
    }
    return Response.json(
      { error: "분석하다 삐끗했어. 다시 시도해줘" },
      { status: 500 },
    );
  }
}
