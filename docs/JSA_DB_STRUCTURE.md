# JSA_DB 구조 및 운영 규약

문서명: JSA_DB_STRUCTURE.md  
버전: 3.0  
상태: 설계 확정안  
작성 기준일: 2026-08-27  
적용 대상: JSA_DB, 위험성평가, 안전작업허가서, TBM  
최종 확정자: 현업 담당자 및 안전보건 담당자

---

## 1. 문서 목적

이 문서는 POSCO FM 포항양극재공장 안전관리 플랫폼에서 사용하는 JSA_DB의 데이터 구조와 운영 원칙을 정의합니다.

JSA_DB는 다음 자료를 통합하여 위험요인과 안전대책을 제공하는 안전 지식 데이터베이스입니다.

- 실제 작업 원문
- 작업계획서 및 WO 자료
- 법령 및 규정
- 사내 안전기준
- 작업표준서 및 SOP
- 기존 위험성평가 및 JSA
- 작업허가서
- TBM 자료
- 재해사례
- 아차사고
- 안전지적 및 개선권고
- KOSHA Guide 및 외부 기술자료
- AI 보완 위험요인 및 안전대책

JSA_DB의 주요 활용 목적은 다음과 같습니다.

- 유사 작업 검색
- 위험요인 후보 제시
- 사고시나리오 안내
- 안전대책 후보 제시
- 필수대책 누락 확인
- 통제수단 수준 검토
- 위험성평가 작성 지원
- 작업허가서 안전대책 연계
- TBM 핵심 위험 및 대책 전달
- 재해·아차사고 재발방지
- 감사 및 출처 추적

JSA_DB는 최종 작업 승인 도구가 아닙니다.

JSA_DB와 AI가 제시한 위험요인 및 안전대책은 현업 담당자와 안전보건 담당자가 검토한 후 실제 평가에 반영해야 합니다.

---

## 2. 데이터 운영 기본 원칙

JSA_DB는 다음 3개 계층으로 구분합니다.

### 2.1 원천자료 계층

TSV 15개 컬럼으로 관리합니다.

주요 목적:

- 원문 내용 보존
- 엑셀 누적관리
- AI 변환 결과 검토
- 출처 및 분류 확인
- JSON 변환 전 품질검사

### 2.2 안전 지식 DB 계층

검토가 완료된 TSV를 구조화 JSON으로 변환하여 관리합니다.

주요 목적:

- 위험요인 배열 관리
- 안전대책 배열 관리
- 위험요인과 안전대책 연결
- 출처 태그 관리
- 통제계층 관리
- 적용조건 및 필수 여부 관리
- 검색 및 추천
- 검토·승인·버전 관리

### 2.3 실제 위험성평가 계층

작업별 실제 위험성평가 결과를 별도로 관리합니다.

주요 목적:

- 현재 작업조건 반영
- 선택한 위험요인 관리
- 사용자 추가 위험요인 관리
- AI 보완 위험요인 관리
- 위험요인별 최초 위험도 평가
- 선택 안전대책 관리
- 위험요인별 잔여 위험도 평가
- 통제 적정성 판정
- 미해결 위험 관리
- 허가서와 TBM 연계

원천자료, 안전 지식 DB, 실제 위험성평가 기록을 서로 혼합하지 않습니다.

---

## 3. 전체 데이터 처리 흐름

JSA_DB 데이터는 다음 절차로 관리합니다.

1. 원본 자료 수집
2. 개인정보 및 보안정보 확인
3. JSA_DB 프롬프트를 이용하여 TSV 초안 생성
4. TSV 15개 컬럼 검증
5. 현업 및 안전보건 검토
6. 구조화 JSON 변환
7. jsaId 발급
8. 위험요인과 안전대책 연결 검토
9. 출처 및 통제계층 검토
10. 승인 처리
11. 승인된 자료만 검색 및 추천에 사용
12. 변경 시 새 버전 작성
13. 폐기 시 기존 자료를 삭제하지 않고 retired 상태로 변경

위험성평가 결과는 JSA_DB에 자동으로 직접 등록하지 않습니다.

위험성평가에서 새롭게 확인된 위험요인이나 대책은 다음 절차를 거칩니다.

1. JSA_DB 후보 등록
2. 검토 대기
3. 현업 검토
4. 안전보건 검토
5. 승인
6. JSA_DB 게시

---

## 4. TSV 원천자료 구조

TSV는 다음 15개 컬럼만 사용합니다.

1. 분류코드
2. 관리시트
3. 작업유형
4. 세부작업유형
5. 작업명
6. 작업단계
7. 사용장비·공구
8. 사용물질·에너지
9. 원문 위험요인
10. 사고유형
11. 사고시나리오
12. 안전대책
13. 표준 안전대책명
14. 통제 적정성
15. 비고

