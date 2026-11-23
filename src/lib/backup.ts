import type { Actress, CodeWithRelations, EsseBackupPayload, Series, Studio, Tag } from '../types/esse';
import { backupPayloadSchema } from './schemas';

export function buildBackupPayload(params: {
  actresses: Actress[];
  studios: Studio[];
  tags: Tag[];
  series: Series[];
  codes: CodeWithRelations[];
}): EsseBackupPayload {
  return {
    version: 1,
    exported_at: new Date().toISOString(),
    data: {
      actresses: params.actresses,
      studios: params.studios,
      tags: params.tags,
      series: params.series,
      codes: params.codes.map((c) => ({
        id: c.id,
        code: c.code,
        url: c.url,
        thumbnail_url: c.thumbnail_url,
        studio_id: c.studio_id,
        series_id: c.series_id,
        created_at: c.created_at,
        updated_at: c.updated_at,
        actress_ids: c.actresses.map((a) => a.id),
        tag_ids: c.tags.map((t) => t.id),
      })),
    },
  };
}

export function parseBackupJson(rawText: string): EsseBackupPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('File JSON tidak valid');
  }

  const result = backupPayloadSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error('Struktur data JSON tidak sesuai format ESSE');
  }
  return result.data;
}
