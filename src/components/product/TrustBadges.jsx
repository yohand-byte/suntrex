/**
 * SUNTREX — Trust Badge Components
 * TierBadge, VerifiedBadge, EscrowBadge, ColisVerifBadge, DeliveryBadge, ResponseBadge
 */
import { TIERS } from '../../lib/multiVendorOffers';

export function TierBadge({ tier }) {
  const t = TIERS[tier];
  if (!t) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px 2px 6px', borderRadius: 5,
      background: t.bg, border: '1px solid ' + t.border,
      fontSize: 10, fontWeight: 800, color: t.color,
      letterSpacing: '0.03em', boxShadow: t.glow,
    }}>
      <span style={{ fontSize: 8 }}>{t.icon}</span> {t.label}
    </span>
  );
}

export function VerifiedBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 7px', borderRadius: 5,
      background: '#ecfdf5', border: '1px solid #a7f3d0',
      fontSize: 10, fontWeight: 700, color: '#059669',
    }}>
      🛡️ Vérifié
    </span>
  );
}

export function EscrowBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 7px', borderRadius: 5,
      background: '#eff6ff', border: '1px solid #bfdbfe',
      fontSize: 10, fontWeight: 700, color: '#2563eb',
    }}>
      🔒 Escrow
    </span>
  );
}

export function ColisVerifBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 7px', borderRadius: 5,
      background: '#f0fdfa', border: '1px solid #99f6e4',
      fontSize: 10, fontWeight: 700, color: '#0d9488',
    }}>
      📦 Colis vérifié
    </span>
  );
}

export function DeliveryBadge({ type }) {
  const isSuntrex = type === 'suntrex';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 7px', borderRadius: 5,
      background: isSuntrex ? '#fff7ed' : '#f8f9fb',
      border: '1px solid ' + (isSuntrex ? '#fed7aa' : '#eef0f4'),
      fontSize: 10, fontWeight: 700,
      color: isSuntrex ? '#E8700A' : '#5f6368',
    }}>
      🚛 {isSuntrex ? 'SUNTREX' : 'Vendeur'}
    </span>
  );
}

export function ResponseBadge({ minutes }) {
  const isFlash = minutes <= 30;
  const label = minutes < 60 ? minutes + 'min' : Math.round(minutes / 60) + 'h';
  const color = isFlash ? '#059669' : minutes <= 60 ? '#d97706' : '#9aa0a6';
  const bg = isFlash ? '#ecfdf5' : minutes <= 60 ? '#fffbeb' : '#f8f9fb';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px', borderRadius: 5,
      background: bg, border: '1px solid ' + color + '25',
      fontSize: 10, fontWeight: 700, color,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%', background: color,
        animation: isFlash ? 'pulse 1.5s ease-in-out infinite' : 'none',
      }} />
      {isFlash ? 'Flash' : 'Réponse'} ~{label}
    </span>
  );
}