TSV 헤더는 다음 순서를 유지합니다.

    분류코드	관리시트	작업유형	세부작업유형	작업명	작업단계	사용장비·공구	사용물질·에너지	원문 위험요인	사고유형	사고시나리오	안전대책	표준 안전대책명	통제 적정성	비고

TSV에는 jsaId를 포함하지 않습니다.

TSV는 사람이 검토하기 위한 중간자료이며, 앱에서 직접 사용하는 최종 구조가 아닙니다.

---

## 5. 분류코드

JSA_DB는 다음 분류코드를 사용합니다.

| 코드 | 관리시트 | 의미 |
|---|---|---|
| LAW | 법령 | 법령·하위규정·고시 |
| INT | 사내 | 사내 안전기준·지침·절차 |
| SOP | 표준 | 작업표준서·SOP |
| JSA | JSA | 위험성평가·JSA Sheet |
| TBM | TBM | TBM·작업 전 위험예지 |
| PTW | 허가 | 안전작업허가서 |
| ACC | 재해 | 사고·재해사례 |
| NMS | 아차 | 아차사고·니어미스 |
| REC | 권고 | 지적·개선권고 |
| EXT | 외부 | KOSHA·제조사·외부자료 |
| WRK | 원문 | 실제 작업자료·WO |
| UNK | 미분류 | 출처 불명확 |

분류코드는 자료 전체의 주된 출처를 나타냅니다.

개별 위험요인과 안전대책은 별도의 source 필드를 사용하여 실제 출처를 기록합니다.

---

## 6. jsaId 발급 규칙

### 6.1 목적

jsaId는 JSA_DB의 각 자료를 유일하게 식별하는 영구 고유번호입니다.

다음 기능에 사용합니다.

- Firestore 문서 식별
- 위험성평가 참조
- 허가서 및 TBM 출처 추적
- 버전 관리
- 폐기 및 대체 자료 연결
- 중복 방지
- 감사 대응

### 6.2 형식

jsaId는 다음 형식을 사용합니다.

    JSA-{분류코드}-{6자리 순번}

예:

    JSA-WRK-000001
    JSA-ACC-000001
    JSA-NMS-000001
    JSA-INT-000001
    JSA-LAW-000001
    JSA-SOP-000001

### 6.3 발급 원칙

- AI는 TSV 생성 단계에서 jsaId를 생성하지 않습니다.
- TSV 검토가 완료된 후 JSON 변환 또는 등록 단계에서 발급합니다.
- `no`는 원본 행 번호로 유지합니다.
- `jsaId`는 시스템 고유번호로 사용합니다.
- jsaId는 최초 발급 후 변경하지 않습니다.
- 폐기된 jsaId를 재사용하지 않습니다.
- Firestore 문서 ID와 내부 jsaId를 동일하게 사용합니다.
- 동일 자료를 수정할 때는 기존 jsaId를 유지하고 버전을 증가시킵니다.
- 완전히 다른 자료로 분리할 때만 새 jsaId를 발급합니다.

분류코드가 승인 전에 변경되는 경우 jsaId를 다시 발급할 수 있습니다.

승인 후 분류 변경이 필요한 경우에는 기존 자료를 retired 처리하고 새 jsaId를 발급하는 것을 원칙으로 합니다.

---

## 7. 기존 앱 호환 필드

현재 위험성평가 v2가 평면형 JSON을 사용하므로, 구조화 JSON 전환 기간에는 다음 필드를 유지합니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| jsaId | string | 시스템 고유번호 |
| no | number 또는 string | 원본 번호 |
| classCode | string | 분류코드 |
| sheet | string | 관리시트 |
| workType | string | 대표 작업유형 |
| workSubType | string | 세부작업유형 |
| workName | string | 작업명 |
| workStage | string | 작업단계 |
| equipment | string | 장비·공구 원문 |
| materials | string | 물질·에너지·위험원 원문 |
| originalHazard | string | 통합 원문 위험요인 |
| accidentType | string | 통합 사고유형 |
| scenario | string | 대표 사고시나리오 |
| detailedMeasures | string | 상세 안전대책 원문 |
| standardMeasures | string | 표준 안전대책명 |
| controlAdequacy | string | ○, △, × |
| remark | string | 비고 |
| schemaVersion | number | 스키마 버전 |

기존 호환 필드는 구조화 필드가 안정될 때까지 삭제하지 않습니다.

현재 위험성평가 앱은 다음 필드를 사용합니다.

- workName
- workType
- workSubType
- workStage
- originalHazard
- accidentType
- detailedMeasures
- standardMeasures
- controlAdequacy
- classCode

구조화 JSON 적용 후에도 위 필드는 검색 및 하위 호환을 위해 일정 기간 유지합니다.

---

