export interface Actress {
  id: string;
  name: string;
  age: number | null;
  photo_url: string | null;
  created_at: string;
}

export interface Studio {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  created_at: string;
}

export interface Series {
  id: string;
  name: string;
  created_at: string;
}

export interface CodeEntry {
  id: string;
  code: string;
  url: string;
  thumbnail_url: string | null;
  studio_id: string | null;
  series_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CodeWithRelations extends CodeEntry {
  actresses: Actress[];
  studio: Studio | null;
  tags: Tag[];
  series: Series | null;
}

export interface VaultStatus {
  initialized: boolean;
  security_question: string | null;
  pin_salt: string | null;
}

export type SortOption = 'newest' | 'oldest' | 'code_asc' | 'code_desc';

export interface CodeFilterState {
  actressId: string;
  studioId: string;
  tagId: string;
  seriesId: string;
}

export interface EsseBackupPayload {
  version: 1;
  exported_at: string;
  data: {
    actresses: Actress[];
    studios: Studio[];
    tags: Tag[];
    series: Series[];
    codes: Array<
      CodeEntry & {
        actress_ids: string[];
        tag_ids: string[];
      }
    >;
  };
}
