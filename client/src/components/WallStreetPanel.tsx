import { useEffect, useState } from 'react'
import { Html } from '@react-three/drei'
import { FinanceService, FinanceData } from '../lib/financeService'

export function WallStreetPanel({ visible, onClose }: { visible: boolean, onClose: () => void }) {
  const [data, setData] = useState<FinanceData | null>(null)

  useEffect(() => {
    if (visible) {
      const load = async () => {
        const base = FinanceService.getMockMarketData()
        const btc = await FinanceService.getBitcoinData()
        setData({ ...base, bitcoin: btc })
      }
      load()
      const interval = setInterval(load, 10000) // Refresh every 10s
      return () => clearInterval(interval)
    }
  }, [visible])

  if (!visible || !data) return null

  return (
    <Html position={[-12, 8, 7]} center distanceFactor={15} zIndexRange={[100, 0]}>
      <div className="bg-gray-900 text-white p-4 rounded-lg shadow-2xl border border-green-500 w-80 font-mono text-xs opacity-90">
        <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
          <h2 className="text-lg font-bold text-green-400">WALL STREET HUB</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Bitcoin Ticker */}
        <div className="mb-4 bg-gray-800 p-2 rounded">
          <div className="text-gray-400">BITCOIN (BTC)</div>
          <div className="text-2xl font-bold flex items-center gap-2">
            ${data.bitcoin.price.toLocaleString()}
            <span className={data.bitcoin.change24h >= 0 ? 'text-green-500 text-sm' : 'text-red-500 text-sm'}>
              {data.bitcoin.change24h > 0 ? '▲' : '▼'} {Math.abs(data.bitcoin.change24h).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Market Sentiment */}
        <div className="mb-4 flex justify-between items-center">
          <span className="text-gray-400">SENTIMENT:</span>
          <span className={`font-bold ${data.marketSentiment === 'Bullish' ? 'text-green-400' : 'text-red-400'}`}>
            {data.marketSentiment.toUpperCase()}
          </span>
        </div>

        {/* Stocks */}
        <div className="mb-4 space-y-1">
          <div className="text-gray-400 mb-1">TOP MOVERS</div>
          {data.topStocks.map(s => (
            <div key={s.symbol} className="flex justify-between">
              <span className="font-bold">{s.symbol}</span>
              <span>${s.price.toFixed(2)}</span>
              <span className={s.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                {s.change > 0 ? '+' : ''}{s.change.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>

        {/* News Feed */}
        <div>
          <div className="text-gray-400 mb-1">LATEST NEWS</div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {data.news.map((n, i) => (
              <div key={i} className="border-l-2 border-blue-500 pl-2">
                <div className="font-semibold text-blue-300 leading-tight">{n.title}</div>
                <div className="text-[10px] text-gray-500">{n.source} • {n.time}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-3 text-center text-gray-600 italic">
          "Greed, for lack of a better word, is good."
        </div>
      </div>
    </Html>
  )
}
