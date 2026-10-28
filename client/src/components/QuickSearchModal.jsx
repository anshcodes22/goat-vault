import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Code2, ExternalLink } from 'lucide-react';
import { problemService } from '../services/api';
import { DifficultyBadge } from './DifficultyBadge';
import { PlatformBadge } from './PlatformBadge';
import { getFilledVariants } from '../utils/helpers';

export const QuickSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await problemService.getProblems({ search: query, limit: 6 });
        if (res.success) {
          setResults(res.problems || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (id) => {
    navigate(`/problems/${id}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-scaleUp">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search problems by name, number, or topic..."
            autoFocus
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {loading && (
            <div className="p-4 text-center text-xs text-slate-400">Searching problems...</div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500">
              No problems found matching "{query}"
            </div>
          )}

          {!loading && !query && (
            <div className="p-6 text-center text-xs text-slate-400">
              Type to search any problem in your vault...
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-1">
              {results.map((prob) => (
                <div
                  key={prob._id}
                  onClick={() => handleSelect(prob._id)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50/60 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      #{prob.problemNumber}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-slate-800 group-hover:text-blue-600 truncate">
                        {prob.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <PlatformBadge
                          platform={prob.platform}
                          customPlatformName={prob.customPlatformName}
                          size="xs"
                        />
                        <DifficultyBadge difficulty={prob.difficulty} size="xs" />
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 font-medium text-right flex flex-col items-end gap-0.5">
                    {(() => {
                      const filled = getFilledVariants(prob.approaches);
                      if (filled.length === 0) return <span className="text-slate-400 text-[11px] italic">Draft</span>;
                      return (
                        <span className="text-blue-600 font-semibold text-[11px]">
                          {filled.map(a => a.name).join(', ')}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
