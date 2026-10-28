import React, { useState, useEffect, useRef } from 'react';
import { Tag as TagIcon, X, Plus, Check } from 'lucide-react';
import { PREDEFINED_TOPICS } from '../utils/helpers';
import { tagService } from '../services/api';

export const TopicSelector = ({
  selectedTopics = [],
  selectedCustomTags = [],
  onChangeTopics,
  onChangeCustomTags
}) => {
  const [allCustomTags, setAllCustomTags] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Fetch existing custom tags from server
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await tagService.getTags();
        if (res.success && res.customTags) {
          setAllCustomTags(res.customTags);
        }
      } catch (err) {
        console.error('Failed to load custom tags:', err);
      }
    };
    fetchTags();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter available options
  const cleanInput = inputValue.trim().toLowerCase();

  const filteredPredefined = PREDEFINED_TOPICS.filter((t) =>
    t.toLowerCase().includes(cleanInput)
  );

  const filteredCustom = allCustomTags.filter((t) =>
    t.toLowerCase().includes(cleanInput) &&
    !PREDEFINED_TOPICS.some((p) => p.toLowerCase() === t.toLowerCase())
  );

  const isExactMatch =
    PREDEFINED_TOPICS.some((t) => t.toLowerCase() === cleanInput) ||
    allCustomTags.some((t) => t.toLowerCase() === cleanInput);

  const canCreateNew = cleanInput.length > 0 && !isExactMatch;

  const handleToggleTopic = (topic) => {
    if (selectedTopics.includes(topic)) {
      onChangeTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      onChangeTopics([...selectedTopics, topic]);
    }
  };

  const handleToggleCustomTag = (tag) => {
    if (selectedCustomTags.includes(tag)) {
      onChangeCustomTags(selectedCustomTags.filter((t) => t !== tag));
    } else {
      onChangeCustomTags([...selectedCustomTags, tag]);
    }
  };

  const handleCreateCustomTag = async (tagName) => {
    const trimmed = tagName.trim();
    if (!trimmed) return;

    // Check if it belongs to predefined
    const matchedPredefined = PREDEFINED_TOPICS.find(
      (p) => p.toLowerCase() === trimmed.toLowerCase()
    );

    if (matchedPredefined) {
      if (!selectedTopics.includes(matchedPredefined)) {
        onChangeTopics([...selectedTopics, matchedPredefined]);
      }
    } else {
      // It's a custom tag
      if (!selectedCustomTags.includes(trimmed)) {
        onChangeCustomTags([...selectedCustomTags, trimmed]);
      }
      if (!allCustomTags.includes(trimmed)) {
        setAllCustomTags([...allCustomTags, trimmed]);
        // Also persist to API
        tagService.createTag(trimmed).catch(() => {});
      }
    }

    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (canCreateNew) {
        handleCreateCustomTag(inputValue);
      } else if (filteredPredefined.length > 0 && !selectedTopics.includes(filteredPredefined[0])) {
        handleToggleTopic(filteredPredefined[0]);
        setInputValue('');
      } else if (filteredCustom.length > 0 && !selectedCustomTags.includes(filteredCustom[0])) {
        handleToggleCustomTag(filteredCustom[0]);
        setInputValue('');
      }
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Selected Tags Display */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 min-h-[46px] rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-colors">
        {/* Selected Predefined Topics */}
        {selectedTopics.map((topic) => (
          <span
            key={`topic-${topic}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200 animate-fadeIn"
          >
            <span>{topic}</span>
            <button
              type="button"
              onClick={() => handleToggleTopic(topic)}
              className="text-blue-500 hover:text-blue-800 p-0.5 rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Selected Custom Tags */}
        {selectedCustomTags.map((tag) => (
          <span
            key={`tag-${tag}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-purple-50 text-purple-700 border border-purple-200 animate-fadeIn"
          >
            <TagIcon className="w-2.5 h-2.5 opacity-70" />
            <span>#{tag}</span>
            <button
              type="button"
              onClick={() => handleToggleCustomTag(tag)}
              className="text-purple-500 hover:text-purple-800 p-0.5 rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedTopics.length === 0 && selectedCustomTags.length === 0
              ? 'Select topics or type to create custom tag...'
              : 'Add more topics or custom tags...'
          }
          className="flex-1 min-w-[180px] bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none px-1 py-0.5"
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-30 mt-1.5 w-full bg-white rounded-xl shadow-lg border border-slate-200 max-h-72 overflow-y-auto p-2">
          {/* Create new custom tag option */}
          {canCreateNew && (
            <div className="mb-2 pb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => handleCreateCustomTag(inputValue)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 rounded-lg transition-colors text-left"
              >
                <span className="flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Create custom tag: <strong className="font-semibold">"{inputValue.trim()}"</strong>
                </span>
                <span className="text-[10px] text-blue-500 uppercase tracking-wider">Press Enter</span>
              </button>
            </div>
          )}

          {/* Predefined Topics Section */}
          <div className="mb-3">
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Standard Topics
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-1">
              {filteredPredefined.map((topic) => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleToggleTopic(topic)}
                    className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{topic}</span>
                    {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
            {filteredPredefined.length === 0 && (
              <div className="text-xs text-slate-400 px-2 py-1 italic">
                No matching standard topics
              </div>
            )}
          </div>

          {/* Reusable Custom Tags Section */}
          {allCustomTags.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Reusable Custom Tags
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {filteredCustom.map((tag) => {
                  const isSelected = selectedCustomTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleCustomTag(tag)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${
                        isSelected
                          ? 'bg-purple-600 text-white font-medium'
                          : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                      }`}
                    >
                      <TagIcon className="w-2.5 h-2.5 opacity-70" />
                      <span>#{tag}</span>
                      {isSelected && <Check className="w-3 h-3 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
