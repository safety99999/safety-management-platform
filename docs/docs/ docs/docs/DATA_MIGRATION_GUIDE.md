# 📥 데이터 마이그레이션 가이드

## 📋 프로젝트
**POSCO FM 포항양극재공장 안전관리 시스템**

---

## 🎯 목표
localStorage의 기존 데이터를 Firestore로 마이그레이션

---

## 📊 마이그레이션 대상 데이터

### **Phase 1: 핵심 데이터 (Week 1)**

#### 1. localStorage → safetyDatabase → 작업DB
```javascript
// localStorage에서 읽기
const safetyDb = JSON.parse(localStorage.getItem('safetyDatabase') || '{}');

// Firestore에 저장
safetyDb.workHistory.forEach(work => {
  await db.collection('작업DB').doc(`work_${work.date}_${work.id}`).set({
    workId: work.id,
    date: new Date(work.date),
    workName: work.workName,
    workType: work.workType,
    riskLevel: work.riskLevel,
    contractor: work.contractor,
    status: work.status,
    // ... 기타 필드
  });
});
```

#### 2. localStorage → permitDatabase → 작업허가
```javascript
const permitDb = JSON.parse(localStorage.getItem('permitDatabase') || '{}');

permitDb.permits.forEach(permit => {
  await db.collection('작업허가').doc(`permit_${permit.permitNo}`).set({
    permitNo: permit.permitNo,
    workId: permit.workId,
    date: new Date(permit.date),
    workName: permit.workName,
    status: permit.status,
    // ... 기타 필드
  });
});
```

#### 3. localStorage → tbmDatabase → TBM
```javascript
const tbmDb = JSON.parse(localStorage.getItem('tbmDatabase') || '{}');

tbmDb.tbmLogs.forEach(tbm => {
  await db.collection('TBM').doc(`tbm_${tbm.tbmNo}`).set({
    tbmNo: tbm.tbmNo,
    permitNo: tbm.permitNo,
    date: new Date(tbm.date),
    status: 'completed',
    // ... 기타 필드
  });
});
```

---

### **Phase 2: 추가 데이터 (Week 2)**

#### 4. 안전퀴즈 기록
```javascript
// 기존 안전퀴즈 데이터 확인 후 마이그레이션
// 필요 시 CSV/JSON 파일에서 직접 import
```

#### 5. 긴급조치 기록
```javascript
// 기존 긴급조치 데이터 Firestore로 이동
```

---

### **Phase 3: 마스터 데이터 (Week 3)**

#### 6. 협력사 정보
```javascript
const contractors = [
  { name: '원준산업', type: '도급', status: '활성' },
  { name: 'PR테크', type: '도급', status: '활성' },
  { name: '직영', type: '직영', status: '활성' },
  // ... 더 많은 협력사
];

contractors.forEach(async (c) => {
  await db.collection('협력사관리').doc(c.name).set({
    contractorId: generateId(),
    contractorName: c.name,
    contractorType: c.type,
    status: c.status,
    statistics: {
      totalWorks: 0,
      violations: 0,
      accidents: 0,
      tbmRate: 0
    }
  });
});
```

#### 7. MSDS 데이터
```javascript
// 기존 MSDS 데이터 또는 화학물질 관련 파일에서 import
const msdsItems = [
  { name: '황산', casNumber: '7664-93-9', ... },
  { name: '페인트', casNumber: '...' , ... },
  // ...
];

msdsItems.forEach(async (msds) => {
  await db.collection('MSDS').doc(msds.name).set(msds);
});
```

#### 8. 사내안전기준
```javascript
// 기존 안전기준 문서에서 수동 입력
// 또는 CSV에서 import

const standards = [
  {
    standardNo: 'MS-001',
    title: '밀폐공간 작업 안전기준',
    category: '밀폐공간',
    // ...
  },
  // ...
];

standards.forEach(async (s) => {
  await db.collection('사내안전기준').doc(s.standardNo).set(s);
});
```

#### 9. 공장안전정보
```javascript
const factorySafety = {
  factoryName: '포항양극재 1공장',
  factoryLocation: '경북 포항시',
  hazardousAreas: [
    {
      areaName: '1동 3층',
      hazardType: ['화재', '질식', '추락'],
      restrictionLevel: '주의'
    },
    // ...
  ]
};

await db.collection('공장안전정보').doc('posco-1').set(factorySafety);
```

---

## 🛠️ 마이그레이션 스크립트 구조

### **firebase-config.js에 추가할 함수**

