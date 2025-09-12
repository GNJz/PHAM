async function loadChatManifest(){
  const r = await fetch('posts/chat/manifest.json', {cache:'no-cache'});
  return (await r.json()).posts || [];
}
async function fetchChatMd(file){
  const r = await fetch(`posts/chat/${file}`, {cache:'no-cache'});
  return await r.text();
}
function mdLite(md){
  return md
    .replace(/^### (.*)$/gm,'<h3>$1</h3>')
    .replace(/^## (.*)$/gm,'<h2>$1</h2>')
    .replace(/^# (.*)$/gm,'<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\n{2,}/g,'</p><p>')
    .replace(/^/, '<p>').concat('</p>');
}
async function renderChat(){
  const wrap=document.getElementById('chatFeed');
  if(!wrap) return;
  try{
    const posts=await loadChatManifest();
    posts.sort((a,b)=>(a.created_at<b.created_at?1:-1));
    wrap.innerHTML='';
    for(const p of posts){
      const raw=await fetchChatMd(p.file);
      const title=p.title||raw.split('\n')[0].replace(/^#\s*/,'');
      const when=new Date(p.created_at||Date.now()).toLocaleString();
      const card=document.createElement('article');
      card.className='chat-card';
      card.innerHTML=`<h3>${title}</h3><div class="meta">${when}</div><div>${mdLite(raw)}</div><hr/>`;
      wrap.appendChild(card);
    }
  }catch(_){
    // ignore
  }
}
document.addEventListener('DOMContentLoaded',renderChat);


