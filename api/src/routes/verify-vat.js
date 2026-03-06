/**
 * verify-vat.js — SUNTREX VAT Verification via VIES API (Fastify)
 *
 * Server-side only. Calls EU VIES SOAP service to validate VAT numbers.
 * Stores result in Supabase for audit trail.
 */

const { getSupabaseAdmin } = require("../lib/supabase");

// VIES SOAP endpoint
const VIES_URL = "https://ec.europa.eu/taxation_customs/vies/services/checkVatService";

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
    const match = xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`, "s"));
    return match ? match[1].trim() : null;
  };

  return {
    valid: getTag("valid") === "true",
    name: getTag("name") || null,
    address: getTag("address") || null,
    countryCode: getTag("countryCode") || null,
    vatNumber: getTag("vatNumber") || null,
  };
}

async function routes(fastify) {
  fastify.post("/verify-vat", async (request, reply) => {
    try {
      const { vatNumber, countryCode, companyId } = request.body || {};

      if (!vatNumber || !countryCode) {
        return reply.code(400).send({ error: "vatNumber and countryCode are required" });
      }

      // Clean VAT number: remove spaces, dashes, country prefix if present
      let cleanVat = vatNumber.replace(/[\s.-]/g, "").toUpperCase();
      const cleanCountry = countryCode.toUpperCase();

      // Remove country prefix if user included it
      if (cleanVat.startsWith(cleanCountry)) {
        cleanVat = cleanVat.slice(cleanCountry.length);
      }
      // Special case: ATU prefix
      if (cleanCountry === "AT" && cleanVat.startsWith("ATU")) {
        cleanVat = cleanVat.slice(3);
      }

      // Call VIES SOAP API
      const soapBody = buildSoapRequest(cleanCountry, cleanVat);

      const viesResponse = await fetch(VIES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml;charset=UTF-8",
          SOAPAction: "",
        },
        body: soapBody,
      });

      if (!viesResponse.ok) {
        // VIES is often down — return graceful degradation
        return reply.code(200).send({
          valid: null,
          error: "Service VIES temporairement indisponible. Vérification reportée.",
          service_unavailable: true,
        });
      }

      const xml = await viesResponse.text();
      const result = parseSoapResponse(xml);

      // Log verification in Supabase (audit trail)
      try {
        const supabaseAdmin = getSupabaseAdmin();
        await supabaseAdmin.from("vat_verifications").insert({
          company_id: companyId || null,
          vat_number: `${cleanCountry}${cleanVat}`,
          country_code: cleanCountry,
          is_valid: result.valid,
          company_name: result.name,
          company_address: result.address,
          raw_response: result,
        });
      } catch (dbErr) {
        console.error("[verify-vat] DB logging error:", dbErr.message);
      }

      return reply.code(200).send({
        valid: result.valid,
        company: result.name !== "---" ? result.name : null,
        address: result.address !== "---" ? result.address : null,
        country: result.countryCode,
        vatNumber: `${cleanCountry}${cleanVat}`,
      });
    } catch (err) {
      console.error("[verify-vat] Error:", err);
      return reply.code(500).send({ error: "Erreur interne du serveur" });
    }
  });
}

module.exports = routes;
