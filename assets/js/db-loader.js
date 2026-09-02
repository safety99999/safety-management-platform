/* ============================================================
 * db-loader.js v1.0
 * 안전관리 플랫폼 - GitHub 정적 JSON 로더
 * 
 * 생성일: 2026-09-03
 * 저장소: safety99999/safety-management-platform
 * 
 * 기능:
 *  - GitHub Pages 우선 접근, 실패 시 Raw URL fallback
 *  - manifest 5분 메모리 캐시
 *  - IndexedDB 영구 저장 (오프라인 대응)
 *  - SHA256 해시 검증
 *  - BOM 자동 제거
 *  - 강제 새로고침 지원
 * 
 * 공개 API:
 *  window.staticDbLoader.load(key)          - 데이터 로드
 *  window.staticDbLoader.forceRefresh()     - 캐시 무효화
 *  window.staticDbLoader.getStatus()        - 현재 상태 조회
 * 
 * 지원 key:
 *  'riskAssessmentDB'  - 위험성평가 기준 DB (215건)
 *  'workDatabase'      - 작업 DB (735건)
 * ============================================================ */

(function(global){
  'use strict';

  // ─────────────────────────────────────────────────────────
  // 설정
  // ─────────────────────────────────────────────────────────
  const CONFIG = {
    // 데이터 소스 URL (우선순위 순)
    sources: [
      {
        name: 'pages',
        base: 'https://safety99999.github.io/safety-management-platform/assets/data/'
      },
      {
        name: 'raw',
        base: 'https://raw.githubusercontent.com/safety99999/safety-management-platform/main/assets/data/'
      }
    ],
    manifestFile: 'db-manifest.json',
    manifestTtlMs: 5 * 60 * 1000,  // 5분
    fetchTimeoutMs: 30 * 1000,     // 30초
    
    // IndexedDB 설정
    dbName: 'safetyStaticDB',
    dbVersion: 1,
    storeName: 'datasets'
  };

  // ─────────────────────────────────────────────────────────
  // 내부 상태
  // ─────────────────────────────────────────────────────────
  let manifestCache = null;
  let manifestCachedAt = 0;
  let loadingPromises = {};  // key별 진행 중인 Promise (중복 요청 방지)

  // ─────────────────────────────────────────────────────────
  // 유틸: 로그
  // ─────────────────────────────────────────────────────────
  function log(...args){
    console.log('[db-loader]', ...args);
  }
  function warn(...args){
    console.warn('[db-loader]', ...args);
  }
  function error(...args){
    console.error('[db-loader]', ...args);
  }

  // ─────────────────────────────────────────────────────────
  // 유틸: fetch with timeout
  // ─────────────────────────────────────────────────────────
  async function fetchWithTimeout(url, timeoutMs){
    const controller = new AbortController();
    const timer = setTimeout(()=> controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { 
        signal: controller.signal,
        cache: 'no-cache'  // 항상 최신 확인 (ETag 활용)
      });
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  // ─────────────────────────────────────────────────────────
  // 유틸: BOM 제거 후 JSON 파싱
  // ─────────────────────────────────────────────────────────
  function parseJsonSafe(text){
    if(!text) return null;
    // UTF-8 BOM 제거
    const cleaned = text.replace(/^\uFEFF/, '');
    return JSON.parse(cleaned);
  }

  // ─────────────────────────────────────────────────────────
  // 유틸: SHA256 계산 (Web Crypto API)
  // ─────────────────────────────────────────────────────────
  async function sha256Hex(text){
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const bytes = Array.from(new Uint8Array(hashBuffer));
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ─────────────────────────────────────────────────────────
  // IndexedDB 헬퍼
  // ─────────────────────────────────────────────────────────
  function openDb(){
    return new Promise((resolve, reject)=>{
      const req = indexedDB.open(CONFIG.dbName, CONFIG.dbVersion);
      req.onupgradeneeded = (e)=>{
        const db = e.target.result;
        if(!db.objectStoreNames.contains(CONFIG.storeName)){
          db.createObjectStore(CONFIG.storeName, { keyPath: 'key' });
        }
      };
      req.onsuccess = ()=> resolve(req.result);
      req.onerror = ()=> reject(req.error);
    });
  }

  async function idbGet(key){
    try {
      const db = await openDb();
      return new Promise((resolve, reject)=>{
        const tx = db.transaction(CONFIG.storeName, 'readonly');
        const store = tx.objectStore(CONFIG.storeName);
        const req = store.get(key);
        req.onsuccess = ()=> resolve(req.result || null);
        req.onerror = ()=> reject(req.error);
      });
    } catch(e){
      warn('IndexedDB read failed:', e.message);
      return null;
    }
  }

  async function idbSet(key, value){
    try {
      const db = await openDb();
      return new Promise((resolve, reject)=>{
        const tx = db.transaction(CONFIG.storeName, 'readwrite');
        const store = tx.objectStore(CONFIG.storeName);
        const req = store.put({ key, ...value });
        req.onsuccess = ()=> resolve(true);
        req.onerror = ()=> reject(req.error);
      });
    } catch(e){
      warn('IndexedDB write failed:', e.message);
      return false;
    }
  }

  async function idbClear(){
    try {
      const db = await openDb();
      return new Promise((resolve, reject)=>{
        const tx = db.transaction(CONFIG.storeName, 'readwrite');
        const store = tx.objectStore(CONFIG.storeName);
        const req = store.clear();
        req.onsuccess = ()=> resolve(true);
        req.onerror = ()=> reject(req.error);
      });
    } catch(e){
      warn('IndexedDB clear failed:', e.message);
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────
  // 다중 소스 fetch (Pages → Raw fallback)
  // ─────────────────────────────────────────────────────────
  async function fetchFromSources(filename){
    let lastError = null;
    for(const src of CONFIG.sources){
      const url = src.base + filename;
      try {
        log(`try [${src.name}]`, url);
        const res = await fetchWithTimeout(url, CONFIG.fetchTimeoutMs);
        if(!res.ok){
          warn(`[${src.name}] HTTP ${res.status}`);
          lastError = new Error(`HTTP ${res.status}`);
          continue;
        }
        const text = await res.text();
        log(`[${src.name}] fetched ${(text.length/1024).toFixed(1)} KB`);
        return { text, source: src.name, url };
      } catch(e){
        warn(`[${src.name}] failed:`, e.message);
        lastError = e;
      }
    }
    throw lastError || new Error('모든 소스 접근 실패');
  }

  // ─────────────────────────────────────────────────────────
  // manifest 로드 (5분 캐시)
  // ─────────────────────────────────────────────────────────
  async function loadManifest(forceRefresh){
    const now = Date.now();
    if(!forceRefresh && manifestCache && (now - manifestCachedAt) < CONFIG.manifestTtlMs){
      log('manifest cached (memory)');
      return manifestCache;
    }
    
    const { text, source } = await fetchFromSources(CONFIG.manifestFile);
    const parsed = parseJsonSafe(text);
    if(!parsed || !parsed.files){
      throw new Error('manifest 구조가 올바르지 않음');
    }
    
    manifestCache = parsed;
    manifestCachedAt = now;
    log(`manifest loaded from [${source}], version=${parsed.manifestVersion}, files=${Object.keys(parsed.files).length}`);
    return parsed;
  }

  // ─────────────────────────────────────────────────────────
  // 핵심: 데이터 로드
  // ─────────────────────────────────────────────────────────
  async function loadInternal(key, options){
    options = options || {};
    const forceRefresh = !!options.forceRefresh;
    const skipHashCheck = !!options.skipHashCheck;
    
    // 1) manifest 확인
    const manifest = await loadManifest(forceRefresh);
    const fileInfo = manifest.files[key];
    if(!fileInfo){
      throw new Error(`알 수 없는 key: ${key} (사용 가능: ${Object.keys(manifest.files).join(', ')})`);
    }
    
    const expectedHash = fileInfo.sha256;
    const filename = fileInfo.filename;
    
    // 2) IndexedDB 캐시 확인 (해시 일치 시 재사용)
    if(!forceRefresh){
      const cached = await idbGet(key);
      if(cached && cached.sha256 === expectedHash && cached.data){
        log(`✅ [${key}] IndexedDB cache hit (sha256=${expectedHash.slice(0,10)}..)`);
        return {
          data: cached.data,
          source: 'indexeddb',
          count: fileInfo.count,
          sha256: expectedHash,
          filename
        };
      }
      if(cached){
        log(`[${key}] cache stale (hash mismatch), refetching...`);
      }
    }
    
    // 3) 네트워크에서 로드
    const { text, source, url } = await fetchFromSources(filename);
    
    // 4) SHA256 검증
    if(!skipHashCheck){
      const actualHash = await sha256Hex(text.replace(/^\uFEFF/, ''));
      if(actualHash !== expectedHash){
        error(`[${key}] SHA256 mismatch! expected=${expectedHash.slice(0,10)}.. actual=${actualHash.slice(0,10)}..`);
        throw new Error(`SHA256 검증 실패 (${key})`);
      }
      log(`[${key}] SHA256 verified ✓`);
    }
    
    // 5) JSON 파싱
    const data = parseJsonSafe(text);
    if(!data){
      throw new Error(`JSON 파싱 실패 (${key})`);
    }
    
    // 6) IndexedDB에 저장 (비동기, 실패해도 무시)
    idbSet(key, {
      sha256: expectedHash,
      filename,
      count: fileInfo.count,
      data,
      savedAt: new Date().toISOString()
    }).then(ok => {
      if(ok) log(`[${key}] saved to IndexedDB`);
    });
    
    log(`✅ [${key}] loaded from [${source}], ${(text.length/1024).toFixed(1)} KB`);
    return {
      data,
      source,
      count: fileInfo.count,
      sha256: expectedHash,
      filename
    };
  }

  // ─────────────────────────────────────────────────────────
  // 공개 API: load (중복 요청 병합)
  // ─────────────────────────────────────────────────────────
  function load(key, options){
    if(loadingPromises[key]){
      log(`[${key}] request already in progress, reusing promise`);
      return loadingPromises[key];
    }
    const p = loadInternal(key, options)
      .finally(()=>{ delete loadingPromises[key]; });
    loadingPromises[key] = p;
    return p;
  }

  // ─────────────────────────────────────────────────────────
  // 공개 API: 강제 새로고침
  // ─────────────────────────────────────────────────────────
  async function forceRefresh(){
    log('force refresh: clearing manifest cache + IndexedDB');
    manifestCache = null;
    manifestCachedAt = 0;
    await idbClear();
    return true;
  }

  // ─────────────────────────────────────────────────────────
  // 공개 API: 상태 조회
  // ─────────────────────────────────────────────────────────
  async function getStatus(){
    const status = {
      manifestCached: !!manifestCache,
      manifestAgeMs: manifestCache ? (Date.now() - manifestCachedAt) : null,
      indexedDb: {}
    };
    
    if(manifestCache){
      for(const key of Object.keys(manifestCache.files)){
        const cached = await idbGet(key);
        status.indexedDb[key] = cached ? {
          count: cached.count,
          sha256Match: cached.sha256 === manifestCache.files[key].sha256,
          savedAt: cached.savedAt
        } : null;
      }
    }
    return status;
  }

  // ─────────────────────────────────────────────────────────
  // 공개 API 등록
  // ─────────────────────────────────────────────────────────
  global.staticDbLoader = {
    version: '1.0.0',
    load,
    forceRefresh,
    getStatus,
    // 편의 함수
    loadRiskAssessmentDB: (opts)=> load('riskAssessmentDB', opts),
    loadWorkDatabase: (opts)=> load('workDatabase', opts)
  };

  log('db-loader v1.0.0 initialized');
  log('sources:', CONFIG.sources.map(s=>s.name).join(' → '));
})(window);
