import React, { useState, useEffect } from 'react';
import { 
  getEmbeddableMediaUrl, 
  getFallbackDriveUrl, 
  getDirectExportDriveUrl,
  isGoogleDriveUrl, 
  extractGoogleDriveFileId 
} from '../utils/driveHelper';
import { HardDrive, ExternalLink } from 'lucide-react';

interface DriveImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export const DriveImage: React.FC<DriveImageProps> = ({
  src,
  alt,
  className = '',
  onClick
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(() => getEmbeddableMediaUrl(src));
  const [hasError, setHasError] = useState(false);
  const [retryState, setRetryState] = useState<'primary' | 'fallback1' | 'fallback2' | 'failed'>('primary');

  useEffect(() => {
    const embedUrl = getEmbeddableMediaUrl(src);
    setCurrentSrc(embedUrl);
    setHasError(false);
    setRetryState('primary');
  }, [src]);

  const handleError = () => {
    if (retryState === 'primary' && isGoogleDriveUrl(src)) {
      setRetryState('fallback1');
      setCurrentSrc(getFallbackDriveUrl(src));
    } else if (retryState === 'fallback1' && isGoogleDriveUrl(src)) {
      setRetryState('fallback2');
      setCurrentSrc(getDirectExportDriveUrl(src));
    } else {
      setRetryState('failed');
      setHasError(true);
    }
  };

  const isDrive = isGoogleDriveUrl(src);
  const fileId = extractGoogleDriveFileId(src);
  const driveDirectLink = fileId ? `https://drive.google.com/file/d/${fileId}/view` : src;

  if (hasError) {
    return (
      <div 
        onClick={onClick || (() => window.open(driveDirectLink, '_blank'))}
        className={`bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-4 text-center select-none relative group cursor-pointer ${className}`}
      >
        <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-2 group-hover:scale-110 transition-transform">
          <HardDrive className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold text-slate-200 line-clamp-1 max-w-[90%]">{alt || 'Arquivo de Mídia'}</span>
        <a
          href={driveDirectLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] text-indigo-300 mt-1 flex items-center gap-1 font-medium bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800 hover:bg-indigo-600 hover:text-white transition-all"
        >
          <ExternalLink className="w-3 h-3" />
          Abrir no Google Drive
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      <img
        src={currentSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={handleError}
        onClick={onClick}
        className={className}
      />
      {isDrive && (
        <div 
          className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-700/60 text-[10px] font-bold text-indigo-300 flex items-center gap-1 shadow-md pointer-events-none"
          title="Mídia do Google Drive"
        >
          <HardDrive className="w-3 h-3 text-indigo-400" />
          <span>Drive</span>
        </div>
      )}
    </div>
  );
};
