"use client";

import { useEffect, useRef, useState } from "react";
import { 
  createChart, 
  ColorType, 
  IChartApi, 
  ISeriesApi, 
  LineStyle, 
  CandlestickSeries,
  HistogramSeries,
} from "lightweight-charts";
import { Maximize2, Share2, CornerUpRight, MousePointer2 } from "lucide-react";

interface PriceChartProps {
  data: { date: string; close: number; open?: number; high?: number; low?: number; volume?: number }[];
  color?: string;
  autoSize?: boolean;
  period?: string;
  onPeriodChange?: (period: string) => void;
}

export default function PriceChart({ 
  data, 
  color = "#00d4ff", 
  autoSize = true,
  period = "3mo",
  onPeriodChange
}: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [legendData, setLegendData] = useState<{
    time: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  } | null>(null);

  // 1. Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a1a1aa",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.02)" },
        horzLines: { color: "rgba(255, 255, 255, 0.02)" },
      },
      crosshair: {
        mode: 1,
        vertLine: { width: 1, color: "rgba(255, 255, 255, 0.2)", style: LineStyle.Dashed },
        horzLine: { width: 1, color: "rgba(255, 255, 255, 0.2)", style: LineStyle.Dashed },
      },
      rightPriceScale: { 
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: { borderVisible: false, fixLeftEdge: true, fixRightEdge: true },
      handleScale: { mouseWheel: false, pinch: false },
      handleScroll: { mouseWheel: false, pressedMouseMove: true },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', downColor: '#ef4444', borderVisible: false,
      wickUpColor: '#10b981', wickDownColor: '#ef4444',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: 'rgba(38, 166, 154, 0.2)', priceFormat: { type: 'volume' }, priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Legend on mouse move
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point) {
        setLegendData(null);
      } else {
        const d = param.seriesData.get(candleSeries) as any;
        const v = param.seriesData.get(volumeSeries) as any;
        if (d) {
          setLegendData({
            time: param.time as string,
            open: d.open?.toFixed(2) || "N/A",
            high: d.high?.toFixed(2) || "N/A",
            low: d.low?.toFixed(2) || "N/A",
            close: d.close?.toFixed(2) || "N/A",
            volume: v?.value?.toLocaleString() || "0",
          });
        }
      }
    });

    // Handle Resize with ResizeObserver
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || !chartRef.current) return;
      const { width, height } = entries[0].contentRect;
      chartRef.current.applyOptions({ width, height });
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [isFullscreen]);

  // 2. Load Data
  useEffect(() => {
    if (!seriesRef.current || !volumeSeriesRef.current || !data || data.length === 0) return;

    try {
      const priceData = data.map(d => ({
        time: d.date.split("T")[0].split(" ")[0], // Robust date cleaning
        open: d.open || d.close,
        high: d.high || d.close,
        low: d.low || d.close,
        close: d.close,
      })).sort((a, b) => (a.time > b.time ? 1 : -1));

      const volumeData = data.map(d => ({
        time: d.date.split("T")[0].split(" ")[0],
        value: d.volume || 0,
        color: d.close >= (d.open || d.close) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
      })).sort((a, b) => (a.time > b.time ? 1 : -1));

      // Remove overlapping same-time points (common bug in data APIs)
      const uniquePrice = priceData.filter((v, i, a) => a.findIndex(t => t.time === v.time) === i);
      const uniqueVolume = volumeData.filter((v, i, a) => a.findIndex(t => t.time === v.time) === i);

      if (uniquePrice.length > 0) {
        seriesRef.current.setData(uniquePrice as any);
        volumeSeriesRef.current.setData(uniqueVolume as any);
        chartRef.current?.timeScale().fitContent();
      }
      setIsDataLoaded(true);
    } catch (err) {
      console.error("[Chart] Data Load Error:", err);
    }
  }, [data]);

  const handleShareToFeed = () => {
    if (!chartRef.current) return;
    const canvas = chartRef.current.takeScreenshot();
    const link = document.createElement('a');
    link.download = `bitigchi-analysis-${period}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className={`flex flex-col w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-black p-8' : 'h-[600px] border border-white/5 rounded-2xl bg-black/40 shadow-2xl backdrop-blur-xl'} overflow-hidden transition-all duration-300`}>
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-white/[0.02]">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${isDataLoaded ? 'bg-[#00d4ff] animate-pulse' : 'bg-white/10'}`} />
               <span className="text-[10px] font-bold tracking-widest text-[#00d4ff] uppercase">Real-Time Data Feed</span>
            </div>

            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/40 border border-white/10">
              {["1d", "1mo", "3mo", "6mo", "1y", "5y", "max"].map((r) => (
                <button key={r} onClick={() => onPeriodChange?.(r)} className="px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all" style={{ background: period === r ? "rgba(0, 212, 255, 0.15)" : "transparent", color: period === r ? "#00d4ff" : "#52525b" }}>
                  {r}
                </button>
              ))}
            </div>

            {legendData && (
              <div className="hidden lg:flex items-center gap-4 text-[10px] font-mono text-white/40">
                <div className="flex gap-1.5"><span className="text-white/20">O</span><span className="text-[#e8e6e3]">{legendData.open}</span></div>
                <div className="flex gap-1.5"><span className="text-white/20">H</span><span className="text-[#10b981]">{legendData.high}</span></div>
                <div className="flex gap-1.5"><span className="text-white/20">L</span><span className="text-[#ef4444]">{legendData.low}</span></div>
                <div className="flex gap-1.5"><span className="text-white/20">C</span><span className="text-[#00d4ff]">{legendData.close}</span></div>
              </div>
            )}
         </div>

         <div className="flex items-center gap-2">
            <button onClick={handleShareToFeed} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:bg-[#00d4ff]/20 hover:text-[#00d4ff] transition-all"><Share2 size={16} /></button>
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 transition-all"><Maximize2 size={16} /></button>
         </div>
      </div>

      <div className="relative flex-1 p-2">
         {!isDataLoaded && (
           <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 backdrop-blur-sm">
              <span className="text-xs font-mono text-white/20 animate-pulse uppercase tracking-widest">Compiling Analytics...</span>
           </div>
         )}
         {isDataLoaded && data.length === 0 && (
           <div className="absolute inset-0 flex items-center justify-center z-10">
              <span className="text-xs font-mono text-white/40 uppercase tracking-widest">Historical Data Unavailable</span>
           </div>
         )}
         <div ref={chartContainerRef} className="w-full h-full" />
      </div>

      <div className="px-6 py-2 border-t border-white/5 flex items-center justify-between text-[9px] uppercase tracking-tighter text-white/20 font-bold">
        <div className="flex items-center gap-2"><span>HYBRID MULTI-SOURCE FEED</span></div>
        <div className="flex items-center gap-3"><span>UTC SYNC</span></div>
      </div>
    </div>
  );
}
