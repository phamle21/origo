/** Lower case without accents, so "quan ly" finds "Quản lý" and "đ" matches "d". */
export function foldForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/** Whether every word of the query appears in one of the texts. An empty query matches everything. */
export function matchesSearch(texts: string[], query: string): boolean {
  const words = foldForSearch(query).split(/\s+/).filter(Boolean);

  if (!words.length) {
    return true;
  }

  const haystack = texts.map(foldForSearch).join(' ');

  return words.every((word) => haystack.includes(word));
}
