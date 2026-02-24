'use client';

interface ComparisonViewProps {
  originalSvg: string;
  animatedSvg: string;
}

export function ComparisonView({ originalSvg, animatedSvg }: ComparisonViewProps) {
  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-gray-400 text-center">Original</h3>
        <div
          className="flex items-center justify-center overflow-hidden rounded-xl border border-gray-700 bg-white p-4 [&>svg]:max-h-64 [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:w-auto"
          dangerouslySetInnerHTML={{ __html: originalSvg }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-gray-400 text-center">Animated</h3>
        <div
          className="flex items-center justify-center overflow-hidden rounded-xl border border-gray-700 bg-white p-4 [&>svg]:max-h-64 [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:w-auto"
          dangerouslySetInnerHTML={{ __html: animatedSvg }}
        />
      </div>
    </div>
  );
}
