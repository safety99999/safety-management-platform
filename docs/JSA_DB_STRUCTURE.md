// ════════════════════════════════════════════
// JSA_DB 관련 함수
// ════════════════════════════════════════════

// JSA 저장
async function saveJSA(jsaData) {
  try {
    const jsaId = jsaData.metadata.jsaId || `jsa_${Date.now()}`;
    await db.collection('JSA_DB').doc(jsaId).set(jsaData);
    console.log('✅ JSA 저장됨:', jsaId);
    return jsaId;
  } catch (error) {
    console.error('❌ JSA 저장 실패:', error);
    throw error;
  }
}

// JSA 검색 (작업명)
async function searchJSA(workName) {
  try {
    const snapshot = await db.collection('JSA_DB')
      .where('workInfo.workName', '>=', workName)
      .where('workInfo.workName', '<=', workName + '\uf8ff')
      .get();
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('❌ JSA 검색 실패:', error);
    return [];
  }
}

// JSA 조회 (협력사별)
async function searchJSAByContractor(contractor) {
  try {
    const snapshot = await db.collection('JSA_DB')
      .where('teamInfo.contractor', '==', contractor)
      .get();
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('❌ JSA 조회 실패:', error);
    return [];
  }
}

// JSA 조회 (날짜별)
async function searchJSAByDate(date) {
  try {
    const snapshot = await db.collection('JSA_DB')
      .where('workInfo.date', '==', date)
      .get();
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('❌ JSA 조회 실패:', error);
    return [];
  }
}

// 전체 JSA 개수
async function countJSA() {
  try {
    const snapshot = await db.collection('JSA_DB').get();
    return snapshot.size;
  } catch (error) {
    console.error('❌ 개수 조회 실패:', error);
    return 0;
  }
}
