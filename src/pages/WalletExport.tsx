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
    <div className="w-screen h-screen bg-white overflow-hidden select-none flex flex-col items-center justify-center px-8">

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md w-full">
        <div className="text-[11px] font-semibold tracking-[0.25em] uppercase text-gray-500">Wallet Export</div>
        <h1 className="text-4xl font-bold font-mono text-purple-500">EXPORT WALLET</h1>

        {/* Warning */}
        <div className="w-full bg-red-50 border border-red-300 rounded-2xl p-4 text-center">
          <p className="text-red-600 text-sm font-semibold mb-1">Keep your private key safe!</p>
          <p className="text-gray-500 text-xs">
            Import this key into MetaMask or any wallet to access your rewards. Never share it publicly.
          </p>
        </div>

        {/* Address */}
        <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">Wallet Address</div>
          <div className="text-gray-800 text-xs font-mono break-all bg-gray-100 rounded-lg p-3">{address}</div>
        </div>

        {/* Private Key */}
        <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">Private Key</div>
          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="w-full bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-500 text-sm py-3 rounded-lg transition-all"
            >
              Click to reveal private key
            </button>
          ) : (
            <div className="relative">
              <div className="text-yellow-700 text-xs font-mono break-all bg-yellow-50 border border-yellow-200 rounded-lg p-3 pr-16">
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
        <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left">
          <div className="text-gray-500 text-xs uppercase tracking-widest mb-3">How to import</div>
          <ol className="text-gray-600 text-xs space-y-2 list-decimal list-inside">
            <li>Copy your private key above</li>
            <li>Open MetaMask and click &quot;Import Account&quot;</li>
            <li>Paste your private key and confirm</li>
            <li>Switch to Monad Testnet to see your rewards</li>
          </ol>
        </div>

        <button
          onClick={onDone}
          className="mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-8 py-3 rounded-2xl transition-all border border-gray-300"
        >
          BACK TO HOME
        </button>
      </div>
    </div>
  )
}
