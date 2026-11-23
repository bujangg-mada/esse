import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  Actress,
  CodeEntry,
  CodeWithRelations,
  EsseBackupPayload,
  Series,
  Studio,
  Tag,
  VaultStatus,
} from '../types/esse';
import { generateSalt, hashSecret, normalizeSecurityAnswer } from './crypto';
import { useVaultStore } from '../store/useVaultStore';

const LOCAL_STORAGE_KEY = 'esse_local_vault_v1';

interface LocalVaultData {
  vault: {
    pin_hash: string;
    pin_salt: string;
    security_question: string;
    security_answer_hash: string;
  } | null;
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
}

export interface AllVaultRecords {
  codes: CodeWithRelations[];
  actresses: Actress[];
  studios: Studio[];
  tags: Tag[];
  series: Series[];
}

function createEmptyLocalData(): LocalVaultData {
  return {
    vault: null,
    actresses: [],
    studios: [],
    tags: [],
    series: [],
    codes: [],
  };
}

function readLocalData(): LocalVaultData {
  if (typeof window === 'undefined') return createEmptyLocalData();
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return createEmptyLocalData();
    const parsed = JSON.parse(raw) as Partial<LocalVaultData>;
    return {
      vault: parsed.vault ?? null,
      actresses: Array.isArray(parsed.actresses) ? parsed.actresses : [],
      studios: Array.isArray(parsed.studios) ? parsed.studios : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      series: Array.isArray(parsed.series) ? parsed.series : [],
      codes: Array.isArray(parsed.codes) ? parsed.codes : [],
    };
  } catch {
    return createEmptyLocalData();
  }
}

function writeLocalData(data: LocalVaultData): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSupabaseClient(): SupabaseClient | null {
  const { supabaseConfig, pinHash } = useVaultStore.getState();
  if (!supabaseConfig?.url || !supabaseConfig?.publishableKey) return null;

  return createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: pinHash ? { 'x-esse-pin-hash': pinHash } : {},
    },
  });
}

export function isUsingSupabase(): boolean {
  const { supabaseConfig } = useVaultStore.getState();
  return Boolean(supabaseConfig?.url && supabaseConfig?.publishableKey);
}

function hydrateCodes(
  rawCodes: Array<CodeEntry & { actress_ids: string[]; tag_ids: string[] }>,
  actresses: Actress[],
  studios: Studio[],
  tags: Tag[],
  series: Series[]
): CodeWithRelations[] {
  const actressMap = new Map(actresses.map((a) => [a.id, a]));
  const studioMap = new Map(studios.map((s) => [s.id, s]));
  const tagMap = new Map(tags.map((t) => [t.id, t]));
  const seriesMap = new Map(series.map((s) => [s.id, s]));

  return rawCodes.map((c) => ({
    id: c.id,
    code: c.code,
    url: c.url,
    thumbnail_url: c.thumbnail_url,
    studio_id: c.studio_id,
    series_id: c.series_id,
    created_at: c.created_at,
    updated_at: c.updated_at,
    actresses: c.actress_ids
      .map((id) => actressMap.get(id))
      .filter((item): item is Actress => Boolean(item)),
    studio: c.studio_id ? studioMap.get(c.studio_id) ?? null : null,
    tags: c.tag_ids
      .map((id) => tagMap.get(id))
      .filter((item): item is Tag => Boolean(item)),
    series: c.series_id ? seriesMap.get(c.series_id) ?? null : null,
  }));
}

export async function getVaultStatus(): Promise<VaultStatus> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.rpc('get_vault_status');
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    return {
      initialized: Boolean(row?.initialized),
      security_question: row?.security_question ?? null,
      pin_salt: row?.pin_salt ?? null,
    };
  }

  const local = readLocalData();
  return {
    initialized: Boolean(local.vault),
    security_question: local.vault?.security_question ?? null,
    pin_salt: local.vault?.pin_salt ?? null,
  };
}

