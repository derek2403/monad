import { useState, useEffect, useCallback } from 'react'
import { BrowserProvider, Contract } from 'ethers'

const COUNTER_ADDRESS = '0x7B60257377bC34F12E451DE2e9eBe7Fc99974c5b'

const COUNTER_ABI = [
  'function x() view returns (uint256)',
  'function inc()',
  'function incBy(uint256 by)',
  'event Increment(uint256 by)',
]

const MONAD_TESTNET_CHAIN_ID = '0x27AF'

function Test() {
  const [count, setCount] = useState<string | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [incByValue, setIncByValue] = useState('1')
  const [status, setStatus] = useState('')

  const fetchCount = useCallback(async () => {
    if (!window.ethereum) return
    try {
      const provider = new BrowserProvider(window.ethereum)
      const contract = new Contract(COUNTER_ADDRESS, COUNTER_ABI, provider)
      const value = await contract.x()
      setCount(value.toString())
    } catch (err) {
      console.error('Failed to fetch count:', err)
      setStatus(`Failed to read counter: ${err}`)
    }
  }, [])

  // auto-detect already connected accounts on mount
  useEffect(() => {
    if (!window.ethereum) return
    window.ethereum
      .request({ method: 'eth_accounts' })
      .then((accounts) => {
        const accs = accounts as string[]
        if (accs.length > 0) {
          setAccount(accs[0])
          fetchCount()
        }
      })
      .catch(console.error)

    // listen for account/chain changes
    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[]
      if (accs.length === 0) {
        setAccount(null)
        setCount(null)
      } else {
        setAccount(accs[0])
        fetchCount()
      }
    }
    const handleChainChanged = () => {
      fetchCount()
    }

    window.ethereum.on?.('accountsChanged', handleAccountsChanged)
    window.ethereum.on?.('chainChanged', handleChainChanged)
    return () => {
      window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged)
      window.ethereum?.removeListener?.('chainChanged', handleChainChanged)
    }
  }, [fetchCount])

  const connect = async () => {
    if (!window.ethereum) {
      setStatus('No wallet found. Install MetaMask.')
      return
    }
    try {
      // request accounts (triggers MetaMask popup if not connected)
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[]
      // switch to Monad Testnet
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: MONAD_TESTNET_CHAIN_ID }],
        })
      } catch {
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
      setAccount(accounts[0])
      await fetchCount()
    } catch (err) {
      console.error('Connection failed:', err)
      setStatus(`Connection failed: ${err}`)
    }
  }

  const callInc = async () => {
    if (!window.ethereum) return
    setLoading(true)
    setStatus('Sending inc()...')
    try {
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new Contract(COUNTER_ADDRESS, COUNTER_ABI, signer)
      const tx = await contract.inc()
      setStatus('Waiting for confirmation...')
      await tx.wait()
      setStatus('inc() confirmed!')
      await fetchCount()
    } catch (err) {
      setStatus(`inc() failed: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const callIncBy = async () => {
    if (!window.ethereum) return
    const val = parseInt(incByValue)
    if (!val || val <= 0) {
      setStatus('Value must be a positive number')
      return
    }
    setLoading(true)
    setStatus(`Sending incBy(${val})...`)
    try {
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new Contract(COUNTER_ADDRESS, COUNTER_ABI, signer)
      const tx = await contract.incBy(val)
      setStatus('Waiting for confirmation...')
      await tx.wait()
      setStatus(`incBy(${val}) confirmed!`)
      await fetchCount()
    } catch (err) {
      setStatus(`incBy() failed: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
      <h1>Monad Counter</h1>
      <p style={{ color: '#888', fontSize: '0.85rem' }}>
        Contract: <code>{COUNTER_ADDRESS}</code>
      </p>

      {!account ? (
        <button onClick={connect}>Connect Wallet</button>
      ) : (
        <>
          <p style={{ fontSize: '0.85rem' }}>
            Connected: <code>{account.slice(0, 6)}...{account.slice(-4)}</code>
          </p>

          <div style={{ margin: '2rem 0' }}>
            <h2 style={{ fontSize: '4rem', margin: '0.5rem 0' }}>{count ?? '...'}</h2>
            <p style={{ color: '#888' }}>Current counter value</p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={callInc} disabled={loading}>
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
              <button onClick={callIncBy} disabled={loading}>
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
        </>
      )}
    </div>
  )
}

export default Test
