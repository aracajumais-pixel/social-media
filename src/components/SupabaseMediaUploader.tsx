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
    // Validação de tipo
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setError('Formato não suportado. Envie uma imagem (PNG, JPG, WEBP, GIF) ou vídeo (MP4, MOV, WEBM).');
      return;
    }

    // Limite de 50MB (limite gratuito do Supabase)
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

      setTimeout(() => {
        setSuccess(false);
        setProgress(null);
      }, 3000);
    } catch (err: any) {
      console.error('Erro no upload:', err);
      setError(err?.message || 'Falha ao enviar arquivo para o Supabase. Verifique se o bucket "media" está criado e público.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleInputChange}
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl transition-all cursor-pointer select-none text-center ${
          compact ? 'p-3' : 'p-4'
        } ${
          isDragging
            ? 'border-indigo-400 bg-indigo-950/40 scale-[1.01]'
            : 'border-slate-700/80 hover:border-indigo-500/70 bg-slate-950/60 hover:bg-slate-900/50'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-1.5">
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-indigo-300">Enviando para o Supabase Storage...</span>
                {progress !== null && (
                  <div className="w-36 h-1.5 bg-slate-800 rounded-full overflow-hidden mx-auto">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : success ? (
            <div className="flex items-center gap-2 py-1 text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Upload concluído no Supabase com sucesso!</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 text-white">
                <UploadCloud className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-white">
                  Clique ou arraste a imagem ou vídeo aqui
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Upload direto para o Bucket <span className="text-emerald-400 font-mono font-bold">media</span> • JPG, PNG, WEBP, MP4 (até 50MB)
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-[11px] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong>Erro no upload:</strong> {error}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setError(null);
            }}
            className="text-rose-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
