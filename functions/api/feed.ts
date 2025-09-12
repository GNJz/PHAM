export async function onRequestGet({ env }: { env: any }) {
  const list = await env.PHAM_POSTS.list({ prefix: "post:" });
  const posts: any[] = [];
  for (const key of list.keys) {
    const val = await env.PHAM_POSTS.get(key.name);
    if (val) posts.push(JSON.parse(val));
  }
  posts.sort((a, b) => b.created_at - a.created_at);
  return new Response(JSON.stringify(posts), {
    headers: { "Content-Type": "application/json" },
  });
}