## 8. JSA_DB 구조화 JSON

JSA_DB의 정식 구조는 다음 영역으로 구성합니다.

    {
      "jsaId": "JSA-WRK-000001",
      "no": 1,
      "classCode": "WRK",
      "sheet": "원문",
      "workType": "전기작업",
      "workSubType": "히터 점검",
      "workName": "소성로 히터·히터박스 점검 및 조치",
      "workStage": "차단·점검·교체",
      "equipment": "히터, 전기판넬, 수공구",
      "materials": "1. 전기에너지 / 2. 고온 / 3. 수공구",
      "originalHazard": "히터 교체 중 감전 위험 / 히터 접촉 화상 위험 / 수공구 사용 손가락 끼임 위험",
      "accidentType": "감전/화상/끼임",
      "scenario": "전원 미차단 감전 가능",
      "detailedMeasures": "1. 전원 차단 및 ILS 실시 / 2. [AI] 무전압 확인",
      "standardMeasures": "1. 전원 차단 / 2. ILS 실시 / 3. 무전압 확인",
      "controlAdequacy": "○",
      "remark": "전기기준 확인 / AI 보완",
      "workInfo": {},
      "hazards": [],
      "measures": [],
      "quality": {},
      "metadata": {},
      "schemaVersion": 3
    }

평면형 호환 필드는 기존 앱을 위한 요약값입니다.

정식 위험성평가와 AI 검토는 hazards와 measures를 우선 사용합니다.

---

## 9. workInfo 구조

workInfo는 작업 검색과 적용조건 판단에 사용하는 구조화 정보입니다.

    {
      "primaryWorkType": "전기작업",
      "workTypes": ["전기작업", "정비작업"],
      "workSubType": "히터 점검",
      "workName": "소성로 히터·히터박스 점검 및 조치",
      "stages": ["차단", "점검", "교체"],
      "equipment": ["히터", "전기판넬", "수공구"],
      "materials": [],
      "energySources": ["전기에너지", "열에너지"],
      "riskSources": ["충전부", "고온부", "수공구"],
      "keywords": ["소성로", "히터", "히터박스", "교체", "감전"]
    }

### workInfo 필드 원칙

- primaryWorkType은 대표 작업유형입니다.
- workTypes는 복수 작업유형을 저장합니다.
- stages는 작업단계를 배열로 저장합니다.
- equipment는 장비와 공구를 배열로 저장합니다.
- materials는 화학물질 또는 사용물질을 저장합니다.
- energySources는 전기·기계·압력·열 등의 에너지원을 저장합니다.
- riskSources는 위험을 발생시키는 설비·조건·환경을 저장합니다.
- keywords는 검색용 키워드입니다.
- 검색용 키워드는 원문 의미를 변경하지 않습니다.

---

## 10. 위험요인 구조

위험요인은 hazards 배열로 관리합니다.

    {
      "hazardId": "H01",
      "text": "히터 교체 중 충전부 접촉 감전 위험",
      "standardName": "충전부 접촉 감전",
      "source": "WRK",
      "sourceText": "히터 교체 중 감전 위험",
      "stage": "교체",
      "energySources": ["전기에너지"],
      "riskSources": ["히터 충전부"],
      "accidentTypes": ["감전"],
      "scenario": "전원 미차단 감전 가능",
      "applicability": ["전기 정비", "히터 교체"],
      "relatedMeasureIds": ["M01", "M02", "M03"],
      "critical": true,
      "aiGenerated": false,
      "reviewStatus": "approved"
    }

### 위험요인 필수 필드

- hazardId
- text
- source
- accidentTypes
- scenario
- relatedMeasureIds
- aiGenerated
- reviewStatus

### hazardId 규칙

hazardId는 JSA 문서 내부에서만 사용하는 식별번호입니다.

형식:

    H01
    H02
    H03

hazardId는 jsaId와 함께 사용해야 고유하게 식별됩니다.

예:

    JSA-WRK-000001 / H01

### 위험요인 출처

source에는 다음 값 중 하나를 사용합니다.

- LAW
- INT
- SOP
- JSA
- TBM
- PTW
- ACC
- NMS
- REC
- EXT
- WRK
- AI
- USER

원문에서 직접 확인되지 않고 AI가 보완한 위험요인은 다음과 같이 저장합니다.

- source: AI
- aiGenerated: true
- reviewStatus: draft 또는 review

AI 위험요인을 원문 위험요인처럼 저장하지 않습니다.

---

## 11. 안전대책 구조

안전대책은 measures 배열로 관리합니다.

    {
      "measureId": "M01",
      "text": "전원 차단 및 ILS 실시",
      "standardName": "전원 차단 및 ILS 실시",
      "source": "WRK",
      "hierarchy": "administrative",
      "required": true,
      "applicability": ["전기 정비", "히터 교체"],
      "conditions": ["전기에너지가 존재하는 경우"],
      "verificationMethod": "차단점 및 잠금상태 현장 확인",
      "relatedHazardIds": ["H01"],
      "aiGenerated": false,
      "reviewStatus": "approved"
    }

