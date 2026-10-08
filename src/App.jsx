import { useEffect, useMemo, useState } from 'react';
import { fetchFlowerObjects } from './api.js';
import { filterObjects, formatYear, summarize } from './data.js';

const ERAS = [
  ['all', 'All eras'],
  ['before1800', 'Before 1800'],
  ['1800s', '1800s'],
  ['1900plus', '1900 onward'],
];

function ArrowIcon({ diagonal = false }) {
  return diagonal ? <span aria-hidden="true">↗</span> : <span aria-hidden="true">→</span>;
}

function Metric({ label, value, detail, index }) {
  return <div className="metric">
    <div className="metric-top"><span>{label}</span><span className="metric-index">0{index}</span></div>
    <strong>{value}</strong>
    <p>{detail}</p>
  </div>;
}

function ArtworkRow({ artwork, index }) {
  return <a className="artwork-row" href={artwork.url} target="_blank" rel="noopener noreferrer">
    <span className="row-number">{String(index + 1).padStart(2, '0')}</span>
    <img src={artwork.image} alt="" loading="lazy" />
    <span className="row-title"><strong>{artwork.title}</strong><small>{artwork.artist}</small></span>
    <span className="row-department">{artwork.department}</span>
    <span className="row-date">{artwork.date}</span>
    <span className="row-arrow"><ArrowIcon diagonal /></span>
  </a>;
}

