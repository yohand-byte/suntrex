// ═══════════════════════════════════════════════════════════════
// SUNTREX — AI Support Chat (Vercel Serverless Function)
// Endpoint: POST /api/support-chat-ai
// Mirror of netlify/functions/support-chat-ai.js adapted for Vercel
// ═══════════════════════════════════════════════════════════════

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Product catalog inlined (same as Netlify function)
const PRODUCT_CATALOG = `SUNTREX CATALOGUE — 541 références / 15+ marques
Les PRIX sont masqués (réservés aux membres vérifiés).
Pour voir les prix → inscription gratuite sur suntrex.eu

━━━ HUAWEI (52 réf. | 36 en stock) ━━━
  HUA/BAT-BACK-1PH — Huawei Batterie Back-up box 1 phase à placer en amont du coffret AC (02406294) [1u]
  HUA/BAT-BACK-3PH — Huawei Batterie Back-up box 3 phases à placer en amont du coffret AC (02406150) [1u]
  HUA/BAT-DC-LUNA2000-C0 — Huawei Batterie Luna module/controleur de puissance DC/DC (ref LUNA2000-5KW-C0) - 01074646 [49u]
  HUA/BAT-LUNA2000-5-E0 — Huawei Batterie Luna 2000-5-E0 module de stockage 5 kW utile - Tension nominale 360V (3 ba [76u]
  HUA/DTSU666-H 100A(Three Phase) — DTSU666-H 100A(Three Phase) [10u]
  HUA/EMMA-A02 — Gestionnaire d'énergie intelligent EMMA-A02 Huawei (Ref : EMMA-A02) [4u]
  HUA/OND-15KTL-M5 — Onduleur triphasé Huawei - 15 KTL M5 (16,5 KW tri - 2MPPT) - Garantie 10 ans [rupture]
  HUA/OND-20KTL-M5 — Onduleur triphasé Huawei - 20 KTL M5 (22 KW tri - 2MPPT) - Garantie 10 ans [rupture]
  HUA/OND-30KTL-M3 — Onduleur triphasé Huawei - 30 KTL M3 (30 KW tri - 4MPPT) - Garantie 5 ans extensible [5u]
  HUA/OND-50KTL-M3 — Onduleur triphasé Huawei Sun 2000 - 50 KTL-M3 (50 KW Tri - 4 MPPT) [rupture]
  HUA/P1300-LONG — Huawei optimiseur de puissance P1300 – Smart PV Optimizer – Pose paysage - Garantie 25 ans [100u]
  HUA/P1300-SHORT — Huawei optimiseur de puissance P1300 – Smart PV Optimizer – Pose paysage - Garantie 25 ans [rupture]
  HUA/P450 — Optimiseur Huawei P450-P2 (Tension de 10 à 80V - Courant entrée max 14,5A) [1u]
  HUA/P600 — Huawei optimiseur de puissance P600 (Tension de 10 à 80V - Courant entrée max 14,5A) [10u]
  HUA/SCharger-22KT-S0 — SCharger-22KT-S0 [10u]
  HUA/SCharger-7KS-S0 — SCharger-7KS-S0 [10u]
  HUA/SMART-MONO — HUAWEI – DDSU666-H (MonoPhasé – Smart Power Sensor Mono (tores inclus) 100A) [13u]
  HUA/SMART-TRI — Huawei Smart Power Sensor (compteur d'énergie) Triphasé PS-T (DTSU666-H) 250A/50mA [15u]
  HUA/SMLOG-3000A-01EU — Huawei SmartLogger 3000A01EU, Solar Smart Monitor & Data Logger with 4G [2u]
  HUA/SUN2000-100KTL-M2 — HUAWEI - Onduleur SUN2000-100KTL-M2 (AFCI) - Onduleur triphasé 100kw 10MPPT [1u]
  HUA/SUN2000-10K-LC0 — Onduleur hybride monophasé Huawei SUN2000-10K-LC0 (10000 VA - 3 MPPT) antenne intégrée [9u]
  HUA/SUN2000-10K-MAP0 — SUN2000-10K-MAP0 [10u]
  HUA/SUN2000-10KTL-M1 — Onduleur hybride triphasé Huawei - SUN2000-10KTL-M1 - 2 MPPT [rupture]
  HUA/SUN2000-12K-MAP0 — SUN2000-12K-MAP0 [7u]
  HUA/SUN2000-12K-MB0 — SUN2000-12K-MB0 [10u]
  HUA/SUN2000-15K-MB0 — SUN2000-15K-MB0 [10u]
  HUA/SUN2000-17K-MB0 — SUN2000-17K-MB0 [10u]
  HUA/SUN2000-20K-MB0 — SUN2000-20K-MB0 [9u]
  HUA/SUN2000-25K-MB0 — SUN2000-25K-MB0 [10u]
  HUA/SUN2000-2KTL-L1 — Onduleur hybride monophasé Huawei - SUN2000-2KTL-L1 - 2MPPT [rupture]
  HUA/SUN2000-3,6KTL-L1 — Onduleur hybride monophasé Huawei - SUN2000-3,6KTL-L1 - 2MPPT [rupture]
  HUA/SUN2000-3KTL-L1 — Onduleur hybride monophasé Huawei - SUN2000-3KTL-L1 - 2MPPT [rupture]
  HUA/SUN2000-3KTL-M1 — Onduleur hybride triphasé Huawei - SUN2000-3KTL-M1 - 2 MPPT [rupture]
  HUA/SUN2000-4,6KTL-L1 — Onduleur hybride monophasé Huawei - SUN2000-4,6KTL-L1 - 2 MPPT [rupture]
  HUA/SUN2000-4KTL-L1 — Onduleur hybride monophasé Huawei - SUN2000-4KTL-L1 - 2MPPT [rupture]
  HUA/SUN2000-4KTL-M1 — Onduleur hybride triphasé 4kw Huawei - SUN2000-4-KTL-M1 - 2 MPPT [rupture]
  HUA/SUN2000-5K-MAP0 — SUN2000-5K-MAP0 [10u]
  HUA/SUN2000-5KTL-L1 — Onduleur hybride monophasé Huawei - 5 KTL-L1 (Mono-2 MPPT) [rupture]
  HUA/SUN2000-5KTL-M1 — Onduleur hybride triphasé Huawei - SUN2000-5KTL-M1 - 2 MPPT [rupture]
  HUA/SUN2000-6K-MAP0 — SUN2000-6K-MAP0 [10u]
  HUA/SUN2000-6KTL-L1 — Onduleur hybride monophasé Huawei - 6 KTL-L1 (Mono-2 MPPT) [3u]
  HUA/SUN2000-6KTL-M1 — Onduleur hybride triphasé Huawei - SUN2000-6KTL-M1 - 2 MPPT [rupture]
  HUA/SUN2000-8K-LC0 — Onduleur hybride monophasé Huawei SUN2000-8K-LC0 (8800 VA - 3 MPPT) antenne intégrée [10u]
  HUA/SUN2000-8K-MAP0 — SUN2000-8K-MAP0 [10u]
  HUA/SUN2000-8KTL-M1 — Onduleur hybride triphasé Huawei - SUN2000-8KTL-M1 - 2 MPPT [rupture]
  HUA/Smart dongle SdongleB-06-EU — Smart dongle SdongleB-06-EU [10u]
  HUA/SmartGuard-63A-S0 — SmartGuard-63A-S0 [5u]
  HUA/SmartGuard-63A-T0 — SmartGuard-63A-T0 [5u]
  HUA/SmartPS-100A-S0 — SmartPS-100A-S0 [10u]
  HUA/SmartPS-250A-T0 — SmartPS-250A-T0 Three-phase intelligent sensor [10u]
  HUA/WLAN-FE — Huawei Smart Dongle Wifi + Ethernet - WLAN-FE (Model: SDongleA-05) [36u]
  HUASmartPS-80AI-T0 — SmartPS-80AI-T0 [10u]

━━━ DEYE (38 réf. | 18 en stock) ━━━
  DEY/3U-Hrack — Armoire rack 13 unités pour batteries haute tension Deye BOS-G et BMS [1u]
  DEY/BOS-GM5.1 — Batterie Deye BOS-GM5.1 LiFePO4 - Unité de base de 5.12 kWh [26u]
  DEY/HVB750V/100A-EU — Module de contrôle BMS DEYE HVB750V/100A-EU pour batteries BOS-G, HV [3u]
  DEY/SE-G5.1Pro-B — Batterie DEYE SE-G5.1 Pro-B LiFePO4 - Unité de base de 5.12 kWh [7u]
  DEY/SUN-10K-SG01HP3-EU-BM4 — Onduleur Hybride Triphasé 10Kw Haute Voltage Deye - 2 MPTT - IP65 [rupture]
  DEY/SUN-10K-SG04LP3-EU — Onduleur Hybride Triphasé 10Kw bas voltage Deye - 2/2+1 MPTT [rupture]
  DEY/SUN-12K-SG01HP3-EU-BM4 — Onduleur Hybride Triphasé 12Kw Haute Voltage Deye - 2 MPTT - IP65 [rupture]
  DEY/SUN-12K-SG04LP3-EU — Onduleur Hybride Triphasé 12Kw bas voltage Deye - 2/2+1 MPTT [rupture]
  DEY/SUN-15K-SG01HP3-EU-BM4 — Onduleur Hybride Triphasé 15Kw Haute Voltage Deye - 2 MPTT - IP65 [rupture]
  DEY/SUN-16K-SG01LP1-EU — Onduleur Hybride Monophasé 16K-SG01LP1-EU [rupture]
  DEY/SUN-18K-G04 — Onduleurs tertiaires triphasé Haute Voltage Deye SUN-18K-G04 - 2 MPTT [rupture]
  DEY/SUN-20K-G04 — Onduleurs tertiaires triphasé Haute Voltage Deye SUN-20K-G04 - 2 MPTT [1u]
  DEY/SUN-20K-SG01HP3-EU-BM4 — Onduleur Hybride Triphasé 20Kw Haute Voltage Deye - 2 MPTT - IP65 [rupture]
  DEY/SUN-20K-SG05LP3-EU-SM2 — Onduleur Hybride Triphasé 20Kw bas voltage Deye [rupture]
  DEY/SUN-25K-G04 — Onduleurs tertiaires triphasé Haute Voltage Deye SUN-25K-G04 [rupture]
  DEY/SUN-25K-SG01HP3-EU-BM4 — Onduleur Hybride Triphasé 25Kw Haute Voltage Deye - 2 MPTT [rupture]
  DEY/SUN-3.6K-SG03LP1-EU — Onduleur hybride monophase bas voltage Deye 3.6Kw - 2 MPTT [1u]
  DEY/SUN-30K-SG01HP3-EU-BM3 — Onduleur Hybride Triphasé 30Kw Haute Voltage Deye - 3 MPTT [1u]
  DEY/SUN-40K-SG01HP3-EU-BM4 — Onduleur Hybride Triphasé 40Kw Haute Voltage Deye - 4 MPTT [rupture]
  DEY/SUN-50K-G03 — Onduleurs tertiaires triphasé Haute Voltage Deye SUN-50K - 4 MPTT [rupture]
  DEY/SUN-50K-SG01HP3-EU-BM4 — Onduleur Hybride Triphasé 50Kw Haute Voltage Deye - 4 MPTT [rupture]
  DEY/SUN-5K-SG01HP3-EU-BM4 — Onduleur Hybride Triphasé 5Kw Haute Voltage Deye - 2 MPTT [rupture]
  DEY/SUN-5K-SG03LP1-EU — Onduleur Hybride Monophasé 5Kw-6Kw Deye - 2 MPTT [7u]
  DEY/SUN-5K-SG04LP3-EU — Onduleur Hybride Triphasé 5Kw bas voltage Deye - 2/1+1 MPTT [1u]
  DEY/SUN-6K-G06P3-EU-AM2 — Onduleur central Triphasé 6Kw bas voltage Deye - 2/1+1 MPTT [rupture]
  DEY/SUN-6K-SG01HP3-EU-BM4 — Onduleur Hybride Triphasé 6Kw Haute Voltage Deye - 2 MPTT [rupture]
  DEY/SUN-6K-SG03LP1-EU — Onduleur Hybride Monophasé 6Kw Deye - 2 MPTT [34u]
  DEY/SUN-6K-SG04LP1-EU — Onduleur Hybride Monophasé 6Kw Deye SUN-6K-SG04LP1-EU - 2 MPTT [rupture]
  DEY/SUN-6K-SG04LP3-EU — Onduleur Hybride Triphasé 6Kw bas voltage Deye - 2/1+1 MPTT [rupture]
  DEY/SUN-8K-SG01HP3-EU-BM4 — Onduleur Hybride Triphasé 8Kw Haute Voltage Deye - 2 MPTT [rupture]
  DEY/SUN-8K-SG01LP1-EU — Onduleur Hybride Monophasé 8Kw Deye - 2 MPTT (2+2) [8u]
  DEY/SUN-8K-SG04LP1-EU — Onduleur Hybride Monophasé 8Kw Deye SUN-8K-SG04LP1-EU - 2 MPTT [1u]
  DEY/SUN-8K-SG04LP3-EU — Onduleur Hybride Triphasé 8Kw bas voltage Deye - 2/1+1 MPTT [8u]
  DEY/SUN-SMART-CT01 — SUN-SMART-CT01 [100u]
  DEY/SUN-SMART-TX01 — SUN-SMART-TX01 [30u]
  DEY/SUN-XL02-A — DEYE optimiseur de puissance SUN-XL02-A (Tension de 10 à 80V) [37u]
  xxx/000/09 — Set Câble batterie Deye 1.5m (+/-) 3U-LPCable1.5 [9u]
  xxx/000/10 — Paire de câbles d'alimentation de batterie 150 mm 4AWG et câble RJ45 [10u]

━━━ PYTES (25 réf. | 11 en stock) ━━━
  PYT/BRACKETS-SET-V5 — Set de supports pour V5 ou V5 alpha - 4 pièces [5u]
  PYT/BTI-M10-CABLE-2M+ — 4AWG Amphénol 5.7-M10 Positif (Orange) - Câble batterie-onduleur 2m [rupture]
  PYT/BTI-M10-CABLE-2M- — 4AWG Amphénol 5.7-M10 Negatif (Noir) - Câble batterie-onduleur 2m [rupture]
  PYT/BTI-M8-CABLE-2M+ — Câble d'alimentation Positif (Rouge) batterie-onduleur 2m (M8) [rupture]
  PYT/BTI-M8-CABLE-2M- — Câble d'alimentation (Noir) batterie-onduleur 2m (M8) [rupture]
  PYT/BTI-V5-M10-CABLE-2M+ — 0AWG Amphénol 8.0-M10 Positif (Rouge) - Câble batterie-onduleur 2m [rupture]
  PYT/BTI-V5-M10-CABLE-2M- — 0AWG Amphénol 8.0-M10 Négatif (Noir) - Câble batterie-onduleur 2m [rupture]
  PYT/BTI-V5°-M10-CABLE-2M+ — Câble Positif (Rouge) batterie-onduleur 2m (M10) pour V5° [rupture]
  PYT/BTI-V5°-M10-CABLE-2M- — Câble (Noir) batterie-onduleur 2m (M10) pour V5° [rupture]
  PYT/BTI-V5°-M8-CABLE-2M+ — Câble Positif (Rouge) batterie-onduleur 2m (M8) pour V5° [5u]
  PYT/BTI-V5°-M8-CABLE-2M- — Câble (Noir) batterie-onduleur 2m (M8) pour V5° [5u]
  PYT/BUSTI-CABLE-2M+ — 0000AWG M10-M10 Positif (Rouge) - Câble busbar-onduleur 2m [1u]
  PYT/BUSTI-CABLE-2M- — 0000AWG M10-M10 Négatif (Noir) - Câble busbar-onduleur 2m [1u]
  PYT/Busbar-600A — 600A BUSBAR - Avec 6 x vis à bornes M10 [1u]
  PYT/C3500RJ45 — Batterie-onduleur câble de communication 3,5 m [9u]
  PYT/CONSOLE — Câble de console pour firmware mise à niveau - Pytes [4u]
  PYT/E-Box-48100R-C16 — Batterie PYTES E-Box 48100R-C16 LiFePO4 - 5.12 kWh [2u]
  PYT/E-Box/KIT-5KW — KIT BATTERIE 5 KWH E-Box PYTES [rupture]
  PYT/EXT-CABLE-LSW-5-V5 — LSW-5 Wifi Dongle pour V5/V5a [rupture]
  PYT/LSW-5-DONGLE-V5 — Câble d'extension de dongle Wifi pour LSW-5 [7u]
  PYT/V-Box-IC-3V5 — Armoire intérieure V-Box-IC pour V5/V5a - jusqu'à 3 pièces [1u]
  PYT/V5ALPHA/KIT-5KW — KIT BATTERIE 5 KWH ALPHA PYTES [rupture]
  PYT/V5° — Batterie PYTES V5° LiFePO4 - 5.12 kWh / 51.2V / 100 Ah - Plus de 6000 cycles [rupture]
  PYT/V5°/KIT-5KW — KIT BATTERIE 5 KWH PYTES [rupture]
  PYT/V5°/KIT-5KW-DEYE — KIT BATTERIE 5 KWH PYTES AVEC ONDULEUR DEYE [rupture]

━━━ Enphase (24 réf. | 19 en stock) ━━━
  12DS425FBMENP1E — KIT ENPHASE 5,10 KWC (12X425W) - MONO DUALSUN [rupture]
  8RE375FBMENP1E — KITS 3KWC ENPHASE 375 W (MONO) [rupture]
  CO/AC-12KTRI-ENPH-IQ8-3E-36M — Coffret AC 12 kW triphasé Enphase IQ8 [49u]
  CO/AC-18KTRI-ENPH-IQ8-3E-54M — Coffret AC 18 à 25 Kw triphasé Enphase IQ8 [8u]
  CO/AC-3K-ENPH-IQ8-13M — Coffret AC 3 kW monophasé Enphase IQ8 [30u]
  CO/AC-6K-ENPH-IQ8-2E-13M — Coffret AC 6 kW monophasé Enphase IQ8 [28u]
  CO/AC-9K-ENPH-IQ8-3E-18M — Coffret AC 9 kW monophasé Enphase IQ8 [47u]
  CO/AC-9KTRI-ENPH-IQ8-3E-24M — Coffret AC 9 kW triphasé Enphase IQ8 [24u]
  EN/ENVOY — Passerelle de communication Envoy S - Mono/Tri [131u]
  EN/ENVOY-METERED — Passerelle de communication Envoy S Metered mono/tri + 2 tores [47u]
  EN/IQ-DISC — Enphase Outil de deconnexion pour IQ [55u]
  EN/IQ-H — Enphase câble IQ Paysage Monophasé (Q25-17-240) [414u]
  EN/IQ-H-TRI — Enphase câble IQ Paysage Triphasé (Q25-17-3P-160) [415u]
  EN/IQ-RELAY-1P — Enphase QRelay VDE Monophasé (Q-RELAY-1P-FR) [450u]
  EN/IQ-RELAY-3P — Enphase QRelay VDE Triphasé (Q-RELAY-3P-INT) [359u]
  EN/IQ-TERM — Enphase embout de terminaison étanche Monophasé [193u]
  EN/IQ-TERM-TRI — Enphase embout de terminaison étanche Triphasé [231u]
  EN/IQ-V — Enphase câble IQ Portrait Monophasé (Q25-10-240) [rupture]
  EN/IQ-V-TRI — Enphase câble IQ Portrait Triphasé (Q25-10-3P-200) [334u]
  EN/IQ8-AC — Enphase micro-onduleur IQ8-AC - 366 VA - MC4 [rupture]
  EN/IQ8-HC — Enphase micro-onduleur IQ8-HC - 384 VA - MC4 [124u]
  EN/IQ8-PLUS — Enphase micro-onduleur IQ8-PLUS - 300 VA - MC4 [647u]
  EN/PINCE-METERED-CT100 — Pince ampèremétrique Slim pour ENVOY METERED [300u]
  IQ8MC-72-M-INT — Enphase micro-onduleur IQ8-MC - 330 VA - MC4 [rupture]

━━━ HOYMILES (48 réf. | 26 en stock) ━━━
  HM/DDSU666 — Hoymiles smart meter CHINT DDSU 666 monophasé avec tore [135u]
  HM/DDSU666/OND — Hoymiles smart meter CHINT DDSU 666 monophasé 1*100A [rupture]
  HM/DTS-WIFI-G1.HM — Data Transfer Stick WiFi (Ref CD041114) [37u]
  HM/DTSU666-3P — Hoymiles smart meter CHINT DTSU 666 triphasé avec tore [123u]
  HM/DTSU666-3P/OND — Hoymiles smart meter CHINT DTSU 666 triphasé 3*100A [rupture]
  HM/DTU-Lite-S — Passerelle de communication Hoymiles DTU-Lite-S [39u]
  HM/DTU-Pro-S — Passerelle de communication Hoymiles DTU-ProS [767u]
  HM/DTU-Wlite-S — Passerelle de communication Hoymiles DTU-Wlite-S (Wi-Fi) pour HMS [rupture]
  HM/HAS-3.0LV-EUG1 — Coupleur hybride monophasé Hoymiles HAS-3.0LV [rupture]
  HM/HAS-3.6LV-EUG1 — Coupleur hybride monophasé Hoymiles HAS-3.6LV [rupture]
  HM/HAS-4.6LV-EUG1 — Coupleur hybride monophasé Hoymiles HAS-4.6LV [rupture]
  HM/HAS-5.0LV-EUG1 — Coupleur hybride monophasé Hoymiles HAS-5.0LV [2u]
  HM/HAT-10.0HV-EUG1 — Coupleur hybride triphasé Hoymiles HAT-10.0HV [rupture]
  HM/HAT-5.0HV-EUG1 — Coupleur hybride triphasé Hoymiles HAT-5.0HV [rupture]
  HM/HAT-6.0HV-EUG1 — Coupleur hybride triphasé Hoymiles HAT-6.0HV [rupture]
  HM/HAT-8.0HV-EUG1 — Coupleur hybride triphasé Hoymiles HAT-8.0HV [rupture]
  HM/HDTS-Ethernet-G1 — Data Transfer Stick Ethernet (CD041239) [2u]
  HM/HMS-1000-2T — Hoymiles micro-onduleur HMS-1000 - 1000 VA - 2 MPPT [14u]
  HM/HMS-1600-4T — Hoymiles micro-onduleur HMS-1600 - 1600 VA - 4 MPPT [82u]
  HM/HMS-2000-4T — Hoymiles micro-onduleur HMS-2000 - 2000 VA - 4 MPPT [rupture]
  HM/HMS-800-2T — Hoymiles micro-onduleur HMS-800 - 800 VA - 2 MPPT [4061u]
  HM/HMS-900-2T — Hoymiles micro-onduleur HMS-900 - 900 VA - 2 MPPT [rupture]
  HM/HMS-CABLE-3M — Hoymiles câble AC 3m pour HMS [1095u]
  HM/HMS-CABLE-40-200 — Hoymiles câble AC 2m pour HMS [6223u]
  HM/HMS-DISC — Hoymiles Outil de déconnexion pour HMS [342u]
  HM/HMS-EXTCON-MC4 — Hoymiles connecteur d'extension AC étanche HMS [113u]
  HM/HMS-FIELD-CON — HMS Field connector [8u]
  HM/HMS-PLUG-3M — Câble plug-and-play HMS 3m [19u]
  HM/HMS-PLUG-5M — Câble plug-and-play HMS 5m [29u]
  HM/HMS-SEAL — Hoymiles Capuchon d'étanchéité HMS [3000u]
  HM/HMS-TERMCON-MC4 — Hoymiles terminal connecteur AC étanche HMS [2933u]
  HM/HMS-TRKCON-MC4 — Hoymiles connecteur d'interconnexion AC étanche HMS [3585u]
  HM/HMT-12AWGTRI-3M — Hoymiles câble Triphasé AC 3m pour HMT [133u]
  HM/HMT-2000-4T — Hoymiles micro-onduleur HMT-2000 - 2000 VA - 4 MPPT [72u]
  HM/HMT-2250-6T — Hoymiles micro-onduleur HMT-2250 - 2250 VA - 6 MPPT [86u]
  HM/HMT-DISC-AC3P — Hoymiles Outil de deconnexion port AC-3P HMT [89u]
  HM/HMT-ENDCAP-AC3P — Hoymiles embout de terminaison AC-3P HMT [178u]
  HM/HMT-UNL-AC3P — Hoymiles Outil de déverrouillage AC-3P HMT [90u]
  HM/HYS-3.0LV-EUG1 — Onduleur hybride monophasé Hoymiles HYS-3.0LV (4,5 KW - 1MPPT) [rupture]
  HM/HYS-3.6LV-EUG1 — Onduleur hybride monophasé Hoymiles HYS-3.6LV (6 KW - 2MPPT) [rupture]
  HM/HYS-4.6LV-EUG1 — Onduleur hybride monophasé Hoymiles HYS-4.6LV (7.5 KW - 2MPPT) [rupture]
  HM/HYS-5.0LV-EUG1 — Onduleur hybride monophasé Hoymiles HYS-5.0LV (7.5 KW - 2MPPT) [rupture]
  HM/HYS-6.0LV-EUG1 — Onduleur hybride monophasé Hoymiles HYS-6.0LV (7.5 KW - 2MPPT) [rupture]
  HM/HYT-10.0HV-EUG1 — Onduleur hybride triphasé Hoymiles HYT-10.0HV (15 KW - 2MPPT) [rupture]
  HM/HYT-12.0HV-EUG1 — Onduleur hybride triphasé Hoymiles HYT-12.0HV (15 KW - 2MPPT) [rupture]
  HM/HYT-5.0HV-EUG1 — Onduleur hybride triphasé Hoymiles HYT-5.0HV (7,5 KW - 2MPPT) [rupture]
  HM/HYT-6.0HV-EUG1 — Onduleur hybride triphasé Hoymiles HYT-6.0HV (9 KW - 2MPPT) [rupture]
  HM/HYT-8.0HV-EUG1 — Onduleur hybride triphasé Hoymiles HYT-8.0HV (12 KW - 2MPPT) [rupture]

━━━ AP Systems (21 réf. | 0 en stock) ━━━
  APS/80A — APsystems Tor de mesure 80A pour ECU-C [rupture]
  APS/AC-FC — APsystems connecteur femelle Mono DS3 pour câble AC [rupture]
  APS/AC-MC — APsystems connecteur mâle Mono DS3 pour câble AC [rupture]
  APS/DS3-H-960 — APSystems micro-onduleur DS3 H Duo 960VA - MC4 [rupture]
  APS/DS3-L-730 — APSystems micro-onduleur DS3-Light Duo 730VA - MC4 [rupture]
  APS/DS3-XL-880 — APSystems micro-onduleur DS3 Duo 880VA - MC4 [rupture]
  APS/ECU-C — APsystems ECU Commercial pour DS3 - QT2 (Zigbee) [rupture]
  APS/ECU-R — APsystems ECU Résidentiel pour DS3 - QT2 (Zigbee) [rupture]
  APS/EXT20A-DS3-H-960 — Extension de Garantie 20 ans DS3-H 960VA [rupture]
  APS/EXT20A-DS3-L-730 — Extension de Garantie 20 ans DS3-L 730VA [rupture]
  APS/EXT20A-DS3-XL-880 — Extension de Garantie 20 ans DS3-XL 880VA [rupture]
  APS/EXT20A-QT2-TRI — Extension de Garantie 20 ans QT2 triphasé 2000VA [rupture]
  APS/QT2-ACBUS-2400MM — Câble AC pour QT2 triphasé - 2,4m [rupture]
  APS/QT2-C-FEMELLE — Connecteur femelle 5 fils pour QT2 triphasé [rupture]
  APS/QT2-C-MALE — Connecteur mâle 5 fils pour QT2 triphasé [rupture]
  APS/QT2-ENDCAP — Bouchon de fin de string pour QT2 triphasé [rupture]
  APS/QT2-TRI — APSystems micro-onduleur QT2 triphasé 2000VA - MC4 [rupture]
  APS/Y3-ACBUS-2M — Câble rallonge Y3 de 2m pour DS3 [rupture]
  APS/Y3-ACBUS-CONCAP — Capuchon étanche pour connecteur Y3 [rupture]
  APS/Y3-ACBUS-ENDCAP — Bouchon de fin de string pour DS3 / DS3-L [rupture]
  APS/Y3-CON-UNLOCKT — Outils de déconnexion pour connecteur Y3 [rupture]

━━━ SolarEdge (4 réf. | 0 en stock) ━━━
  SE/CT-SPL-250A-A — SolarEdge Transformateur de courant 250A [rupture]
  SE/MTR-3Y-400V-A — SolarEdge Electricity Meter 1Ph/3Ph 230/400V [rupture]
  SE/ONDSE-SU-K — SolarEdge Unité secondaire Synergy [rupture]
  SE/ONDSE90K-DC — SolarEdge Onduleur triphasé SE 90K [rupture]

━━━ AUTRES MARQUES (résumé) ━━━
  ESDEC: 164 réf. (18 en stock) — Systèmes de montage toiture
  K2 SYSTEMS: 53 réf. (2 en stock) — Systèmes de montage
  JORISOLAR: 14 réf. (11 en stock) — Fixations et accessoires
  UZ ENERGY: 12 réf. (8 en stock) — Accessoires solaires
  Solar Speed: 10 réf. (1 en stock) — Fixations rapides
  VaySunic: 7 réf. (6 en stock) — Accessoires
  SOLARPLAST: 5 réf. (1 en stock) — Accessoires plastiques
  SUNPOWER: 5 réf. (1 en stock) — Panneaux solaires premium
  GSE: 5 réf. (0 en stock) — Intégration toiture
  RECOM SILLIA: 4 réf. (2 en stock) — Panneaux solaires
  DUALSUN: 4 réf. (1 en stock) — Panneaux hybrides
  SUNRISE: 4 réf. (0 en stock) — Panneaux solaires
  ES Elitec: 4 réf. (3 en stock) — Électrotechnique
  STÄUBLI: 3 réf. (3 en stock) — Connecteurs MC4
  JA Solar: 2 réf. (1 en stock) — Panneaux solaires
  RENUSOL: 2 réf. (2 en stock) — Systèmes de montage
  Easy Solar Box: 2 réf. (2 en stock) — Coffrets précâblés
  Heschen: 2 réf. (2 en stock) — Connecteurs
  + autres marques (voir catalogue complet sur suntrex.eu)`;

