<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<meta name="theme-color" content="#0b0b0d" />
<title>안전관리 플랫폼 로그인 (TEST)</title>

<style>
/* =========================================================
   0. 기본 리셋
   ========================================================= */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
               "Noto Sans KR", "Malgun Gothic", sans-serif;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
}

body {
  background: #0b0b0d;
  color: #f4f4f5;
  overflow: hidden;
}

button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  background: none;
  color: inherit;
}

input {
  font-family: inherit;
}

/* =========================================================
   1. PC용 휴대폰 프레임 (대시보드와 동일 컨셉)
   ========================================================= */
.phone-frame {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(1200px 800px at 50% 50%, #1a1a1f 0%, #0b0b0d 60%, #000 100%);
  padding: 24px;
}

.phone-screen {
  position: relative;
  width: 390px;
  height: 780px;
  max-height: calc(100vh - 48px);
  background: #111114;
  border-radius: 44px;
  border: 2px solid #2a2a30;
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.6),
    inset 0 0 0 6px #000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 상단 노치 (장식) */
.phone-screen::before {
  content: "";
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 26px;
  background: #000;
  border-radius: 20px;
  z-index: 10;
}

/* =========================================================
   2. 로그인 셸 (실제 콘텐츠 영역)
   ========================================================= */
.login-shell {
  flex: 1;
  overflow-y: auto;
  padding: 60px 28px 28px;
  background: linear-gradient(180deg, #14141a 0%, #0f0f13 100%);
  color: #f4f4f5;
  display: flex;
  flex-direction: column;
}

/* 브랜드 영역 */
.brand {
  text-align: center;
  margin-bottom: 32px;
}

.brand-badge {
  display: inline-block;
  padding: 6px 12px;
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 14px;
}

.brand-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 6px;
  color: #ffffff;
}

.brand-sub {
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
}

/* 폼 */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 12px;
  font-weight: 600;
  color: #d4d4d8;
  padding-left: 2px;
}

.field-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.field input {
  width: 100%;
  padding: 14px 14px;
  background: #1c1c22;
  border: 1px solid #2f2f38;
  border-radius: 12px;
  color: #f4f4f5;
  font-size: 15px;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
}

.field input:focus {
  border-color: #6366f1;
  background: #1f1f27;
}

.field input::placeholder {
  color: #6b7280;
}

/* 비밀번호 보기 토글 */
.pw-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  padding: 6px 10px;
  font-size: 12px;
  color: #a1a1aa;
  border-radius: 8px;
}

.pw-toggle:hover {
  background: #2a2a33;
  color: #fff;
}

/* 로그인 버튼 */
.btn-login {
  margin-top: 8px;
  padding: 14px;
  background: linear-gradient(180deg, #4f46e5 0%, #4338ca 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  border-radius: 12px;
  transition: transform 0.05s, filter 0.15s;
}

.btn-login:hover:not(:disabled) {
  filter: brightness(1.1);
}

.btn-login:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 구분선 */
.divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 22px 0 14px;
  color: #6b7280;
  font-size: 11px;
}

.divider::before,
.divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #2a2a30;
}

/* 테스터 진입 버튼 */
.btn-tester {
  padding: 12px;
  background: #1c1c22;
  border: 1px solid #2f2f38;
  border-radius: 12px;
  color: #d4d4d8;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.15s;
}

.btn-tester:hover {
  background: #26262d;
}

/* 오류·안내 메시지 */
.msg {
  min-height: 20px;
  margin-top: 10px;
  padding: 10px 12px;
  font-size: 12.5px;
  border-radius: 10px;
  display: none;
  line-height: 1.5;
}

