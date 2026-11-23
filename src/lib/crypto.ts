import { isValidHttpUrl } from './schemas';

export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function normalizeSecurityAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function hashSecret(value: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${value}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function extractDeterministicThumbnail(rawUrl: string): string | null {
  if (!isValidHttpUrl(rawUrl)) return null;
  try {
    const parsed = new URL(rawUrl.trim());
    const hostname = parsed.hostname.toLowerCase();

    // Direct image URLs
    if (/\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(parsed.pathname)) {
      return parsed.toString();
    }

    // YouTube patterns
    if (hostname.includes('youtube.com') || hostname === 'youtu.be') {
      let videoId: string | null = null;
      if (hostname === 'youtu.be') {
        videoId = parsed.pathname.split('/').filter(Boolean)[0] ?? null;
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/shorts/')[1]?.split('/')[0] ?? null;
      } else {
        videoId = parsed.searchParams.get('v');
      }
      if (videoId && /^[A-Za-z0-9_-]{6,20}$/.test(videoId)) {
        return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function fetchUrlMetadataThumbnail(rawUrl: string): Promise<string | null> {
  if (!isValidHttpUrl(rawUrl)) return null;

  const directThumb = extractDeterministicThumbnail(rawUrl);
  if (directThumb) return directThumb;

  // Client-side OpenGraph metadata lookup via Microlink (no backend needed)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const endpoint = `https://api.microlink.io/?url=${encodeURIComponent(rawUrl.trim())}`;
    const response = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) return null;
    const json = (await response.json()) as {
      status?: string;
      data?: { image?: { url?: string }; logo?: { url?: string } };
    };
    const imageUrl = json?.data?.image?.url;
    if (imageUrl && isValidHttpUrl(imageUrl)) {
      return imageUrl;
    }
    return null;
  } catch {
    return null;
  }
}

export async function compressImageToDataUrl(file: File, maxSize = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak didukung'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width >= height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas tidak tersedia'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const webp = canvas.toDataURL('image/webp', 0.84);
        if (webp.startsWith('data:image/webp')) {
          resolve(webp);
        } else {
          resolve(canvas.toDataURL('image/jpeg', 0.84));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
