import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import type { Race, User } from '../types/index';
import { 
  Trophy, Settings, Plus, Users, 
  Flag, Package, MoreVertical, Edit2, Trash2, Search, Loader2
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('races');
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const racesRes = await api.get('/races');
        setRaces(racesRes.data);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const filteredRaces = races.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Admin Sidebar */}
          <aside className="w-full md:w-64 space-y-2">
            <h2 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] px-4 mb-4">Control Panel</h2>
            {[
              { id: 'races', icon: Flag, label: 'Race Management' },
              { id: 'users', icon: Users, label: 'User Directory' },
              { id: 'assets', icon: Package, label: 'Asset Factory' },
              { id: 'config', icon: Settings, label: 'System Config' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </aside>

          {/* Admin Content Area */}
          <div className="flex-1 space-y-6">
            
            {/* Header with Search & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search races..."
                  className="w-full bg-secondary/40 border border-white/5 rounded-lg py-2.5 pl-11 pr-4 focus:border-primary/50 outline-none text-sm"
                />
              </div>
              <button className="btn-primary flex items-center gap-2 py-2.5">
                <Plus className="w-4 h-4" /> Create New Race
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Active Races', value: races.filter(r => r.status === 'RUNNING').length, color: 'text-primary' },
                { label: 'Total Races', value: races.length, color: 'text-blue-500' },
                { label: 'System Status', value: 'Healthy', color: 'text-green-500' },
              ].map((stat, i) => (
                <div key={i} className="racing-card p-3 border-white/5">
                  <p className="text-[10px] font-black uppercase text-gray-500 mb-1">{stat.label}</p>
                  <p className={`text-xl font-black italic tracking-tighter ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Main Management Table */}
            <div className="racing-card p-0 overflow-hidden border-white/5 bg-secondary/30">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h3 className="text-sm font-black uppercase italic tracking-widest">Race Registry</h3>
                <span className="text-[10px] font-bold text-gray-500 italic">Live data from NitroDash Circuit</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] font-black uppercase text-gray-500 tracking-widest bg-black/20">
                      <th className="px-6 py-4">Circuit Name</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Grid Size</th>
                      <th className="px-6 py-4">Prize Pool</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredRaces.map(race => (
                      <tr key={race.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 font-bold italic">{race.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            race.status === 'RUNNING' ? 'bg-green-500/10 text-green-500' :
                            race.status === 'PENDING' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-gray-500/10 text-gray-500'
                          }`}>
                            {race.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">{race.participantsCount} Drivers</td>
                        <td className="px-6 py-4 text-sm font-black text-accent">{race.prizePool.toLocaleString()} ND</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRaces.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                          No races found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
