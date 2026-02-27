import { createRequire } from "module";
import {
  readRawBody,
  runNetlifyHandler,
} from "../lib/vercel/netlifyAdapter.js";

const require = createRequire(import.meta.url);
const { handler } = require("../lib/vercel/handlers/stripe-webhook.cjs");

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function vercelStripeWebhook(req, res) {
  const rawBody = await readRawBody(req);
  return runNetlifyHandler(handler, req, res, { rawBody });
}
