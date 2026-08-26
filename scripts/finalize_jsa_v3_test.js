/**
 * JSA_DB V3 테스트 데이터 최종 보정 스크립트
 *
 * 입력:
 *   data/jsa_database_v3_test.json
 *
 * 출력:
 *   data/jsa_database_v3_test.final.json
 *
 * 주의:
 * - 운영 data/jsa_database.json은 수정하지 않습니다.
 * - 원본 테스트 파일도 직접 덮어쓰지 않습니다.
 */

const fs = require("fs");
const path = require("path");

const inputPath = path.resolve(
  process.cwd(),
  "data/jsa_database_v3_test.json"
);

const outputPath = path.resolve(
  process.cwd(),
  "data/jsa_database_v3_test.final.json"
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function findJsa(database, jsaId) {
  const jsa = database.find((item) => item.jsaId === jsaId);

  assert(jsa, `JSA를 찾을 수 없습니다: ${jsaId}`);

  return jsa;
}

function findHazard(jsa, hazardId) {
  const hazard = jsa.hazards.find((item) => item.hazardId === hazardId);

  assert(
    hazard,
    `위험요인을 찾을 수 없습니다: ${jsa.jsaId}/${hazardId}`
  );

  return hazard;
}

function findMeasure(jsa, measureId) {
  const measure = jsa.measures.find((item) => item.measureId === measureId);

  assert(
    measure,
    `안전대책을 찾을 수 없습니다: ${jsa.jsaId}/${measureId}`
  );

  return measure;
}

function unique(values) {
  return [...new Set(values)];
}

function addSourceDocument(jsa, sourceDocument) {
  if (!Array.isArray(jsa.sourceDocuments)) {
    jsa.sourceDocuments = [];
  }

  const existing = jsa.sourceDocuments.find(
    (item) => item.sourceId === sourceDocument.sourceId
  );

  if (!existing) {
    jsa.sourceDocuments.push(sourceDocument);
  }
}

function moveMissingMeasureToReviewNote(jsa, missingText, reviewNote) {
  if (!jsa.quality) {
    return;
  }

  if (Array.isArray(jsa.quality.missingCriticalMeasures)) {
    jsa.quality.missingCriticalMeasures =
      jsa.quality.missingCriticalMeasures.filter(
        (item) => item !== missingText
      );
  }

  if (!Array.isArray(jsa.quality.reviewNotes)) {
    jsa.quality.reviewNotes = [];
  }

  if (!jsa.quality.reviewNotes.includes(reviewNote)) {
    jsa.quality.reviewNotes.push(reviewNote);
  }
}

function normalizeCommonFields(jsa) {
  jsa.schemaVersion = 3;

  if (!jsa.metadata) {
    jsa.metadata = {};
  }

  jsa.metadata.status = "review";

  for (const hazard of jsa.hazards || []) {
    hazard.reviewStatus = "review";

    if (hazard.source === "AI") {
      hazard.aiGenerated = true;
    }
  }

  for (const measure of jsa.measures || []) {
    measure.reviewStatus = "review";

    if (measure.source === "AI") {
      measure.aiGenerated = true;
    }
  }

  if (!jsa.quality) {
    jsa.quality = {};
  }

  if (!Array.isArray(jsa.quality.missingCriticalMeasures)) {
    jsa.quality.missingCriticalMeasures = [];
  }

  if (!Array.isArray(jsa.quality.reviewNotes)) {
    jsa.quality.reviewNotes = [];
  }
}

function applySourceDocuments(jsa) {
  const sourceDefinitions = {
    WRK: {
      sourceId: "WRK",
      sourceType: "workRecord",
      name: "작업 원문",
      version: "",
      verified: false,
      reviewStatus: "review"
    },
    INT: {
      sourceId: "INT",
      sourceType: "internalStandard",
      name: "사내 안전기준",
      version: "",
      verified: false,
      reviewStatus: "review"
    },
    ACC: {
      sourceId: "ACC",
      sourceType: "accidentCase",
      name: "재해사례 원문",
      version: "",
      verified: false,
      reviewStatus: "review"
    },
    NMS: {
      sourceId: "NMS",
      sourceType: "nearMissCase",
      name: "아차사고 원문",
      version: "",
      verified: false,
      reviewStatus: "review"
    },
    AI: {
      sourceId: "AI",
      sourceType: "aiGenerated",
      name: "AI 보완안",
      version: "",
      verified: false,
      reviewStatus: "review"
    }
  };

  const usedSources = new Set();

  for (const hazard of jsa.hazards || []) {
    if (hazard.source) {
      usedSources.add(hazard.source);
    }
  }

  for (const measure of jsa.measures || []) {
    if (measure.source) {
      usedSources.add(measure.source);
    }
  }

  for (const sourceId of usedSources) {
    const sourceDocument = sourceDefinitions[sourceId];

    assert(
      sourceDocument,
      `${jsa.jsaId}: 정의되지 않은 source가 있습니다: ${sourceId}`
    );

    addSourceDocument(jsa, { ...sourceDocument });
  }
}

function applyHighRiskCandidates(database) {
  const settings = {
    "JSA-WRK-000001": {
      status: "candidate",
      types: ["밀폐공간"],
      reason: "밀폐공간 내부 진입과 산소결핍·유해가스 위험이 확인되나 현장 지정 및 허가조건 확인이 필요함"
    },
    "JSA-WRK-000002": {
      status: "candidate",
      types: ["화기작업", "고소작업"],
      reason: "용접 화기와 상부 작업이 포함되며 화기허가 및 실제 작업높이 확인이 필요함"
    },
    "JSA-WRK-000003": {
      status: "candidate",
      types: ["전기작업"],
      reason: "히터 충전부 접촉 위험이 있으며 전압과 작업범위 확인이 필요함"
    },
    "JSA-WRK-000008": {
      status: "candidate",
      types: ["고소작업"],
      reason: "고소작업대 탑승 작업이 포함되며 장비·작업높이·지반조건 확인이 필요함"
    },
    "JSA-WRK-000012": {
      status: "candidate",
      types: ["중량물작업", "양중작업", "전기작업"],
      reason: "중량물 인양과 히터 결선이 포함되며 중량·정격하중·전압 확인이 필요함"
    },
    "JSA-WRK-000006": {
      status: "candidate",
      types: ["화학물질작업"],
      reason: "가성소다와 황산코발트 잔류액 노출 가능성이 있으며 물질별 작업기준 확인이 필요함"
    },
    "JSA-ACC-000082": {
      status: "candidate",
      types: ["시험가동", "기계설비작업"],
      reason: "시험가동 중 가동부 끼임 위험이 있으며 공식 재발방지대책과 시험가동 절차 확인이 필요함"
    },
    "JSA-NMS-000081": {
      status: "unknown",
      types: ["승강기 비상대응"],
      reason: "승강기 갇힘 비상대응 사례이나 JSA 고위험 작업 분류 기준 적용 여부를 추가 확인해야 함"
    },
    "JSA-INT-000077": {
      status: "candidate",
      types: ["화기작업", "가스용접·용단"],
      reason: "산소 및 가연성가스를 사용하는 용접·용단 설비 기준으로 실제 작업 적용 여부 확인이 필요함"
    },
    "JSA-INT-000078": {
      status: "candidate",
      types: ["화학물질작업", "분진작업"],
      reason: "수산화리튬 분진·접촉·수분반응 위험이 있으며 물질 상태와 MSDS 확인이 필요함"
    }
  };

  for (const jsa of database) {
    const setting = settings[jsa.jsaId];

    assert(
      setting,
      `${jsa.jsaId}: highRiskCandidate 설정이 없습니다.`
    );

    jsa.highRiskCandidate = {
      status: setting.status,
      types: setting.types,
      reason: setting.reason,
      reviewStatus: "review"
    };
  }
}

function fixJsaWrk000006(database) {
  const jsa = findJsa(database, "JSA-WRK-000006");
  const hazard = findHazard(jsa, "H02");

  // 방류턱·넘어짐 위험은 원문에 존재함
  hazard.source = "WRK";
  hazard.aiGenerated = false;
  hazard.reviewStatus = "review";

  if (
    !jsa.quality.reviewNotes.includes(
      "방류턱 통행 위험은 작업 원문 기반이며 M08 대책만 AI 보완"
    )
  ) {
    jsa.quality.reviewNotes.push(
      "방류턱 통행 위험은 작업 원문 기반이며 M08 대책만 AI 보완"
    );
  }

  moveMissingMeasureToReviewNote(
    jsa,
    "잔류압력 제거·비상세안·누출 회수 및 폐기 확인",
    "잔류압력 제거, 비상세안, 누출 회수·폐기 절차의 현장 적용 여부 확인"
  );
}

function fixJsaInt000077(database) {
  const jsa = findJsa(database, "JSA-INT-000077");
  const directionMeasure = findMeasure(jsa, "M04");
  const leakageMeasure = findMeasure(jsa, "M05");

  // 설치방향 확인은 AI 보완
  directionMeasure.source = "AI";
  directionMeasure.aiGenerated = true;
  directionMeasure.reviewStatus = "review";

  // 누설점검은 사내기준 원문
  leakageMeasure.source = "INT";
  leakageMeasure.aiGenerated = false;
  leakageMeasure.reviewStatus = "review";

  jsa.detailedMeasures =
    "1. [사내] 산소 압력조정기 후단 설치 / " +
    "2. [사내] 가연성가스 압력조정기 후단 설치 / " +
    "3. [사내] 취관·호스 사이 설치 / " +
    "4. [AI] 설치방향 확인 / " +
    "5. [사내] 누설점검 실시 / " +
    "6. [사내] 전용 클립 사용";

  jsa.quality.reviewNotes = jsa.quality.reviewNotes.filter(
    (note) =>
      note !== "기존 AI 항목 중 설치방향·누설점검을 INT 후보로 재분류"
  );

  if (
    !jsa.quality.reviewNotes.includes(
      "역화방지기 설치방향은 AI 보완이며 누설점검은 INT 원문 기반"
    )
  ) {
    jsa.quality.reviewNotes.push(
      "역화방지기 설치방향은 AI 보완이며 누설점검은 INT 원문 기반"
    );
  }

  moveMissingMeasureToReviewNote(
    jsa,
    "용기 전도방지·보호캡·유효기간 확인",
    "용기 전도방지, 보호캡 및 검사·유효기간 관련 사내기준 적용 여부 확인"
  );
}

function fixJsaWrk000012(database) {
  const jsa = findJsa(database, "JSA-WRK-000012");
  const hazard = findHazard(jsa, "H03");
  const originalMeasure = findMeasure(jsa, "M04");

  // 원문 인양줄 확인
  originalMeasure.text = "인양줄의 손상 및 체결상태 확인";
  originalMeasure.standardName = "인양줄 확인";
  originalMeasure.source = "WRK";
  originalMeasure.hierarchy = "administrative";
  originalMeasure.controlFunction = "inspection";
  originalMeasure.required = true;
  originalMeasure.conditions = ["중량물 인양 전"];
  originalMeasure.verificationMethod =
    "인양줄의 손상·변형 및 체결상태 확인";
  originalMeasure.relatedHazardIds = ["H03"];
  originalMeasure.aiGenerated = false;
  originalMeasure.reviewStatus = "review";

  // 사내기준 줄걸이 용구 점검
  if (!jsa.measures.some((measure) => measure.measureId === "M08")) {
    jsa.measures.push({
      measureId: "M08",
      text: "줄걸이 용구의 인증·정격하중 및 손상 여부 점검",
      standardName: "줄걸이 용구 점검",
      source: "INT",
      hierarchy: "administrative",
      controlFunction: "inspection",
      required: true,
      conditions: ["중량물 인양 전 줄걸이 용구를 사용하는 경우"],
      verificationMethod:
        "인양줄·샤클·훅의 인증, WLL 또는 SWL, 손상 및 체결상태 확인",
      relatedHazardIds: ["H03"],
      aiGenerated: false,
      reviewStatus: "review"
    });
  }

  hazard.relatedMeasureIds = unique([
    ...hazard.relatedMeasureIds,
    "M08"
  ]);

  jsa.detailedMeasures =
    "1. 작업구역 설정 / " +
    "2. 신호수 배치 / " +
    "3. 지그 조립상태 확인 / " +
    "4. 인양줄 확인 / " +
    "5. 유도줄 설치 / " +
    "6. 결선 전 검전 / " +
    "7. ILS 실시 / " +
    "8. [사내] 줄걸이 용구 인증·정격하중·손상 점검";

  jsa.standardMeasures =
    "1. 작업구역 설정 / " +
    "2. 신호수 / " +
    "3. 지그 확인 / " +
    "4. 인양줄 확인 / " +
    "5. 유도줄 / " +
    "6. 검전 / " +
    "7. ILS 실시 / " +
    "8. 줄걸이 용구 점검";

  if (
    !jsa.quality.reviewNotes.includes(
      "M04는 원문 인양줄 확인, M08은 사내기준 줄걸이 용구 점검으로 분리"
    )
  ) {
    jsa.quality.reviewNotes.push(
      "M04는 원문 인양줄 확인, M08은 사내기준 줄걸이 용구 점검으로 분리"
    );
  }

  moveMissingMeasureToReviewNote(
    jsa,
    "인양물 중량·무게중심 및 장비 정격하중 확인",
    "인양물 중량·무게중심과 인양장비 정격하중 확인 필요"
  );
}

function fixJsaInt000078(database) {
  const jsa = findJsa(database, "JSA-INT-000078");
  const contactHazard = findHazard(jsa, "H02");
  const moistureHazard = findHazard(jsa, "H03");
  const contaminationMeasure = findMeasure(jsa, "M06");
  const moistureMeasure = findMeasure(jsa, "M08");

  // 오염구역·작업복 관리는 접촉·오염 확산 위험과 연결
  contaminationMeasure.relatedHazardIds = ["H02"];

  contactHazard.relatedMeasureIds = unique([
    ...contactHazard.relatedMeasureIds,
    "M06"
  ]);

  // 수분반응 위험에서는 오염구역 관리 연결 제거
  moistureHazard.relatedMeasureIds =
    moistureHazard.relatedMeasureIds.filter(
      (measureId) => measureId !== "M06"
    );

  // 수분반응 위험에 직접 대응하는 AI 대책으로 변경
  moistureMeasure.text =
    "무수 수산화리튬의 수분 접촉을 방지하고 설비·도구를 건조 상태로 유지";
  moistureMeasure.standardName = "수분 접촉 방지·건조 유지";
  moistureMeasure.source = "AI";
  moistureMeasure.hierarchy = "engineering";
  moistureMeasure.controlFunction = "isolation";
  moistureMeasure.required = true;
  moistureMeasure.conditions = [
    "무수 수산화리튬의 보관·취급·청소 작업"
  ];
  moistureMeasure.verificationMethod =
    "보관용기 밀폐상태, 수분 유입 가능성 및 설비·도구의 건조상태 확인";
  moistureMeasure.relatedHazardIds = ["H03"];
  moistureMeasure.aiGenerated = true;
  moistureMeasure.reviewStatus = "review";

  moistureHazard.relatedMeasureIds = unique([
    ...moistureHazard.relatedMeasureIds,
    "M08"
  ]);

  // 누출·오염 대응은 별도 AI 대책으로 분리
  if (!jsa.measures.some((measure) => measure.measureId === "M09")) {
    jsa.measures.push({
      measureId: "M09",
      text: "물질별 MSDS에 따른 누출 회수·청소 및 폐기방법 적용",
      standardName: "물질별 누출·폐기 대응",
      source: "AI",
      hierarchy: "administrative",
      controlFunction: "emergencyResponse",
      required: true,
      conditions: ["수산화리튬 누출 또는 작업구역 오염 발생 시"],
      verificationMethod:
        "MSDS, 누출대응 절차, 회수장비 및 폐기방법 확인",
      relatedHazardIds: ["H01", "H02"],
      aiGenerated: true,
      reviewStatus: "review"
    });
  }

  const inhalationHazard = findHazard(jsa, "H01");

  inhalationHazard.relatedMeasureIds = unique([
    ...inhalationHazard.relatedMeasureIds,
    "M09"
  ]);

  contactHazard.relatedMeasureIds = unique([
    ...contactHazard.relatedMeasureIds,
    "M09"
  ]);

  jsa.detailedMeasures =
    "1. [사내] 양압식 마스크 착용 / " +
    "2. [사내] 화학물질용 보호복 착용 / " +
    "3. [사내] 화학물질용 안전장갑 착용 / " +
    "4. [사내] 화학물질용 안전화 착용 / " +
    "5. [AI] 노출구역 출입관리 / " +
    "6. [사내] 오염구역·작업복·안전화 구분 및 오염 제거 / " +
    "7. [AI] 수분 접촉 방지 및 설비·도구 건조 유지 / " +
    "8. [AI] MSDS에 따른 누출 회수·청소·폐기";

  jsa.standardMeasures =
    "1. 양압식 마스크 / " +
    "2. 화학물질용 보호복 / " +
    "3. 화학물질용 안전장갑 / " +
    "4. 화학물질용 안전화 / " +
    "5. 출입관리 / " +
    "6. 오염구역·보호구 관리 / " +
    "7. 수분 접촉 방지·건조 유지 / " +
    "8. 누출·폐기 대응";

  jsa.quality.adequacyReason =
    "분진·접촉 노출 대책과 수분반응 방지 대책을 분리했으며 AI 보완 대책은 검토 상태로 유지함";

  jsa.quality.missingCriticalMeasures = [
    "비상세안·샤워설비 적용 여부 및 공식 물질별 누출·폐기절차 확인"
  ];

  if (
    !jsa.quality.reviewNotes.includes(
      "M06 오염구역 관리는 H02 접촉·오염 위험에만 연결"
    )
  ) {
    jsa.quality.reviewNotes.push(
      "M06 오염구역 관리는 H02 접촉·오염 위험에만 연결"
    );
  }

  if (
    !jsa.quality.reviewNotes.includes(
      "M08 수분 접촉 방지·건조 유지와 M09 누출·폐기 대응은 AI 보완"
    )
  ) {
    jsa.quality.reviewNotes.push(
      "M08 수분 접촉 방지·건조 유지와 M09 누출·폐기 대응은 AI 보완"
    );
  }
}

function reorganizeReviewItems(database) {
  const moves = [
    {
      jsaId: "JSA-WRK-000001",
      missing:
        "유입원 차단 및 비상구조 절차 적용 여부 확인",
      note:
        "유입원 차단 및 비상구조 절차의 현장 적용 여부 확인"
    },
    {
      jsaId: "JSA-WRK-000002",
      missing:
        "가연성가스 측정 및 환기 적용 여부 확인",
      note:
        "가연성가스 측정 및 환기 필요 여부를 작업환경과 화기기준에 따라 확인"
    },
    {
      jsaId: "JSA-WRK-000003",
      missing:
        "무전압 확인 출처 및 세부 확인방법 검토",
      note:
        "무전압 확인은 AI 보완이므로 출처와 세부 확인방법 검토"
    },
    {
      jsaId: "JSA-WRK-000008",
      missing:
        "고소작업대 비상하강·지반·아웃트리거 기준 확인",
      note:
        "고소작업대 비상하강, 지반 및 아웃트리거 적용조건 확인"
    },
    {
      jsaId: "JSA-ACC-000082",
      missing:
        "공식 재발방지대책 및 시험가동 절차 확인",
      note:
        "공식 재발방지대책과 시험가동 절차 원문 확인 필요"
    },
    {
      jsaId: "JSA-NMS-000081",
      missing:
        "승강기 유지관리 기준 및 공식 구조절차 확인",
      note:
        "승강기 유지관리 기준과 공식 구조절차 확인 필요"
    }
  ];

  for (const move of moves) {
    const jsa = findJsa(database, move.jsaId);

    moveMissingMeasureToReviewNote(
      jsa,
      move.missing,
      move.note
    );
  }
}

function validateDatabase(database) {
  const allowedHighRiskStates = new Set([
    "candidate",
    "confirmed",
    "notApplicable",
    "unknown"
  ]);

  assert(Array.isArray(database), "루트 데이터는 배열이어야 합니다.");
  assert(database.length === 10, `JSA는 10건이어야 합니다: ${database.length}`);

  const jsaIds = new Set();

  for (const jsa of database) {
    assert(jsa.jsaId, "jsaId가 없는 레코드가 있습니다.");
    assert(!jsaIds.has(jsa.jsaId), `중복 jsaId: ${jsa.jsaId}`);
    jsaIds.add(jsa.jsaId);

    assert(
      jsa.metadata?.status === "review",
      `${jsa.jsaId}: metadata.status는 review여야 합니다.`
    );

    assert(
      Array.isArray(jsa.sourceDocuments) &&
        jsa.sourceDocuments.length > 0,
      `${jsa.jsaId}: sourceDocuments가 없습니다.`
    );

    assert(
      allowedHighRiskStates.has(jsa.highRiskCandidate?.status),
      `${jsa.jsaId}: highRiskCandidate 상태가 잘못됐습니다.`
    );

    const sourceIds = new Set(
      jsa.sourceDocuments.map((item) => item.sourceId)
    );

    const hazardIds = new Set();
    const measureIds = new Set();

    for (const hazard of jsa.hazards || []) {
      assert(
        !hazardIds.has(hazard.hazardId),
        `${jsa.jsaId}: 중복 hazardId ${hazard.hazardId}`
      );

      hazardIds.add(hazard.hazardId);

      assert(
        sourceIds.has(hazard.source),
        `${jsa.jsaId}/${hazard.hazardId}: sourceDocuments에 없는 source ${hazard.source}`
      );

      assert(
        hazard.source !== "AI" || hazard.aiGenerated === true,
        `${jsa.jsaId}/${hazard.hazardId}: AI 출처와 aiGenerated 불일치`
      );

      assert(
        hazard.source === "AI" || hazard.aiGenerated !== true,
        `${jsa.jsaId}/${hazard.hazardId}: 비AI 출처인데 aiGenerated가 true`
      );

      assert(
        hazard.reviewStatus === "review",
        `${jsa.jsaId}/${hazard.hazardId}: reviewStatus 오류`
      );
    }

    for (const measure of jsa.measures || []) {
      assert(
        !measureIds.has(measure.measureId),
        `${jsa.jsaId}: 중복 measureId ${measure.measureId}`
      );

      measureIds.add(measure.measureId);

      assert(
        sourceIds.has(measure.source),
        `${jsa.jsaId}/${measure.measureId}: sourceDocuments에 없는 source ${measure.source}`
      );

      assert(
        measure.source !== "AI" || measure.aiGenerated === true,
        `${jsa.jsaId}/${measure.measureId}: AI 출처와 aiGenerated 불일치`
      );

      assert(
        measure.source === "AI" || measure.aiGenerated !== true,
        `${jsa.jsaId}/${measure.measureId}: 비AI 출처인데 aiGenerated가 true`
      );

      assert(
        measure.reviewStatus === "review",
        `${jsa.jsaId}/${measure.measureId}: reviewStatus 오류`
      );
    }

    for (const hazard of jsa.hazards || []) {
      for (const measureId of hazard.relatedMeasureIds || []) {
        assert(
          measureIds.has(measureId),
          `${jsa.jsaId}/${hazard.hazardId}: 존재하지 않는 measureId ${measureId}`
        );

        const measure = findMeasure(jsa, measureId);

        assert(
          measure.relatedHazardIds.includes(hazard.hazardId),
          `${jsa.jsaId}: 단방향 참조 ${hazard.hazardId} -> ${measureId}`
        );
      }
    }

    for (const measure of jsa.measures || []) {
      for (const hazardId of measure.relatedHazardIds || []) {
        assert(
          hazardIds.has(hazardId),
          `${jsa.jsaId}/${measure.measureId}: 존재하지 않는 hazardId ${hazardId}`
        );

        const hazard = findHazard(jsa, hazardId);

        assert(
          hazard.relatedMeasureIds.includes(measure.measureId),
          `${jsa.jsaId}: 단방향 참조 ${measure.measureId} -> ${hazardId}`
        );
      }
    }

    const unlinkedHazards = (jsa.hazards || []).filter(
      (hazard) => !hazard.relatedMeasureIds?.length
    ).length;

    const unlinkedMeasures = (jsa.measures || []).filter(
      (measure) => !measure.relatedHazardIds?.length
    ).length;

    jsa.quality.unlinkedHazardCount = unlinkedHazards;
    jsa.quality.unlinkedMeasureCount = unlinkedMeasures;

    assert(
      unlinkedHazards === 0,
      `${jsa.jsaId}: 연결되지 않은 위험요인이 있습니다.`
    );

    assert(
      unlinkedMeasures === 0,
      `${jsa.jsaId}: 연결되지 않은 대책이 있습니다.`
    );
  }
}

function main() {
  assert(
    fs.existsSync(inputPath),
    `입력 파일이 없습니다: ${inputPath}`
  );

  const sourceText = fs.readFileSync(inputPath, "utf8");
  const database = JSON.parse(sourceText);

  assert(
    Array.isArray(database),
    "data/jsa_database_v3_test.json의 루트는 배열이어야 합니다."
  );

  assert(
    database.length === 10,
    `대표 JSA가 10건이 아닙니다: ${database.length}건`
  );

  for (const jsa of database) {
    normalizeCommonFields(jsa);
  }

  fixJsaWrk000006(database);
  fixJsaInt000077(database);
  fixJsaWrk000012(database);
  fixJsaInt000078(database);
  reorganizeReviewItems(database);
  applyHighRiskCandidates(database);

  // 개별 수정이 끝난 뒤 실제 사용 출처를 기준으로 생성
  for (const jsa of database) {
    jsa.sourceDocuments = [];
    applySourceDocuments(jsa);
  }

  validateDatabase(database);

  fs.writeFileSync(
    outputPath,
    JSON.stringify(database, null, 2) + "\n",
    "utf8"
  );

  console.log("JSA_DB V3 테스트 파일 생성 및 검증 완료");
  console.log(`입력: ${inputPath}`);
  console.log(`출력: ${outputPath}`);
  console.log(`JSA 수: ${database.length}`);
  console.log("metadata.status: 전체 review");
  console.log("ID 및 양방향 참조: PASS");
  console.log("AI 출처 정합성: PASS");
  console.log("sourceDocuments: PASS");
  console.log("highRiskCandidate: PASS");
}

main();
