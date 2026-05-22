const API_ORIGIN = "https://api.vkeys.cn";
const ALLOWED_PREFIX = "/v2/music/";
const TIMEOUT_MS = 15000;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Cache-Control": "no-store"
  };
}

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function routePath(params) {
  const value = params && params.path;
  if (Array.isArray(value)) return `/${value.join("/")}`;
  return `/${String(value || "")}`;
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const pathname = routePath(context.params);
  if (!pathname.startsWith(ALLOWED_PREFIX)) {
    return jsonResponse({ code: 403, message: "Unsupported API path", data: null }, 403);
  }

  const sourceUrl = new URL(context.request.url);
  const targetUrl = new URL(pathname, API_ORIGIN);
  sourceUrl.searchParams.forEach((value, key) => targetUrl.searchParams.set(key, value));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), TIMEOUT_MS);
  try {
    const upstream = await fetch(targetUrl.toString(), {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cf: { cacheTtl: 0, cacheEverything: false }
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        ...corsHeaders(),
        "Content-Type": upstream.headers.get("Content-Type") || "application/json; charset=utf-8"
      }
    });
  } catch (error) {
    const timeout = error && (error.name === "AbortError" || error === "timeout");
    return jsonResponse({
      code: 504,
      message: timeout ? "API request timeout" : "API proxy request failed",
      data: null
    }, timeout ? 504 : 502);
  } finally {
    clearTimeout(timer);
  }
}
