const TIMEOUT_MS = 20000;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Range, Content-Type, Accept",
    "Cache-Control": "no-store"
  };
}

function badRequest(message, status) {
  return new Response(message, {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch (error) {
    return null;
  }
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequest(context) {
  const requestUrl = new URL(context.request.url);
  const targetUrl = safeUrl(requestUrl.searchParams.get("url") || "");
  if (!targetUrl) return badRequest("Missing or invalid audio url", 400);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), TIMEOUT_MS);
  try {
    const headers = new Headers();
    const range = context.request.headers.get("Range");
    if (range) headers.set("Range", range);
    headers.set("Accept", "*/*");

    const upstream = await fetch(targetUrl.toString(), {
      method: context.request.method === "HEAD" ? "HEAD" : "GET",
      signal: controller.signal,
      headers,
      cf: { cacheTtl: 0, cacheEverything: false }
    });

    const responseHeaders = new Headers(corsHeaders());
    [
      "Accept-Ranges",
      "Content-Length",
      "Content-Range",
      "Content-Type",
      "ETag",
      "Last-Modified"
    ].forEach((key) => {
      const value = upstream.headers.get(key);
      if (value) responseHeaders.set(key, value);
    });
    if (!responseHeaders.has("Content-Type")) responseHeaders.set("Content-Type", "audio/mpeg");

    return new Response(context.request.method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      headers: responseHeaders
    });
  } catch (error) {
    return badRequest("Audio proxy request failed", error && error.name === "AbortError" ? 504 : 502);
  } finally {
    clearTimeout(timer);
  }
}
