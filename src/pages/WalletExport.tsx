import { useState } from 'react'

interface WalletExportProps {
  privateKey: string
  address: string
  onDone: () => void
}

export default function WalletExport({ privateKey, address, onDone }: WalletExportProps) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(privateKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = privateKey
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="w-screen h-screen bg-[#0a0a1a] overflow-hidden select-none flex flex-col items-center justify-center px-8">
      {/* Background video */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <video src="/character.mp4" autoPlay loop muted playsInline style={{ height: '80%', objectFit: 'contain', opacity: 0.15 }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md w-full">
        <div className="text-[11px] font-semibold tracking-[0.25em] uppercase text-gray-400">Wallet Export</div>
        <h1 className="text-4xl font-bold font-mono text-purple-400">EXPORT WALLET</h1>

        {/* Warning */}
        <div className="w-full bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center">
          <p className="text-red-400 text-sm font-semibold mb-1">Keep your private key safe!</p>
          <p className="text-gray-400 text-xs">
            Import this key into MetaMask or any wallet to access your rewards. Never share it publicly.
          </p>
        </div>

        {/* Address */}
        <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
          <div className="text-gray-400 text-xs uppercase tracking-widest mb-2">Wallet Address</div>
          <div className="text-white/80 text-xs font-mono break-all bg-black/30 rounded-lg p-3">{address}</div>
        </div>

        {/* Private Key */}
        <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
          <div className="text-gray-400 text-xs uppercase tracking-widest mb-2">Private Key</div>
          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-sm py-3 rounded-lg transition-all"
            >
              Click to reveal private key
            </button>
          ) : (
            <div className="relative">
              <div className="text-yellow-400 text-xs font-mono break-all bg-black/40 rounded-lg p-3 pr-16">
                {privateKey}
              </div>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 py-1.5 rounded-lg transition-all"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-left">
          <div className="text-gray-400 text-xs uppercase tracking-widest mb-3">How to import</div>
          <ol className="text-gray-300 text-xs space-y-2 list-decimal list-inside">
            <li>Copy your private key above</li>
            <li>Open MetaMask and click &quot;Import Account&quot;</li>
            <li>Paste your private key and confirm</li>
            <li>Switch to Monad Testnet to see your rewards</li>
          </ol>
        </div>

        <button
          onClick={onDone}
          className="mt-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-8 py-3 rounded-2xl transition-all border border-white/10"
        >
          BACK TO HOME
        </button>
      </div>
    </div>
  )
}