```javascript
/**
 * 전체 마이그레이션 실행
 */
async function migrateAllData() {
  try {
    console.log('🚀 데이터 마이그레이션 시작...');
    
    // Phase 1
    await migrateWorks();
    await migratePermits();
    await migrateTBM();
    
    // Phase 2
    await migrateQuizzes();
    await migrateEmergencies();
    
    // Phase 3
    await migrateContractors();
    await migrateMSDS();
    await migrateStandards();
    await migrateFactorySafety();
    
    console.log('✅ 마이그레이션 완료!');
    alert('✅ 모든 데이터가 Firestore로 마이그레이션되었습니다!');
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    alert('❌ 마이그레이션 중 오류 발생: ' + error.message);
  }
}

/**
 * 진행 상황 모니터링
 */
async function monitorMigration() {
  const collections = [
    '작업DB', '작업허가', 'TBM', '안전퀴즈',
    '긴급조치', '협력사관리', 'MSDS',
    '사내안전기준', '공장안전정보'
  ];
  
  for (const coll of collections) {
    const snapshot = await db.collection(coll).get();
    console.log(`${coll}: ${snapshot.size}개 문서`);
  }
}
```

---

## 📋 마이그레이션 체크리스트

### **사전 준비**
- [ ] Firebase Console 접근 확인
- [ ] 보안 규칙 적용 완료
- [ ] 백업 생성 (localStorage 내용 export)
- [ ] 테스트 용 Firestore 컬렉션 생성

### **Phase 1 (작업 데이터)**
- [ ] 작업DB 데이터 마이그레이션 (예상: 100~500건)
- [ ] 작업허가 데이터 마이그레이션 (예상: 100~500건)
- [ ] TBM 데이터 마이그레이션 (예상: 50~200건)
- [ ] 검증: Firestore에서 데이터 확인

### **Phase 2 (기록 데이터)**
- [ ] 안전퀴즈 결과 마이그레이션
- [ ] 긴급조치 기록 마이그레이션
- [ ] 검증: 데이터 무결성 확인

### **Phase 3 (마스터 데이터)**
- [ ] 협력사 정보 입력 (5~10개)
- [ ] MSDS 데이터 입력 (필요시)
- [ ] 사내안전기준 입력 (5~10개)
- [ ] 공장안전정보 입력 (팩토리별 1~3개)
- [ ] 검증: 모든 데이터 확인

### **최종 검증**
- [ ] 모든 컬렉션에 데이터 존재
- [ ] 작업 → 허가 → TBM 연결 확인
- [ ] 보안 규칙 작동 확인
- [ ] 통계 자동 계산 확인

---

## 🔄 롤백 계획 (Rollback)

만약 마이그레이션 중 문제 발생 시:

1. **Firestore 데이터 삭제**
   ```javascript
   // 특정 컬렉션 전체 삭제
   await deleteCollection('작업허가');
   ```

2. **localStorage 복원**
   ```javascript
   // 백업된 데이터 복원
   localStorage.setItem('safetyDatabase', backupData);
   ```

3. **원상 복귀 확인**
   - localhost에서 기존 앱 정상 작동 확인
   - Firebase 연동 OFF

---

## 📊 예상 마이그레이션 규모

| 컬렉션 | 예상 문서 수 | 크기 | 소요 시간 |
|--------|-------------|------|---------|
| 작업DB | 200 | 500KB | 5분 |
| 작업허가 | 200 | 600KB | 5분 |
| TBM | 100 | 300KB | 3분 |
| 안전퀴즈 | 500 | 800KB | 10분 |
| 긴급조치 | 50 | 200KB | 2분 |
| 협력사 | 10 | 50KB | 1분 |
| MSDS | 20 | 100KB | 1분 |
| 사내기준 | 10 | 100KB | 1분 |
| 공장정보 | 3 | 50KB | 1분 |
| **합계** | **1,093** | **2.7MB** | **28분** |

---

## ✅ 완료 후 작업

1. localStorage 유지 또는 삭제 결정
2. Firebase 연동 완전 활성화
3. 팀 교육 및 운영 시작
4. 모니터링 대시보드 설정

---

## 📞 트러블슈팅

### **마이그레이션 중 오류 발생**
- Firestore 쿼터 확인 (일일 쓰기 50,000건 제한)
- 네트워크 연결 확인
- 보안 규칙 재검토

### **데이터 손실 우려**
- 마이그레이션 전 반드시 백업
- 소규모 테스트 먼저 진행
- Phase별로 단계적 진행

---

## 🎯 다음 단계

마이그레이션 완료 후:
1. Authentication 활성화
2. 실시간 동기화 설정
3. 대시보드 Firestore 연동
4. 모바일 앱 배포
