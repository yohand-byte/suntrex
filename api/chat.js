const SYSTEM_PROMPT = `Tu es l'assistant support de SUNTREX, la marketplace B2B de matériel photovoltaïque en Europe.

Ton rôle :
- Aider les professionnels du solaire (installateurs, distributeurs, grossistes) avec leurs questions
- Suivi de commandes, retours/SAV, facturation, conseil produits
- Spécialités : panneaux solaires, onduleurs (Huawei, Deye, Enphase), batteries, câbles, structures de montage

Règles :
- Réponds en français, de manière concise et professionnelle (3-4 phrases max)
- Pour le suivi de commande → oriente vers "Mes achats > Transactions"
- Pour les retours/SAV → support@suntrex.com avec n° de commande, délai 14 jours
- Pour la facturation → "Mes achats > Factures" ou compta@suntrex.com
- Si hors scope → "Pour cette question, contactez notre équipe à support@suntrex.com"
- Ne donne jamais de prix spécifiques, oriente vers le catalogue
- Sois amical mais professionnel, tutoiement accepté`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: messages.map(({ role, content }) => ({ role, content })),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', response.status, err);
      return res.status(502).json({ error: 'AI service error' });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || '';

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