export async function setupVaultPin(params: {
  pin: string;
  securityQuestion: string;
  securityAnswer: string;
}): Promise<string> {
  const salt = generateSalt();
  const pinHash = await hashSecret(params.pin.trim(), salt);
  const answerHash = await hashSecret(normalizeSecurityAnswer(params.securityAnswer), salt);

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.rpc('setup_vault_pin', {
      p_pin_hash: pinHash,
      p_pin_salt: salt,
      p_question: params.securityQuestion,
      p_answer_hash: answerHash,
    });
    if (error) throw new Error(error.message);
    if (!data) throw new Error('PIN sudah diatur sebelumnya');
    return pinHash;
  }

  const local = readLocalData();
  if (local.vault) throw new Error('PIN sudah diatur sebelumnya');
  local.vault = {
    pin_hash: pinHash,
    pin_salt: salt,
    security_question: params.securityQuestion,
    security_answer_hash: answerHash,
  };
  writeLocalData(local);
  return pinHash;
}

export async function verifyVaultPin(pin: string): Promise<string | null> {
  const status = await getVaultStatus();
  if (!status.initialized || !status.pin_salt) {
    throw new Error('PIN belum dikonfigurasi');
  }
  const pinHash = await hashSecret(pin.trim(), status.pin_salt);

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.rpc('verify_vault_pin', {
      p_pin_hash: pinHash,
    });
    if (error) throw new Error(error.message);
    return data ? pinHash : null;
  }

  const local = readLocalData();
  if (!local.vault) return null;
  return local.vault.pin_hash === pinHash ? pinHash : null;
}

export async function resetPinWithSecurityAnswer(params: {
  securityAnswer: string;
  newPin: string;
}): Promise<string | null> {
  const status = await getVaultStatus();
  if (!status.initialized || !status.pin_salt) {
    throw new Error('Konfigurasi PIN tidak ditemukan');
  }

  const currentAnswerHash = await hashSecret(
    normalizeSecurityAnswer(params.securityAnswer),
    status.pin_salt
  );
  const newSalt = generateSalt();
  const newPinHash = await hashSecret(params.newPin.trim(), newSalt);
  const newAnswerHash = await hashSecret(
    normalizeSecurityAnswer(params.securityAnswer),
    newSalt
  );

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.rpc('verify_security_answer_and_reset_pin', {
      p_answer_hash: currentAnswerHash,
      p_new_pin_hash: newPinHash,
      p_new_salt: newSalt,
      p_new_answer_hash: newAnswerHash,
    });
    if (error) throw new Error(error.message);
    return data ? newPinHash : null;
  }

  const local = readLocalData();
  if (!local.vault || local.vault.security_answer_hash !== currentAnswerHash) {
    return null;
  }
  local.vault = {
    ...local.vault,
    pin_hash: newPinHash,
    pin_salt: newSalt,
    security_answer_hash: newAnswerHash,
  };
  writeLocalData(local);
  return newPinHash;
}

export async function changeVaultPin(params: {
  currentPin: string;
  newPin: string;
  securityQuestion: string;
  securityAnswer: string;
}): Promise<string | null> {
  const status = await getVaultStatus();
  if (!status.initialized || !status.pin_salt) {
    throw new Error('Konfigurasi PIN tidak ditemukan');
  }

  const oldPinHash = await hashSecret(params.currentPin.trim(), status.pin_salt);
  const newSalt = generateSalt();
  const newPinHash = await hashSecret(params.newPin.trim(), newSalt);
  const newAnswerHash = await hashSecret(
    normalizeSecurityAnswer(params.securityAnswer),
    newSalt
  );

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.rpc('change_vault_pin', {
      p_old_pin_hash: oldPinHash,
      p_new_pin_hash: newPinHash,
      p_new_salt: newSalt,
      p_question: params.securityQuestion,
      p_answer_hash: newAnswerHash,
    });
    if (error) throw new Error(error.message);
    return data ? newPinHash : null;
  }

  const local = readLocalData();
  if (!local.vault || local.vault.pin_hash !== oldPinHash) {
    return null;
  }
  local.vault = {
    pin_hash: newPinHash,
    pin_salt: newSalt,
    security_question: params.securityQuestion,
    security_answer_hash: newAnswerHash,
  };
  writeLocalData(local);
  return newPinHash;
}

