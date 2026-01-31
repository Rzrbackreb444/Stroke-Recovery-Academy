import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, BarChart3, Waves } from "lucide-react";

type VisualizerMode = "waveform" | "spectrum" | "bars";

interface WaveformVisualizerProps {
  analyserNode?: AnalyserNode | null;
  isPlaying?: boolean;
  color?: string;
  height?: number;
}

export function WaveformVisualizer({ 
  analyserNode, 
  isPlaying = false,
  color = "#C9941A",
  height = 120 
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [mode, setMode] = useState<VisualizerMode>("spectrum");
  const [sensitivity, setSensitivity] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const canvasHeight = canvas.height;

      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, width, canvasHeight);

      if (!analyserNode || !isPlaying) {
        drawIdleState(ctx, width, canvasHeight);
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      if (mode === "waveform") {
        drawWaveform(ctx, analyserNode, width, canvasHeight);
      } else if (mode === "spectrum") {
        drawSpectrum(ctx, analyserNode, width, canvasHeight);
      } else {
        drawBars(ctx, analyserNode, width, canvasHeight);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    const drawIdleState = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const time = Date.now() / 1000;
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, `${color}20`);
      gradient.addColorStop(0.5, `${color}40`);
      gradient.addColorStop(1, `${color}20`);
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let x = 0; x < width; x++) {
        const y = height / 2 + Math.sin(x * 0.02 + time * 2) * 10 * Math.sin(time);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const drawWaveform = (ctx: CanvasRenderingContext2D, analyser: AnalyserNode, width: number, height: number) => {
      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.5, "#F59E0B");
      gradient.addColorStop(1, color);

      ctx.lineWidth = 2;
      ctx.strokeStyle = gradient;
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    const drawSpectrum = (ctx: CanvasRenderingContext2D, analyser: AnalyserNode, width: number, height: number) => {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, `${color}00`);
      gradient.addColorStop(0.3, `${color}80`);
      gradient.addColorStop(0.6, "#F59E0B");
      gradient.addColorStop(1, "#EF4444");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, height);

      const barCount = 128;
      const barWidth = width / barCount;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[dataIndex] * sensitivity;
        const barHeight = (value / 255) * height;
        
        const x = i * barWidth;
        const y = height - barHeight;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[dataIndex] * sensitivity;
        const barHeight = (value / 255) * height;
        const x = i * barWidth;
        const y = height - barHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const drawBars = (ctx: CanvasRenderingContext2D, analyser: AnalyserNode, width: number, height: number) => {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const barCount = 64;
      const barWidth = (width / barCount) - 2;
      const gap = 2;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[dataIndex] * sensitivity;
        const barHeight = (value / 255) * height;
        
        const x = i * (barWidth + gap);
        const y = height - barHeight;

        const hue = (i / barCount) * 60;
        ctx.fillStyle = `hsl(${hue + 30}, 80%, 50%)`;
        
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();

        ctx.fillStyle = `hsl(${hue + 30}, 90%, 70%)`;
        ctx.fillRect(x, y, barWidth, 2);
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyserNode, isPlaying, mode, sensitivity, color]);

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-orange-500" />
            Audio Visualizer
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={mode === "waveform" ? "default" : "ghost"}
              onClick={() => setMode("waveform")}
              className="h-7 px-2"
              data-testid="button-mode-waveform"
            >
              <Waves className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant={mode === "spectrum" ? "default" : "ghost"}
              onClick={() => setMode("spectrum")}
              className="h-7 px-2"
              data-testid="button-mode-spectrum"
            >
              <Activity className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant={mode === "bars" ? "default" : "ghost"}
              onClick={() => setMode("bars")}
              className="h-7 px-2"
              data-testid="button-mode-bars"
            >
              <BarChart3 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <canvas
          ref={canvasRef}
          width={800}
          height={height}
          className="w-full rounded-md"
          style={{ height: `${height}px` }}
        />
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>20Hz</span>
          <Badge variant="outline" className="text-xs">
            {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
          </Badge>
          <span>20kHz</span>
        </div>
      </CardContent>
    </Card>
  );
}
