export const COIN_CONFIG = {
  bitcoin:  { bg: '#F7931A', glow: '#FFB84D', symbol: '₿',  label: 'BTC',   isGood: true  },
  ethereum: { bg: '#627EEA', glow: '#8B9FFF', symbol: 'Ξ',  label: 'ETH',   isGood: true  },
  monad:    { bg: '#836EF9', glow: '#A78BFA', symbol: 'M',  label: 'MONAD', isGood: true  },
  pizzadao: { bg: '#E85D04', glow: '#FF7B1A', symbol: '⬡',  label: 'PIZZA', isGood: true  },
  ftx:      { bg: '#16213E', glow: '#FF4444', symbol: 'F',  label: 'FTX',   isGood: false },
  terra:    { bg: '#2D3A87', glow: '#FF6B6B', symbol: 'L',  label: 'LUNA',  isGood: false },
}

export const GOOD_TYPES = ['bitcoin', 'ethereum', 'monad', 'pizzadao']
export const BAD_TYPES  = ['ftx', 'terra']

export const GRAVITY           = 800   // px/s² — softer so coins hang longer
export const COIN_RADIUS       = 36    // px
export const SPAWN_INTERVAL_MS = 550   // ms — faster for a 10s game
export const MAX_COINS         = 14
export const GOOD_SCORE        = 10
export const BAD_PENALTY       = 15
export const BAD_COIN_CHANCE   = 0.2   // 20% chance of bad coin
export const WINDOW_MS         = 10_000 // 10-second tracking window
export const GAME_DURATION     = 10_000 // total game length in ms
