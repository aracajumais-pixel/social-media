import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Image, Video, X } from 'lucide-react';
import { uploadMediaToSupabase } from '../lib/supabase';

interface SupabaseMediaUploaderProps {
  currentUrl?: string;
  onUploadSuccess: (publicUrl: string, mediaType: 'image' | 'video') => void;
  folder?: string;
  className?: string;
  compact?: boolean;
}

export const SupabaseMediaUploader: React.FC<SupabaseMediaUploaderProps> = ({
  currentUrl,
  onUploadSuccess,
  folder = 'posts',
  className = '',
  compact = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setError('Formato não suportado. Envie uma imagem (PNG, JPG, WEBP, GIF) ou vídeo (MP4, MOV, WEBM).');
      return;
    }

    const MAX_SIZE_MB = 50;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`O arquivo tem ${(file.size / (1024 * 1024)).toFixed(1)}MB. O limite máximo é de ${MAX_SIZE_MB}MB.`);
      return;
    }

    setIsUploading(true);
    setProgress(15);
    setError(null);
    setSuccess(false);

    try {
      setProgress(45);
      const res = await uploadMediaToSupabase(file, folder);

      if (!res.success || !res.url) {
        throw new Error(res.error || 'Falha no upload para o Supabase Storage.');
      }

      setProgress(100);
      setSuccess(true);
      const mediaType = isVideo ? 'video' : 'image';
      onUploadSuccess(res.url, mediaType);
    } catch (err: any) {
      console.error('Erro de upload:', err);
      setError(err.message || 'Erro ao fazer upload do arquivo.');
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setProgress(null);
      }, 2000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-all text-center ${
          compact ? 'p-3' : 'p-5'
        } ${
          isDragging
            ? 'border-emerald-500 bg-emerald-500/10'
            : isUploading
            ? 'border-indigo-500 bg-indigo-500/5'
            : success
            ? 'border-emerald-500/60 bg-emerald-950/20 hover:border-emerald-500'
            : 'border-slate-700 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-800/60'
        }`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-2">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            <span className="text-xs font-semibold text-slate-200">Enviando para o Supabase Storage...</span>
            {progress && (
              <div className="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        ) : success ? (
          <div className="flex items-center justify-center space-x-2 text-emerald-400 py-1">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-xs font-bold">Upload concluído no Supabase Storage!</span>
            <span className="text-[10px] text-slate-400 ml-2">(Clique para trocar)</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
            <div className="flex items-center space-x-2 text-emerald-400">
              <UploadCloud className="w-5 h-5" />
              <span className="text-xs font-bold text-slate-200">
                {compact ? 'Enviar Mídia (Supabase Storage)' : 'Clique ou arraste a imagem ou vídeo aqui'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Upload direto para o Bucket <code className="text-emerald-400 font-mono">media</code> • JPG, PNG, WEBP, MP4 (até 50MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setError(null);
            }}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};