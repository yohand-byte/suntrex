import { createRequire } from "module";
import { runNetlifyHandler } from "../lib/vercel/netlifyAdapter.js";

const require = createRequire(import.meta.url);
const { handler } = require("../lib/vercel/handlers/stripe-connect.cjs");

export default async function vercelStripeConnect(req, res) {
  return runNetlifyHandler(handler, req, res);
}
