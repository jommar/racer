import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import RaceTrack from '../components/RaceTrack';
import { Play, RotateCcw, Trophy, Gauge, Cpu, Activity, Zap } from 'lucide-react';

const RaceSimulator: React.FC = () => {
  const [carCount, setCarCount] = useState(20);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isRacing, setIsRacing] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [ticks, setTicks] = useState(0);
  const trackLength = 1000;

  // Initialize participants with randomized stats
  const initRace = useCallback(() => {
    const colors = [
      '#e11d48', '#fbbf24', '#3b82f6', '#10b981', 
      '#a855f7', '#f97316', '#06b6d4', '#ec4899'
    ];
    
    const newParticipants = Array.from({ length: carCount }).map((_, i) => ({
      id: `${i}`,
      name: i === 0 ? 'ALPHA-01' : `RACER-${(i + 1).toString().padStart(2, '0')}`,
      position: 0,
      color: colors[i % colors.length],
      speed: 1.5 + Math.random() * 3.5, // Randomized base speed
      drift: Math.random() * 0.5,
    }));
    
    setParticipants(newParticipants);
    setIsRacing(false);
    setWinner(null);
    setTicks(0);
  }, [carCount]);

  useEffect(() => {
    initRace();
  }, [initRace]);

  // Simulation Loop (Frontend Engine Baseline)
  useEffect(() => {
    if (!isRacing) return;

    const interval = setInterval(() => {
      setParticipants((prev) => {
        let currentWinner = winner;
        const updated = prev.map((p) => {
          if (p.position >= trackLength) return p;
          
          // Simplified Probabilistic Movement
          // Position += BaseSpeed + (Random variance for "puncher's chance")
          const variance = Math.random() * 2;
          const move = p.speed + variance;
          const newPos = Math.min(p.position + move, trackLength);
          
          if (newPos >= trackLength && !currentWinner) {
            currentWinner = p.name;
            setWinner(p.name);
          }
          
          return { ...p, position: newPos };
        });

        setTicks(t => t + 1);

        if (updated.every(p => p.position >= trackLength)) {
          setIsRacing(false);
          clearInterval(interval);
        }

        return updated;
      });
    }, 32); // ~30 FPS logic loop

    return () => clearInterval(interval);
  }, [isRacing, winner]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Header & Controls Card */}
        <div className="racing-card border-white/5 bg-secondary/20 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <Cpu className="text-primary w-8 h-8" />
              Engine <span className="text-primary">Baseline</span>
            </h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">v1.0.0 • Canvas Renderer • Unlimited Participants</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <div className="flex flex-col gap-2 bg-black/40 p-3 rounded-lg border border-white/5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Load Test</label>
                <span className="text-[10px] font-black text-primary">{carCount} CARS</span>
              </div>
              <input 
                type="range" min="1" max="500" value={carCount} 
                onChange={(e) => setCarCount(parseInt(e.target.value))}
                className="w-40 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                disabled={isRacing}
              />
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setIsRacing(true)} 
                disabled={isRacing || !!winner}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-black uppercase italic tracking-tighter transition-all ${
                  isRacing || !!winner 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-primary text-white hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(225,29,72,0.4)]'
                }`}
              >
                <Play className="w-4 h-4 fill-current" /> Burn Rubber
              </button>
              
              <button 
                onClick={initRace}
                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                title="Reset Simulation"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* The Track */}
        <div className="space-y-3">
          <div className="flex justify-between items-end px-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                <Activity className={`w-3 h-3 text-red-500 ${isRacing ? 'animate-pulse' : ''}`} />
                <span className="text-[10px] font-black uppercase text-red-500 tracking-tighter">
                  {isRacing ? 'Live Telemetry' : 'Standby'}
                </span>
              </div>
              {winner && (
                <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full animate-in fade-in slide-in-from-left-4">
                  <Trophy className="w-3 h-3 text-accent" />
                  <span className="text-[10px] font-black uppercase text-accent tracking-tighter">WINNER: {winner}</span>
                </div>
              )}
            </div>
            <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
              Distance: {trackLength}m • Ticks: {ticks}
            </div>
          </div>
          
          <RaceTrack participants={participants} trackLength={trackLength} isLive={isRacing} />
        </div>

        {/* Baseline Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="racing-card border-white/5 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase">Throughput</p>
              <p className="text-xl font-black italic">{(carCount * (isRacing ? 30 : 0)).toLocaleString()} <span className="text-xs opacity-50 font-normal">ops/sec</span></p>
            </div>
          </div>

          <div className="racing-card border-white/5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Gauge className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase">Logic Latency</p>
              <p className="text-xl font-black italic">32ms <span className="text-xs opacity-50 font-normal">Fixed</span></p>
            </div>
          </div>

          <div className="racing-card border-white/5 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase">Render Engine</p>
              <p className="text-xl font-black italic">HTML5 <span className="text-xs opacity-50 font-normal text-green-500">CANVAS</span></p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RaceSimulator;