### 안전대책 필수 필드

- measureId
- text
- standardName
- source
- hierarchy
- required
- relatedHazardIds
- aiGenerated
- reviewStatus

### measureId 규칙

measureId는 JSA 문서 내부에서만 사용하는 식별번호입니다.

형식:

    M01
    M02
    M03

measureId는 jsaId와 함께 사용해야 고유하게 식별됩니다.

예:

    JSA-WRK-000001 / M01

### 대책 출처

source에는 다음 값 중 하나를 사용합니다.

- LAW
- INT
- SOP
- JSA
- TBM
- PTW
- ACC
- NMS
- REC
- EXT
- WRK
- AI
- USER

태그가 없는 대책의 source를 무조건 WRK로 지정하지 않습니다.

태그가 없는 경우 자료 전체의 classCode와 실제 출처를 확인합니다.

예:

- WRK 원문에서 직접 확인된 대책 → WRK
- INT 자료에서 직접 확인된 대책 → INT
- ACC 재발방지대책 → ACC
- NMS 예방대책 → NMS
- 입력자료에 없는 AI 보완대책 → AI

---

## 12. 통제계층

각 안전대책에는 hierarchy를 저장합니다.

허용 값은 다음과 같습니다.

| 값 | 의미 |
|---|---|
| elimination | 제거 |
| substitution | 대체 |
| engineering | 공학적 대책 |
| administrative | 행정적 대책 |
| ppe | 개인보호구 |
| emergency | 비상대응 |
| unknown | 미분류 |

### 통제계층 적용 원칙

- 제거와 대체를 우선 검토합니다.
- 공학적 대책을 행정적 대책보다 우선 검토합니다.
- 개인보호구만으로 위험을 통제하지 않습니다.
- 개인보호구는 다른 통제수단을 보완하는 수단으로 사용합니다.
- 분류가 불명확하면 unknown으로 저장하고 검토 대상으로 표시합니다.
- 하나의 대책에 여러 통제 기능이 있으면 주된 통제계층을 저장합니다.

예:

- 위험설비 제거 → elimination
- 유해물질 대체 → substitution
- 방호덮개 설치 → engineering
- 환기설비 설치 → engineering
- ILS 실시 → administrative
- 출입통제 → administrative
- 작업절차 수립 → administrative
- 송기마스크 착용 → ppe
- 비상구조계획 → emergency

---

## 13. 위험요인과 안전대책 연결

모든 안전대책은 가능한 한 하나 이상의 위험요인과 연결합니다.

위험요인의 relatedMeasureIds와 대책의 relatedHazardIds는 서로 일치해야 합니다.

예:

    H01 감전 위험
      → M01 전원 차단 및 ILS 실시
      → M02 무전압 확인
      → M03 충전부 접근통제

    H02 고온부 접촉 화상 위험
      → M04 냉각상태 확인
      → M05 방열장갑 착용

### 연결 원칙

- 하나의 위험요인에 여러 대책을 연결할 수 있습니다.
- 하나의 대책을 여러 위험요인에 연결할 수 있습니다.
- 연결관계가 원문에서 불명확하면 임의 확정하지 않습니다.
- 불명확한 연결은 reviewStatus를 review로 설정합니다.
- 필수 위험에 연결된 필수대책은 검색 결과에서 우선 표시합니다.
- 위험요인과 연결되지 않은 대책은 검토 대상으로 표시합니다.
- 대책이 없는 위험요인은 미통제 위험으로 표시합니다.

---

## 14. 통제 적정성

JSA 자료의 통제 적정성은 다음 값만 사용합니다.

- ○
- △
- ×

### 판정 기준

#### ○ 적정

- 주요 위험요인에 대응하는 대책이 있음
- 제거·대체·공학적·행정적 대책이 적절히 포함됨
- PPE에만 의존하지 않음
- 필수대책이 누락되지 않음

#### △ 보완 필요

- 대책은 있으나 행정적 대책 또는 PPE 중심임
- 공학적 또는 상위 통제수단이 부족함
- 일부 필수대책의 적용 여부가 불명확함
- AI 보완대책의 검토가 필요함

#### × 미흡

- 핵심 안전대책이 없음
- PPE만 존재함
- 주요 위험에 연결된 대책이 없음
- 필수대책이 누락됨
- 입력자료가 부족하여 통제를 확인할 수 없음

통제 적정성은 법적 적합 판정 또는 위험도 등급이 아닙니다.

통제 적정성의 판정 사유는 quality.adequacyReason에 저장합니다.