export async function fetchAllVaultRecords(): Promise<AllVaultRecords> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const [actRes, studioRes, tagRes, seriesRes, codeRes, codeActRes, codeTagRes] =
      await Promise.all([
        supabase.from('actresses').select('*').order('name', { ascending: true }),
        supabase.from('studios').select('*').order('name', { ascending: true }),
        supabase.from('tags').select('*').order('name', { ascending: true }),
        supabase.from('series').select('*').order('name', { ascending: true }),
        supabase.from('codes').select('*').order('created_at', { ascending: false }),
        supabase.from('code_actresses').select('*'),
        supabase.from('code_tags').select('*'),
      ]);

    const firstError =
      actRes.error ||
      studioRes.error ||
      tagRes.error ||
      seriesRes.error ||
      codeRes.error ||
      codeActRes.error ||
      codeTagRes.error;
    if (firstError) throw new Error(firstError.message);

    const actresses = (actRes.data ?? []) as Actress[];
    const studios = (studioRes.data ?? []) as Studio[];
    const tags = (tagRes.data ?? []) as Tag[];
    const series = (seriesRes.data ?? []) as Series[];
    const rawCodes = (codeRes.data ?? []) as CodeEntry[];
    const codeActresses = (codeActRes.data ?? []) as Array<{
      code_id: string;
      actress_id: string;
    }>;
    const codeTags = (codeTagRes.data ?? []) as Array<{
      code_id: string;
      tag_id: string;
    }>;

    const actByCode = new Map<string, string[]>();
    for (const row of codeActresses) {
      const list = actByCode.get(row.code_id) ?? [];
      list.push(row.actress_id);
      actByCode.set(row.code_id, list);
    }

    const tagByCode = new Map<string, string[]>();
    for (const row of codeTags) {
      const list = tagByCode.get(row.code_id) ?? [];
      list.push(row.tag_id);
      tagByCode.set(row.code_id, list);
    }

    const combined = rawCodes.map((c) => ({
      ...c,
      actress_ids: actByCode.get(c.id) ?? [],
      tag_ids: tagByCode.get(c.id) ?? [],
    }));

    return {
      actresses,
      studios,
      tags,
      series,
      codes: hydrateCodes(combined, actresses, studios, tags, series),
    };
  }

  const local = readLocalData();
  const actresses = [...local.actresses].sort((a, b) => a.name.localeCompare(b.name));
  const studios = [...local.studios].sort((a, b) => a.name.localeCompare(b.name));
  const tags = [...local.tags].sort((a, b) => a.name.localeCompare(b.name));
  const series = [...local.series].sort((a, b) => a.name.localeCompare(b.name));
  const codes = hydrateCodes(local.codes, actresses, studios, tags, series).sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );

  return { actresses, studios, tags, series, codes };
}

