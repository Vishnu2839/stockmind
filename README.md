<div align="center">

<br/>

```
███████╗████████╗ ██████╗  ██████╗██╗  ██╗███╗   ███╗██╗███╗   ██╗██████╗ 
██╔════╝╚══██╔══╝██╔═══██╗██╔════╝██║ ██╔╝████╗ ████║██║████╗  ██║██╔══██╗
███████╗   ██║   ██║   ██║██║     █████╔╝ ██╔████╔██║██║██╔██╗ ██║██║  ██║
╚════██║   ██║   ██║   ██║██║     ██╔═██╗ ██║╚██╔╝██║██║██║╚██╗██║██║  ██║
███████║   ██║   ╚██████╔╝╚██████╗██║  ██╗██║ ╚═╝ ██║██║██║ ╚████║██████╔╝
╚══════╝   ╚═╝    ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝ 
```

### 🧠 AI Brain for Stocks — Real-Time Paper Trading Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

> **StockMind shows you *HOW* it thinks — not just *WHAT* it thinks.**  
> Real market data. Virtual $1,000,000. Zero risk. Maximum insight.

</div>

---

## ✨ What is StockMind?

**StockMind** is a full-stack AI-powered paper trading platform that fuses **social sentiment**, **live news**, **technical indicators**, and **machine learning** into a single, transparent verdict — complete with a streaming AI Brain that explains its reasoning word-by-word in real time.

Unlike black-box prediction tools, StockMind's **Glass Box AI** shows every step of its analysis:

```
📡 Gather Evidence  →  📊 Read Signals  →  ⚡ Detect Conflicts  →  🔮 Predict  →  ✅ Verdict
```

---

## 🚀 Quick Start

### 1. Clone & Enter

```bash
git clone https://github.com/your-username/stockmind.git
cd stockmind
```

### 2. Start the Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
# Backend running on: http://localhost:8001
```

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
# Frontend running on: http://localhost:5173
```

### 4. Open in Browser

```
http://localhost:5173
```

> 📝 **Register** a new account to get access. Your virtual **$1,000,000** balance is waiting!

---

## 🧠 The AI Brain — Glass Box Explained

The AI Brain processes **6 live data sources** simultaneously, then streams its full reasoning to you in real-time:

| # | Step | What Happens |
|---|------|-------------|
| 1 | **📡 Evidence Gathering** | Scans StockTwits, News, Google Trends, Technicals, Alpha Vantage, and Events |
| 2 | **📊 Signal Reading** | Interprets the bullish/bearish weight of each source |
| 3 | **⚡ Conflict Analysis** | Detects contradictions (e.g. bullish news vs bearish RSI) |
| 4 | **🧩 Pattern Memory** | Matches historical setups from trained BiLSTM model |
| 5 | **🔮 Emotion Fusion** | Blends all signals into a 0-100 emotion score |
| 6 | **✅ Final Verdict** | `BUY` / `SELL` / `HOLD` + price target + stop loss + confidence |

---

## 📡 Live Data Sources

