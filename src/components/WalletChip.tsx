interface WalletChipProps {
  address: string
  onPress: () => void
}

export default function WalletChip({ address, onPress }: WalletChipProps) {
  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '...'

  return (
    <button
      onClick={onPress}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: '999px',
        padding: '6px 14px 6px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        fontSize: '0.85rem',
        fontWeight: 700,
        color: '#111',
        fontFamily: "'Roboto Mono', monospace",
        cursor: 'pointer',
      }}
    >
      {short}
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}
