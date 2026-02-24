'use client';

import { useCallback } from 'react';
import { Download } from 'lucide-react';

interface ExportDialogProps {
  svgString: string;
  fileName?: string;
}

export function ExportDialog({ svgString, fileName = 'animated.svg' }: ExportDialogProps) {
  const handleDownload = useCallback(() => {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [svgString, fileName]);

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-950"
    >
      <Download className="h-4 w-4" />
      Download SVG
    </button>
  );
}
