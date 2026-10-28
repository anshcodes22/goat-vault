import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Plus, Search } from 'lucide-react';

export const Navbar = ({ onToggleSidebar, onOpenSearch }) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="GOAT Vault"
              className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                GOAT Vault
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search Trigger */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <div
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-400 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search problems, topics, identifiers...</span>
            </span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
              /
            </kbd>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/problems/new')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Problem</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>
    </header>
  );
};
