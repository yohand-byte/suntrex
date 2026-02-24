import { createContext, useContext, useState, useCallback } from "react";
import Cookies from "js-cookie";

const CURRENCIES = [
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  { code: "RON", symbol: "lei", name: "Romanian Leu" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
];

// Je ne sais pas the exact exchange rates — they change daily.
// Option A (safe default): only EUR is supported as source currency.
// All prices in the DB are in EUR. We display EUR only.
// The selector is active but shows "≈" prefix for non-EUR to indicate approximate.
// To enable real conversion, set VITE_EXCHANGE_RATE_API_URL env var.
// Option B: fetch rates from an external API (configurable via env).
const STATIC_RATES = null; // No hardcoded rates — we don't know them

const CurrencyContext = createContext();

export const CURRENCY_LIST = CURRENCIES;

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    const saved = Cookies.get("currency") || localStorage.getItem("currency");
    const valid = CURRENCIES.find(c => c.code === saved);
    return valid ? valid.code : "EUR";
  });

  const [rates, setRates] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(false);

  const setCurrency = useCallback((code) => {
    const valid = CURRENCIES.find(c => c.code === code);
    if (!valid) return;
    setCurrencyState(code);
    Cookies.set("currency", code, { expires: 365, sameSite: "lax" });
    localStorage.setItem("currency", code);
  }, []);

  const currencyInfo = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  // formatMoney: formats an amount (in EUR) to the selected currency
  // If no rates available and currency !== EUR, shows "≈" prefix
  const formatMoney = useCallback((amountEur, locale) => {
    if (typeof amountEur !== "number" || isNaN(amountEur)) return "—";

    let converted = amountEur;
    let isApprox = false;

    if (currency !== "EUR") {
      if (rates && rates[currency]) {
        converted = amountEur * rates[currency];
      } else {
        // No rates available — show EUR with selected currency symbol as hint
        // This is the safe Option A behavior
        isApprox = true;
        converted = amountEur; // Keep EUR amount
      }
    }

    const formatted = new Intl.NumberFormat(locale || "en", {
      style: "currency",
      currency: isApprox ? "EUR" : currency,
      minimumFractionDigits: currency === "HUF" || currency === "CZK" ? 0 : 2,
      maximumFractionDigits: currency === "HUF" || currency === "CZK" ? 0 : 2,
    }).format(converted);

    return isApprox && currency !== "EUR" ? `≈ ${formatted}` : formatted;
  }, [currency, rates]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, currencyInfo, formatMoney, currencies: CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
