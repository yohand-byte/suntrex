/**
 * SUNTREX — VAT Verification via VIES API
 * Netlify Function: /.netlify/functions/verify-vat
 * 
 * Server-side only. Calls EU VIES SOAP service to validate VAT numbers.
 * Stores result in Supabase for audit trail.
 * 
 * ⚠️  Uses SUPABASE_SERVICE_ROLE_KEY (server-only, bypasses RLS)
 */

const { createClient } = require('@supabase/supabase-js');

// VIES SOAP endpoint
const VIES_URL = 'https://ec.europa.eu/taxation_customs/vies/services/checkVatService';

// Create Supabase admin client (server-side only)
function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// SOAP request template for VIES
function buildSoapRequest(countryCode, vatNumber) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soapenv:Header/>
  <soapenv:Body>
    <urn:checkVat>
      <urn:countryCode>${countryCode}</urn:countryCode>
      <urn:vatNumber>${vatNumber}</urn:vatNumber>
    </urn:checkVat>
  </soapenv:Body>
</soapenv:Envelope>`;
}

// Parse SOAP response
function parseSoapResponse(xml) {
  const getTag = (tag) => {
    const match = xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`, 's'));
    return match ? match[1].trim() : null;
  };

  return {
    valid: getTag('valid') === 'true',
    name: getTag('name') || null,
    address: getTag('address') || null,
    countryCode: getTag('countryCode') || null,
    vatNumber: getTag('vatNumber') || null,
  };
}

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { vatNumber, countryCode, companyId } = JSON.parse(event.body);

    if (!vatNumber || !countryCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'vatNumber and countryCode are required' }),
      };
    }

    // Clean VAT number: remove spaces, dashes, country prefix if present
    let cleanVat = vatNumber.replace(/[\s.-]/g, '').toUpperCase();
    const cleanCountry = countryCode.toUpperCase();

    // Remove country prefix if user included it
    if (cleanVat.startsWith(cleanCountry)) {
      cleanVat = cleanVat.slice(cleanCountry.length);
    }
    // Special case: ATU prefix
    if (cleanCountry === 'AT' && cleanVat.startsWith('ATU')) {
      cleanVat = cleanVat.slice(3);
    }

    // Call VIES SOAP API
    const soapBody = buildSoapRequest(cleanCountry, cleanVat);

    const viesResponse = await fetch(VIES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': '',
      },
      body: soapBody,
    });

    if (!viesResponse.ok) {
      // VIES is often down — return graceful degradation
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          valid: null,
          error: 'Service VIES temporairement indisponible. Vérification reportée.',
          service_unavailable: true,
        }),
      };
    }

    const xml = await viesResponse.text();
    const result = parseSoapResponse(xml);

    // Log verification in Supabase (audit trail)
    try {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin.from('vat_verifications').insert({
        company_id: companyId || null,
        vat_number: `${cleanCountry}${cleanVat}`,
        country_code: cleanCountry,
        is_valid: result.valid,
        company_name: result.name,
        company_address: result.address,
        raw_response: result,
      });
    } catch (dbErr) {
      // Non-blocking: verification still returns to user even if logging fails
      console.error('[verify-vat] DB logging error:', dbErr.message);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: result.valid,
        company: result.name !== '---' ? result.name : null,
        address: result.address !== '---' ? result.address : null,
        country: result.countryCode,
        vatNumber: `${cleanCountry}${cleanVat}`,
      }),
    };

  } catch (err) {
    console.error('[verify-vat] Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erreur interne du serveur' }),
    };
  }
};
