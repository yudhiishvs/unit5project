import { normalizeObject, OBJECT_URL, SEARCH_URL } from './data.js';

async function getJson(url, signal) {
  const response = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]) });
  if (!response.ok) throw new Error(`The Met API returned ${response.status}`);
  return response.json();
}

function shuffle(values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

const DEPARTMENT_IDS = [1, 6, 9, 11, 19];

function searchUrl(departmentId, offset) {
  const params = new URLSearchParams({ q: 'flower', hasImages: 'true', isPublicDomain: 'true', departmentId: String(departmentId), limit: '30', offset: String(offset) });
  return `${SEARCH_URL}?${params}`;
}

async function findIds(departmentId, signal) {
  const first = await getJson(searchUrl(departmentId, 0), signal);
  if (!Array.isArray(first.objectIDs) || first.objectIDs.length === 0) return [];
  const highestOffset = Math.min(Math.max(Number(first.total) - 30, 0), 1000);
  if (highestOffset === 0) return shuffle(first.objectIDs);
  const offset = Math.floor(Math.random() * (highestOffset + 1));
  try {
    const page = await getJson(searchUrl(departmentId, offset), signal);
    return shuffle(Array.isArray(page.objectIDs) && page.objectIDs.length >= 10 ? page.objectIDs : first.objectIDs);
  } catch (error) {
    if (signal.aborted) throw error;
    return shuffle(first.objectIDs);
  }
}

export async function fetchFlowerObjects(signal) {
  const searches = await Promise.allSettled(DEPARTMENT_IDS.map((id) => findIds(id, signal)));
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  const groups = searches.filter((result) => result.status === 'fulfilled').map((result) => result.value);
  const ids = [];
  for (let index = 0; index < 30; index += 1) {
    for (const group of groups) if (group[index]) ids.push(group[index]);
  }
  const candidates = [...new Set(ids)].slice(0, 90);
  if (candidates.length === 0) throw new Error('No artwork IDs came back from the collection.');
  const found = [];
  for (let start = 0; start < candidates.length && found.length < 24; start += 30) {
    const batch = candidates.slice(start, start + 30);
    const results = await Promise.allSettled(batch.map((id) => getJson(`${OBJECT_URL}/${id}`, signal)));
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      const object = normalizeObject(result.value);
      if (object) found.push(object);
    }
  }
  if (found.length < 10) throw new Error('The collection returned too few artworks with images.');
  return found.slice(0, 30);
}
