import test from 'node:test';
import assert from 'node:assert/strict';
import {
  actressFormSchema,
  codeFormSchema,
  isValidHttpUrl,
  isValidMediaSource,
  setupPinSchema,
} from './schemas';
import {
  extractDeterministicThumbnail,
  hashSecret,
  normalizeSecurityAnswer,
} from './crypto';
import { EMPTY_FILTERS, filterAndSortCodes, getLatestCodes } from './queryFilter';
import { buildBackupPayload, parseBackupJson } from './backup';
import { filterSelectableOptions } from '../components/SearchableMultiSelect';
import type { CodeWithRelations } from '../types/esse';

test('URL and media validation blocks unsafe schemes', () => {
  assert.equal(isValidHttpUrl('https://example.com/video'), true);
  assert.equal(isValidHttpUrl('http://example.com'), true);
  assert.equal(isValidHttpUrl('javascript:alert(1)'), false);
  assert.equal(isValidHttpUrl('data:text/html,<script>'), false);

  assert.equal(isValidMediaSource('https://cdn.example.com/pic.jpg'), true);
  assert.equal(
    isValidMediaSource('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB'),
    true
  );
  assert.equal(isValidMediaSource('javascript:alert(1)'), false);
});

test('Zod schemas enforce required fields and constraints', () => {
  const pinValid = setupPinSchema.safeParse({
    pin: '1234',
    confirmPin: '1234',
    securityQuestion: 'Apa nama kota kelahiran Anda?',
    securityAnswer: 'Bandung',
  });
  assert.equal(pinValid.success, true);

  const pinMismatch = setupPinSchema.safeParse({
    pin: '1234',
    confirmPin: '5678',
    securityQuestion: 'Apa nama kota kelahiran Anda?',
    securityAnswer: 'Bandung',
  });
  assert.equal(pinMismatch.success, false);

  const actressInvalidAge = actressFormSchema.safeParse({
    name: 'Aktris Satu',
    age: 15,
    photo_url: '',
  });
  assert.equal(actressInvalidAge.success, false);

  const codeInvalidUrl = codeFormSchema.safeParse({
    code: 'ROE-504',
    url: 'not-a-url',
  });
  assert.equal(codeInvalidUrl.success, false);
});

test('Crypto hashing and security answer normalization are deterministic', async () => {
  const norm = normalizeSecurityAnswer('  Jakarta   Selatan  ');
  assert.equal(norm, 'jakarta selatan');

  const h1 = await hashSecret('1234', 'salt-abc');
  const h2 = await hashSecret('1234', 'salt-abc');
  const h3 = await hashSecret('9999', 'salt-abc');
  assert.equal(h1, h2);
  assert.notEqual(h1, h3);
  assert.equal(h1.length, 64);
});

