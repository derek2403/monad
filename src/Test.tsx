import { useState, useEffect, useCallback, useRef } from 'react'
import { JsonRpcProvider, BrowserProvider, Wallet, Contract, WebSocketProvider, formatEther, Signer } from 'ethers'

const COUNTER_ADDRESS = '0x7B60257377bC34F12E451DE2e9eBe7Fc99974c5b'

const COUNTER_ABI = [
  'function x() view returns (uint256)',
  'function inc()',
  'function incBy(uint256 by)',
  'event Increment(uint256 by)',
]

const MONAD_RPC_URL = 'https://monad-testnet.g.alchemy.com/v2/6U7t79S89NhHIspqDQ7oKGRWp5ZOfsNj'
const MONAD_WS_URL = 'wss://monad-testnet.g.alchemy.com/v2/6U7t79S89NhHIspqDQ7oKGRWp5ZOfsNj'
const MONAD_TESTNET_CHAIN_ID = '0x279F'

const STORAGE_KEY = 'monad-counter-burner-key'
const MODE_KEY = 'monad-counter-mode'

type WalletMode = 'none' | 'burner' | 'metamask' | 'auto'

const ENV_PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY as string | undefined

interface TxLog {
  action: string
  txSentAt: number
  txConfirmedAt: number | null
  wsEventAt: number | null
}

function loadBurnerWallet(): Wallet | null {
  const privateKey = localStorage.getItem(STORAGE_KEY)
  if (!privateKey) return null
  const provider = new JsonRpcProvider(MONAD_RPC_URL)
  return new Wallet(privateKey, provider)
}

function createBurnerWallet(): Wallet {
  const wallet = Wallet.createRandom()
  localStorage.setItem(STORAGE_KEY, wallet.privateKey)
  const provider = new JsonRpcProvider(MONAD_RPC_URL)
  return new Wallet(wallet.privateKey, provider)
}