---

## 15. quality 구조

quality는 데이터 품질과 검토 결과를 관리합니다.

    {
      "controlAdequacy": "△",
      "adequacyReason": "행정적 대책과 PPE 중심",
      "missingCriticalMeasures": ["무전압 확인"],
      "unlinkedHazardCount": 0,
      "unlinkedMeasureCount": 0,
      "sourceVerified": false,
      "terminologyVerified": true,
      "duplicateChecked": true,
      "qualityGrade": "B",
      "reviewNotes": ["전기기준 확인 필요"]
    }

### 품질 등급

| 등급 | 의미 |
|---|---|
| A | 출처·위험·대책·연결관계 검토 완료 |
| B | 기본 검토 완료, 일부 기준 확인 필요 |
| C | AI 변환 또는 원문 정리 단계 |
| D | 입력 부족 또는 출처 불명확 |

승인 검색자료는 원칙적으로 A 또는 B 등급만 사용합니다.

C와 D 등급은 일반 사용자 추천에서 제외하거나 검토 필요 자료로 별도 표시합니다.

---

## 16. metadata 구조

metadata는 출처, 버전, 승인 및 감사 정보를 관리합니다.

    {
      "status": "approved",
      "version": 1,
      "sourceDocumentName": "작업관리대장",
      "sourceDocumentVersion": "",
      "sourceWorkDate": "",
      "sourceVerifiedAt": "",
      "reviewedAt": "",
      "reviewedBy": "",
      "approvedAt": "",
      "approvedBy": "",
      "createdAt": "2026-08-27T09:00:00Z",
      "createdBy": "system",
      "updatedAt": "2026-08-27T09:00:00Z",
      "updatedBy": "system",
      "retiredAt": null,
      "retiredBy": null,
      "replacedByJsaId": null
    }

### 상태값

| 상태 | 의미 | 위험성평가 추천 |
|---|---|---|
| draft | 변환 초안 | 사용 금지 |
| review | 검토 중 | 별도 표시 |
| approved | 승인·활성 | 사용 가능 |
| retired | 폐기 | 사용 금지 |

위험성평가 기본 검색은 approved 상태만 사용합니다.

개발 단계의 기존 11건은 임시로 review 상태로 관리할 수 있습니다.

---

## 17. 위험도 정보 처리 원칙

JSA_DB의 과거 위험도는 현재 작업의 위험도로 자동 적용하지 않습니다.

같은 작업이라도 다음 조건에 따라 위험도가 달라질 수 있습니다.

- 작업 장소
- 작업 인원
- 설비 상태
- 작업시간
- 동시작업
- 비정상작업
- 사용물질
- 에너지 차단 상태
- 주변 가동설비
- 기상 및 환경조건

과거 위험도 정보가 있는 경우 참고정보로만 보존할 수 있습니다.

    {
      "historicalRiskReference": {
        "frequency": 2,
        "severity": 4,
        "score": 8,
        "note": "과거 평가 참고값",
        "autoApply": false
      }
    }

신규 위험성평가에서는 현재 작업조건에 따라 다시 평가합니다.

---

## 18. 위험성평가 연동 규칙

위험성평가에서는 다음 순서로 JSA_DB를 사용합니다.

1. 허가서 또는 작업DB에서 기본정보 불러오기
2. 작업명·작업유형·상세내용으로 유사 작업 검색
3. 작업단계·장비·물질·에너지원으로 추가 검색
4. 관련 사내기준 검색
5. 관련 재해·아차사고 검색
6. 위험요인 후보 통합
7. 중복 위험요인 제거
8. 사용자가 적용 위험요인 선택
9. 사용자 위험요인 추가
10. AI 보완 위험요인 별도 제시
11. 위험요인별 안전대책 연결
12. 위험요인별 최초 위험도 평가
13. 안전대책 적용
14. 위험요인별 잔여 위험도 평가
15. 통제 적정성 검토
16. 미해결 위험 확인
17. 사용자 최종 확인
18. 위험성평가 저장

AI가 제시한 위험요인과 대책은 자동으로 공식 평가에 포함하지 않습니다.

사용자가 선택하거나 승인한 항목만 공식 평가에 반영합니다.

---

## 19. 복수 JSA 참조

위험성평가는 여러 JSA 자료를 동시에 참조할 수 있습니다.

참조자료는 referencedJSAs 배열로 저장합니다.

    {
      "jsaId": "JSA-WRK-000001",
      "classCode": "WRK",
      "workName": "소성로 히터 점검 및 조치",
      "similarity": 0.85,
      "version": 1,
      "selectedHazardIds": ["H01", "H02"],
      "selectedMeasureIds": ["M01", "M02", "M04"],
      "referencedAt": "2026-08-27T09:30:00Z"
    }

