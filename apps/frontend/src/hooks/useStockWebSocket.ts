"use client";

import { useState, useEffect, useRef } from "react";

export interface TradeUpdate {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
}

export function useStockWebSocket(symbol: string, apiKey: string) {
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [lastTrade, setLastTrade] = useState<TradeUpdate | null>(null);
  const [pressure, setPressure] = useState<number>(50); // 0-100 (50 is neutral)
  const [isWsConnected, setIsWsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!symbol || !apiKey) return;

    const connectWS = () => {
      // Connect to Finnhub WebSocket
      ws.current = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);

      ws.current.onopen = () => {
        console.log(`[WS] Connected for ${symbol}`);
        setIsWsConnected(true);
        ws.current?.send(JSON.stringify({ type: "subscribe", symbol: symbol.toUpperCase() }));
      };

      ws.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "trade") {
          const trades = msg.data as any[];
          if (trades.length > 0) {
            const latest = trades[trades.length - 1];
            setLivePrice(latest.p);
            setLastTrade({
              symbol: latest.s,
              price: latest.p,
              volume: latest.v,
              timestamp: latest.t,
            });

            setPressure(prev => {
               const change = latest.p > (livePrice || latest.p) ? 4 : (latest.p < (livePrice || latest.p) ? -4 : 0);
               return Math.max(10, Math.min(90, prev + change));
            });
          }
        }
      };

      ws.current.onerror = (err) => {
        console.error("[WS] Error observed, switching to polling fallback...");
        setIsWsConnected(false);
      };

      ws.current.onclose = () => {
        console.log("[WS] Disconnected, triggering polling fallback...");
        setIsWsConnected(false);
      };
    };

    connectWS();

    // FALLBACK POLLING: If WS fails or isn't connected, fetch price every 2.5s
    pollTimer.current = setInterval(async () => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
        try {
          const r = await fetch(`/api/lookup/${symbol}?period=1d`);
          const d = await r.json();
          if (d.current_price) {
            setLivePrice(d.current_price);
            // Simulate some pressure movement to keep UI alive
            setPressure(p => Math.max(20, Math.min(80, p + (Math.random() > 0.5 ? 2 : -2))));
          }
        } catch (err) {
          console.error("[Polling] Fallback failed:", err);
        }
      }
    }, 2500);

    return () => {
      if (ws.current) ws.current.close();
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [symbol, apiKey]);

  return { livePrice, lastTrade, pressure, isWsConnected };
}
