// ============================================
// Firebase 설정 (모든 페이지에서 사용)
// ============================================

// Firebase 프로젝트 설정값
const firebaseConfig = {
  apiKey: "AIzaSyB7xLsGrG_tTH6ZQ1-Hz1HTQ1GPDq8sfzU",
  authDomain: "safety-management-platfo-5f413.firebaseapp.com",
  projectId: "safety-management-platfo-5f413",
  storageBucket: "safety-management-platfo-5f413.firebasestorage.app",
  messagingSenderId: "96226952530",
  appId: "1:96226952530:web:07e7cb286dc4e120cea68b",
  measurementId: "G-KNK5ECRCX5"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firebase 서비스 초기화
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// 현재 로그인한 사용자 정보
let currentUser = null;

// 사용자 로그인 상태 모니터링
auth.onAuthStateChanged((user) => {
  currentUser = user;
  console.log('사용자 상태 변경:', user ? user.email : '로그아웃됨');
  
  if (user) {
    console.log('✅ 로그인됨:', user.email);
    updateLoginUI(true, user);
  } else {
    console.log('❌ 로그아웃됨');
    updateLoginUI(false);
  }
});

// 기본 함수들
async function signUpWithEmail(email, password, displayName = '사용자') {
  try {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    await result.user.updateProfile({ displayName: displayName });
    console.log('✅ 회원가입 성공:', email);
    return result.user;
  } catch (error) {
    console.error('❌ 회원가입 실패:', error.message);
    alert('회원가입 실패: ' + error.message);
    return null;
  }
}

async function signInWithEmail(email, password) {
  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    console.log('✅ 로그인 성공:', email);
    return result.user;
  } catch (error) {
    console.error('❌ 로그인 실패:', error.message);
    alert('로그인 실패: ' + error.message);
    return null;
  }
}

async function signOut() {
  try {
    await auth.signOut();
    console.log('✅ 로그아웃 성공');
    return true;
  } catch (error) {
    console.error('❌ 로그아웃 실패:', error.message);
    return false;
  }
}

async function saveData(collectionName, data, docId = null) {
  try {
    if (docId) {
      await db.collection(collectionName).doc(docId).set(data, { merge: true });
      console.log(`✅ 데이터 저장 (${collectionName}/${docId})`);
      return docId;
    } else {
      const docRef = await db.collection(collectionName).add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ 데이터 저장 (${collectionName}/${docRef.id})`);
      return docRef.id;
    }
  } catch (error) {
    console.error(`❌ 데이터 저장 실패:`, error.message);
    alert('데이터 저장 실패: ' + error.message);
    return null;
  }
}

async function getData(collectionName, docId = null) {
  try {
    if (docId) {
      const doc = await db.collection(collectionName).doc(docId).get();
      if (doc.exists) {
        console.log(`✅ 데이터 조회 (${collectionName}/${docId})`);
        return doc.data();
      } else {
        console.log(`⚠️ 문서 없음 (${collectionName}/${docId})`);
        return null;
      }
    } else {
      const snapshot = await db.collection(collectionName).get();
      const data = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() });
      });
      console.log(`✅ 데이터 조회 (${collectionName}): ${data.length}개`);
      return data;
    }
  } catch (error) {
    console.error(`❌ 데이터 조회 실패:`, error.message);
    return null;
  }
}

async function getTodayPermits() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const snapshot = await db.collection('작업허가')
      .where('날짜', '>=', today)
      .get();
    
    const permits = [];
    snapshot.forEach(doc => {
      permits.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`✅ 오늘 작업 허가: ${permits.length}개`);
    return permits;
  } catch (error) {
    console.error('❌ 오늘 작업 허가 조회 실패:', error.message);
    return [];
  }
}

function updateLoginUI(isLoggedIn, user = null) {
  if (typeof onLoginStatusChanged === 'function') {
    onLoginStatusChanged(isLoggedIn, user);
  }
}

async function syncLocalStorageToFirebase() {
  try {
    if (!currentUser) {
      alert('로그인 후 이용해주세요.');
      return false;
    }
    
    const safetyDatabase = localStorage.getItem('safetyDatabase');
    const permitDatabase = localStorage.getItem('permitDatabase');
    const tbmDatabase = localStorage.getItem('tbmDatabase');
    
    if (safetyDatabase) {
      const data = JSON.parse(safetyDatabase);
      await saveData('작업DB', { data }, currentUser.uid + '_작업DB');
      console.log('✅ 작업 DB 동기화 완료');
    }
    
    if (permitDatabase) {
      const data = JSON.parse(permitDatabase);
      await saveData('작업허가', { data }, currentUser.uid + '_작업허가');
      console.log('✅ 작업 허가 DB 동기화 완료');
    }
    
    if (tbmDatabase) {
      const data = JSON.parse(tbmDatabase);
      await saveData('TBM', { data }, currentUser.uid + '_TBM');
      console.log('✅ TBM DB 동기화 완료');
    }
    
    alert('✅ 모든 데이터가 Firebase에 동기화되었습니다!');
    return true;
  } catch (error) {
    console.error('❌ 동기화 실패:', error.message);
    alert('동기화 실패: ' + error.message);
    return false;
  }
}

async function syncFirebaseToLocalStorage() {
  try {
    if (!currentUser) {
      alert('로그인 후 이용해주세요.');
      return false;
    }
    
    const workData = await getData('작업DB', currentUser.uid + '_작업DB');
    const permitData = await getData('작업허가', currentUser.uid + '_작업허가');
    const tbmData = await getData('TBM', currentUser.uid + '_TBM');
    
    if (workData?.data) {
      localStorage.setItem('safetyDatabase', JSON.stringify(workData.data));
    }
    if (permitData?.data) {
      localStorage.setItem('permitDatabase', JSON.stringify(permitData.data));
    }
    if (tbmData?.data) {
      localStorage.setItem('tbmDatabase', JSON.stringify(tbmData.data));
    }
    
    alert('✅ Firebase 데이터가 로컬에 복원되었습니다!');
    return true;
  } catch (error) {
    console.error('❌ 복원 실패:', error.message);
    alert('복원 실패: ' + error.message);
    return false;
  }
}

console.log('🔧 Firebase 설정 로드 완료');