const SYSTEM_PROMPT = `You are SUNTREX Support, the AI assistant for SUNTREX — a B2B European marketplace for photovoltaic (solar) equipment and energy storage systems.

Your role:
- Help solar installers, distributors, and professionals with their questions
- Answer questions about orders, shipping, products, payments, and technical specs
- Be knowledgeable about solar panels, inverters, batteries, mounting systems, cables
- Key brands: Huawei, Deye, Enphase, SMA, Canadian Solar, Jinko, Trina, BYD, LONGi, SolarEdge, JA Solar, Sungrow, Growatt, GoodWe
- Markets: France, Germany, Benelux, Italy, Spain

Rules:
- Respond in the same language as the user (default: French)
- Be professional, helpful, and concise
- For complex issues (disputes, returns, technical problems), suggest handoff to a human agent
- Never share internal pricing, margins, or business data
- Never process payments or share financial details
- **NEVER reveal prices, costs, or margins. If asked about a price, ALWAYS respond: "Inscrivez-vous gratuitement sur SUNTREX pour voir les prix professionnels." / "Sign up for free on SUNTREX to see professional prices."**
- If unsure, say so and offer to connect with a specialist
- Include relevant product categories when discussing products: Solar Panels, Inverters, Batteries, Mounting Systems, Electrical/Cables, E-Mobility

Product catalog capabilities:
- You can search products by SKU (e.g. "HUA/SUN2000-10K-LC0") or by name/description
- You know real-time stock status: [Xu] = X units in stock, [rupture] = out of stock
- When a product is out of stock, suggest similar alternatives from the same brand or category
- When listing products, include SKU, name, and stock status
- NEVER mention or invent prices — prices are gated and reserved for verified members

Response format:
- Keep responses under 200 words
- Use bullet points for lists
- Bold important terms with **term**

--- SUNTREX PRODUCT CATALOG ---
${PRODUCT_CATALOG}`;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!MISTRAL_API_KEY) {
    return res.status(500).json({ error: 'AI service not configured' });
  }

  try {
    const { conversation_id, message, context = {} } = req.body;

    if (!message || !conversation_id) {
      return res.status(400).json({ error: 'Missing message or conversation_id' });
    }

    // Build conversation history (OpenAI-compatible format for Mistral)
    const previousMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(context.previousMessages || []).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // Call Mistral AI API
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        max_tokens: 512,
        messages: previousMessages,
      }),
    });

    if (!response.ok) {
      const errData = await response.text();
      console.error('Mistral API error:', response.status, errData);
      return res.status(502).json({ error: 'AI service error' });
    }

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content || "Désolé, je n'ai pas pu générer une réponse.";

    // Detect handoff needs
    const handoffKeywords = ['litige', 'dispute', 'remboursement', 'refund', 'avocat', 'lawyer', 'plainte', 'complaint', 'urgent'];
    const needsHandoff = handoffKeywords.some((kw) => message.toLowerCase().includes(kw) || aiText.toLowerCase().includes(kw));

    // Save AI response to Supabase (server-side)
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && !conversation_id.startsWith('demo-')) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/SupportMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            conversation_id,
            sender_type: 'ai',
            content: aiText,
            metadata: { model: 'mistral-small-latest', handoff: needsHandoff },
          }),
        });
      } catch (dbErr) {
        console.error('Failed to save AI message to Supabase:', dbErr);
      }
    }

    return res.status(200).json({
      messages: [
        {
          id: 'ai-' + Date.now(),
          text: aiText,
          handoff: needsHandoff,
        },
      ],
    });
  } catch (err) {
    console.error('Support chat AI error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
