# 🦅 Bitigchi — The Investor's Social Ecosystem

**Bitigchi** is a professional-grade financial intelligence platform. It combines real-time market data with AI-driven insights and a thriving community layer to create a "Social Network for Smart Investors."

---

## 🚀 Key Modules & Features

### 👨‍💻 Professional Interactive Charting
Powered by **TradingView Lightweight Charts (v5.1.0)**, Bitigchi provides a high-fidelity charting experience:
*   **Time Range Selection:** Toggle between 1D, 1mo, 3mo, 6mo, and 1y horizons.
*   **Dynamic Intervals:** Intelligent switching between 1-minute, 5-minute, and daily bars.
*   **Financial Aesthetics:** Interactive crosshairs, responsive scaling, and a premium dark-mode interface.

### 🧙‍♂️ Bitigchi AI Bot (Gemini AI)
A world-class financial analyst, accessible in real-time. 
*   **Context-Aware Analysis:** The AI monitors current stock prices, technical indicators (RSI, SMA), and news sentiment to provide deep insights.
*   **Data-Driven Answers:** Ask about specific stocks and get answers based on real-time market conditions.
*   **Threaded History:** Persistent chat threads allow you to continue your analysis over multiple sessions.

### 🤝 Social Discussion Boards
Trading is no longer a solo sport.
*   **Stock-Specific Feeds:** Every ticker page features a dedicated analysis board.
*   **Sentiment Tagging:** Tag your posts as **Bullish** or **Bearish** to contribute to the crowd-sourced sentiment signal.
*   **Global Community Hub:** A centralized "Hot Discussions" feed to track what smart investors are looking at globally.

### 🔍 Advanced Search & Screening
*   **Global Search:** Quick-jump to any ticker from the navbar with an optimized CMD+K style lookup.
*   **Technical Screener:** Filter stocks by RSI, Moving Average crossovers, and market momentum.

---

## 🛠 Technology Stack

### Frontend
- **Framework:** Next.js 16 (TypeScript)
- **Styling:** Tailwind CSS + Framer Motion
- **Charting:** Lightweight Charts (TradingView)
- **Icons:** Lucide-React

### Backend
- **API:** FastAPI (Python 3.11)
- **Database:** PostgreSQL + SQLAlchemy
- **Migrations:** Alembic
- **AI Engine:** Google Gemini Pro (google-generativeai)

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Data APIs:** yfinance + Twelve Data

---

## 🏁 Getting Started

### Prerequisites
- Docker Desktop
- Node.js 20+
- Python 3.11+
- Gemini API Key (Optional, for AI features)

### Installation
1. **Clone the repo:**
   ```bash
   git clone https://github.com/GaribKarimli/Bitigchi.git
   ```
2. **Start Database:**
   ```bash
   docker compose up -d
   ```
3. **Backend Setup:**
   ```bash
   cd apps/backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```
4. **Frontend Setup:**
   ```bash
   cd apps/frontend
   npm install
   npm run dev
   ```

---

*Built with ❤️ for the global investor community.*
