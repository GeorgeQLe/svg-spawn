'use client';

interface SvgPreviewThumbnailProps {
  svgString: string;
  className?: string;
}

export function SvgPreviewThumbnail({ svgString, className = '' }: SvgPreviewThumbnailProps) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-gray-700 bg-white p-2 ${className}`}
      style={{ maxWidth: '200px', maxHeight: '200px' }}
    >
      <div
        className="flex items-center justify-center [&>svg]:max-h-full [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:w-auto"
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
    </div>
  );
}
