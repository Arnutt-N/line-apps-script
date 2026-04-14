const encoder = new TextEncoder();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const configOk = Boolean(env.GAS_WEBHOOK_URL && env.LINE_CHANNEL_SECRET && env.GAS_PROXY_TOKEN);

    if (url.pathname === "/health") {
      return jsonResponse({
        ok: configOk,
        service: "line-oa-webhook-proxy",
        gasWebhookConfigured: Boolean(env.GAS_WEBHOOK_URL),
        lineSecretConfigured: Boolean(env.LINE_CHANNEL_SECRET),
        proxyTokenConfigured: Boolean(env.GAS_PROXY_TOKEN),
      }, configOk ? 200 : 503);
    }

    if (url.pathname !== "/" && url.pathname !== "/webhook") {
      return jsonResponse({ ok: false, error: "Not found" }, 404);
    }

    if (request.method !== "POST") {
      return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
    }

    const requestId = crypto.randomUUID();

    try {
      assertConfig(env);

      const signature = request.headers.get("x-line-signature");
      if (!signature) {
        return jsonResponse({ ok: false, error: "Missing X-Line-Signature" }, 401, requestId);
      }

      const rawBody = await request.text();
      const verified = await verifyLineSignature(env.LINE_CHANNEL_SECRET, rawBody, signature);
      if (!verified) {
        return jsonResponse({ ok: false, error: "Invalid LINE signature" }, 401, requestId);
      }

      const lineWebhook = parseJson(rawBody);
      if (!lineWebhook || !Array.isArray(lineWebhook.events) || typeof lineWebhook.destination !== "string") {
        return jsonResponse({ ok: false, error: "Invalid LINE webhook payload" }, 400, requestId);
      }

      const upstreamResponse = await fetch(normalizeGasWebhookUrl(env.GAS_WEBHOOK_URL), {
        method: "POST",
        headers: {
          "content-type": "application/json; charset=utf-8",
          "user-agent": "line-oa-webhook-proxy/1.0",
          "x-proxy-request-id": requestId,
        },
        body: JSON.stringify({
          proxyToken: env.GAS_PROXY_TOKEN,
          lineWebhook: lineWebhook,
        }),
        redirect: "follow",
      });

      console.log(JSON.stringify({
        level: "info",
        message: "forwarded webhook",
        requestId: requestId,
        upstreamStatus: upstreamResponse.status,
        redirected: upstreamResponse.redirected,
        eventCount: lineWebhook.events.length,
      }));

      const responseHeaders = new Headers(upstreamResponse.headers);
      responseHeaders.set("x-proxy-request-id", requestId);
      responseHeaders.set("cache-control", "no-store");
      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error(JSON.stringify({
        level: "error",
        message: "proxy failure",
        requestId: requestId,
        error: error && error.message ? error.message : String(error),
      }));
      return jsonResponse({ ok: false, error: "Proxy failure" }, 502, requestId);
    }
  },
};

function assertConfig(env) {
  if (!env.LINE_CHANNEL_SECRET) {
    throw new Error("Missing LINE_CHANNEL_SECRET");
  }
  if (!env.GAS_WEBHOOK_URL) {
    throw new Error("Missing GAS_WEBHOOK_URL");
  }
  if (!env.GAS_PROXY_TOKEN) {
    throw new Error("Missing GAS_PROXY_TOKEN");
  }
}

function normalizeGasWebhookUrl(value) {
  const url = new URL(String(value || "").trim());
  if (url.protocol !== "https:") {
    throw new Error("GAS_WEBHOOK_URL must use https");
  }
  return url.toString();
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

async function verifyLineSignature(secret, bodyText, signatureHeader) {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const signature = decodeBase64(signatureHeader);
    return crypto.subtle.verify("HMAC", key, signature, encoder.encode(bodyText));
  } catch (error) {
    return false;
  }
}

function decodeBase64(value) {
  const normalized = String(value || "").trim();
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function jsonResponse(payload, status = 200, requestId) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });

  if (requestId) {
    headers.set("x-proxy-request-id", requestId);
  }

  return new Response(JSON.stringify(payload), {
    status: status,
    headers: headers,
  });
}
