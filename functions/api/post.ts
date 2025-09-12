export async function onRequestPost({ request, env }: { request: Request; env: any }) {
  const secret = request.headers.get("x-admin-secret");
  if (secret !== env.ADMIN_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  let data: any;
  try {
    data = await request.json();
  } catch (_) {
    return new Response("Invalid JSON", { status: 400 });
  }

  const id = crypto.randomUUID();
  const post = {
    id,
    body: data.body || "",
    title: data.title || data.body?.slice(0, 20) || "Untitled",
    created_at: Date.now(),
  };
  await env.PHAM_POSTS.put(`post:${id}`, JSON.stringify(post));
  return new Response(JSON.stringify(post), {
    headers: { "Content-Type": "application/json" },
  });
}


