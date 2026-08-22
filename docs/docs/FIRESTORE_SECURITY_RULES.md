# 🔒 Firestore 보안 규칙 (Security Rules)

## 📋 프로젝트
**POSCO FM 포항양극재공장 안전관리 시스템**

---

## 🔐 보안 규칙 코드

Firebase Console → Firestore → Rules 탭에 다음 코드를 입력하세요:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ═══════════════════════════════════════════════════════════
    // 1. 사용자 인증 확인 함수
    // ═══════════════════════════════════════════════════════════
    
    function isSignedIn() {
      return request.auth != null;
    }
    
    function getUserId() {
      return request.auth.uid;
    }
    
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    function isAdmin() {
      return getUserRole() == 'admin';
    }
    
    function isManager() {
      return getUserRole() in ['admin', 'manager'];
    }
    
    function isWorker() {
      return isSignedIn();
    }
    
    // ═══════════════════════════════════════════════════════════
    // 2. Users 컬렉션 (자신의 정보만 읽기 가능)
    // ═══════════════════════════════════════════════════════════
    
    match /users/{userId} {
      // 자신의 정보만 읽기
      allow read: if isSignedIn() && getUserId() == userId;
      
      // 관리자만 모든 사용자 읽기
      allow read: if isAdmin();
      
      // 자신의 정보만 수정
      allow update: if isSignedIn() && getUserId() == userId;
      
      // 관리자만 생성/삭제
      allow create, delete: if isAdmin();
    }
    
    // ═══════════════════════════════════════════════════════════
    // 3. 작업DB (모든 인증된 사용자 읽기, 매니저 이상 쓰기)
    // ═══════════════════════════════════════════════════════════
    
    match /작업DB/{workId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isManager();
    }
    
    // ═══════════════════════════════════════════════════════════
    // 4. 작업허가 (모든 인증된 사용자 읽기, 매니저 이상 쓰기)
    // ═══════════════════════════════════════════════════════════
    
    match /작업허가/{permitId} {
      allow read: if isSignedIn();
      allow create, update: if isManager();
      allow delete: if isAdmin();
    }
    
    // ═══════════════════════════════════════════════════════════
    // 5. TBM (모든 인증된 사용자 읽기, 매니저 이상 쓰기)
    // ═══════════════════════════════════════════════════════════
    
    match /TBM/{tbmId} {
      allow read: if isSignedIn();
      allow create, update: if isManager();
      allow delete: if isAdmin();
    }
    
    // ═══════════════════════════════════════════════════════════
    // 6. 위험성평가 (모든 인증된 사용자 읽기, 관리자 쓰기)
    // ═══════════════════════════════════════════════════════════
    
    match /위험성평가/{raId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
    
    // ═══════════════════════════════════════════════════════════
    // 7. 안전퀴즈 (자신의 것만 읽기, 자신의 것만 쓰기)
    // ═══════════════════════════════════════════════════════════
    
    match /안전퀴즈/{quizId} {
      allow read: if isSignedIn() && 
                     (getUserId() == resource.data.userId || isManager());
      allow create: if isSignedIn();
      allow update, delete: if isManager();
    }
    
    // ═══════════════════════════════════════════════════════════
    // 8. 긴급조치 (모든 인증된 사용자 읽기, 매니저 이상 쓰기)
    // ═══════════════════════════════════════════════════════════
    
    match /긴급조치/{emergencyId} {
      allow read: if isSignedIn();
      allow create, update: if isManager();
      allow delete: if isAdmin();
    }
    
    // ═══════════════════════════════════════════════════════════
    // 9. 안전정보제공 (모든 인증된 사용자 읽기, 매니저 이상 쓰기)
    // ═══════════════════════════════════════════════════════════
    
    match /안전정보제공/{safeinfoId} {
      allow read: if isSignedIn();
      allow create, update: if isManager();
      allow delete: if isAdmin();
    }
    
    // ═══════════════════════════════════════════════════════════
    // 10. 안전점검사항 (모든 인증된 사용자 읽기, 모두 생성, 매니저 이상 수정)
    // ═══════════════════════════════════════════════════════════
    
    match /안전점검사항/{inspectionId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isManager();
      allow delete: if isAdmin();
    }
    
    // ═══════════════════════════════════════════════════════════
    // 11. 협력사관리 (모든 인증된 사용자 읽기, 관리자 쓰기)
    // ═══════════════════════════════════════════════════════════
    
    match /협력사관리/{contractorId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
    
    // ═══════════════════════════════════════════════════════════
    // 12. 작업자관리 (모든 인증된 사용자 읽기, 관리자 쓰기)
    // ═══════════════════════════════════════════════════════════
    
    match /작업자관리/{workerId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
    
    // ═══════════════════════════════════════════════════════════
    // 13. MSDS (모든 인증된 사용자 읽기, 관리자 쓰기)
    // ═══════════════════════════════════════════════════════════
    
    match /MSDS/{msdsId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
    
    // ═══════════════════════════════════════════════════════════
    // 14. 사내안전기준 (모든 인증된 사용자 읽기, 관리자 쓰기)
    // ═══════════════════════════════════════════════════════════
    
    match /사내안전기준/{standardId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
    
    // ═══════════════════════════════════════════════════════════
    // 15. 공장안전정보 (모든 인증된 사용자 읽기, 관리자 쓰기)
    // ═══════════════════════════════════════════════════════════
    
    match /공장안전정보/{factorySafetyId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
    
    // ═══════════════════════════════════════════════════════════
    // 16. 월간통계 (모든 인증된 사용자 읽기만, 시스템 자동 생성)
    // ═══════════════════════════════════════════════════════════
    
    match /월간통계/{month} {
      allow read: if isSignedIn();
      allow create, update, delete: if false; // 시스템만 업데이트
    }
    
    // ═══════════════════════════════════════════════════════════
    // 17. 협력사통계 (모든 인증된 사용자 읽기만, 시스템 자동 생성)
    // ═══════════════════════════════════════════════════════════
    
    match /협력사통계/{contractorName} {
      allow read: if isSignedIn();
      allow create, update, delete: if false; // 시스템만 업데이트
    }
    
    // ═══════════════════════════════════════════════════════════
    // 기본 거부
    // ═══════════════════════════════════════════════════════════
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 📋 역할별 권한 표

| 역할 | users | 작업DB | 작업허가 | TBM | 위험성평가 | 안전점검 | MSDS | 사내기준 | 통계 |
|------|--------|--------|---------|-----|-----------|---------|------|---------|------|
| **worker** | 자신만 | 읽기 | 읽기 | 읽기 | 읽기 | 읽기/쓰기 | 읽기 | 읽기 | 읽기 |
| **manager** | 모두 | 읽기/쓰기 | 읽기/쓰기 | 읽기/쓰기 | 읽기 | 읽기/쓰기 | 읽기 | 읽기 | 읽기 |
| **admin** | 모두 | 모두 | 모두 | 모두 | 모두 | 모두 | 모두 | 모두 | 읽기만 |

---

## 🔒 주요 보안 원칙

✅ 인증된 사용자만 접근 가능
✅ 역할 기반 접근 제어 (RBAC)
✅ 자신의 데이터는 본인만 수정 가능
✅ 통계는 시스템 자동 생성 (수동 수정 불가)
✅ 최소 권한 원칙 (Principle of Least Privilege)

---

## 📝 적용 방법

1. Firebase Console 접속
2. Firestore Database → Rules 탭
3. 위 코드 전체 복사
4. Rules 에디터에 붙여넣기
5. "Publish" 버튼 클릭
6. 배포 완료!
