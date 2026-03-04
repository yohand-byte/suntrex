/**
 * SUNTREX — Comparison Drawer
 * Side-by-side comparison of 2-4 selected vendor offers
 */
import { COMPARISON_ROWS } from '../../lib/multiVendorOffers';

export default function ComparisonDrawer({ offers, selectedIds, onClose, isLoggedIn, formatMoney, lang }) {
  const selected = offers.filter(o => selectedIds.includes(o.sellerId));
  if (selected.length < 2) return null;

  const bestPrice = Math.min(...selected.map(s => s.price));

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: '#fff', borderTop: '2px solid #E8700A',
      boxShadow: '0 -8px 30px rgba(0,0,0,0.15)',
      maxHeight: '55vh', overflow: 'auto',
      animation: 'slideUp .3s ease-out',
    }}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚖️</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#222' }}>
              {lang === 'fr' ? 'Comparaison directe' : 'Direct comparison'}
            </span>
            <span style={{ fontSize: 11, color: '#888' }}>({selected.length} {lang === 'fr' ? 'vendeurs' : 'vendors'})</span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid #e4e5ec', borderRadius: 6,
            padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', color: '#555',
          }}>
            {lang === 'fr' ? 'Fermer' : 'Close'} ✕
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 12px', background: '#f8f9fb', borderBottom: '2px solid #e4e5ec', fontWeight: 600, color: '#555', width: 140, position: 'sticky', left: 0 }}>
                  {lang === 'fr' ? 'Critère' : 'Criteria'}
                </th>
                {selected.map(s => (
                  <th key={s.sellerId} style={{
                    textAlign: 'center', padding: '10px 12px', background: '#f8f9fb',
                    borderBottom: '2px solid #e4e5ec', minWidth: 140,
                  }}>
                    <div style={{ fontWeight: 700, color: '#222' }}>{s.sellerName}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{s.flag} {s.country}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={row.key}>
                  <td style={{
                    padding: '9px 12px', fontWeight: 500, color: '#555',
                    borderBottom: '1px solid #f0f0f0',
                    background: i % 2 === 0 ? '#fff' : '#f8f9fb',
                    position: 'sticky', left: 0,
                  }}>
                    {row.label}
                  </td>
                  {selected.map(s => {
                    const val = s[row.key];
                    const isBest = row.key === 'price' && val === bestPrice;
                    return (
                      <td key={s.sellerId} style={{
                        textAlign: 'center', padding: '9px 12px',
                        borderBottom: '1px solid #f0f0f0',
                        background: i % 2 === 0 ? '#fff' : '#f8f9fb',
                        fontWeight: isBest ? 800 : 600,
                        color: isBest ? '#059669' : '#222',
                      }}>
                        {!isLoggedIn && row.key === 'price' ? '●●●●' : row.fmt(val)}
                        {isBest && <span style={{ fontSize: 9, color: '#059669', display: 'block', fontWeight: 600 }}>{lang === 'fr' ? 'Meilleur' : 'Best'}</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
