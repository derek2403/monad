import { Button } from '@heroui/react'
import Ballpit from '../components/Ballpit'

interface LandingProps {
  onPlay: () => void
  onAdmin: () => void
}

export default function Landing({ onPlay, onAdmin }: LandingProps) {
  return (
    <div className="relative w-screen h-screen bg-white overflow-hidden select-none flex flex-col items-center justify-center">
      {/* Ballpit background */}
      <div className="absolute inset-0 z-0">
        <Ballpit
          count={40}
          gravity={0.5}
          friction={0.9975}
          wallBounce={0.95}
          followCursor={true}
          colors={[0x6E54FF, 0x85E6FF, 0xFF8EE4, 0xFFAE45]}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Headline */}
        <h1
          className="text-7xl font-bold italic text-center leading-tight tracking-tight"
          style={{
            fontFamily: "'Britti Sans', sans-serif",
            background: 'linear-gradient(90deg, #6E54FF 0%, #85E6FF 25%, #FF8EE4 50%, #FFAE45 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          The Fastest Ball Game{' '}
          <svg className="inline-block align-baseline" style={{ height: '0.75em', marginBottom: '-0.02em' }} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M39.6349 0C28.1892 0 0 28.4481 0 39.9998C0 51.5514 28.1892 80 39.6349 80C51.0805 80 79.2702 51.551 79.2702 39.9998C79.2702 28.4486 51.081 0 39.6349 0ZM33.4584 62.873C28.6319 61.5457 15.6554 38.6374 16.9708 33.7664C18.2863 28.8952 40.985 15.7995 45.8115 17.127C50.6383 18.4543 63.6148 41.3622 62.2994 46.2334C60.9839 51.1046 38.2849 64.2006 33.4584 62.873Z" fill="#6E54FF"/>
          </svg>
          nchain
        </h1>

        {/* Built on Monad */}
        <div className="flex items-center gap-2.5 mt-2">
          <span className="text-gray-400 text-sm tracking-widest uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
            Built on
          </span>
          <img src="/Wordmark Black.svg" alt="Monad" className="h-5" />
        </div>

        {/* Play button */}
        <Button
          size="lg"
          className="mt-4 text-lg font-bold px-14 py-7 rounded-2xl text-white shadow-lg shadow-[#6E54FF]/30 hover:shadow-[#6E54FF]/50"
          style={{
            fontFamily: "'Roboto Mono', monospace",
            backgroundColor: '#6E54FF',
          }}
          onPress={onPlay}
        >
          PLAY
        </Button>

        {/* Admin link */}
        <button
          onClick={onAdmin}
          className="mt-4 text-gray-400 hover:text-gray-600 text-xs underline transition-colors"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Admin Panel
        </button>
      </div>
    </div>
  )
}