| Source | What We Collect | Indicator Color |
|--------|----------------|-----------------|
| 💬 **StockTwits** | Tweets, sentiment, engagement, influencer posts | ![#1d9bf0](https://placehold.co/12x12/1d9bf0/1d9bf0.png) `#1d9bf0` |
| 📰 **News (FinBERT)** | Headlines scored with FinBERT NLP model locally | ![#0d9488](https://placehold.co/12x12/0d9488/0d9488.png) `#0d9488` |
| 🧠 **Alpha Vantage** | Fundamental & sentiment data from financial APIs | ![#f97316](https://placehold.co/12x12/f97316/f97316.png) `#f97316` |
| 📈 **Google Trends** | Search interest spikes and direction shifts | ![#10b981](https://placehold.co/12x12/10b981/10b981.png) `#10b981` |
| 📊 **Price / Technical** | RSI, MACD, Bollinger Bands, EMA, 15+ indicators | ![#9d5ff5](https://placehold.co/12x12/9d5ff5/9d5ff5.png) `#9d5ff5` |
| 📅 **Events / Earnings** | Earnings dates, analyst consensus, dividends | ![#f59e0b](https://placehold.co/12x12/f59e0b/f59e0b.png) `#f59e0b` |

---

## 📱 App Screens

```
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│   🏠 Home    │  📊 Markets  │  🔍 Detail   │   🧠 Brain   │  💼 Portfolio│
├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Net worth    │ Search any   │ Live chart   │ Watch AI     │ Holdings P&L │
│ Your stocks  │ stock ticker │ Evidence     │ think live   │ Allocation   │
│ Market mood  │ Trending     │ grid (6)     │ word-by-word │ donut chart  │
│ AI Alerts    │ stocks list  │ AI verdict   │ with steps   │ Trade history│
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

---

## 🏗️ Project Structure

```
stockmind/
├── 🐍 backend/
│   ├── main.py                 # FastAPI routes & CORS
│   ├── data_collector.py       # yfinance + 15+ technical indicators
│   ├── social_scraper.py       # StockTwits live scraper
│   ├── news_scraper.py         # Yahoo Finance news + FinBERT NLP
│   ├── trends_scraper.py       # Google Trends via pytrends
│   ├── events_calendar.py      # Earnings, dividends, analyst ratings
│   ├── emotion_fusion.py       # Master emotion score (0–100)
│   ├── regime_detector.py      # HMM market regime detection
│   ├── ai_brain.py             # Streaming SSE reasoning engine
│   ├── predictor.py            # 8-timeframe ML predictions
│   ├── backtest.py             # 1-year paper trading simulation
│   ├── model.py                # BiLSTM + Multi-Head Attention
│   ├── train.py                # Training pipeline
│   ├── models/                 # Trained .h5 model weights
│   └── requirements.txt
│
└── ⚛️  frontend/
    └── src/
        ├── App.jsx             # Router + AuthProvider
        ├── api/stockApi.js     # API layer + SSE streaming client
        ├── hooks/
        │   ├── useAuth.js      # Authentication state
        │   ├── usePortfolio.js # Portfolio & trading logic
        │   ├── useStock.js     # Two-stage stock data loading
        │   └── useStream.js    # AI reasoning stream handler
        └── components/
            ├── layout/         # Sidebar, Topbar, BottomNav
            ├── screens/        # Home, Markets, StockDetail, Portfolio, Auth
            ├── evidence/       # EvidenceGrid, SourceCard, SourceModal
            ├── brain/          # AIBrainPanel, ThinkingStream
            ├── verdict/        # VerdictCard, ConfidenceRing
            └── shared/         # StockRow, AIChatbot, MoodBar, SearchBar
```

---

## 🤖 StockMind AI Assistant

Every page features a **floating AI assistant** that answers market questions with live data:

| You Ask | Assistant Answers |
|---------|------------------|
| *"Which stock is best to buy?"* | Recommends top stock by AI Brain confidence score |
| *"Which stock is in loss?"* | Names the worst performer with exact % drop |
| *"I want to invest $1000"* | Suggests the best affordable stock + share count |
| *"How does the AI work?"* | Explains the Emotion Fusion pipeline |
| *"What's my portfolio?"* | Shows current balance and holdings count |

---

## 📊 Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server status + loaded model count |
| `GET` | `/search?q=AAPL` | Ticker search with company name |
| `GET` | `/watchlist?tickers=AAPL,TSLA` | Live prices for multiple stocks |
| `GET` | `/analyze?ticker=AAPL` | Full 6-source deep analysis |
| `GET` | `/think?ticker=AAPL&timeframe=1M` | **SSE stream** — real-time AI reasoning |
| `GET` | `/historical?ticker=AAPL&days=365` | OHLCV + technical indicators for charts |
| `GET` | `/backtest?ticker=AAPL` | 1-year paper trading simulation results |
| `GET` | `/compare?ticker=AAPL` | Model accuracy comparison table |
| `GET` | `/news?ticker=AAPL` | Latest headlines with FinBERT sentiment |

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|-------|-----------|
| **API** | FastAPI + Uvicorn (Python 3.11) |
| **Data** | yfinance · pytrends · BeautifulSoup |
| **NLP** | FinBERT (local, no API key needed) |
| **ML Model** | BiLSTM + Multi-Head Attention |
| **Regime** | Hidden Markov Model (hmmlearn) |
| **Frontend** | React 18 + Vite |
| **Styling** | TailwindCSS 3 + Custom CSS |
| **Charts** | Pure SVG (no external chart lib) |
| **Streaming** | Server-Sent Events (SSE) |
| **Auth** | Local localStorage (paper trading) |

</div>

---

## 💡 Key Features at a Glance

- ✅ **100% Real Market Data** — Live prices via yfinance, no synthetic numbers
- ✅ **$1,000,000 Virtual Balance** — Paper trade safely without real money
- ✅ **Streaming AI Brain** — Watch analysis stream word-by-word via SSE
- ✅ **6 Evidence Sources** — Social + News + Technical + Events all fused
- ✅ **8 Prediction Timeframes** — From 1 Day to 5 Years
- ✅ **Backtesting Engine** — See how the model would have performed historically
- ✅ **Floating AI Chatbot** — Ask market questions in plain English
- ✅ **Login & Register** — Secure user accounts (local auth)
- ✅ **Mobile Responsive** — Works on any device with bottom navigation
- ✅ **Buy & Sell** — Full paper trading with P&L tracking

---

## 🔐 Authentication

StockMind uses **local authentication** — your account data is stored safely in the browser. No cloud server or external database needed for paper trading.

```
Register → Get $1,000,000 → Trade any stock → Track your P&L
```

---

## 🧪 Supported Stocks (Trained Models)

```
AAPL  ·  TSLA  ·  NVDA  ·  MSFT  ·  GOOGL  ·  AMZN  ·  META  ·  NFLX
```

> Any other ticker can be analyzed using technical + social signals (without the BiLSTM model prediction).

---

<div align="center">

**Built with ❤️ for curious traders who want to understand the market.**

*StockMind is for educational & paper trading purposes only. Not financial advice.*

</div>
