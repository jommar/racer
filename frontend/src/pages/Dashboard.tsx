import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import RaceTrack from '../components/RaceTrack';
import { Play, RotateCcw, Trophy, Gauge } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [carCount, setCarCount] = useState(10);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isRacing, setIsRacing] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const trackLength = 1000;

  // Initialize participants
  const initRace = useCallback(() => {
    const colors = ['#e11d48', '#fbbf24', '#3b82f6', '#10b981', '#a855f7', '#f97316'];
    const newParticipants = Array.from({ length: carCount }).map((_, i) => ({
      id: `${i}`,
      name: i === 0 ? 'YOU' : `Racer #${i + 1}`,
      position: 0,
      color: colors[i % colors.length],
      speed: 2 + Math.random() * 3, // Base speed
      acceleration: 0.1 + Math.random() * 0.2,
      currentSpeed: 0,
    }));
    setParticipants(newParticipants);
    setIsRacing(false);
    setWinner(null);
  }, [carCount]);

  useEffect(() => {
    initRace();
  }, [initRace]);

  // Simulation Loop
  useEffect(() => {
    if (!isRacing) return;

    const interval = setInterval(() => {
      setParticipants((prev) => {
        const updated = prev.map((p) => {
          if (p.position >= trackLength) return p;
          
          // Mimic Tick Formula: Position += Speed + (Random Weight)
          const boost = Math.random() > 0.9 ? 2 : 0; // Random "Nitro" tick
          const move = p.speed + boost;
          const newPos = Math.min(p.position + move, trackLength);
          
          if (newPos >= trackLength && !winner) {
            setWinner(p.name);
          }
          
          return { ...p, position: newPos };
        });

        // Check if all finished
        if (updated.every(p => p.position >= trackLength)) {
          setIsRacing(false);
          clearInterval(interval);
        }

        return updated;
      });
    }, 50); // 20 Ticks per second

    return () => clearInterval(interval);
  }, [isRacing, winner]);

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">
              Race <span className="text-primary">Simulator</span>
            </h1>
            <p className="text-gray-400 font-medium">Test track performance with unlimited participants.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 bg-secondary/30 p-4 rounded-xl border border-white/5">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-gray-500">Participant Count</label>
              <input 
                type="range" min="2" max="200" value={carCount} 
                onChange={(e) => setCarCount(parseInt(e.target.value))}
                className="w-32 accent-primary"
                disabled={isRacing}
              />
              <span className="text-xs font-bold">{carCount} Cars</span>
            </div>
            
            <div className="h-10 w-px bg-white/10 mx-2" />
            
            <button 
              onClick={() => setIsRacing(true)} 
              disabled={isRacing || !!winner}
              className={`btn-primary px-8 flex items-center gap-2 ${isRacing || !!winner ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Play className="w-4 h-4 fill-current" /> Start Race
            </button>
            
            <button 
              onClick={initRace}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        {/* Live Race Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Active Test Run</h2>
              {winner && (
                <div className="bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-accent/30 animate-bounce">
                  <Trophy className="w-3 h-3" /> Winner: {winner}
                </div>
              )}
            </div>
          </div>
          
          <RaceTrack participants={participants} trackLength={trackLength} isLive={isRacing} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="racing-card">
            <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Total Ticks</p>
            <p className="text-2xl font-black italic">142</p>
          </div>
          <div className="racing-card">
            <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Simulation FPS</p>
            <p className="text-2xl font-black italic text-green-500">60</p>
          </div>
          <div className="racing-card">
            <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Track Load</p>
            <p className="text-2xl font-black italic">{carCount} Objects</p>
          </div>
          <div className="racing-card border-primary/30">
            <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Canvas Engine</p>
            <p className="text-2xl font-black italic text-primary uppercase">Active</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