참조할 수 있는 자료 예:

- 유사 실제 작업
- 사내기준
- 작업표준서
- 재해사례
- 아차사고
- 허가조건
- 외부 안전자료

기존 referencedJSA 단일 객체는 하위 호환을 위해 일정 기간 유지할 수 있습니다.

신규 구조에서는 referencedJSAs 배열을 우선 사용합니다.

---

## 20. 위험성평가 결과 구조

실제 위험성평가에서는 위험요인별 평가를 riskItems 배열로 관리합니다.

    {
      "riskItemId": "RI01",
      "hazardText": "히터 교체 중 충전부 접촉 감전 위험",
      "hazardSource": "JSA_DB",
      "sourceJsaId": "JSA-WRK-000001",
      "sourceHazardId": "H01",
      "stage": "교체",
      "accidentTypes": ["감전"],
      "scenario": "전원 미차단 감전 가능",
      "initialRisk": {
        "frequency": 3,
        "severity": 4,
        "score": 12,
        "level": "고위험"
      },
      "selectedMeasures": [],
      "residualRisk": {
        "frequency": 1,
        "severity": 4,
        "score": 4,
        "level": "저위험"
      },
      "controlAdequacy": "○",
      "adequacyReason": "ILS와 무전압 확인 적용",
      "unresolved": false,
      "actionOwner": "",
      "dueDate": ""
    }

종합 위험도는 riskItems의 결과를 바탕으로 계산합니다.

종합 위험도 산정 방식은 별도 위험성평가 규약에서 정의합니다.

---

## 21. 작업허가서 연동

위험성평가 완료 후 허가서에는 다음 요약정보를 반영합니다.

- riskId
- 종합 위험도 점수
- 종합 위험도 등급
- 통제 적정성
- 주요 위험요인
- 승인된 안전대책
- 미해결 위험 수
- 참조 JSA ID 목록
- AI 보완안 포함 여부
- 평가 완료 시각

상세 위험성평가 원본은 riskAssessments에 보존합니다.

허가서에는 상세 데이터를 무조건 복제하지 않고 요약정보와 riskId 참조를 저장합니다.

필수 안전대책을 개수 제한으로 삭제하지 않습니다.

---

## 22. TBM 연동

TBM에는 위험성평가에서 승인된 다음 정보를 반영합니다.

- 주요 위험요인
- 대표 사고시나리오
- 실행할 안전대책
- 작업단계
- 대책 담당자
- 현장 확인방법
- 작업중지 기준
- riskId
- 참조 jsaId
- 자동 채움 출처

위험성평가 결과가 변경되더라도 기존 TBM 내용을 자동으로 덮어쓰지 않습니다.

사용자가 `최신 위험성평가 다시 불러오기` 기능을 실행한 경우에만 갱신합니다.

같은 위험요인과 대책이 중복으로 추가되지 않도록 식별번호를 사용합니다.

---

## 23. 검색 원칙

JSA_DB 검색은 작업명만으로 수행하지 않습니다.

다음 항목을 종합하여 검색합니다.

- 작업명
- 대표 작업유형
- 복수 작업유형
- 세부작업유형
- 작업단계
- 작업 상세내용
- 설비·공구
- 사용물질
- 에너지원
- 위험원
- 사고유형
- 위험요인
- 검색 키워드

검색 결과는 다음 영역으로 구분하여 표시하는 것을 권장합니다.

1. 유사 작업
2. 관련 사내기준
3. 관련 작업표준
4. 관련 재해사례
5. 관련 아차사고
6. 관련 법령·외부기준
7. AI 보완 후보

검색 기본 대상은 다음 조건을 만족해야 합니다.

- metadata.status가 approved
- retired 상태가 아님
- quality.qualityGrade가 A 또는 B
- 현재 버전
- 출처와 적용조건이 확인됨

개발 단계에서는 review 상태 자료를 별도 표시하여 사용할 수 있으나 승인 자료와 구분해야 합니다.

---

## 24. AI 보완 정책

AI는 다음 기능을 수행할 수 있습니다.

- 누락 위험요인 제안
- 작업단계별 추가 위험 제안
- 에너지원 기반 위험 제안
- 재해·아차사고 유사 위험 경고
- 필수대책 누락 점검
- PPE 중심 대책 경고
- 상위 통제수단 제안
- 위험요인과 대책 연결 오류 점검
- 통제 적정성 추천
- 사용자 판정과 시스템 추천의 불일치 안내

AI가 생성한 항목은 반드시 다음과 같이 구분합니다.

- source: AI
- aiGenerated: true
- reviewStatus: draft 또는 review

AI 항목은 기본적으로 미선택 상태로 표시합니다.

AI가 다음 사항을 자동 확정하지 않습니다.