export default function App() {
  const [artworks, setArtworks] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [era, setEra] = useState('all');

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;
    async function load() {
      setStatus('loading');
      setError('');
      try {
        const items = await fetchFlowerObjects(controller.signal);
        if (!ignore) {
          setArtworks(items);
          setStatus('ready');
        }
      } catch (reason) {
        if (!ignore) {
          setError(reason instanceof Error ? reason.message : 'The collection could not be loaded.');
          setStatus('error');
        }
      }
    }
    load();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [reload]);

  const filtered = useMemo(() => filterObjects(artworks, search, department, era), [artworks, search, department, era]);
  const stats = useMemo(() => summarize(artworks), [artworks]);
  const departments = useMemo(() => stats.departments.map(([name]) => name), [stats]);
  const lead = artworks[0];

  function clearFilters() {
    setSearch('');
    setDepartment('all');
    setEra('all');
  }

  return <div className="site-shell">
    <div className="topline"><span>THE MET COLLECTION · AN OPEN DATA EXPLORATION</span><span>FIELD NOTES / 001</span></div>
    <header className="site-header">
      <a className="brand" href="#top" aria-label="The Flower Index home"><span className="brand-mark">✳</span><span>The Flower Index<span className="brand-dot">.</span></span></a>
      <nav aria-label="Main navigation"><a href="#overview">Overview</a><a href="#collection">Collection</a><a href="https://www.metmuseum.org/art/collection" target="_blank" rel="noopener noreferrer">Visit The Met <ArrowIcon diagonal /></a></nav>
    </header>

    <main id="top">
      <section className="hero" id="overview">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> A LIVING COLLECTION STUDY</div>
          <h1>A thousand ways<br />to see a <em>flower.</em></h1>
          <p className="hero-description">Across centuries and continents, artists keep returning to the same subject. Explore a live sample of floral works from The Metropolitan Museum of Art.</p>
          <a className="hero-link" href="#collection">Explore the collection <ArrowIcon /></a>
          <div className="hero-foot"><span className="live-dot" /> LIVE DATA FROM THE MET COLLECTION API</div>
        </div>
        <div className="hero-art" aria-label={lead ? `Featured artwork, ${lead.title}` : 'Featured artwork loading'}>
          {lead ? <img src={lead.image} alt={lead.title} /> : <div className="hero-art-placeholder"><span>✳</span></div>}
          <div className="hero-art-caption"><span>FEATURED FROM THE SAMPLE</span><strong>{lead?.title || 'Gathering the collection'}</strong><small>{lead?.date || 'Please wait'}</small></div>
          <span className="hero-stamp">01 / 04</span>
        </div>
      </section>

      <section className="overview-section" aria-labelledby="overview-heading">
        <div className="section-heading"><div><span className="section-kicker">THE BIG PICTURE</span><h2 id="overview-heading">A collection in numbers</h2></div><p>These figures describe the live sample below, not the museum’s entire collection.</p></div>
        <div className="metrics-grid">
          <Metric index={1} label="WORKS IN THIS SAMPLE" value={status === 'ready' ? stats.total : '…'} detail="Individual objects ready to explore" />
          <Metric index={2} label="DEPARTMENTS" value={status === 'ready' ? stats.departmentCount : '…'} detail="Distinct corners of the collection" />
          <Metric index={3} label="EARLIEST WORK" value={status === 'ready' ? formatYear(stats.earliestYear) : '…'} detail={status === 'ready' ? `To ${formatYear(stats.latestYear)} in this sample` : 'Waiting for collection data'} />
        </div>
      </section>

      <section className="collection-section" id="collection" aria-labelledby="collection-heading">
        <div className="section-heading collection-heading"><div><span className="section-kicker">THE OBJECTS</span><h2 id="collection-heading">Browse the bloom</h2></div><p>Search by title or maker. Narrow by department and era.</p></div>
        <div className="collection-layout">
          <div className="collection-main">
            <div className="filters" aria-label="Collection filters">
              <label className="search-field"><span className="field-label">SEARCH THE SAMPLE</span><span className="search-input-wrap"><span className="search-icon" aria-hidden="true">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title or artist" aria-label="Search title or artist" /></span></label>
              <label className="select-field"><span className="field-label">DEPARTMENT</span><select value={department} onChange={(event) => setDepartment(event.target.value)} aria-label="Filter by department"><option value="all">All departments</option>{departments.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
            </div>
            <div className="era-filters" role="group" aria-label="Filter by era">{ERAS.map(([value, label]) => <button key={value} type="button" className={era === value ? 'active' : ''} onClick={() => setEra(value)} aria-pressed={era === value}>{label}</button>)}</div>
            <div className="list-header"><span>{status === 'ready' ? `${filtered.length} OF ${artworks.length} WORKS` : 'THE COLLECTION'}</span><span>FROM THE MET <ArrowIcon diagonal /></span></div>
            {status === 'loading' && <div className="message-panel" role="status"><span className="loading-flower">✳</span><h3>Gathering the collection</h3><p>Finding floral works with images and details from The Met.</p></div>}
            {status === 'error' && <div className="message-panel" role="alert"><span className="message-symbol">!</span><h3>The collection is unavailable</h3><p>{error} Check your connection, then try again.</p><button type="button" onClick={() => setReload((value) => value + 1)}>Try again <ArrowIcon /></button></div>}
            {status === 'ready' && filtered.length === 0 && <div className="message-panel"><span className="message-symbol">⌕</span><h3>No works match those filters</h3><p>Try another title, maker, department, or era.</p><button type="button" onClick={clearFilters}>Clear filters <ArrowIcon /></button></div>}
            {status === 'ready' && filtered.length > 0 && <div className="artwork-list">{filtered.map((artwork, index) => <ArtworkRow artwork={artwork} index={index} key={artwork.id} />)}</div>}
            <div className="list-footer"><span>Showing a live sample of publicly available collection records.</span><button type="button" onClick={() => setReload((value) => value + 1)} disabled={status === 'loading'}>Refresh sample <span aria-hidden="true">↻</span></button></div>
          </div>
          <aside className="insight-panel" aria-label="Department breakdown">
            <div className="insight-inner"><span className="section-kicker">A CLOSER LOOK</span><h3>Where the<br /><em>flowers</em> live.</h3><p>One motif appears in many parts of the museum. Here is how this sample divides by department.</p>
              {status === 'ready' ? <div className="department-bars">{stats.departments.slice(0, 6).map(([name, count], index) => <div className="bar-row" key={name}><div className="bar-label"><span>{String(index + 1).padStart(2, '0')} &nbsp; {name}</span><strong>{count}</strong></div><div className="bar-track"><span style={{ width: `${Math.max(8, count / stats.total * 100)}%` }} /></div></div>)}</div> : <div className="insight-wait">Department breakdown will appear when the collection loads.</div>}
              <div className="insight-bottom"><span>✳</span><p>Each object links back to its record at The Met.</p></div>
            </div>
          </aside>
        </div>
      </section>
    </main>
    <footer><span className="footer-brand">The Flower Index<span>.</span></span><span>Made with open collection data from <a href="https://www.metmuseum.org/art/collection" target="_blank" rel="noopener noreferrer">The Metropolitan Museum of Art <ArrowIcon diagonal /></a></span><a href="#top">Back to top ↑</a></footer>
  </div>;
}
