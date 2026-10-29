import React, { useState } from 'react';
import { RotateCcw, X, CheckCircle2 } from 'lucide-react';
import { getFilledVariants } from '../utils/helpers';

export const RevisitModal = ({
  isOpen,
  problem,
  onClose,
  onConfirm,
  isSubmitting = false
}) => {
  const [notes, setNotes] = useState('');
  const [solveStatus, setSolveStatus] = useState('');
  const [variantReviewed, setVariantReviewed] = useState(
    problem?.approaches?.[0]?.name || ''
  );

  if (!isOpen || !problem) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      notes,
      variantReviewed: variantReviewed || (problem.approaches?.[0]?.name || ''),
      solveStatus: solveStatus.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Mark as Revisited</h3>
                <p className="text-xs text-slate-500">Record a new revision event for this problem</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Problem
              </label>
              <div className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                #{problem.problemNumber} — {problem.title} ({problem.platform})
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Solution Variant Reviewed
              </label>
              <select
                value={variantReviewed}
                onChange={(e) => setVariantReviewed(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              >
                <option value="All Approaches">All Approaches</option>
                {(() => {
                  const filled = getFilledVariants(problem.approaches);
                  const toList = filled.length > 0 ? filled : (problem.approaches || []);
                  return toList.map((app) => (
                    <option key={app.id || app.name} value={app.name}>
                      {app.name} ({app.timeComplexity || 'No complexity specified'})
                    </option>
                  ));
                })()}
              </select>
            </div>

            {problem.firstSolveStatus && (
              <div className="text-xs text-slate-600 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 flex items-start gap-2">
                <span className="font-semibold text-blue-700 uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-blue-100 flex-shrink-0">
                  First Solve
                </span>
                <span>{problem.firstSolveStatus}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Did you figure it out this time?</span>
                <span className="text-[11px] text-slate-400 font-normal">Self assessment</span>
              </label>
              <input
                type="text"
                value={solveStatus}
                onChange={(e) => setSolveStatus(e.target.value)}
                placeholder="e.g. Solved independently in 10 mins, Needed to recall recurrence formula, Forgot edge case, etc."
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Revision Notes / Key Takeaways <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Re-implemented without looking; remembered Kadane's all-negative edge case..."
                className="w-full text-sm rounded-lg border border-slate-200 bg-white p-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                Current revisit count is <strong className="font-semibold">{problem.revisitCount || 0}</strong>. Saving will increment it to <strong className="font-semibold">{(problem.revisitCount || 0) + 1}</strong> and log server timestamp.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60"
              >
                <RotateCcw className="w-4 h-4" />
                {isSubmitting ? 'Recording...' : 'Record Revision'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
