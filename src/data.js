export const SEARCH_URL = 'https://collectionapi.metmuseum.org/public/collection/v1.1/search';
export const OBJECT_URL = 'https://collectionapi.metmuseum.org/public/collection/v1/objects';

export function normalizeObject(record) {
  if (!record || !Number.isFinite(Number(record.objectID)) || !record.title) return null;
  const image = record.primaryImageSmall || record.primaryImage;
  if (!image) return null;
  const begin = Number(record.objectBeginDate);
  const end = Number(record.objectEndDate);
  return {
    id: Number(record.objectID),
    title: record.title.trim(),
    artist: record.artistDisplayName?.trim() || 'Unknown maker',
    department: record.department?.trim() || 'Other department',
    medium: record.medium?.trim() || 'Medium not listed',
    date: record.objectDate?.trim() || 'Date unknown',
    year: Number.isFinite(begin) && begin !== 0 ? begin : Number.isFinite(end) && end !== 0 ? end : null,
    image,
    url: record.objectURL || `https://www.metmuseum.org/art/collection/search/${record.objectID}`,
  };
}

export function filterObjects(objects, search, department, era) {
  const query = search.trim().toLocaleLowerCase();
  return objects.filter((object) => {
    const matchesSearch = !query || `${object.title} ${object.artist}`.toLocaleLowerCase().includes(query);
    const matchesDepartment = department === 'all' || object.department === department;
    const matchesEra = era === 'all' || (object.year !== null && (
      (era === 'before1800' && object.year < 1800) ||
      (era === '1800s' && object.year >= 1800 && object.year < 1900) ||
      (era === '1900plus' && object.year >= 1900)
    ));
    return matchesSearch && matchesDepartment && matchesEra;
  });
}

export function summarize(objects) {
  const departments = new Map();
  for (const object of objects) {
    departments.set(object.department, (departments.get(object.department) || 0) + 1);
  }
  const years = objects.map((object) => object.year).filter((year) => year !== null);
  return {
    total: objects.length,
    departmentCount: departments.size,
    earliestYear: years.length ? Math.min(...years) : null,
    latestYear: years.length ? Math.max(...years) : null,
    departments: [...departments.entries()].sort((a, b) => b[1] - a[1]),
  };
}

export function formatYear(year) {
  if (year === null) return 'Unknown';
  return year < 0 ? `${Math.abs(year).toLocaleString()} BCE` : `${year.toLocaleString()} CE`;
}
