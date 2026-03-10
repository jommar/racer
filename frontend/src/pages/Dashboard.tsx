import React, { useState, useEffect } from 'react';
import PageContainer from '../components/PageContainer';
import RaceTrack from '../components/RaceTrack';
import api from '../services/api';
import type { Car, Race, User } from '../types/index';
import { Card, Button, Badge } from '../components/ui/core';
import { Gauge, Trophy, Zap, ChevronRight, Loader2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [userRes, carsRes, racesRes] = await Promise.all([
          api.get('/auth/profile'),
          api.get('/cars/garage'),
          api.get('/races'),
        ]);

        setUser(userRes.data);
        setCars(carsRes.data || []);
        setRaces(racesRes.data || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  const primaryCar = cars.find(c => c.isEquipped) || cars[0];

  return (
    <PageContainer className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">
            Welcome Back, <span className="text-primary">{user?.username || 'Driver'}</span>
          </h1>
          <p className="text-gray-400 font-medium text-sm">Your garage is looking sharp. Check the latest circuits.</p>
        </div>
        <div className="flex gap-4">
          <Card className="flex items-center gap-3 px-6 py-3 border-primary/20 bg-primary/5" hover={false}>
            <Zap className="w-5 h-5 text-accent fill-accent" />
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Balance</p>
              <p className="text-lg font-bold">{user?.currency.toLocaleString() || 0} <span className="text-xs text-accent italic">ND</span></p>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Active Race Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Live Circuit</h2>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary">View All Races</Button>
          </div>
          
          {races.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {races.filter(r => r.status !== 'FINISHED').map(race => (
                <Card key={race.id} className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-white/5 rounded-lg text-primary">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <Badge variant={race.status === 'RUNNING' ? 'success' : 'primary'}>{race.status}</Badge>
                  </div>
                  <h3 className="font-bold mb-1 italic text-lg">{race.name}</h3>
                  <p className="text-xs text-gray-400 mb-6 font-medium">
                    Prize: <span className="text-accent font-bold">{race.prizePool.toLocaleString()} ND</span> • {race.participantsCount} Drivers
                  </p>
                  <Button className="w-full">Join Race</Button>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="py-12 text-center text-gray-500 italic" hover={false}>
              No active races at the moment.
            </Card>
          )}
        </div>

        {/* Sidebar Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Your Primary Vehicle</h2>
            {primaryCar ? (
              <Card className="group p-0 overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                  <Gauge className="w-20 h-20 text-white/10 absolute -bottom-4 -right-4 rotate-12" />
                  <span className="text-xs font-black uppercase text-white/20 tracking-[1em] absolute top-4">{primaryCar.name}</span>
                  <div className="w-48 h-24 bg-primary rounded-tr-[40px] rounded-bl-lg relative shadow-[0_20px_50px_rgba(225,29,72,0.3)]">
                    <div className="absolute top-2 right-4 w-12 h-6 bg-white/20 rounded-tr-[20px]"></div>
                    <div className="absolute bottom-[-10px] left-4 w-10 h-10 bg-black rounded-full border-4 border-white/10"></div>
                    <div className="absolute bottom-[-10px] right-4 w-10 h-10 bg-black rounded-full border-4 border-white/10"></div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-xl italic">{primaryCar.name}</h3>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Performance Level: {primaryCar.stats?.speed || primaryCar.baseSpeed}</p>
                    </div>
                  </div>
                  <Button variant="secondary" className="w-full text-xs py-2 gap-2">
                    Enter Customization <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="py-12 text-center text-gray-500 italic" hover={false}>
                Your garage is empty. Visit the shop!
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