function Test() {
  const [count, setCount] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [incByValue, setIncByValue] = useState('1')
  const [status, setStatus] = useState('')
  const [wsConnected, setWsConnected] = useState(false)
  const [balance, setBalance] = useState<string | null>(null)
  const [txLogs, setTxLogs] = useState<TxLog[]>([])
  const wsProviderRef = useRef<WebSocketProvider | null>(null)
  const pendingTxRef = useRef<TxLog | null>(null)

  // wallet mode
  const [mode, setMode] = useState<WalletMode>(() => {
    return (localStorage.getItem(MODE_KEY) as WalletMode) || 'none'
  })
  const [burnerWallet, setBurnerWallet] = useState<Wallet | null>(() => loadBurnerWallet())
  const [metamaskAddress, setMetamaskAddress] = useState<string | null>(null)
  const [autoWallet] = useState<Wallet | null>(() => {
    if (!ENV_PRIVATE_KEY) return null
    const provider = new JsonRpcProvider(MONAD_RPC_URL)
    return new Wallet(ENV_PRIVATE_KEY, provider)
  })

  const address = mode === 'auto' ? autoWallet?.address ?? null
    : mode === 'burner' ? burnerWallet?.address ?? null
    : metamaskAddress
  const isConnected = mode !== 'none' && address !== null

  // get signer for the current mode
  const getSigner = useCallback(async (): Promise<Signer> => {
    if (mode === 'auto') {
      if (!autoWallet) throw new Error('No private key in .env')
      return autoWallet
    }
    if (mode === 'burner') {
      if (!burnerWallet) throw new Error('No burner wallet')
      return burnerWallet
    }
    if (!window.ethereum) throw new Error('No wallet found')
    const provider = new BrowserProvider(window.ethereum)
    return provider.getSigner()
  }, [mode, burnerWallet, autoWallet])

  const fetchBalance = useCallback(async () => {
    if (!address) return
    try {
      const provider = new JsonRpcProvider(MONAD_RPC_URL)
      const bal = await provider.getBalance(address)
      setBalance(formatEther(bal))
    } catch (err) {
      console.error('Failed to fetch balance:', err)
    }
  }, [address])

  const fetchCount = useCallback(async () => {
    try {
      const provider = new JsonRpcProvider(MONAD_RPC_URL)
      const contract = new Contract(COUNTER_ADDRESS, COUNTER_ABI, provider)
      const value = await contract.x()
      setCount(value.toString())
    } catch (err) {
      console.error('Failed to fetch count:', err)
      setStatus(`Failed to read counter: ${err}`)
    }
  }, [])

  useEffect(() => { fetchCount() }, [fetchCount])
  useEffect(() => { if (address) fetchBalance() }, [address, fetchBalance])

  // auto-detect MetaMask on mount
  useEffect(() => {
    if (mode !== 'metamask' || !window.ethereum) return
    window.ethereum
      .request({ method: 'eth_accounts' })
      .then((accounts) => {
        const accs = accounts as string[]
        if (accs.length > 0) setMetamaskAddress(accs[0])
      })
      .catch(console.error)

    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[]
      if (accs.length === 0) {
        setMetamaskAddress(null)
      } else {
        setMetamaskAddress(accs[0])
      }
    }

    window.ethereum.on?.('accountsChanged', handleAccountsChanged)
    return () => {
      window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged)
    }
  }, [mode])

  // WebSocket listener
  useEffect(() => {
    let destroyed = false

    const setupWs = async () => {
      try {
        const wsProvider = new WebSocketProvider(MONAD_WS_URL)
        wsProviderRef.current = wsProvider

        await wsProvider.ready
        if (destroyed) { wsProvider.destroy(); return }
        setWsConnected(true)

        const contract = new Contract(COUNTER_ADDRESS, COUNTER_ABI, wsProvider)
        contract.on('Increment', (by) => {
          const wsEventAt = performance.now()
          console.log(`Live: Increment(${by}) at ${wsEventAt.toFixed(0)}ms`)

          if (pendingTxRef.current) {
            const log = { ...pendingTxRef.current, wsEventAt }
            pendingTxRef.current = null
            setTxLogs(prev => [log, ...prev].slice(0, 10))
          } else {
            setTxLogs(prev => [{
              action: `ext incBy(${by})`,
              txSentAt: wsEventAt,
              txConfirmedAt: null,
              wsEventAt,
            }, ...prev].slice(0, 10))
          }
          fetchCount()
        })
      } catch (err) {
        console.error('WebSocket connection failed:', err)
        setWsConnected(false)
      }
    }

    setupWs()
    return () => {
      destroyed = true
      if (wsProviderRef.current) {
        wsProviderRef.current.destroy()
        wsProviderRef.current = null
      }
      setWsConnected(false)
    }
  }, [fetchCount])

  // --- wallet actions ---

  const selectBurner = () => {
    localStorage.setItem(MODE_KEY, 'burner')
    setMode('burner')
    setMetamaskAddress(null)
    setBalance(null)
    if (!burnerWallet) {
      const w = createBurnerWallet()
      setBurnerWallet(w)
    }
    setStatus('Burner wallet selected')
  }

  const selectMetamask = async () => {
    if (!window.ethereum) {
      setStatus('No wallet found. Install MetaMask.')
      return
    }
    try {
      // switch to Monad Testnet first
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: MONAD_TESTNET_CHAIN_ID }],
        })
      } catch (switchErr: unknown) {
        const code = (switchErr as { code?: number }).code
        // 4902 = chain not added yet
        if (code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: MONAD_TESTNET_CHAIN_ID,
              chainName: 'Monad Testnet',
              nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
              rpcUrls: ['https://testnet-rpc.monad.xyz'],
              blockExplorerUrls: ['https://testnet.monadexplorer.com'],
            }],
          })
        }
      }
      // then request accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[]
      localStorage.setItem(MODE_KEY, 'metamask')
      setMode('metamask')
      setMetamaskAddress(accounts[0])
      setBalance(null)
      setStatus('MetaMask connected')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      setStatus(`MetaMask failed: ${msg}`)
    }
  }

  const generateNewBurner = () => {
    localStorage.removeItem(STORAGE_KEY)
    const w = createBurnerWallet()
    setBurnerWallet(w)
    setBalance(null)
    setStatus('New burner wallet generated!')
  }

  const disconnect = () => {
    localStorage.removeItem(MODE_KEY)
    setMode('none')
    setMetamaskAddress(null)
    setBalance(null)
    setStatus('Disconnected')
  }

  // --- tx actions ---

  const callInc = async () => {
    setLoading(true)
    setStatus('Sign the transaction...')
    try {
      const signer = await getSigner()
      const contract = new Contract(COUNTER_ADDRESS, COUNTER_ABI, signer)
      const tx = await contract.inc()
      // start timing AFTER tx is signed & submitted to the network
      const txSentAt = performance.now()
      const log: TxLog = { action: 'inc()', txSentAt, txConfirmedAt: null, wsEventAt: null }
      pendingTxRef.current = log
      setStatus('TX submitted, waiting...')
      await tx.wait()
      const txConfirmedAt = performance.now()
      log.txConfirmedAt = txConfirmedAt
      // if WS hasn't fired yet, the log will be added when WS fires
      // if WS already fired and cleared pendingTxRef, update the log in state
      if (!pendingTxRef.current) {
        setTxLogs(prev => {
          const updated = [...prev]
          if (updated[0] && updated[0].action === log.action && updated[0].txConfirmedAt === null) {
            updated[0] = { ...updated[0], txConfirmedAt }
          }
          return updated
        })
      }
      setStatus(`inc() — TX: ${((txConfirmedAt - txSentAt) / 1000).toFixed(2)}s`)
      await fetchCount()
      await fetchBalance()
    } catch (err) {
      pendingTxRef.current = null
      setStatus(`inc() failed: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const callIncBy = async () => {
    const val = parseInt(incByValue)
    if (!val || val <= 0) {
      setStatus('Value must be a positive number')
      return
    }
    setLoading(true)
    setStatus('Sign the transaction...')
    try {
      const signer = await getSigner()
      const contract = new Contract(COUNTER_ADDRESS, COUNTER_ABI, signer)
      const tx = await contract.incBy(val)
      // start timing AFTER tx is signed & submitted to the network
      const txSentAt = performance.now()
      const log: TxLog = { action: `incBy(${val})`, txSentAt, txConfirmedAt: null, wsEventAt: null }
      pendingTxRef.current = log
      setStatus('TX submitted, waiting...')
      await tx.wait()
      const txConfirmedAt = performance.now()
      log.txConfirmedAt = txConfirmedAt
      if (!pendingTxRef.current) {
        setTxLogs(prev => {
          const updated = [...prev]
          if (updated[0] && updated[0].action === log.action && updated[0].txConfirmedAt === null) {
            updated[0] = { ...updated[0], txConfirmedAt }
          }
          return updated
        })
      }
      setStatus(`incBy(${val}) — TX: ${((txConfirmedAt - txSentAt) / 1000).toFixed(2)}s`)
      await fetchCount()
      await fetchBalance()
    } catch (err) {
      pendingTxRef.current = null
      setStatus(`incBy() failed: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const hasBalance = balance !== null && parseFloat(balance) > 0

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h1>Monad Counter</h1>
      <p style={{ color: '#888', fontSize: '0.85rem' }}>
        Contract: <code>{COUNTER_ADDRESS}</code>
      </p>
      <p style={{ fontSize: '0.75rem', color: wsConnected ? '#4ade80' : '#f87171' }}>
        {wsConnected ? 'Live updates via WebSocket' : 'WebSocket disconnected'}
      </p>

      {/* Wallet selection */}
      <div style={{ margin: '1rem 0', padding: '1rem', borderRadius: '8px', border: '1px solid #333' }}>
        {mode === 'none' ? (
          <>
            <p style={{ fontSize: '0.85rem', color: '#888', margin: '0 0 1rem' }}>
              Choose a wallet to start transacting
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {ENV_PRIVATE_KEY && (
                <button onClick={() => { localStorage.setItem(MODE_KEY, 'auto'); setMode('auto'); setStatus('Private key wallet connected') }}>
                  Private Key
                </button>
              )}
              <button onClick={selectBurner}>Burner</button>
              <button onClick={selectMetamask}>MetaMask</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#888' }}>
                {mode === 'auto' ? 'Private Key' : mode === 'burner' ? 'Burner' : 'MetaMask'}
              </span>
              <button onClick={disconnect} style={{ fontSize: '0.7rem', padding: '0.2em 0.6em' }}>
                Disconnect
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
              <code>{address}</code>
            </p>
            <p style={{ fontSize: '0.85rem', margin: '0.5rem 0' }}>
              Balance: <strong>{balance ?? '...'} MON</strong>
            </p>
            {!hasBalance && (
              <p style={{ fontSize: '0.75rem', color: '#f87171' }}>
                Send testnet MON to the address above to start transacting
              </p>
            )}
            {mode === 'burner' && (
              <button onClick={generateNewBurner} style={{ fontSize: '0.75rem', padding: '0.3em 0.8em', marginTop: '0.5rem' }}>
                Generate New Wallet
              </button>
            )}
          </>
        )}
      </div>

      {/* Counter display */}
      <div style={{ margin: '2rem 0' }}>
        <h2 style={{ fontSize: '4rem', margin: '0.5rem 0' }}>{count ?? '...'}</h2>
        <p style={{ color: '#888' }}>Current counter value</p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={callInc} disabled={loading || !isConnected || !hasBalance}>
          inc()
        </button>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <input
            type="number"
            min="1"
            value={incByValue}
            onChange={(e) => setIncByValue(e.target.value)}
            style={{ width: '60px', padding: '0.5em', borderRadius: '8px', border: '1px solid #444', textAlign: 'center' }}
          />
          <button onClick={callIncBy} disabled={loading || !isConnected || !hasBalance}>
            incBy()
          </button>
        </div>
        <button onClick={fetchCount} disabled={loading}>
          Refresh
        </button>
      </div>

      {status && (
        <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#aaa' }}>{status}</p>
      )}

      {/* Speed log */}
      {txLogs.length > 0 && (
        <div style={{ marginTop: '2rem', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Speed Log</h3>
          <div style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.25rem', padding: '0.5rem', borderBottom: '1px solid #333', color: '#888' }}>
              <span>Action</span>
              <span>TX Confirm</span>
              <span>WS Event</span>
            </div>
            {txLogs.map((log, i) => {
              const confirmMs = log.txConfirmedAt ? ((log.txConfirmedAt - log.txSentAt) / 1000).toFixed(2) : '—'
              const wsMs = log.wsEventAt ? ((log.wsEventAt - log.txSentAt) / 1000).toFixed(2) : '—'
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.25rem', padding: '0.5rem', borderBottom: '1px solid #222' }}>
                  <span style={{ color: '#c4b5fd' }}>{log.action}</span>
                  <span style={{ color: '#4ade80' }}>{confirmMs}s</span>
                  <span style={{ color: '#38bdf8' }}>{wsMs}s</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Test
