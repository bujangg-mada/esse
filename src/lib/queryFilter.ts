import Fuse from 'fuse.js';
import type { CodeFilterState, CodeWithRelations, SortOption } from '../types/esse';

export const EMPTY_FILTERS: CodeFilterState = {
  actressId: '',
  studioId: '',
  tagId: '',
  seriesId: '',
};

export function filterAndSortCodes(
  items: CodeWithRelations[],
  searchQuery: string,
  filters: CodeFilterState,
  sortBy: SortOption
): CodeWithRelations[] {
  let result = items;

  if (filters.actressId) {
    result = result.filter((item) =>
      item.actresses.some((actress) => actress.id === filters.actressId)
    );
  }

  if (filters.studioId) {
    result = result.filter((item) => item.studio_id === filters.studioId);
  }

  if (filters.tagId) {
    result = result.filter((item) => item.tags.some((tag) => tag.id === filters.tagId));
  }

  if (filters.seriesId) {
    result = result.filter((item) => item.series_id === filters.seriesId);
  }

  const trimmedQuery = searchQuery.trim();
  if (trimmedQuery.length > 0) {
    const fuse = new Fuse(result, {
      keys: [
        { name: 'code', weight: 0.45 },
        { name: 'actresses.name', weight: 0.25 },
        { name: 'studio.name', weight: 0.15 },
        { name: 'tags.name', weight: 0.1 },
        { name: 'series.name', weight: 0.05 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
    });
    result = fuse.search(trimmedQuery).map((hit) => hit.item);
  }

  const sorted = [...result];
  switch (sortBy) {
    case 'oldest':
      sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
      break;
    case 'code_asc':
      sorted.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
      break;
    case 'code_desc':
      sorted.sort((a, b) => b.code.localeCompare(a.code, undefined, { numeric: true }));
      break;
    case 'newest':
    default:
      sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
      break;
  }

  return sorted;
}

export function getLatestCodes(items: CodeWithRelations[], limit = 5): CodeWithRelations[] {
  return [...items]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

export function hasActiveFilters(searchQuery: string, filters: CodeFilterState): boolean {
  return Boolean(
    searchQuery.trim() ||
      filters.actressId ||
      filters.studioId ||
      filters.tagId ||
      filters.seriesId
  );
}