.msg.error {
  display: block;
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.msg.info {
  display: block;
  background: rgba(59, 130, 246, 0.12);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

/* 하단 안내 */
.foot {
  margin-top: auto;
  padding-top: 24px;
  text-align: center;
  font-size: 11px;
  color: #6b7280;
  line-height: 1.6;
}

.foot .warn {
  color: #fbbf24;
  font-weight: 600;
}

/* =========================================================
   3. 실제 모바일 대응 — 검은 프레임 제거
   ========================================================= */
@media (max-width: 640px) {
  body {
    overflow: auto;
    background: #0f0f13;
  }

  .phone-frame {
    position: static;
    padding: 0;
    background: none;
    display: block;
    min-height: 100vh;
  }

  .phone-screen {
    width: 100%;
    height: auto;
    min-height: 100vh;
    max-height: none;
    border-radius: 0;
    border: none;
    box-shadow: none;
  }

  .phone-screen::before {
    display: none; /* 노치 제거 */
  }

  .login-shell {
    padding: 40px 22px 28px;
  }
}
</style>
</head>
<body>

<div class="phone-frame">
  <div class="phone-screen">
    <main class="login-shell">

      <div class="brand">
        <span class="brand-badge">DEV · TEST</span>
        <h1 class="brand-title">안전관리 플랫폼</h1>
        <p class="brand-sub">개발 테스트용 · 실제 작업허가 효력 없음</p>
      </div>

      <form class="login-form" id="loginForm" autocomplete="off">
        <div class="field">
          <label for="userId">아이디</label>
          <div class="field-input-wrap">
            <input
              type="text"
              id="userId"
              name="userId"
              placeholder="예: admin"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
            />
          </div>
        </div>

        <div class="field">
          <label for="userPw">비밀번호</label>
          <div class="field-input-wrap">
            <input
              type="password"
              id="userPw"
              name="userPw"
              placeholder="비밀번호"
            />
            <button type="button" class="pw-toggle" id="pwToggle">보기</button>
          </div>
        </div>

        <button type="submit" class="btn-login" id="btnLogin">
          로그인
        </button>

        <div class="msg" id="loginMsg"></div>
      </form>

      <div class="divider">또는</div>

      <button type="button" class="btn-tester" id="btnTester">
        로그인 없이 테스터로 체험하기
      </button>

      <div class="foot">
        <div class="warn">⚠ 개발 테스트 환경</div>
        <div>실제 개인정보 · 사진 · 서명 입력 금지</div>
        <div>Firestore 컬렉션: <code>test_*</code></div>
      </div>

    </main>
  </div>
</div>

<!-- =========================================================
     Firebase SDK (compat 방식 - 기존 코드와 동일 스타일)
     ========================================================= -->
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js"></script>

<script>
/* =========================================================
   Firebase 설정 (기존 firebase-config.js 값과 동일)
   ========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyB7xLsGrG_tTH6ZQ1-Hz1HTQ1GPDq8sfzU",
  authDomain: "safety-management-platfo-5f413.firebaseapp.com",
  projectId: "safety-management-platfo-5f413",
  storageBucket: "safety-management-platfo-5f413.firebasestorage.app",
  messagingSenderId: "96226952530",
  appId: "1:96226952530:web:07e7cb286dc4e120cea68b",
  measurementId: "G-KNK5ECRCX5"
};

/* Firebase 초기화 (중복 초기화 방지) */
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db   = firebase.firestore();

/* 기존 대시보드와 동일한 Firestore 설정 유지
   (Edge/사내망 WebChannel 실패 대응) */
try {
  db.settings({
    experimentalForceLongPolling: true,
    merge: true
  });
} catch (e) {
  /* 이미 사용된 경우 무시 */
}

/* 인수인계서 3.2 - 테스트 모드 고정 */
window.APP_MODE = 'test';
window.COLLECTION_PREFIX = 'test_';
console.log(
  '%c[APP MODE] TEST',
  'background:#dc3545;color:white;padding:4px 12px;border-radius:4px;font-weight:bold;'
);

/* 인수인계서 3.3 - 고정 도메인 유지 */
const AUTH_ID_DOMAIN = "pfm-safety.test";

/* =========================================================
   DOM
   ========================================================= */
const $form     = document.getElementById("loginForm");
const $id       = document.getElementById("userId");
const $pw       = document.getElementById("userPw");
const $btn      = document.getElementById("btnLogin");
const $msg      = document.getElementById("loginMsg");
const $pwToggle = document.getElementById("pwToggle");
const $tester   = document.getElementById("btnTester");

/* =========================================================
   유틸
   ========================================================= */
function showMsg(text, type){
  $msg.textContent = text;
  $msg.className = "msg " + (type || "error");
}

function clearMsg(){
  $msg.textContent = "";
  $msg.className = "msg";
  $msg.style.display = "none";
}

function toEmail(rawId){
  const id = (rawId || "").trim();
  if(!id) return "";
  if(id.includes("@")) return id;
  return id + "@" + AUTH_ID_DOMAIN;
}

/* =========================================================
   비밀번호 보기 / 숨기기
   ========================================================= */
$pwToggle.addEventListener("click", () => {
  if($pw.type === "password"){
    $pw.type = "text";
    $pwToggle.textContent = "숨김";
  }else{
    $pw.type = "password";
    $pwToggle.textContent = "보기";
  }
});

/* =========================================================
   로그인 처리 (인수인계서 3.3 / 3.4 / 3.5 유지)
   ========================================================= */
$form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMsg();

  const rawId = $id.value.trim();
  const pw    = $pw.value;

  if(!rawId || !pw){
    showMsg("아이디와 비밀번호를 입력하세요.", "error");
    return;
  }

  const email = toEmail(rawId);

  $btn.disabled = true;
  $btn.textContent = "로그인 중...";

  try{
    /* 로그인 지속 - 브라우저 세션 유지 */
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

    const cred = await auth.signInWithEmailAndPassword(email, pw);
    const user = cred.user;
    console.log("[로그인] Authentication 성공:", user.uid);

    /* Firestore users/{uid} 역할 문서 확인 */
    const userSnap = await db.collection("users").doc(user.uid).get();
    console.log("[로그인] users 문서 존재:", userSnap.exists);

    if(!userSnap.exists){
      showMsg("등록되지 않은 계정입니다. 관리자에게 문의하세요.", "error");
      await auth.signOut();
      return;
    }

    const data = userSnap.data();
    console.log(
      "[로그인] active:", data.active,
      "role:", data.role,
      "env:", data.environment
    );

    if(data.active !== true){
      showMsg("비활성 계정입니다.", "error");
      await auth.signOut();
      return;
    }

    if(data.environment !== "test"){
      showMsg("테스트 환경 계정이 아닙니다.", "error");
      await auth.signOut();
      return;
    }

    if(data.role !== "admin" && data.role !== "user"){
      showMsg("허용되지 않은 역할입니다.", "error");
      await auth.signOut();
      return;
    }

    /* 세션 저장 (인수인계서 3.5 형태 유지) */
    const session = {
      accessMode: "authenticated",
      role: data.role,
      uid: user.uid,
      displayName: data.displayName || "",
      email: user.email || email,
      environment: "test"
    };
    sessionStorage.setItem("APP_SESSION", JSON.stringify(session));
    console.log("[로그인] 앱 세션 저장 완료");

    showMsg("로그인 성공. 대시보드로 이동합니다.", "info");
    setTimeout(() => {
      location.href = "index.html";
    }, 300);

  }catch(err){
    console.error("[로그인 오류]", err);
    let text = "로그인에 실패했습니다.";
    switch(err.code){
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        text = "아이디 또는 비밀번호가 올바르지 않습니다.";
        break;
      case "auth/too-many-requests":
        text = "로그인 시도가 많습니다. 잠시 후 다시 시도하세요.";
        break;
      case "auth/network-request-failed":
        text = "네트워크 오류가 발생했습니다.";
        break;
      case "auth/invalid-email":
        text = "아이디 형식이 올바르지 않습니다.";
        break;
    }
    showMsg(text, "error");
  }finally{
    $btn.disabled = false;
    $btn.textContent = "로그인";
  }
});

/* =========================================================
   테스터 진입 (인수인계서 3.5 형태 유지)
   ========================================================= */
$tester.addEventListener("click", () => {
  const testerSession = {
    accessMode: "tester",
    role: "tester",
    uid: null,
    displayName: "공개 테스터",
    email: "",
    environment: "test"
  };
  sessionStorage.setItem("APP_SESSION", JSON.stringify(testerSession));
  console.log("[테스터] 로컬 세션 생성 완료");
  location.href = "index.html";
});

console.log("🔧 login.html 로드 완료");
</script>

</body>
</html>
