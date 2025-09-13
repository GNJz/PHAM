(function(){
  // ===== v0 설정 =====
  const LS_KEY = 'pham_memo4_posts_v1';
  const DRAFT_KEY = 'pham_memo4_draft_v1';
  const OWNER_FLAG = 'pham_owner_ok_v1';
  const OWNER_PASSPHRASE = 'pham-admin'; // ← 원하면 바꿔. (v0은 진짜 보안 아님)

  // memo_4 섹션 등장 감지 → UI 주입
  document.addEventListener('DOMContentLoaded', () => {
    const target = document.getElementById('memo_4');
    if (!target) return;

    // memo_4가 활성화될 때 초기화
    const obs = new MutationObserver(() => {
      if (target.classList.contains('active')) initMemo4(target);
    });
    obs.observe(target, {attributes: true, attributeFilter: ['class']});

    // 첫 로딩이 memo_4면 즉시 초기화
    if (target.classList.contains('active')) initMemo4(target);
  });

  function initMemo4(root){
    if (root.dataset.inited) return;
    root.dataset.inited = '1';

    // 래퍼 & 오너바 & 컴포저 & 리스트
    root.innerHTML = `
      <div id="memo4-wrap">
        <div id="memo4-ownerbar">
          <div>🗨️ <b>잡담 모드</b> — 개인 글쓰기 v0 (로컬 저장)</div>
          <div class="right">
            <button id="memo4-owner-enter" class="memo4-btn">🔒 소유자 모드</button>
            <button id="memo4-export" class="memo4-btn">⬇️ JSON 내보내기</button>
            <label class="memo4-btn">
              ⬆️ JSON 불러오기
              <input id="memo4-import" type="file" accept="application/json" style="display:none">
            </label>
          </div>
        </div>

        <div id="memo4-composer">
          <input id="m4-title" type="text" placeholder="제목 (선택)">
          <textarea id="m4-body" placeholder="여기에 바로 붙여넣기 (Facebook/Threads 텍스트 그대로 OK)"></textarea>
          <div style="display:flex;gap:8px;align-items:center;margin:8px 0;">
            <input id="m4-files" type="file" accept="image/*,video/*" multiple>
            <span style="font-size:12px;color:#666">이미지/동영상 선택 가능(데이터 URL 저장)</span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button id="m4-publish" class="memo4-btn primary">게시</button>
            <button id="m4-draft-save" class="memo4-btn">임시 저장</button>
            <button id="m4-draft-load" class="memo4-btn">임시 불러오기</button>
            <button id="m4-clear" class="memo4-btn warn">입력 지우기</button>
          </div>
        </div>

        <div id="memo4-list"></div>
      </div>
    `;

    const el = {
      enter: root.querySelector('#memo4-owner-enter'),
      composer: root.querySelector('#memo4-composer'),
      title: root.querySelector('#m4-title'),
      body: root.querySelector('#m4-body'),
      files: root.querySelector('#m4-files'),
      pub: root.querySelector('#m4-publish'),
      dsave: root.querySelector('#m4-draft-save'),
      dload: root.querySelector('#m4-draft-load'),
      clear: root.querySelector('#m4-clear'),
      list: root.querySelector('#memo4-list'),
      exportBtn: root.querySelector('#memo4-export'),
      importInput: root.querySelector('#memo4-import'),
    };

    // 소유자 모드 여부
    if (sessionStorage.getItem(OWNER_FLAG) === '1') {
      showOwner(el);
    }

    el.enter.addEventListener('click', () => {
      if (sessionStorage.getItem(OWNER_FLAG) === '1') {
        sessionStorage.removeItem(OWNER_FLAG);
        hideOwner(el);
      } else {
        const pass = prompt('소유자 패스문구를 입력하세요:');
        if (pass && pass === OWNER_PASSPHRASE) {
          sessionStorage.setItem(OWNER_FLAG, '1');
          showOwner(el);
        } else {
          alert('패스가 올바르지 않습니다 (v0, 진짜 보안 아님)');
        }
      }
    });

    el.pub.addEventListener('click', async () => {
      if (!isOwner()) return alert('소유자 모드에서만 게시 가능(v0)');
      const record = await buildRecord(el);
      if (!record.body && record.images.length === 0 && record.videos.length === 0) {
        return alert('내용 또는 파일이 필요합니다.');
      }
      const posts = loadPosts();
      posts.unshift(record);
      savePosts(posts);
      clearComposer(el);
      renderList(el);
    });

    el.dsave.addEventListener('click', () => {
      const draft = { title: el.title.value, body: el.body.value };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      alert('임시 저장 완료');
    });

    el.dload.addEventListener('click', () => {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return alert('저장된 초안이 없습니다.');
      const draft = JSON.parse(raw);
      el.title.value = draft.title || '';
      el.body.value = draft.body || '';
    });

    el.clear.addEventListener('click', () => clearComposer(el));

    el.exportBtn.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(loadPosts(), null, 2)], {type:'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `memo4_posts_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

    el.importInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      try{
        const incoming = JSON.parse(text);
        if (!Array.isArray(incoming)) throw new Error('JSON은 배열이어야 합니다.');
        const now = loadPosts();
        // 중복 방지: id 기준
        const ids = new Set(now.map(p=>p.id));
        const merged = [...now, ...incoming.filter(p=>!ids.has(p.id))];
        savePosts(merged);
        renderList(el);
        alert(`불러오기 완료: ${incoming.length}개(중복 제외 후 ${merged.length-now.length}개 추가)`);
      }catch(err){
        alert('불러오기 실패: '+err.message);
      } finally {
        e.target.value = '';
      }
    });

    // 페이스트에서 이미지/파일도 잡기
    el.body.addEventListener('paste', async (ev) => {
      if (!ev.clipboardData) return;
      const items = ev.clipboardData.items;
      if (!items) return;
      for (const it of items) {
        if (it.kind === 'file') {
          const f = it.getAsFile();
          if (f) el.files.files = await filesAppend(el.files.files, [f]);
        }
      }
    });

    renderList(el);
  }

  function isOwner(){ return sessionStorage.getItem(OWNER_FLAG) === '1'; }

  function showOwner(el){
    el.composer.classList.add('show');
    el.enter.textContent = '🔓 소유자 모드 (끄기)';
  }
  function hideOwner(el){
    el.composer.classList.remove('show');
    el.enter.textContent = '🔒 소유자 모드';
  }

  function loadPosts(){
    try{ return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
    catch{ return []; }
  }
  function savePosts(arr){
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  }

  function clearComposer(el){
    el.title.value = '';
    el.body.value = '';
    el.files.value = '';
  }

  async function buildRecord(el){
    const id = 'p_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);
    const media = await readFiles(el.files.files);
    // 간단 붙여넣기 클리너(추적 파라미터 제거 정도)
    const cleaned = el.body.value.replace(/([?&])(fbclid|utm_[^=]+)=[^&]+/g, '').trim();
    return {
      id,
      title: el.title.value.trim(),
      body: cleaned,
      images: media.images,
      videos: media.videos,
      createdAt: new Date().toISOString()
    };
  }

  async function readFiles(fileList){
    const images = [], videos = [];
    if (!fileList || fileList.length===0) return {images, videos};
    for (const f of fileList){
      const dataURL = await fileToDataURL(f);
      if (f.type.startsWith('image/')) images.push({name: f.name, dataURL});
      else if (f.type.startsWith('video/')) videos.push({name: f.name, dataURL});
    }
    return {images, videos};
  }

  function fileToDataURL(file){
    return new Promise((res, rej)=>{
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  async function filesAppend(existing, add){ // v0 더미(필요시 확장)
    return existing;
  }

  function renderList(el){
    const posts = loadPosts();
    if (posts.length===0){
      el.list.innerHTML = `<div style="color:#666">아직 게시글이 없습니다. (오른쪽 위 ‘소유자 모드’ → 게시)</div>`;
      return;
    }
    el.list.innerHTML = posts.map(p => cardHTML(p)).join('');
    // 버튼 동작(삭제/복사 등)
    el.list.querySelectorAll('[data-act="del"]').forEach(btn=>{
      btn.onclick = () => {
        if (!isOwner()) return alert('소유자 모드 필요');
        const id = btn.dataset.id;
        const next = loadPosts().filter(x=>x.id!==id);
        savePosts(next);
        renderList(el);
      };
    });
    el.list.querySelectorAll('[data-act="copy"]').forEach(btn=>{
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const p = loadPosts().find(x=>x.id===id);
        if (!p) return;
        const text = (p.title?`[${p.title}]\n`:'') + p.body;
        try{
          await navigator.clipboard.writeText(text);
          btn.textContent='✓ 복사됨';
          setTimeout(()=>btn.textContent='복사',1200);
        }catch{
          alert('클립보드 복사 실패');
        }
      };
    });
  }

  function cardHTML(p){
    const when = new Date(p.createdAt).toLocaleString();
    const imgs = (p.images||[]).map(im=>`<img src="${im.dataURL}" alt="${im.name}">`).join('');
    const vids = (p.videos||[]).map(v=>`<div style="margin-top:8px"><video controls style="max-width:100%"><source src="${v.dataURL}"></video></div>`).join('');
    const title = p.title ? `<div class="memo4-title">${escapeHTML(p.title)}</div>` : '';
    return `
      <article class="memo4-card" id="${p.id}">
        ${title}
        <div class="memo4-meta">${when}</div>
        <div class="memo4-body" style="white-space:pre-wrap;word-break:break-word">${linkify(escapeHTML(p.body))}</div>
        ${imgs?`<div class="memo4-images">${imgs}</div>`:''}
        ${vids||''}
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="memo4-btn" data-act="copy" data-id="${p.id}">복사</button>
          <button class="memo4-btn warn" data-act="del" data-id="${p.id}">삭제</button>
        </div>
      </article>
    `;
  }

  function escapeHTML(s){ return (s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&apos;' })[m]); }
  function linkify(text){
    return (text||'').replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }
})();
