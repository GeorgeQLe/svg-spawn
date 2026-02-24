'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isDisabled?: boolean;
  isLoading?: boolean;
}

const MAX_CHARS = 1000;

export function PromptInput({ onSubmit, isDisabled = false, isLoading = false }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (trimmed && !isDisabled && !isLoading) {
      onSubmit(trimmed);
    }
  };

  const charCount = prompt.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canSubmit = prompt.trim().length > 0 && !isDisabled && !isLoading && !isOverLimit;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-lg">
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe how you want to animate this SVG..."
          disabled={isDisabled || isLoading}
          rows={4}
          className="w-full resize-none rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-gray-100 placeholder-gray-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          <span
            className={`text-xs ${
              isOverLimit ? 'text-red-400' : 'text-gray-500'
            }`}
          >
            {charCount}/{MAX_CHARS}
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Generate Animation
          </>
        )}
      </button>
    </form>
  );
}
