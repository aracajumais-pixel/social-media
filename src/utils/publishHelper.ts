// Helper para abertura de aplicativos e plataformas de postagem social
export interface PublishPlatform {
  id: string;
  name: string;
  shortLabel: string;
  webUrl: string;
  mobileDeepLink?: string;
  description: string;
  badge: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export const PUBLISH_PLATFORMS: PublishPlatform[] = [
  {
    id: 'meta_business',
    name: 'Meta Business Suite',
    shortLabel: 'Meta Business',
    webUrl: 'https://business.facebook.com/',
    mobileDeepLink: 'fb-business://',
    description: 'Postagem e agendamento conjunto no Instagram e Facebook',
    badge: 'Recomendado',
    bgClass: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:from-blue-500 hover:to-sky-400',
    borderClass: 'border-blue-400/50',
    textClass: 'text-white'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    shortLabel: 'Instagram',
    webUrl: 'https://www.instagram.com/',
    mobileDeepLink: 'instagram://share',
    description: 'Abrir feed ou stories do Instagram',
    badge: 'Feed / Reels',
    bgClass: 'bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 hover:from-pink-500 hover:to-amber-400',
    borderClass: 'border-pink-400/40',
    textClass: 'text-white'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    shortLabel: 'Facebook',
    webUrl: 'https://www.facebook.com/',
    mobileDeepLink: 'fb://feed',
    description: 'Abrir página ou feed do Facebook',
    badge: 'Página / Feed',
    bgClass: 'bg-blue-700 hover:bg-blue-600',
    borderClass: 'border-blue-500/40',
    textClass: 'text-white'
  },
  {
    id: 'tiktok',
    name: 'TikTok Creator',
    shortLabel: 'TikTok',
    webUrl: 'https://www.tiktok.com/creator-center/upload',
    mobileDeepLink: 'snssdk1233://',
    description: 'Central de upload do TikTok',
    badge: 'Upload TikTok',
    bgClass: 'bg-slate-900 hover:bg-black',
    borderClass: 'border-emerald-500/50',
    textClass: 'text-emerald-300'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    shortLabel: 'LinkedIn',
    webUrl: 'https://www.linkedin.com/feed/',
    mobileDeepLink: 'linkedin://',
    description: 'Publicar no feed profissional do LinkedIn',
    badge: 'Feed Pro',
    bgClass: 'bg-sky-700 hover:bg-sky-600',
    borderClass: 'border-sky-500/40',
    textClass: 'text-white'
  }
];

export function copyCaptionToClipboard(caption: string): boolean {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      navigator.clipboard.writeText(caption);
      return true;
    } catch (e) {
      console.warn('Erro ao copiar legenda:', e);
      return false;
    }
  }
  return false;
}

export function getPublishTargetUrl(platform: PublishPlatform): string {
  if (typeof navigator === 'undefined') return platform.webUrl;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile && platform.mobileDeepLink) {
    // Para celulares, podemos retornar o link web com fallback ou o próprio webUrl que é universal e abre o app caso instalado
    return platform.webUrl;
  }
  return platform.webUrl;
}
