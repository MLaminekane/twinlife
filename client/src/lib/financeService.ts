
// Service simple pour récupérer des données financières
// Utilise l'API CoinGecko pour la crypto (gratuit, sans clé) et simule les données boursières

export interface FinanceData {
  // Données sur le Bitcoin (prix et variation sur 24h)
  bitcoin: {
    price: number
    change24h: number
  }
  etherum?: {
    price: number
    change24h: number
  } 
  // Sentiment du marché (Haussier, Baissier ou Neutre)
  marketSentiment: 'Bullish' | 'Bearish' | 'Neutral'
  // Liste des actions les plus performantes
  topStocks: Array<{ symbol: string, price: number, change: number }>
  // Flux d'actualités financières
  news: Array<{ title: string, source: string, time: string, url: string }>
}

export const FinanceService = {
  async getBitcoinData() {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true')
      const data = await res.json()
      return {
        price: data.bitcoin.usd,
        change24h: data.bitcoin.usd_24h_change
      }
    } catch (e) {
      console.warn('Échec de la récupération des données crypto, utilisation du fallback', e)
      return { price: 95000 + Math.random() * 1000, change24h: (Math.random() - 0.5) * 5 }
    }
  },

  async getRealNews() {
    try {
      // Utilise rss2json pour récupérer le flux RSS de CNBC Finance sans problème de CORS
      const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.cnbc.com/id/10000664/device/rss/rss.html')
      const data = await res.json()
      
      if (data.status === 'ok') {
        return data.items.slice(0, 5).map((item: any) => ({
          title: item.title,
          source: 'CNBC Finance',
          time: new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          url: item.link
        }))
      }
      throw new Error('RSS fetch failed')
    } catch (e) {
      console.warn('Échec news, fallback', e)
      return [
        { title: "Impossible de charger les news en temps réel", source: "Système", time: "Maintenant", url: "#" }
      ]
    }
  },

  async getMarketData(): Promise<FinanceData> {
    const btc = await this.getBitcoinData()
    const news = await this.getRealNews()
        // Simulations des actions
    const sentiment = btc.change24h > 0 ? 'Bullish' : 'Bearish'
    
    return {
      bitcoin: btc,
      marketSentiment: sentiment,
      topStocks: [
        { symbol: 'AAPL', price: 180 + Math.random() * 2, change: (Math.random() - 0.4) * 1.5 },
        { symbol: 'NVDA', price: 800 + Math.random() * 5, change: (Math.random() - 0.3) * 2 },
        { symbol: 'TSLA', price: 200 + Math.random() * 3, change: (Math.random() - 0.5) * 3 },
        { symbol: 'MSFT', price: 400 + Math.random() * 2, change: (Math.random() - 0.4) * 1 },
      ],
      news: news
    }
  },

  getMockMarketData(): FinanceData {
    return {
      bitcoin: { price: 0, change24h: 0 }, 
      marketSentiment: 'Neutral',
      topStocks: [],
      news: []
    }
  }
}
