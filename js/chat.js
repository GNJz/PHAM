;(async function () {
  const SEC_ID = 'memo_4'; // 잡담 섹션
  const wrap = document.getElementById(SEC_ID);
  if (!wrap) return;

  // 스타일(모바일 가독성)
  const style = document.createElement('style');
  style.textContent = `
    #${SEC_ID} { max-width: 760px; margin: 0 auto; line-height: 1.8; font-size: 18px; }
    #${SEC_ID} .post { padding: 16px 0; border-bottom: 1px solid #eee; }
    #${SEC_ID} .post h2 { margin: 0 0 8px; font-size: 22px; }
    #${SEC_ID} .meta { color: #666; font-size: 13px; margin-bottom: 10px; }
    #${SEC_ID} .body { white-space: pre-wrap; word-break: break-word; }
    @media (max-width:600px){ #${SEC_ID}{ font-size: 17px; padding: 12px; } }
  `;
  document.head.appendChild(style);

  // 마크다운 아주 간단 변환(헤더/리스트 정도만)
  const md = (t) => (t || '')
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/^\- (.*)$/gm, '• $1');

  try {
    // 데이터 로드
    const meta = await fetch('posts/index.json', { cache: 'no-store' }).then(r => r.json());
    const posts = (meta.posts || [])
      .filter(p => p.section === SEC_ID)
      .sort((a,b) => (a.created < b.created ? 1 : -1)); // 최신 우선

    wrap.innerHTML = posts.length ? '' : '<p>아직 게시글이 없습니다.</p>';

    for (const p of posts) {
      const body = await fetch(`posts/${p.id}.md`, { cache: 'no-store' })
        .then(r => r.text())
        .catch(()=>'(본문을 불러오지 못했습니다)');
      const el = document.createElement('article');
      el.className = 'post';
      el.innerHTML = `
        <h2>${p.title || ''}</h2>
        <div class="meta">${new Date(p.created).toLocaleString()} · ${(p.tags||[]).join(', ')}</div>
        <div class="body">${md(body)}</div>
      `;
      wrap.appendChild(el);
    }
  } catch (e) {
    console.error(e);
  }
})();


