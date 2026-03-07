import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const localeRoot = path.join(root, "src", "i18n", "locales");
const legacyLocales = path.join(root, "src", "locales");
const languages = ["fr", "en", "de", "es", "it", "pl", "el"];
const namespaces = ["common", "homepage", "catalog", "auth", "dashboard", "delivery", "chat"];

const requiredKeys = [
  ["common", "header.nav.allProducts"],
  ["common", "footer.columns.navigation"],
  ["homepage", "whySuntrex.title"],
  ["homepage", "mockups.dashboard.title"],
  ["homepage", "products.available"],
  ["catalog", "filters.search"],
  ["auth", "login.title"],
  ["dashboard", "mobileTabs.buy"],
  ["delivery", "deliveryVerification.headerTitle"],
  ["delivery", "escrowStatus.title"],
  ["chat", "supportChat.homeTitle"],
  ["chat", "supportChat.responses.tracking"],
];

const codeChecks = [
  {
    file: "src/pages/HomePage.jsx",
    patterns: [/\bt\("home\./, /\bt\("common\./, /useTranslation\(\["translation"/],
  },
  {
    file: "src/AnimatedMockups.jsx",
    patterns: [/\bt\("mockups\./, /useTranslation\(\["translation"/],
  },
  {
    file: "src/components/chat/SuntrexSupportChat.jsx",
    patterns: [/\bt\("supportChat\./, /useTranslation\(\["translation"/],
  },
  {
    file: "src/components/dashboard/DashboardLayout.jsx",
    patterns: [/useTranslation\(\["translation"/],
  },
  {
    file: "src/components/delivery/DeliveryVerification.jsx",
    patterns: [/useTranslation\(\["translation"/],
  },
  {
    file: "src/components/escrow/EscrowStatus.jsx",
    patterns: [/useTranslation\(\["translation"/],
  },
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function get(obj, dotted) {
  return dotted.split(".").reduce((acc, part) => (acc == null ? undefined : acc[part]), obj);
}

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exitCode = 1;
}

if (fs.existsSync(legacyLocales)) {
  fail("legacy directory src/locales still exists");
}

for (const lang of languages) {
  for (const namespace of namespaces) {
    const file = path.join(localeRoot, lang, `${namespace}.json`);
    if (!fs.existsSync(file)) {
      fail(`missing locale file ${path.relative(root, file)}`);
      continue;
    }

    const data = readJson(file);
    for (const [requiredNamespace, key] of requiredKeys) {
      if (requiredNamespace !== namespace) continue;
      if (get(data, key) == null) {
        fail(`missing key ${lang}/${namespace}:${key}`);
      }
    }
  }
}

for (const check of codeChecks) {
  const abs = path.join(root, check.file);
  const source = fs.readFileSync(abs, "utf8");
  for (const pattern of check.patterns) {
    if (pattern.test(source)) {
      fail(`pattern ${pattern} still present in ${check.file}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("PASS i18n smoke");
