document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('part3_qquarts');
  if(!el) return;
  el.innerHTML = `
    <section class="qqu-hero">
      <h2>Qquarts co.</h2>
      <p>실험·프로토타입을 작게 쌓아 올리는 PHAM의 엔지니어링 허브. 
         지금은 v0 — 가볍게 시작해서 확장 쉽게.</p>
      <div class="qqu-actions">
        <a href="#memo_4" class="qqu-btn">잡담(로그) 보기</a>
        <button class="qqu-btn" id="qqu-refresh">새로고침</button>
      </div>
    </section>
    <div class="qqu-grid" id="qqu-cards">
      <div class="qqu-card">
        <h3>Labs</h3>
        <p>작은 실험 단위로 진행. 실패도 기록.</p>
      </div>
      <div class="qqu-card">
        <h3>Posts</h3>
        <p>페북/스레드 복붙 → posts.json 렌더.</p>
      </div>
      <div class="qqu-card">
        <h3>Roadmap</h3>
        <p>척수→해마→소뇌 순서로, 최소 기능부터.</p>
      </div>
    </div>
  `;
  const btn = document.getElementById('qqu-refresh');
  if(btn) btn.addEventListener('click', () => location.reload());
});


