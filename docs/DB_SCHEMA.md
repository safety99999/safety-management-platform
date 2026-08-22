# 🗄️ Firestore DB 스키마 설계서

## 📋 프로젝트명
**POSCO FM 포항양극재공장 안전관리 시스템**

## 📅 버전
- v1.0 (2026-08-22)
- 작성자: Safety Management Team

---

## 📊 컬렉션 목록 (16개)

### **Core Collections (7개)**

#### 1. users (사용자 관리)
```
문서ID: uid (Google Auth)
- email: string
- displayName: string
- role: string (admin/manager/worker)
- department: string
- joinDate: timestamp
- lastLogin: timestamp
- status: string (활성/비활성)
```

#### 2. 작업DB (원본 작업 정보)
```
문서ID: work_{날짜}_{번호}
- workId, date, workName, workType, riskLevel
- department, contractor, workers: array
- status, startTime, endTime, location
- notes
```

#### 3. 작업허가 (안전작업허가서)
```
문서ID: permit_{날짜}_{번호}
- permitNo, workId, date, workName, riskLevel
- riskFactors: array, safetyMeasures: array
- requiredEPE: array, supervisor, approver
- status, createdBy, createdAt, updatedAt
```

#### 4. TBM (작업 전 안전미팅)
```
문서ID: tbm_{날짜}_{번호}
- tbmNo, permitNo, date, time, location
- workName, mainHazards: array (위험요소 3가지)
- safetyRules: array, emergencyInfo: object
- attendees: array, conductedBy, status
```

#### 5. 위험성평가 (AI 위험성평가)
```
문서ID: ra_{날짜}_{번호}
- raNo, workId, date, workName, workType
- processStage: array (1-9단계)
- riskAssessment: array (원문위험요인, 사고유형, 심각도, 빈도)
- overallRiskLevel, historicalData
- evaluatedBy, approver, status
```

#### 6. 안전퀴즈 (출입자 안전퀴즈)
```
문서ID: quiz_{날짜}_{사용자ID}
- quizCode, userId, name, date, startTime, endTime
- totalQuestions, correctAnswers, score, passYN
- answers: array, signatureImage, ipAddress
```

#### 7. 긴급조치 (긴급조치 관리대장)
```
문서ID: emergency_{날짜}_{번호}
- emergencyNo, permitNo, date, time, location
- incidentType, description, severity
- measuresTaken: array, injuryCount, damageAmount
- reportedBy, approvedBy, status
```

---

### **Safety Information Collections (3개)**

#### 8. 안전정보제공 (Safety Info Provision)
```
문서ID: safetyinfo_{날짜}_{번호}
- safeinfoNo, date, type (도급인용/수급인용)
- employer: object (도급인 정보)
- contractor: object (수급인 정보)
- workInfo, chemicalInfo, safetyRules
- requiredDocuments, factorySafetyInfo, ppe
- emergencyInfo, signatures
```

#### 9. 안전점검사항 (Safety Inspection Record)
```
문서ID: inspection_{날짜}_{번호}
- inspectionNo, permitNo, date, time, location
- contractor, workName, reportedBy: object
- violationItems: array (item, severity, source, photo)
- correctionStatus: object (status, completedAt)
- priority, notes
```

#### 10. 공장안전정보 (Factory Safety Information)
```
문서ID: factorysafety_{공장명}
- factorySafetyId, factoryName, factoryLocation
- hazardousAreas: array (지역별 위험정보)
- criticalEquipment: array (설비별 정보)
- chemicalStorage: array (화학물질 저장)
- emergencyEquipment, safetyFacilities
- restrictedAreas, disasterPlan, contactInfo
- lastUpdated, status
```

---

### **Management Collections (3개)**

#### 11. 협력사관리 (Contractor Management)
```
문서ID: contractor_{협력사명}
- contractorId, contractorName, contractorType
- registrationDate, contactInfo: object
- status, totalProjects, safetyScore
- statistics: object (totalWorks, violations, accidents)
```

#### 12. 작업자관리 (Worker Management)
```
문서ID: worker_{작업자ID}
- workerId, name, contractor, position
- phone, email
- workHistory: array, accidents: array, violations: array
- status
```

#### 13. MSDS (화학물질 안전정보)
```
문서ID: msds_{화학물질명}
- msdsId, chemicalName, casNumber, manufacturer
- hazardSymbols: array, hazardClassification: array
- precautionaryStatements: array
- firstAidMeasures, fireAndExplosion
- personalProtection: object
- exposure, documentVersion, pdfUrl
- status, lastUpdated
```

#### 14. 사내안전기준 (Company Safety Standards)
```
문서ID: standard_{부서}_{번호}
- standardId, standardNo (MS-001 등)
- title, category, department, applicableArea
- purpose, scope, definitions, requirements
- procedures, checkList: array
- relatedRegulations, attachments
- version, effectiveDate, reviewDate
- approver, status
```

---

### **Statistics Collections (2개)**

#### 15. 월간통계 (Monthly Statistics)
```
문서ID: statistics/monthly/{년월}
- month, totalWorks
- byRiskLevel: object (high, medium, low)
- byContractor: array (협력사별 통계)
- permits, tbmStats, inspections
- accidents
```

#### 16. 협력사통계 (Contractor Statistics)
```
문서ID: contractorStats/{협력사명}
- contractorName, evaluationPeriod
- totalWorks, completedWorks
- safetyMetrics: object (tbmRate, permitApprovalRate, violations)
- workTypeBreakdown, riskLevelDistribution
- ranking, trend: array
- recommendations
```

---

## 🔗 **관계 구조 (Foreign Keys)**

```
작업DB ─→ 작업허가 ─→ TBM ─→ 긴급조치
  ↓           ↓
위험성평가  안전정보제공
  ↓
안전점검사항

users (모든 항목의 createdBy/approver 참조)
협력사관리 (contractor 참조)
작업자관리 (contractor 참조)
```

---

## 🔒 **보안 규칙**

별도 파일 참조: `FIRESTORE_SECURITY_RULES.md`

---

## 📥 **데이터 마이그레이션**

별도 파일 참조: `DATA_MIGRATION_GUIDE.md`

---

## 📝 **주요 특징**

✅ 16개 컬렉션으로 완전한 안전관리 시스템 구축
✅ 개인정보 최소화 (이름, 전화, 이메일만 필수)
✅ 협력사/작업자별 통계 및 성과 평가
✅ MSDS, 사내기준, 공장안전정보 통합 관리
✅ 실시간 모니터링 및 리포팅 가능

---

## 🔄 **버전 관리**

| 버전 | 날짜 | 변경사항 |
|------|------|---------|
| v1.0 | 2026-08-22 | 초기 설계 |
