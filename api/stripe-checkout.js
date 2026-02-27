import { createRequire } from "module";
import { runNetlifyHandler } from "../lib/vercel/netlifyAdapter.js";

const require = createRequire(import.meta.url);
const { handler } = require("../lib/vercel/handlers/stripe-checkout.cjs");

export default async function vercelStripeCheckout(req, res) {
  return runNetlifyHandler(handler, req, res);
}