export async function saveActress(input: {
  id?: string;
  name: string;
  age: number | null;
  photo_url: string | null;
}): Promise<Actress> {
  const supabase = getSupabaseClient();
  if (supabase) {
    if (input.id) {
      const { data, error } = await supabase
        .from('actresses')
        .update({
          name: input.name.trim(),
          age: input.age,
          photo_url: input.photo_url || null,
        })
        .eq('id', input.id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as Actress;
    }

    const { data, error } = await supabase
      .from('actresses')
      .insert({
        name: input.name.trim(),
        age: input.age,
        photo_url: input.photo_url || null,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as Actress;
  }

  const local = readLocalData();
  if (input.id) {
    const idx = local.actresses.findIndex((a) => a.id === input.id);
    if (idx === -1) throw new Error('Aktris tidak ditemukan');
    local.actresses[idx] = {
      ...local.actresses[idx],
      name: input.name.trim(),
      age: input.age,
      photo_url: input.photo_url || null,
    };
    writeLocalData(local);
    return local.actresses[idx];
  }

  const created: Actress = {
    id: createId(),
    name: input.name.trim(),
    age: input.age,
    photo_url: input.photo_url || null,
    created_at: new Date().toISOString(),
  };
  local.actresses.push(created);
  writeLocalData(local);
  return created;
}

export async function deleteActress(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('actresses').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }

  const local = readLocalData();
  local.actresses = local.actresses.filter((a) => a.id !== id);
  local.codes = local.codes.map((c) => ({
    ...c,
    actress_ids: c.actress_ids.filter((aid) => aid !== id),
  }));
  writeLocalData(local);
}

export async function saveStudio(input: {
  id?: string;
  name: string;
  logo_url: string | null;
}): Promise<Studio> {
  const supabase = getSupabaseClient();
  if (supabase) {
    if (input.id) {
      const { data, error } = await supabase
        .from('studios')
        .update({
          name: input.name.trim(),
          logo_url: input.logo_url || null,
        })
        .eq('id', input.id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as Studio;
    }

    const { data, error } = await supabase
      .from('studios')
      .insert({
        name: input.name.trim(),
        logo_url: input.logo_url || null,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as Studio;
  }

  const local = readLocalData();
  if (input.id) {
    const idx = local.studios.findIndex((s) => s.id === input.id);
    if (idx === -1) throw new Error('Studio tidak ditemukan');
    local.studios[idx] = {
      ...local.studios[idx],
      name: input.name.trim(),
      logo_url: input.logo_url || null,
    };
    writeLocalData(local);
    return local.studios[idx];
  }

  const duplicate = local.studios.find(
    (s) => s.name.toLowerCase() === input.name.trim().toLowerCase()
  );
  if (duplicate) return duplicate;

  const created: Studio = {
    id: createId(),
    name: input.name.trim(),
    logo_url: input.logo_url || null,
    created_at: new Date().toISOString(),
  };
  local.studios.push(created);
  writeLocalData(local);
  return created;
}

export async function deleteStudio(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('studios').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }

  const local = readLocalData();
  local.studios = local.studios.filter((s) => s.id !== id);
  local.codes = local.codes.map((c) => (c.studio_id === id ? { ...c, studio_id: null } : c));
  writeLocalData(local);
}

export async function saveTag(input: string | { id?: string; name: string }): Promise<Tag> {
  const tagId = typeof input === 'string' ? undefined : input.id;
  const cleanName = (typeof input === 'string' ? input : input.name).trim();
  const supabase = getSupabaseClient();
  if (supabase) {
    if (tagId) {
      const { data, error } = await supabase
        .from('tags')
        .update({ name: cleanName })
        .eq('id', tagId)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as Tag;
    }

    const existing = await supabase
      .from('tags')
      .select('*')
      .ilike('name', cleanName)
      .maybeSingle();
    if (existing.data) return existing.data as Tag;

    const { data, error } = await supabase
      .from('tags')
      .insert({ name: cleanName })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as Tag;
  }

  const local = readLocalData();
  if (tagId) {
    const idx = local.tags.findIndex((t) => t.id === tagId);
    if (idx === -1) throw new Error('Tag tidak ditemukan');
    local.tags[idx] = {
      ...local.tags[idx],
      name: cleanName,
    };
    writeLocalData(local);
    return local.tags[idx];
  }

  const existing = local.tags.find((t) => t.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) return existing;

  const created: Tag = {
    id: createId(),
    name: cleanName,
    created_at: new Date().toISOString(),
  };
  local.tags.push(created);
  writeLocalData(local);
  return created;
}

export async function deleteTag(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }

  const local = readLocalData();
  local.tags = local.tags.filter((t) => t.id !== id);
  local.codes = local.codes.map((c) => ({
    ...c,
    tag_ids: c.tag_ids.filter((tid) => tid !== id),
  }));
  writeLocalData(local);
}

export async function saveSeries(input: { id?: string; name: string }): Promise<Series> {
  const cleanName = input.name.trim();
  const supabase = getSupabaseClient();
  if (supabase) {
    if (input.id) {
      const { data, error } = await supabase
        .from('series')
        .update({ name: cleanName })
        .eq('id', input.id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as Series;
    }

    const existing = await supabase
      .from('series')
      .select('*')
      .ilike('name', cleanName)
      .maybeSingle();
    if (existing.data) return existing.data as Series;

    const { data, error } = await supabase
      .from('series')
      .insert({ name: cleanName })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as Series;
  }

  const local = readLocalData();
  if (input.id) {
    const idx = local.series.findIndex((s) => s.id === input.id);
    if (idx === -1) throw new Error('Seri tidak ditemukan');
    local.series[idx] = { ...local.series[idx], name: cleanName };
    writeLocalData(local);
    return local.series[idx];
  }

  const existing = local.series.find((s) => s.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) return existing;

  const created: Series = {
    id: createId(),
    name: cleanName,
    created_at: new Date().toISOString(),
  };
  local.series.push(created);
  writeLocalData(local);
  return created;
}

export async function deleteSeries(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('series').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }

  const local = readLocalData();
  local.series = local.series.filter((s) => s.id !== id);
  local.codes = local.codes.map((c) => (c.series_id === id ? { ...c, series_id: null } : c));
  writeLocalData(local);
}

export async function saveCodeEntry(input: {
  id?: string;
  code: string;
  url: string;
  thumbnail_url: string | null;
  actress_ids: string[];
  tag_ids: string[];
  studio_id: string | null;
  series_id: string | null;
}): Promise<string> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    let codeId = input.id;
    if (codeId) {
      const { error } = await supabase
        .from('codes')
        .update({
          code: input.code.trim(),
          url: input.url.trim(),
          thumbnail_url: input.thumbnail_url || null,
          studio_id: input.studio_id || null,
          series_id: input.series_id || null,
          updated_at: now,
        })
        .eq('id', codeId);
      if (error) throw new Error(error.message);

      await supabase.from('code_actresses').delete().eq('code_id', codeId);
      await supabase.from('code_tags').delete().eq('code_id', codeId);
    } else {
      const { data, error } = await supabase
        .from('codes')
        .insert({
          code: input.code.trim(),
          url: input.url.trim(),
          thumbnail_url: input.thumbnail_url || null,
          studio_id: input.studio_id || null,
          series_id: input.series_id || null,
        })
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      codeId = (data as { id: string }).id;
    }

    if (input.actress_ids.length > 0) {
      const { error } = await supabase.from('code_actresses').insert(
        input.actress_ids.map((actress_id) => ({ code_id: codeId!, actress_id }))
      );
      if (error) throw new Error(error.message);
    }

    if (input.tag_ids.length > 0) {
      const { error } = await supabase.from('code_tags').insert(
        input.tag_ids.map((tag_id) => ({ code_id: codeId!, tag_id }))
      );
      if (error) throw new Error(error.message);
    }

    return codeId!;
  }

  const local = readLocalData();
  if (input.id) {
    const idx = local.codes.findIndex((c) => c.id === input.id);
    if (idx === -1) throw new Error('Kode tidak ditemukan');
    local.codes[idx] = {
      ...local.codes[idx],
      code: input.code.trim(),
      url: input.url.trim(),
      thumbnail_url: input.thumbnail_url || null,
      studio_id: input.studio_id || null,
      series_id: input.series_id || null,
      actress_ids: input.actress_ids,
      tag_ids: input.tag_ids,
      updated_at: now,
    };
    writeLocalData(local);
    return input.id;
  }

  const createdId = createId();
  local.codes.push({
    id: createdId,
    code: input.code.trim(),
    url: input.url.trim(),
    thumbnail_url: input.thumbnail_url || null,
    studio_id: input.studio_id || null,
    series_id: input.series_id || null,
    actress_ids: input.actress_ids,
    tag_ids: input.tag_ids,
    created_at: now,
    updated_at: now,
  });
  writeLocalData(local);
  return createdId;
}

export async function deleteCodeEntry(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('codes').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }

  const local = readLocalData();
  local.codes = local.codes.filter((c) => c.id !== id);
  writeLocalData(local);
}