- 최종 위험도
- 법령 준수 여부
- 작업허가 승인
- 작업 가능 여부
- 사내기준 적용 확정
- 안전대책 공식 반영
- JSA_DB 승인

AI 항목은 사용자가 선택하고 검토한 경우에만 실제 위험성평가에 반영합니다.

---

## 25. 버전 관리

JSA 자료를 수정할 때 다음 원칙을 적용합니다.

### 단순 수정

오탈자, 띄어쓰기, 표시문구 수정 등 안전 의미가 바뀌지 않는 경우:

- 기존 jsaId 유지
- version 증가 가능
- updatedAt 및 updatedBy 갱신

### 안전 의미 변경

위험요인, 필수대책, 적용조건 또는 기준이 변경되는 경우:

- 기존 jsaId 유지
- version 증가
- 변경 사유 기록
- 재검토 및 재승인
- 승인 전까지 이전 승인 버전을 계속 사용할지 운영정책에 따라 결정

### 완전히 다른 자료로 분리

작업 범위나 적용대상이 완전히 달라지는 경우:

- 새로운 jsaId 발급
- 기존 자료와 관계 기록

### 폐기

자료를 삭제하지 않고 다음과 같이 처리합니다.

- metadata.status: retired
- retiredAt 기록
- retiredBy 기록
- replacedByJsaId 기록 가능

---

## 26. 기존 11건 데이터 마이그레이션

현재 평면형 11건 데이터는 삭제하지 않습니다.

다음 순서로 스키마 v3로 변환합니다.

1. 기존 JSON 백업
2. no 유지
3. jsaId 발급
4. 평면형 호환 필드 유지
5. workInfo 생성
6. originalHazard를 위험요인 후보로 분리
7. detailedMeasures를 대책 후보로 분리
8. standardMeasures와 상세 대책 연결
9. 태그를 source로 변환
10. 위험요인과 대책 연결
11. 통제계층 분류
12. 필수대책 여부 검토
13. quality 작성
14. metadata 작성
15. review 상태로 저장
16. 현업 및 안전보건 검토
17. 승인 후 approved로 변경

자동 변환 결과를 바로 approved 상태로 저장하지 않습니다.

---

## 27. 하위 호환 정책

스키마 v3 전환 중에는 다음 원칙을 적용합니다.

- 기존 평면 필드를 유지합니다.
- 신규 hazards와 measures를 추가합니다.
- 위험성평가 구버전은 평면 필드를 읽습니다.
- 위험성평가 신버전은 hazards와 measures를 우선 읽습니다.
- hazards 또는 measures가 없으면 기존 문자열을 임시 파싱합니다.
- 문자열 파싱은 마이그레이션 기간에만 사용합니다.
- 구조화 전환 완료 후 앱의 문자열 파싱 의존도를 줄입니다.
- 기존 referencedJSA는 유지하고 referencedJSAs를 추가합니다.
- 기존 riskMeasures 문자열 배열은 TBM 하위 호환용으로만 유지합니다.

---

## 28. Firestore 저장 규칙

컬렉션명:

    JSA_DB

문서 ID:

    jsaId

예:

    JSA_DB/JSA-WRK-000001

Firestore 문서 ID와 문서 내부 jsaId는 반드시 일치해야 합니다.

JSA_DB 권한 원칙:

- 작업자: 승인 자료 조회
- 안전관리자: 후보 등록 및 검토 의견 작성
- 관리자 또는 지정 승인자: 승인·수정·폐기
- 일반 사용자의 직접 덮어쓰기 금지
- 위험성평가 저장 시 JSA_DB 자동 등록 금지

Firestore 이관 전에는 data/jsa_database.json을 정식 원본으로 사용합니다.

---

## 29. 필수 검증 항목

JSON 변환 및 업로드 전에 다음을 확인합니다.

### 식별 검증

- jsaId 존재
- jsaId 중복 없음
- Firestore 문서 ID와 jsaId 일치
- no 원본 번호 보존

### 분류 검증

- classCode가 허용 값인지 확인
- classCode와 sheet가 일치하는지 확인
- 출처 불명확 자료는 UNK로 관리

### 위험요인 검증

- hazards 배열 존재
- hazardId 중복 없음
- 위험 문구 존재
- 사고유형 존재
- 사고시나리오 존재
- AI 위험 출처 표시
- 위험요인과 대책 연결 확인

### 대책 검증

- measures 배열 존재
- measureId 중복 없음
- 상세 대책과 표준명 존재
- source 허용 값 확인
- hierarchy 허용 값 확인
- required 값 확인
- AI 대책 출처 표시
- 관련 위험요인 연결 확인

### 품질 검증

- controlAdequacy가 ○, △, × 중 하나인지 확인
- △ 또는 × 판정 사유 존재
- qualityGrade 존재
- metadata.status 존재
- 승인되지 않은 자료의 일반 추천 차단
- 폐기 자료의 일반 추천 차단
- schemaVersion 존재

