// SUNTREX — Gemini / Vertex AI shared client
// Uses Application Default Credentials (automatic on Cloud Run)

const { GoogleAuth } = require('google-auth-library');

const PROJECT_ID = process.env.GCP_PROJECT_ID || 'suntrex-marketplace';
const LOCATION = 'europe-west1';
const MODEL = 'gemini-2.0-flash';

let _auth = null;

function getAuth() {
  if (!_auth) {
    _auth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' });
  }
  return _auth;
}

async function callGemini({ contents, systemInstruction, generationConfig = {} }) {
  const auth = getAuth();
  const client = await auth.getClient();
  const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

  const body = {
    contents,
    ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topP: 0.9,
      ...generationConfig,
    },
  };

  const response = await client.request({ url, method: 'POST', data: body });
  const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  return { text, raw: response.data };
}

module.exports = { callGemini, PROJECT_ID, LOCATION, MODEL };
