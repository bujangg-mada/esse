import { z } from 'zod';

export const SECURITY_QUESTIONS = [
  'Apa nama kota kelahiran Anda?',
  'Apa nama hewan peliharaan pertama Anda?',
  'Apa judul film favorit pertama Anda?',
  'Apa nama sekolah dasar Anda?',
  'Siapa nama sahabat masa kecil Anda?',
] as const;

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidMediaSource(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('data:image/')) {
    return /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/i.test(trimmed);
  }
  return isValidHttpUrl(trimmed);
}

export const pinValueSchema = z
  .string()
  .trim()
  .regex(/^\d{4,8}$/, 'PIN harus berupa 4 hingga 8 digit angka');

export const setupPinSchema = z
  .object({
    pin: pinValueSchema,
    confirmPin: z.string().trim(),
    securityQuestion: z.string().min(1, 'Pilih pertanyaan keamanan'),
    securityAnswer: z.string().trim().min(2, 'Jawaban minimal 2 karakter'),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: 'Konfirmasi PIN tidak cocok',
    path: ['confirmPin'],
  });

export const unlockPinSchema = z.object({
  pin: pinValueSchema,
});

export const forgotPinSchema = z
  .object({
    securityAnswer: z.string().trim().min(1, 'Masukkan jawaban verifikasi'),
    newPin: pinValueSchema,
    confirmNewPin: z.string().trim(),
  })
  .refine((data) => data.newPin === data.confirmNewPin, {
    message: 'Konfirmasi PIN baru tidak cocok',
    path: ['confirmNewPin'],
  });

export const changePinSchema = z
  .object({
    currentPin: pinValueSchema,
    newPin: pinValueSchema,
    confirmNewPin: z.string().trim(),
    securityQuestion: z.string().min(1, 'Pilih pertanyaan keamanan'),
    securityAnswer: z.string().trim().min(2, 'Jawaban minimal 2 karakter'),
  })
  .refine((data) => data.newPin === data.confirmNewPin, {
    message: 'Konfirmasi PIN baru tidak cocok',
    path: ['confirmNewPin'],
  });

export const actressFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama aktris wajib diisi').max(120, 'Nama terlalu panjang'),
  age: z
    .union([z.number().int().min(18, 'Umur minimal 18').max(120, 'Umur tidak valid'), z.nan(), z.null()])
    .optional()
    .transform((val) => (typeof val === 'number' && !Number.isNaN(val) ? val : null)),
  photo_url: z
    .string()
    .trim()
    .optional()
    .default('')
    .refine(isValidMediaSource, 'Foto harus berupa URL http/https yang valid atau file gambar'),
});

export const studioFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama studio wajib diisi').max(120, 'Nama terlalu panjang'),
  logo_url: z
    .string()
    .trim()
    .optional()
    .default('')
    .refine(isValidMediaSource, 'Logo harus berupa URL http/https yang valid atau file gambar'),
});

export const tagFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama tag wajib diisi').max(60, 'Tag terlalu panjang'),
});

export const seriesFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama seri wajib diisi').max(120, 'Nama terlalu panjang'),
});

export const codeFormSchema = z.object({
  code: z.string().trim().min(1, 'Kode wajib diisi').max(80, 'Kode terlalu panjang'),
  url: z
    .string()
    .trim()
    .min(1, 'URL wajib diisi')
    .refine(isValidHttpUrl, 'URL harus diawali http:// atau https://'),
  thumbnail_url: z
    .string()
    .trim()
    .optional()
    .default('')
    .refine(isValidMediaSource, 'Thumbnail harus berupa URL valid atau gambar'),
  actress_ids: z.array(z.string()).default([]),
  tag_ids: z.array(z.string()).default([]),
  studio_id: z.string().nullable().default(null),
  series_id: z.string().nullable().default(null),
});

export const backupPayloadSchema = z.object({
  version: z.literal(1),
  exported_at: z.string(),
  data: z.object({
    actresses: z.array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        age: z.number().int().nullable(),
        photo_url: z.string().nullable(),
        created_at: z.string(),
      })
    ),
    studios: z.array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        logo_url: z.string().nullable(),
        created_at: z.string(),
      })
    ),
    tags: z.array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        created_at: z.string(),
      })
    ),
    series: z.array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        created_at: z.string(),
      })
    ),
    codes: z.array(
      z.object({
        id: z.string().min(1),
        code: z.string().min(1),
        url: z.string().refine(isValidHttpUrl),
        thumbnail_url: z.string().nullable(),
        studio_id: z.string().nullable(),
        series_id: z.string().nullable(),
        created_at: z.string(),
        updated_at: z.string(),
        actress_ids: z.array(z.string()),
        tag_ids: z.array(z.string()),
      })
    ),
  }),
});
