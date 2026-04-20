"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, LineStyle, AreaSeries } from "lightweight-charts";

interface PriceChartProps {
  data: { date: string; close: number; open?: number; high?: number; low?: number; volume?: number }[];
  color?: string;
  autoSize?: boolean;
}

export default function PriceChart({ data, color = "#00d4ff", autoSize = true }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create Chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 350,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#6b7280",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      crosshair: {
        mode: 1,
        vertLine: { width: 1, color: "rgba(255, 255, 255, 0.2)", style: LineStyle.Dashed },
        horzLine: { width: 1, color: "rgba(255, 255, 255, 0.2)", style: LineStyle.Dashed },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });

    // Add Area Series - V5 API
    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: color,
      topColor: `${color}4D`,
      bottomColor: `${color}00`,
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = areaSeries;

    // Handle Responsive
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight 
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [color]);

  useEffect(() => {
    if (seriesRef.current && data && data.length > 0) {
      // Format data: Sort by date and convert to seconds or YYYY-MM-DD
      const formatted = data
        .map((d) => ({
          time: d.date.includes("T") ? d.date.split("T")[0] : d.date,
          value: d.close,
        }))
        .sort((a, b) => (a.time > b.time ? 1 : -1));

      // Remove duplicates if any
      const uniqueData = formatted.filter((v, i, a) => a.findIndex(t => t.time === v.time) === i);
      
      seriesRef.current.setData(uniqueData);
      chartRef.current?.timeScale().fitContent();
    }
  }, [data]);

  const handleShareToFeed = () => {
    if (!chartRef.current) return;
    try {
      const canvas = chartRef.current.takeScreenshot();
      const dataUrl = canvas.toDataURL("image/png");
      // In a full implementation, this dataUrl (or blob) gets sent to MinIO via the /api/v2/social/posts endpoint.
      alert("Chart captured! Redirecting to New Post screen...");
      // Simulate navigation or open a modal here
    } catch (err) {
      console.error("Failed to take screenshot:", err);
    }
  };

  return (
    <div className="relative w-full h-[350px] group">
      <div ref={chartContainerRef} className="w-full h-full" />
      
      {/* Chart Tools Placeholder (Phase 2 & 2.5) */}
      <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
         <button className="px-2 py-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] uppercase font-bold tracking-wider text-white/60">
           Select Range
         </button>
         <button 
           onClick={handleShareToFeed}
           className="px-2 py-1.5 rounded bg-[#00d4ff]/20 border border-[#00d4ff]/30 text-[#00d4ff] hover:bg-[#00d4ff]/30 text-[10px] uppercase font-bold tracking-wider transition-all"
         >
           Share to Feed
         </button>
      </div>
    </div>
  );
}
