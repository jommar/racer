import React from 'react';
import { Trophy, Gauge, ShoppingCart, LogOut, User } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav className="border-b border-white/10 bg-background/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="p-2 bg-primary rounded-lg group-hover:rotate-12 transition-transform">
            <Gauge className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase">Nitro<span className="text-primary">Dash</span></span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <a href="#" className="hover:text-white transition-colors flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Races
          </a>
          <a href="#" className="hover:text-white transition-colors flex items-center gap-2">
            <User className="w-4 h-4" /> Garage
          </a>
          <a href="#" className="hover:text-white transition-colors flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Marketplace
          </a>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <LogOut className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
