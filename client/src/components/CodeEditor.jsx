import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Copy, Check, Save, Code, CheckCircle, Clock } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../utils/helpers';

export const CodeEditor = ({
  code = '',
  language = 'C++',
  onChangeCode,
  onChangeLanguage,
  onSave,
  isSaving = false,
  hasUnsavedChanges = false,
  readOnly = false,
  minHeight = '360px'
}) => {
  const [copied, setCopied] = useState(false);
  const [monacoFailed, setMonacoFailed] = useState(false);

  // Map display language to monaco language id
  const getMonacoLang = (lang) => {
    const found = SUPPORTED_LANGUAGES.find(
      (l) => l.value.toLowerCase() === (lang || '').toLowerCase()
    );
    return found ? found.monaco : 'cpp';
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Code className="w-4 h-4 text-blue-600" />
            <span>Solution Code</span>
          </div>

          {/* Language selector */}
          <div className="relative">
            <select
              value={language}
              disabled={readOnly}
              onChange={(e) => onChangeLanguage && onChangeLanguage(e.target.value)}
              className="text-xs font-medium bg-white border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-2">
          {/* Saved / Unsaved indicator */}
          {!readOnly && (
            <div className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full">
              {isSaving ? (
                <span className="inline-flex items-center gap-1 text-blue-600 animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Saving...</span>
                </span>
              ) : hasUnsavedChanges ? (
                <span className="inline-flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  <span>Unsaved changes</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle className="w-3 h-3" />
                  <span>Saved</span>
                </span>
              )}
            </div>
          )}

          {/* Explicit Save button if callback provided */}
          {onSave && !readOnly && (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || !hasUnsavedChanges}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              title="Save code"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          )}

          {/* Copy code button */}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
            title="Copy Code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Editor Body */}
      <div className="relative w-full" style={{ minHeight }}>
        {!monacoFailed ? (
          <Editor
            height={minHeight}
            language={getMonacoLang(language)}
            value={code}
            onChange={(newVal) => onChangeCode && onChangeCode(newVal || '')}
            options={{
              readOnly,
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'JetBrains Mono, Menlo, monospace',
              tabSize: 4,
              insertSpaces: true,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              lineNumbers: 'on',
              padding: { top: 12, bottom: 12 },
              renderLineHighlight: 'all',
              automaticLayout: true,
            }}
            theme="vs"
            onMount={() => {}}
            loading={
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                Loading editor...
              </div>
            }
          />
        ) : (
          /* Graceful fallback if Monaco CDN fails to load */
          <textarea
            value={code}
            readOnly={readOnly}
            onChange={(e) => onChangeCode && onChangeCode(e.target.value)}
            rows={15}
            spellCheck={false}
            placeholder="// Paste or write your solution code here..."
            className="w-full h-full p-4 font-mono text-xs sm:text-sm text-slate-800 bg-slate-50 focus:outline-none focus:bg-white resize-y leading-relaxed"
          />
        )}
      </div>
    </div>
  );
};
