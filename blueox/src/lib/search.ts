// A generic, case-insensitive substring filter shared by every searchable
// list in the app (Admin's tabs, the Partner Portal's candidate list). Each
// caller just says which fields of its own item type are searchable.
export function filterBySearch<T>(
  items: T[],
  query: string,
  getFields: (item: T) => Array<string | null | undefined>
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => getFields(item).some((f) => f?.toLowerCase().includes(q)));
}
