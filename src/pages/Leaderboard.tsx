interface LeaderboardEntry {
  address: string
  score: number
}

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[]
  myScore: number
  myAddress: string
  onClaimPrize: () => void
}

const RANK_STYLES: Record<number, { emoji: string; bg: string; text: string; border: string }> = {
  0: { emoji: '🥇', bg: 'rgba(251,191,36,0.12)', text: '#d97706', border: '#fcd34d' },
  1: { emoji: '🥈', bg: 'rgba(156,163,175,0.12)', text: '#6b7280', border: '#d1d5db' },
  2: { emoji: '🥉', bg: 'rgba(251,146,60,0.12)', text: '#ea580c', border: '#fdba74' },
}

export default function Leaderboard({ leaderboard, myScore, myAddress, onClaimPrize }: LeaderboardProps) {
  const myRank = leaderboard.findIndex(e => e.address.toLowerCase() === myAddress.toLowerCase()) + 1

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lb-row { animation: fadeUp 0.4s ease both; }
        .lb-row:nth-child(1) { animation-delay: 0.05s; }
        .lb-row:nth-child(2) { animation-delay: 0.12s; }
        .lb-row:nth-child(3) { animation-delay: 0.19s; }
        .lb-row:nth-child(4) { animation-delay: 0.26s; }
        .lb-row:nth-child(5) { animation-delay: 0.33s; }
        .claim-btn:hover { transform: scale(1.04); box-shadow: 0 12px 40px rgba(131,110,249,0.35); }
        .claim-btn:active { transform: scale(0.97); }
      `}</style>

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        width: '100%',
        maxWidth: 520,
        padding: '0 1.5rem',
        animation: 'fadeUp 0.5s ease both',
      }}>
        {/* Label */}
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.28em', color: '#9ca3af', textTransform: 'uppercase' }}>
          Game Over
        </div>

        {/* Title */}
        <h1 style={{
          margin: 0,
          fontSize: 'clamp(2.8rem, 8vw, 4.5rem)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          background: 'linear-gradient(90deg, #836ef9 0%, #f9a8d4 35%, #60a5fa 65%, #fb923c 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontStyle: 'italic',
        }}>
          LEADERBOARD
        </h1>

        {/* My score card */}
        <div style={{
          width: '100%',
          background: 'linear-gradient(135deg, rgba(131,110,249,0.1) 0%, rgba(249,168,212,0.1) 100%)',
          border: '1.5px solid rgba(131,110,249,0.25)',
          borderRadius: 20,
          padding: '1rem 1.5rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.18em', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>
            Your Score
          </div>
          <div style={{
            fontSize: '2.4rem',
            fontWeight: 900,
            background: 'linear-gradient(90deg, #836ef9, #f472b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: 'monospace',
          }}>
            {myScore} pts
          </div>
          {myRank > 0 && (
            <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 2 }}>
              Rank #{myRank} of {leaderboard.length}
            </div>
          )}
        </div>

        {/* Table */}
        <div style={{
          width: '100%',
          background: 'rgba(249,250,251,0.8)',
          border: '1.5px solid #e5e7eb',
          borderRadius: 20,
          overflow: 'hidden',
          maxHeight: '36vh',
          overflowY: 'auto',
        }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '52px 1fr 70px',
            padding: '0.65rem 1rem',
            borderBottom: '1px solid #e5e7eb',
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#9ca3af',
          }}>
            <span>Rank</span><span>Player</span><span style={{ textAlign: 'right' }}>Score</span>
          </div>

          {leaderboard.map((entry, i) => {
            const short = `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`
            const isMe = entry.address.toLowerCase() === myAddress.toLowerCase()
            const rs = RANK_STYLES[i]
            return (
              <div
                key={entry.address}
                className="lb-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '52px 1fr 70px',
                  padding: '0.7rem 1rem',
                  borderBottom: '1px solid #f3f4f6',
                  background: isMe
                    ? 'linear-gradient(90deg, rgba(131,110,249,0.07), rgba(249,168,212,0.07))'
                    : rs ? rs.bg : undefined,
                  alignItems: 'center',
                }}
              >
                <span style={{
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  fontSize: rs ? '1.1rem' : '0.85rem',
                  color: rs ? rs.text : '#9ca3af',
                }}>
                  {rs ? rs.emoji : `#${i + 1}`}
                </span>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  color: isMe ? '#836ef9' : '#374151',
                  fontWeight: isMe ? 700 : 400,
                }}>
                  {short}{isMe ? ' 👈 you' : ''}
                </span>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  textAlign: 'right',
                  color: i === 0 ? '#d97706' : i === 1 ? '#6b7280' : i === 2 ? '#ea580c' : '#16a34a',
                }}>
                  {entry.score}
                </span>
              </div>
            )
          })}

          {leaderboard.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>
              No scores yet
            </div>
          )}
        </div>

        {/* Claim button */}
        <button
          onClick={onClaimPrize}
          className="claim-btn"
          style={{
            background: 'linear-gradient(135deg, #836ef9 0%, #f472b6 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 999,
            padding: '0.9rem 3rem',
            fontSize: '1.05rem',
            fontWeight: 900,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            boxShadow: '0 8px 28px rgba(131,110,249,0.28)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
        >
          CLAIM PRIZE 🎉
        </button>
      </div>
    </div>
  )
}