export async function resetDataCategory(
  category: 'codes' | 'actresses' | 'studios' | 'tags' | 'series' | 'all'
): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    if (category === 'all') {
      await supabase.from('code_actresses').delete().neq('code_id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('code_tags').delete().neq('code_id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('codes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('actresses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('studios').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('series').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      return;
    }
    const { error } = await supabase
      .from(category)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw new Error(error.message);
    return;
  }

  const local = readLocalData();
  if (category === 'all') {
    writeLocalData({
      vault: local.vault,
      actresses: [],
      studios: [],
      tags: [],
      series: [],
      codes: [],
    });
    return;
  }

  if (category === 'codes') {
    local.codes = [];
  } else if (category === 'actresses') {
    local.actresses = [];
    local.codes = local.codes.map((c) => ({ ...c, actress_ids: [] }));
  } else if (category === 'studios') {
    local.studios = [];
    local.codes = local.codes.map((c) => ({ ...c, studio_id: null }));
  } else if (category === 'tags') {
    local.tags = [];
    local.codes = local.codes.map((c) => ({ ...c, tag_ids: [] }));
  } else if (category === 'series') {
    local.series = [];
    local.codes = local.codes.map((c) => ({ ...c, series_id: null }));
  }
  writeLocalData(local);
}

export async function importBackupPayload(
  payload: EsseBackupPayload,
  mode: 'merge' | 'replace'
): Promise<void> {
  if (mode === 'replace') {
    await resetDataCategory('all');
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    if (payload.data.actresses.length > 0) {
      const { error } = await supabase.from('actresses').upsert(payload.data.actresses);
      if (error) throw new Error(error.message);
    }
    if (payload.data.studios.length > 0) {
      const { error } = await supabase.from('studios').upsert(payload.data.studios);
      if (error) throw new Error(error.message);
    }
    if (payload.data.tags.length > 0) {
      const { error } = await supabase.from('tags').upsert(payload.data.tags);
      if (error) throw new Error(error.message);
    }
    if (payload.data.series.length > 0) {
      const { error } = await supabase.from('series').upsert(payload.data.series);
      if (error) throw new Error(error.message);
    }
    if (payload.data.codes.length > 0) {
      const codeRows = payload.data.codes.map(
        ({ actress_ids: _a, tag_ids: _t, ...rest }) => rest
      );
      const { error } = await supabase.from('codes').upsert(codeRows);
      if (error) throw new Error(error.message);

      for (const item of payload.data.codes) {
        await supabase.from('code_actresses').delete().eq('code_id', item.id);
        await supabase.from('code_tags').delete().eq('code_id', item.id);
        if (item.actress_ids.length > 0) {
          await supabase.from('code_actresses').insert(
            item.actress_ids.map((actress_id) => ({ code_id: item.id, actress_id }))
          );
        }
        if (item.tag_ids.length > 0) {
          await supabase.from('code_tags').insert(
            item.tag_ids.map((tag_id) => ({ code_id: item.id, tag_id }))
          );
        }
      }
    }
    return;
  }

  const local = readLocalData();
  const mergeById = <T extends { id: string }>(existing: T[], incoming: T[]): T[] => {
    const map = new Map(existing.map((item) => [item.id, item]));
    for (const item of incoming) {
      map.set(item.id, item);
    }
    return Array.from(map.values());
  };

  local.actresses = mergeById(local.actresses, payload.data.actresses);
  local.studios = mergeById(local.studios, payload.data.studios);
  local.tags = mergeById(local.tags, payload.data.tags);
  local.series = mergeById(local.series, payload.data.series);
  local.codes = mergeById(local.codes, payload.data.codes);
  writeLocalData(local);
}