test('Deterministic thumbnail extractor handles YouTube and direct images', () => {
  assert.equal(
    extractDeterministicThumbnail('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
  );
  assert.equal(
    extractDeterministicThumbnail('https://youtu.be/dQw4w9WgXcQ'),
    'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
  );
  assert.equal(
    extractDeterministicThumbnail('https://example.com/poster.webp'),
    'https://example.com/poster.webp'
  );
  assert.equal(extractDeterministicThumbnail('https://example.com/watch/123'), null);
});

test('Search, filter, sort, and latest 5 history work deterministically', () => {
  const sampleCodes: CodeWithRelations[] = [
    {
      id: '1',
      code: 'ROE-504',
      url: 'https://example.com/1',
      thumbnail_url: null,
      studio_id: 's1',
      series_id: 'ser1',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      actresses: [{ id: 'a1', name: 'Hana', age: 25, photo_url: null, created_at: '2026-01-01T00:00:00Z' }],
      studio: { id: 's1', name: 'Madonna', logo_url: null, created_at: '2026-01-01T00:00:00Z' },
      tags: [{ id: 't1', name: 'Drama', created_at: '2026-01-01T00:00:00Z' }],
      series: { id: 'ser1', name: 'Seri A', created_at: '2026-01-01T00:00:00Z' },
    },
    {
      id: '2',
      code: 'ALDN-627',
      url: 'https://example.com/2',
      thumbnail_url: null,
      studio_id: 's2',
      series_id: null,
      created_at: '2026-02-01T00:00:00Z',
      updated_at: '2026-02-01T00:00:00Z',
      actresses: [{ id: 'a2', name: 'Mina', age: 28, photo_url: null, created_at: '2026-02-01T00:00:00Z' }],
      studio: { id: 's2', name: 'Takara', logo_url: null, created_at: '2026-02-01T00:00:00Z' },
      tags: [{ id: 't2', name: 'Misteri', created_at: '2026-02-01T00:00:00Z' }],
      series: null,
    },
  ];

  const byQuery = filterAndSortCodes(sampleCodes, 'ALDN', EMPTY_FILTERS, 'newest');
  assert.equal(byQuery.length, 1);
  assert.equal(byQuery[0].code, 'ALDN-627');

  const byTag = filterAndSortCodes(sampleCodes, '', { ...EMPTY_FILTERS, tagId: 't1' }, 'newest');
  assert.equal(byTag.length, 1);
  assert.equal(byTag[0].code, 'ROE-504');

  const sortedAsc = filterAndSortCodes(sampleCodes, '', EMPTY_FILTERS, 'code_asc');
  assert.equal(sortedAsc[0].code, 'ALDN-627');

  const latest = getLatestCodes(sampleCodes, 1);
  assert.equal(latest.length, 1);
  assert.equal(latest[0].code, 'ALDN-627');
});

test('Backup export and import validation roundtrip', () => {
  const payload = buildBackupPayload({
    actresses: [{ id: 'a1', name: 'Hana', age: 25, photo_url: null, created_at: '2026-01-01T00:00:00Z' }],
    studios: [{ id: 's1', name: 'Madonna', logo_url: null, created_at: '2026-01-01T00:00:00Z' }],
    tags: [{ id: 't1', name: 'Drama', created_at: '2026-01-01T00:00:00Z' }],
    series: [{ id: 'ser1', name: 'Seri A', created_at: '2026-01-01T00:00:00Z' }],
    codes: [
      {
        id: '1',
        code: 'ROE-504',
        url: 'https://example.com/1',
        thumbnail_url: null,
        studio_id: 's1',
        series_id: 'ser1',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        actresses: [{ id: 'a1', name: 'Hana', age: 25, photo_url: null, created_at: '2026-01-01T00:00:00Z' }],
        studio: { id: 's1', name: 'Madonna', logo_url: null, created_at: '2026-01-01T00:00:00Z' },
        tags: [{ id: 't1', name: 'Drama', created_at: '2026-01-01T00:00:00Z' }],
        series: { id: 'ser1', name: 'Seri A', created_at: '2026-01-01T00:00:00Z' },
      },
    ],
  });

  const parsed = parseBackupJson(JSON.stringify(payload));
  assert.equal(parsed.data.codes[0].code, 'ROE-504');
  assert.deepEqual(parsed.data.codes[0].actress_ids, ['a1']);
  assert.throws(() => parseBackupJson('{invalid json'));
});

test('SearchableMultiSelect option filtering matches labels and sublabels case-insensitively', () => {
  const options = [
    { id: '1', label: 'Hana Shiratori', sublabel: '25 thn' },
    { id: '2', label: 'Mina Kitano', sublabel: '28 thn' },
    { id: '3', label: 'Drama' },
  ];

  assert.equal(filterSelectableOptions(options, '').length, 3);
  assert.deepEqual(
    filterSelectableOptions(options, 'hana').map((o) => o.id),
    ['1']
  );
  assert.deepEqual(
    filterSelectableOptions(options, '28 thn').map((o) => o.id),
    ['2']
  );
  assert.deepEqual(filterSelectableOptions(options, 'zzz'), []);
});