---

## 30. 금지사항

다음 사항은 금지합니다.

- 검토되지 않은 자료를 approved로 저장
- 위험성평가 결과를 JSA_DB에 자동 등록
- AI 위험요인을 원문 위험요인처럼 저장
- AI 대책을 법령·사내기준 대책처럼 저장
- 출처가 다른 대책을 무조건 WRK로 저장
- 위험요인과 연결되지 않은 대책을 승인
- 대책이 없는 위험요인을 적정으로 판정
- PPE만 있는 대책을 자동으로 ○ 판정
- 필수대책을 개수 제한 때문에 삭제
- 과거 위험도 점수를 신규 작업에 자동 적용
- jsaId를 Date.now 또는 Math.random으로 생성
- 폐기된 jsaId 재사용
- 일반 사용자의 JSA_DB 직접 덮어쓰기
- 작업명 접두어 검색만으로 유사 작업을 확정
- 협력사명만으로 JSA 적용 여부 결정
- 문자열 파싱 결과를 사람 검토 없이 승인
- 최신 법령 준수 여부를 AI가 자동 확정

---

## 31. 적용 우선순위

JSA_DB 고도화는 다음 순서로 진행합니다.

### P0

1. 이 문서를 정식 구조 문서로 저장
2. JSA_DB 프롬프트 저장
3. 현재 11건 JSON 백업
4. 대표 10건에 jsaId 발급
5. 대표 10건을 hazards와 measures 구조로 변환
6. 위험요인과 대책 연결 검토
7. 사내기준으로 필수대책 검증

### P1

8. 위험성평가에 위험요인 선택 기능 추가
9. 사용자 위험요인 추가 기능 추가
10. AI 위험요인 분리 표시
11. 복수 JSA 참조
12. 위험요인별 대책 연결
13. 최초 위험도와 잔여 위험도 분리
14. 시스템 통제 적정성 추천

### P2

15. 위험성평가 결과를 허가서에 구조화하여 반영
16. 위험성평가 결과를 TBM에 반영
17. 중복 방지 및 최신 평가 다시 불러오기
18. 나머지 76건 변환
19. 전체 데이터 품질검사

### P3

20. Firestore JSA_DB 이관
21. 권한 및 승인 절차 적용
22. 버전·폐기·대체 관리
23. 통합 리포트 및 감사 추적

---

## 32. 완료 기준

JSA_DB 구조 고도화는 다음 조건을 만족할 때 완료로 판단합니다.

- 모든 승인 자료에 고유 jsaId가 있음
- 원본 no가 보존됨
- 위험요인이 배열로 관리됨
- 안전대책이 배열로 관리됨
- 위험요인과 안전대책이 연결됨
- 대책마다 출처가 있음
- 대책마다 통제계층이 있음
- AI 위험과 대책이 원문과 구분됨
- 통제 적정성 판정 사유가 있음
- 승인·검토·폐기 상태가 구분됨
- 위험성평가에서 복수 JSA를 참조할 수 있음
- 위험요인별 최초·잔여 위험도를 관리할 수 있음
- 허가서와 TBM에서 출처를 추적할 수 있음
- 필수대책이 개수 제한으로 누락되지 않음
- 승인되지 않은 자료가 일반 추천에 사용되지 않음

---

## 33. 관련 문서

| 문서 | 역할 |
|---|---|
| PROJECT_CONVENTIONS.md | 프로젝트 공통 규약 |
| PROJECT_HANDOVER.md | 진행 현황 및 우선순위 |
| JSA_DB_PROMPT.md | 원문을 TSV로 변환하는 규칙 |
| JSA_DB_STRUCTURE.md | JSA_DB 구조 및 운영 규약 |
| DB_SCHEMA.md | 전체 Firestore 스키마 |
| AI_REVIEW_POLICY.md | AI 위험·대책 검토 정책 |
| DATA_MIGRATION_GUIDE.md | 데이터 이관 절차 |

---

## 34. 최종 원칙

JSA_DB는 단순한 작업 사례 목록이 아니라 다음 기능을 수행하는 안전 지식 DB로 관리합니다.

- 작업조건에 맞는 위험요인 발굴
- 위험요인별 안전대책 연결
- 법령·사내기준·재해·아차사고 출처 추적
- 통제계층에 따른 대책 적정성 검토
- AI 보완 위험과 대책의 명확한 구분
- 위험성평가·작업허가서·TBM 간 일관된 데이터 전달

AI와 JSA_DB는 작업자의 판단을 대신하지 않습니다.

최종 위험성평가와 안전대책은 현장조건을 확인한 현업 담당자 및 안전보건 담당자가 검토하고 확정합니다.
