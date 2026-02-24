'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, FileWarning } from 'lucide-react';
import { useUploadStore } from '@/store/upload-store';
import { SvgPreviewThumbnail } from './svg-preview-thumbnail';

export function SvgUpload() {
  const { svgString, error, isProcessing, setFile, setSvgString, setError, setProcessing, reset } =
    useUploadStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
        setError('Please upload a valid SVG file.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('File too large. Maximum size is 5MB.');
        return;
      }

      setProcessing(true);
      setError(null);

      try {
        const text = await file.text();
        if (!text.includes('<svg')) {
          setError('File does not contain valid SVG content.');
          setProcessing(false);
          return;
        }
        setFile(file);
        setSvgString(text);
      } catch {
        setError('Failed to read file.');
      } finally {
        setProcessing(false);
      }
    },
    [setFile, setSvgString, setError, setProcessing],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  if (svgString) {
    return (
      <div className="flex flex-col items-center gap-4">
        <SvgPreviewThumbnail svgString={svgString} className="w-48 h-48" />
        <button
          onClick={reset}
          className="text-sm text-gray-400 hover:text-gray-200 underline transition-colors"
        >
          Upload a different SVG
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg">
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleClick();
        }}
        className={`flex w-full cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors ${
          isDragOver
            ? 'border-indigo-400 bg-indigo-950/30'
            : 'border-gray-600 bg-gray-900/50 hover:border-gray-500 hover:bg-gray-900/80'
        }`}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-indigo-400" />
            <p className="text-sm text-gray-400">Processing...</p>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-300">
                Drag and drop your SVG file here
              </p>
              <p className="text-xs text-gray-500 mt-1">or click to browse</p>
            </div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".svg,image/svg+xml"
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-950/50 border border-red-800 px-4 py-2 text-sm text-red-300">
          <FileWarning className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
