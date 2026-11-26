import React, { useEffect, useMemo, useState } from 'react';
import { CheckCheck, Film, Image as ImageIcon, Link2, Play } from 'lucide-react';
import { SocialNetwork } from '../types';
import { isGoogleDriveUrl } from '../utils/driveHelper';
import { DriveImage } from './DriveImage';

export interface WhatsAppLinkPreviewCardProps {
  messageText?: string;
  title: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'carousel';
  socialNetworks?: SocialNetwork[];
  linkUrl?: string;
  domain?: string;
  clientName?: string;
  timestamp?: string;
  videoDurationSeconds?: number;
  maxMediaHeightClass?: string;
}

type DetectedPlatform = SocialNetwork | 'generic';

const VIDEO_EXT_REGEX = /\.(mp4|mov|webm|m4v|ogv)(\?.*)?$/i;
const URL_SPLIT_REGEX = /(https?:\/\/[^\s]+)/g;
const URL_MATCH_REGEX = /https?:\/\/[^\s]+/i;

function formatDuration(seconds?: number): string | null {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function extractDomainFromUrl(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return null;
  }
}

function detectPlatform(
  urls: (string | undefined)[],
  socialNetworks?: SocialNetwork[]
): DetectedPlatform {
  for (const raw of urls) {
    if (!raw) continue;
    const lower = raw.toLowerCase();
    if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram';
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
    if (lower.includes('tiktok.com')) return 'tiktok';
    if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.com')) return 'facebook';
    if (lower.includes('linkedin.com')) return 'linkedin';
  }
  if (socialNetworks && socialNetworks.length > 0) {
    return socialNetworks[0];
  }
  return 'generic';
}

const PlatformBadgeIcon: React.FC<{ platform: DetectedPlatform }> = ({ platform }) => {
  const [faviconFailed, setFaviconFailed] = useState(false);

  switch (platform) {
    case 'instagram':
      return (
        <span
          className="w-5 h-5 rounded-[5px] flex items-center justify-center shrink-0 shadow-sm"
          style={{
            background:
              'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285aeb 90%)',
          }}
          title="Instagram"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        </span>
      );
    case 'youtube':
      return (
        <span className="w-5 h-5 rounded-[5px] bg-[#ff0000] flex items-center justify-center shrink-0 shadow-sm" title="YouTube">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="currentColor">
            <path d="M9.5 7.5v9l7-4.5-7-4.5z" />
          </svg>
        </span>
      );
    case 'tiktok':
      return (
        <span className="w-5 h-5 rounded-[5px] bg-black border border-white/15 flex items-center justify-center shrink-0 shadow-sm" title="TikTok">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="currentColor">
            <path d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1-2.59-2.5 2.59 2.59 0 0 1 2.59-2.5c.27 0 .53.04.78.12v-3.13a5.8 5.8 0 0 0-.78-.05A5.72 5.72 0 0 0 4 15.54 5.72 5.72 0 0 0 9.72 21.3a5.72 5.72 0 0 0 5.72-5.72V9.3a7.33 7.33 0 0 0 4.3 1.38V7.6a4.28 4.28 0 0 1-3.14-1.78Z" />
          </svg>
        </span>
      );
    case 'facebook':
      return (
        <span className="w-5 h-5 rounded-[5px] bg-[#1877f2] flex items-center justify-center shrink-0 shadow-sm" title="Facebook">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="currentColor">
            <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
          </svg>
        </span>
      );
    case 'linkedin':
      return (
        <span className="w-5 h-5 rounded-[5px] bg-[#0a66c2] flex items-center justify-center shrink-0 shadow-sm" title="LinkedIn">
          <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="currentColor">
            <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z" />
          </svg>
        </span>
      );
    default:
      return !faviconFailed ? (
        <img
          src="/favicon.jpg"
          alt="Ícone do site"
          referrerPolicy="no-referrer"
          onError={() => setFaviconFailed(true)}
          className="w-5 h-5 rounded-[5px] object-cover shrink-0 border border-white/10"
        />
      ) : (
        <span className="w-5 h-5 rounded-[5px] bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center shrink-0">
          <Link2 className="w-3 h-3 text-emerald-300" />
        </span>
      );
  }
};

