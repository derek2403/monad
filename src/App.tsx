import { useState, useCallback } from 'react'
import { Wallet } from 'ethers'
import Landing from './pages/Landing'
import Lobby from './pages/Lobby'
import Game from './components/Game/Game'
import Leaderboard from './pages/Leaderboard'
import Reward from './pages/Reward'
import WalletExport from './pages/WalletExport'

type Page = 'landing' | 'lobby' | 'game' | 'leaderboard' | 'reward' | 'wallet'

interface LeaderboardEntry {
  address: string
  score: number
}

const STORAGE_KEY = 'monad-ballgame-burner-key'

function App() {
  const [page, setPage] = useState<Page>('landing')
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [myScore, setMyScore] = useState(0)

  const handlePlay = () => {
    setPage('lobby')
  }

  const handleGameStart = useCallback((w: Wallet) => {
    setWallet(w)
    setPage('game')
  }, [])

  const handleGameEnd = useCallback((lb: LeaderboardEntry[], score: number) => {
    setLeaderboard(lb)
    setMyScore(score)
    setPage('leaderboard')
  }, [])

  const handleClaimPrize = () => {
    setPage('reward')
  }

  const handleExportWallet = () => {
    setPage('wallet')
  }

  const handleDone = () => {
    setPage('landing')
  }

  const privateKey = wallet?.privateKey ?? localStorage.getItem(STORAGE_KEY) ?? ''
  const address = wallet?.address ?? ''

  switch (page) {
    case 'landing':
      return <Landing onPlay={handlePlay} />
    case 'lobby':
      return <Lobby onGameStart={handleGameStart} />
    case 'game':
      return wallet ? <Game wallet={wallet} onGameEnd={handleGameEnd} /> : null
    case 'leaderboard':
      return (
        <Leaderboard
          leaderboard={leaderboard}
          myScore={myScore}
          myAddress={address}
          onClaimPrize={handleClaimPrize}
        />
      )
    case 'reward':
      return (
        <Reward
          myScore={myScore}
          myAddress={address}
          onExportWallet={handleExportWallet}
        />
      )
    case 'wallet':
      return (
        <WalletExport
          privateKey={privateKey}
          address={address}
          onDone={handleDone}
        />
      )
    default:
      return <Landing onPlay={handlePlay} />
  }
}

export default App
