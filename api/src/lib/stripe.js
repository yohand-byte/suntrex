let stripeClient = null;

function getStripeClient() {
  if (stripeClient) return stripeClient;
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  stripeClient = require("stripe")(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });
  return stripeClient;
}

module.exports = { getStripeClient };