function renderPreservedMessage(text: string): React.ReactNode {
  const parts = text.split(URL_SPLIT_REGEX);
  return parts.map((part, idx) => {
    if (/^https?:\/\/[^\s]+$/i.test(part)) {
      return (
        <span key={idx} className="text-[#53bdeb] underline decoration-[#53bdeb]/60 break-all">
          {part}
        </span>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export const WhatsAppLinkPreviewCard: React.FC<WhatsAppLinkPreviewCardProps> = ({
  messageText,
  title,
  description,
  mediaUrl,
  mediaType,
  socialNetworks,
  linkUrl,
  domain,
  clientName,
  timestamp,
  videoDurationSeconds,
  maxMediaHeightClass = 'max-h-[360px]',
}) => {
  const [detectedVideoDuration, setDetectedVideoDuration] = useState<number | undefined>(
    videoDurationSeconds
  );
  const [mediaLoadFailed, setMediaLoadFailed] = useState(false);
  const [mediaAspect, setMediaAspect] = useState<number | null>(null);

  const trimmedMediaUrl = (mediaUrl || '').trim();
  const isDriveUrl = Boolean(trimmedMediaUrl && isGoogleDriveUrl(trimmedMediaUrl));
  const isDirectVideoFile = Boolean(trimmedMediaUrl && VIDEO_EXT_REGEX.test(trimmedMediaUrl));

  useEffect(() => {
    setMediaLoadFailed(false);
    setMediaAspect(null);
    setDetectedVideoDuration(videoDurationSeconds);
  }, [trimmedMediaUrl, videoDurationSeconds]);
  const isVideo =
    mediaType === 'video' ||
    isDirectVideoFile ||
    /instagram\.com\/reel|youtube\.com\/shorts|youtu\.be|tiktok\.com/i.test(trimmedMediaUrl);

  const firstMessageUrl = useMemo(() => {
    if (!messageText) return undefined;
    const match = messageText.match(URL_MATCH_REGEX);
    return match ? match[0] : undefined;
  }, [messageText]);

  const resolvedDomain = useMemo(() => {
    const fromMessage = extractDomainFromUrl(firstMessageUrl);
    if (fromMessage) return fromMessage;
    const fromLink = extractDomainFromUrl(linkUrl);
    if (fromLink) return fromLink;
    if (domain) return domain.replace(/^www\./i, '');
    if (typeof window !== 'undefined' && window.location.host) {
      return window.location.host;
    }
    return 'socialmedia5.app';
  }, [firstMessageUrl, linkUrl, domain]);

  const platform = useMemo(
    () => detectPlatform([firstMessageUrl, linkUrl, trimmedMediaUrl], socialNetworks),
    [firstMessageUrl, linkUrl, trimmedMediaUrl, socialNetworks]
  );

  const formattedTime = useMemo(() => {
    if (timestamp) return timestamp;
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }, [timestamp]);

  const displayTitle = clientName ? `${clientName}: "${title}"` : title;
  const durationLabel = formatDuration(videoDurationSeconds ?? detectedVideoDuration);

  return (
    <div
      className="relative rounded-2xl p-3 sm:p-3.5 overflow-hidden border border-emerald-900/50 bg-[#0b141a]"
      style={{
        backgroundImage:
          'radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        backgroundPosition: '0 0, 14px 14px',
      }}
    >
      {/* Balão verde de mensagem enviada do WhatsApp */}
      <div className="ml-auto w-full max-w-[330px] bg-[#005c4b] rounded-2xl rounded-tr-sm p-1.5 shadow-xl border border-emerald-400/10">
        {/* A) MENSAGEM NO TOPO DO CARTÃO */}
        {messageText && messageText.trim().length > 0 && (
          <div className="px-2 pt-1 pb-2 text-[12.5px] leading-[1.42] text-[#e9edef] whitespace-pre-wrap break-words font-sans">
            {renderPreservedMessage(messageText)}
          </div>
        )}

        {/* CARTÃO DE LINK ESTILO INSTAGRAM */}
        <div className="bg-[#1f2c34] rounded-xl overflow-hidden border border-white/10 shadow-md">
          {/* B) ÁREA DE MÍDIA EM DESTAQUE NO TOPO (modo foto na vertical 3x4 estilo Instagram) */}
          <div className="relative w-full aspect-[3/4] bg-[#111b21] overflow-hidden rounded-t-xl">
            {trimmedMediaUrl && !mediaLoadFailed ? (
              isDirectVideoFile ? (
                <video
                  src={trimmedMediaUrl}
                  muted
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={(e) => {
                    const dur = e.currentTarget.duration;
                    if (Number.isFinite(dur) && dur > 0) {
                      setDetectedVideoDuration(dur);
                    }
                  }}
                  onError={() => setMediaLoadFailed(true)}
                  className={`w-full h-full ${maxMediaHeightClass ? '' : ''} object-cover block bg-black`}
                />
              ) : isDriveUrl ? (
                <DriveImage
                  src={trimmedMediaUrl}
                  alt={title}
                  className="w-full h-full object-cover block"
                />
              ) : (
                <>
                  {mediaAspect !== null && mediaAspect > 0.9 && (
                    <img
                      src={trimmedMediaUrl}
                      alt=""
                      aria-hidden="true"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-65 brightness-75 pointer-events-none"
                    />
                  )}
                  <img
                    src={trimmedMediaUrl}
                    alt={title}
                    referrerPolicy="no-referrer"
                    onLoad={(e) => {
                      const { naturalWidth, naturalHeight } = e.currentTarget;
                      if (naturalWidth > 0 && naturalHeight > 0) {
                        setMediaAspect(naturalWidth / naturalHeight);
                      }
                    }}
                    onError={() => setMediaLoadFailed(true)}
                    className={`relative z-[1] w-full h-full ${
                      mediaAspect !== null && mediaAspect > 0.9 ? 'object-contain' : 'object-cover'
                    } block`}
                  />
                </>
              )
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1b2832] via-[#131d24] to-[#0b141a] flex flex-col items-center justify-center p-5 text-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-300">
                  {isVideo ? <Film className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                </div>
                <div className="space-y-0.5 max-w-[90%]">
                  <p className="text-xs font-semibold text-white line-clamp-1">{resolvedDomain}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{title}</p>
                </div>
              </div>
            )}

            {/* Scrim sutil inferior para legibilidade do indicador de vídeo */}
            {isVideo && trimmedMediaUrl && !mediaLoadFailed && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
            )}

            {/* Botão Play centralizado quando for vídeo */}
            {isVideo && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-[2px] border border-white/25 flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 text-white fill-white translate-x-0.5" />
                </div>
              </div>
            )}

            {/* Indicador de Reels / Vídeo + duração real quando disponível */}
            {isVideo && (durationLabel || (trimmedMediaUrl && !mediaLoadFailed)) && (
              <div className="pointer-events-none absolute bottom-2.5 left-2.5 flex items-center gap-1.5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                <span className="w-5 h-5 rounded-md bg-black/55 border border-white/20 flex items-center justify-center">
                  <Film className="w-3 h-3 text-white" />
                </span>
                {durationLabel && (
                  <span className="text-xs font-bold tracking-tight tabular-nums">
                    {durationLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* C) RODAPÉ ESCURO DO CARTÃO (padrão Instagram) */}
          <div className="bg-[#1f2c34] px-3 py-2.5 space-y-1.5">
            <h4 className="text-[13.5px] sm:text-[14px] font-semibold text-[#e9edef] leading-[1.3] line-clamp-2">
              {displayTitle}
            </h4>

            {description && description.trim().length > 0 && (
              <p className="text-[11.5px] text-[#8696a0] leading-[1.35] line-clamp-2">
                {description}
              </p>
            )}

            <div className="pt-0.5 flex items-center justify-between gap-2">
              <span className="min-w-0 flex items-center gap-1.5 text-[11.5px] text-[#aebac1]">
                <Link2 className="w-3.5 h-3.5 text-[#aebac1] shrink-0" />
                <span className="truncate">{resolvedDomain}</span>
              </span>
              <PlatformBadgeIcon platform={platform} />
            </div>
          </div>
        </div>

        {/* D) FINAL DA MENSAGEM: Horário de envio e indicadores de confirmação do WhatsApp */}
        <div className="flex items-center justify-end gap-1 px-1.5 pt-1 pb-0.5 select-none">
          <span className="text-[10.5px] text-[#aebac1] tabular-nums leading-none">
            {formattedTime}
          </span>
          <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] shrink-0" aria-label="Enviado e confirmado" />
        </div>
      </div>
    </div>
  );
};
