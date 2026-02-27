export function serializeRequestBody(body) {
  if (body == null) return "";
  if (typeof body === "string") return body;
  if (Buffer.isBuffer(body)) return body.toString("utf8");
  return JSON.stringify(body);
}

export function buildNetlifyEvent(req, rawBody) {
  return {
    httpMethod: req.method,
    headers: req.headers || {},
    queryStringParameters: req.query || {},
    body: rawBody ?? serializeRequestBody(req.body),
    isBase64Encoded: false,
    rawUrl: req.url,
  };
}

export async function readRawBody(req) {
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function runNetlifyHandler(handler, req, res, options = {}) {
  const event = buildNetlifyEvent(req, options.rawBody);
  const result = await handler(event, {});

  const statusCode = result?.statusCode ?? 200;
  const headers = result?.headers || {};
  const body = result?.body ?? "";

  for (const [key, value] of Object.entries(headers)) {
    if (typeof value !== "undefined") {
      res.setHeader(key, value);
    }
  }

  return res.status(statusCode).send(body);
}
