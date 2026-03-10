import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import RaceTrack from '../components/RaceTrack';
import { Gauge, Trophy, Zap, ChevronRight, ShoppingBag } from 'lucide-react';

const Dashboard: React.FC = () => {
  // Mock data for the "Look and Feel" MVP
  const [participants] = useState([
    { id: '1', name: 'Player One', position: 450, color: '#e11d48' },
    { id: '2', name: 'Racer X', position: 320, color: '#fbbf24' },
    { id: '3', name: 'Shadow', position: 580, color: '#3b82f6' },
  ]);

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">
              Welcome Back, <span className="text-primary">Driver</span>
            </h1>
            <p className="text-gray-400 font-medium">Your garage is looking sharp. 2 races scheduled today.</p>
          </div>
          <div className="flex gap-4">
            <div className="racing-card flex items-center gap-3 px-6 py-3 border-primary/20 bg-primary/5">
              <Zap className="w-5 h-5 text-accent fill-accent" />
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Balance</p>
                <p className="text-lg font-bold">12,450 <span className="text-xs text-accent italic">ND</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Race Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Live Circuit</h2>
              <button className="text-xs text-primary hover:underline font-bold uppercase">View All Races</button>
            </div>
            <RaceTrack participants={participants} trackLength={1000} isLive />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="racing-card group hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-white/5 rounded-lg text-primary">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded font-bold uppercase">Tournament</span>
                </div>
                <h3 className="font-bold mb-1">Night City Sprint</h3>
                <p className="text-xs text-gray-400 mb-4">Starts in 14:02 • Prize: 5,000 ND</p>
                <button className="w-full btn-primary py-2 text-sm">Join Race</button>
              </div>
              
              <div className="racing-card group hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-white/5 rounded-lg text-accent">
                    <Gauge className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] bg-accent/20 text-accent px-2 py-1 rounded font-bold uppercase">Daily</span>
                </div>
                <h3 className="font-bold mb-1">Underground Drag</h3>
                <p className="text-xs text-gray-400 mb-4">Ongoing • Spectate live results</p>
                <button className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-lg text-sm transition-colors">Spectate</button>
              </div>
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Your Primary Vehicle</h2>
              <div className="racing-card overflow-hidden group">
                <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary rounded-lg mb-4 relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                  <Gauge className="w-20 h-20 text-white/10 absolute -bottom-4 -right-4 rotate-12" />
                  <span className="text-xs font-black uppercase text-white/20 tracking-[1em] absolute top-4">Phantom-GT</span>
                  {/* Mock Car Asset Visualization */}
                  <div className="w-48 h-24 bg-primary rounded-tr-[40px] rounded-bl-lg relative shadow-[0_20px_50px_rgba(225,29,72,0.3)]">
                    <div className="absolute top-2 right-4 w-12 h-6 bg-white/20 rounded-tr-[20px]"></div>
                    <div className="absolute bottom-[-10px] left-4 w-10 h-10 bg-black rounded-full border-4 border-white/10"></div>
                    <div className="absolute bottom-[-10px] right-4 w-10 h-10 bg-black rounded-full border-4 border-white/10"></div>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-lg italic">Phantom GT-R</h3>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Class S • Level 24</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">842 <span className="text-[10px] text-gray-500">HP</span></p>
                    <div className="w-20 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                      <div className="w-[85%] h-full bg-primary"></div>
                    </div>
                  </div>
                </div>
                <button className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase py-2 bg-white/5 hover:bg-white/10 rounded transition-colors">
                  Customize Parts <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Marketplace Spotlight</h2>
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="racing-card flex items-center gap-4 py-3 hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-white/5 rounded flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ShoppingBag className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold italic">Titanium Crankshaft</p>
                      <p className="text-[10px] text-gray-500 uppercase">+12 Acceleration</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">2,400 ND</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
