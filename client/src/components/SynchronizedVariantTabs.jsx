import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { isVariantFilled } from '../utils/helpers';

export const SynchronizedVariantTabs = ({
  variants = [],
  activeVariantId,
  onSelectVariant,
  onAddVariant,
  onRenameVariant,
  onDeleteVariant,
  sectionLabel = '',
  canEditStructure = true
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newVariantName, setNewVariantName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [deleteModalVariant, setDeleteModalVariant] = useState(null);

  const handleStartAdd = () => {
    setIsAdding(true);
    setNewVariantName('');
  };

  const handleConfirmAdd = () => {
    const trimmed = newVariantName.trim();
    if (!trimmed) return;
    if (variants.some((v) => v.name.toLowerCase() === trimmed.toLowerCase())) {
      alert(`An approach variant named "${trimmed}" already exists.`);
      return;
    }
    onAddVariant(trimmed);
    setIsAdding(false);
    setNewVariantName('');
  };

  const handleStartRename = (variant, e) => {
    e.stopPropagation();
    setEditingId(variant.id);
    setEditingName(variant.name);
  };

  const handleConfirmRename = (variantId) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    const exists = variants.some(
      (v) => v.id !== variantId && v.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      alert(`An approach variant named "${trimmed}" already exists.`);
      return;
    }
    onRenameVariant(variantId, trimmed);
    setEditingId(null);
  };

  const handleStartDelete = (variant, e) => {
    e.stopPropagation();
    if (variants.length <= 1) {
      alert('Cannot delete the only remaining approach. Every problem must have at least one approach.');
      return;
    }
    setDeleteModalVariant(variant);
  };

  const handleConfirmDelete = () => {
    if (deleteModalVariant) {
      onDeleteVariant(deleteModalVariant.id);
      setDeleteModalVariant(null);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
      {/* Section label (e.g. Approach or Code) & sync hint */}
      <div className="flex items-center gap-2">
        {sectionLabel && (
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {sectionLabel}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none flex-wrap">
        {variants.map((variant) => {
          const isActive = variant.id === activeVariantId;
          const isBeingEdited = editingId === variant.id;

          if (isBeingEdited) {
            return (
              <div
                key={variant.id}
                className="inline-flex items-center gap-1 bg-white border border-blue-400 rounded-lg px-2 py-1 shadow-sm"
              >
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmRename(variant.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  autoFocus
                  className="text-xs font-medium text-slate-800 w-28 bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleConfirmRename(variant.id)}
                  className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded"
                  title="Save Name"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={variant.id}
              onClick={() => onSelectVariant(variant.id)}
              className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              {isVariantFilled(variant) && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-300' : 'bg-emerald-500'}`}
                  title="Has typed content"
                />
              )}
              <span>{variant.name}</span>

              {/* Complexity chip if present */}
              {variant.timeComplexity && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? 'bg-blue-700/60 text-blue-100' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {variant.timeComplexity}
                </span>
              )}

              {/* Actions: Rename / Delete if editing is allowed */}
              {canEditStructure && (
                <div
                  className={`flex items-center gap-0.5 ml-1 transition-opacity ${
                    isActive ? 'opacity-90' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => handleStartRename(variant, e)}
                    className={`p-0.5 rounded transition-colors ${
                      isActive ? 'hover:bg-blue-700 text-blue-100' : 'hover:bg-slate-300 text-slate-500'
                    }`}
                    title="Rename approach"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleStartDelete(variant, e)}
                      className={`p-0.5 rounded transition-colors ${
                        isActive ? 'hover:bg-blue-700 text-blue-100' : 'hover:bg-slate-300 text-rose-500'
                      }`}
                      title="Delete approach"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add variant inline button */}
        {canEditStructure && (
          <>
            {isAdding ? (
              <div className="inline-flex items-center gap-1 bg-white border border-blue-400 rounded-lg px-2 py-1 shadow-sm animate-fadeIn">
                <input
                  type="text"
                  placeholder="e.g. Recursive approach"
                  value={newVariantName}
                  onChange={(e) => setNewVariantName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmAdd();
                    if (e.key === 'Escape') setIsAdding(false);
                  }}
                  autoFocus
                  className="text-xs font-medium text-slate-800 w-36 bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleConfirmAdd}
                  className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded"
                  title="Add"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartAdd}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                title="Add custom approach variant"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Approach</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteModalVariant)}
        title={`Delete "${deleteModalVariant?.name}" Approach?`}
        message={`Are you sure you want to delete the "${deleteModalVariant?.name}" approach? Its explanation and code will be permanently removed.`}
        confirmText="Delete Approach"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalVariant(null)}
      />
    </div>
  );
};
