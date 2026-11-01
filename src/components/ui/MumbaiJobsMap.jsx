import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ArrowRight, Navigation } from 'lucide-react';
import {
  FORT_ORIGIN,
  MUMBAI_AREAS,
  project,
  formatDistance,
  estimatedTotalPay,
  isHourly,
} from '../../data/mumbai.js';
import './MumbaiJobsMap.css';

// Self-contained, schematic map of South & Central Mumbai (no tiles, no API
// key, works offline). Shapes are approximate; marker positions are computed
// from real neighbourhood coordinates.
const W = 560;
const H = 789;

const toPath = (points) =>
  points
    .map(([lng, lat], i) => {
      const { x, y } = project({ lat, lng }, W, H);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ') + ' Z';

const toLine = (points) =>
  points
    .map(([lng, lat], i) => {
      const { x, y } = project({ lat, lng }, W, H);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

// [lng, lat] outline of the Mumbai island (west coast south->north, then east coast north->south).
const LAND = [
  [72.812, 18.894], [72.8135, 18.905], [72.815, 18.91], [72.8195, 18.919], [72.8225, 18.926],
  [72.821, 18.934], [72.821, 18.944], [72.8125, 18.9535], [72.803, 18.9505], [72.7935, 18.945],
  [72.7945, 18.958], [72.804, 18.97], [72.81, 18.982], [72.812, 18.989], [72.8105, 19.003],
  [72.812, 19.02], [72.817, 19.035], [72.87, 19.035], [72.866, 19.02], [72.862, 19.0],
  [72.854, 18.98], [72.849, 18.97], [72.847, 18.952], [72.844, 18.942], [72.841, 18.932],
  [72.8355, 18.9215], [72.834, 18.915], [72.829, 18.907], [72.823, 18.9], [72.818, 18.894],
];

const WESTERN_LINE = [
  [72.8264, 18.9322], [72.8235, 18.9437], [72.8185, 18.952], [72.816, 18.963], [72.8205, 18.969],
  [72.823, 18.983], [72.83, 18.993], [72.8365, 19.0075], [72.843, 19.0185], [72.846, 19.035],
];
const CENTRAL_LINE = [
  [72.8355, 18.9398], [72.8387, 18.9485], [72.8398, 18.96], [72.833, 18.976], [72.835, 18.986],
  [72.837, 18.995], [72.84, 18.9966], [72.8445, 19.0185],
];

// Areas that get a text label (kept short so the map stays readable).
const LABELLED = new Set([
  'Colaba', 'Nariman Point', 'Churchgate', 'Marine Lines', 'Malabar Hill', 'Girgaon',
  'Mumbai Central', 'Mazagaon', 'Byculla', 'Lower Parel', 'Worli', 'Dadar', 'CSMT', 'Parel',
]);

const compactPay = (job) => {
  const total = estimatedTotalPay(job);
  if (total == null) return '';
  const amount = parseFloat(String(job.payRate).replace(/,/g, '').match(/\d+(\.\d+)?/)?.[0] || '0');
  const short = amount >= 1000 ? `₹${+(amount / 1000).toFixed(1)}k` : `₹${amount}`;
  return isHourly(job) ? `${short}/hr` : short;
};

export default function MumbaiJobsMap({ jobs, selectedId, onSelect }) {
  const origin = project(FORT_ORIGIN, W, H);

  // Nudge markers that share a neighbourhood so they don't overlap.
  const placed = useMemo(() => {
    const seen = {};
    return jobs
      .filter((j) => j._coords)
      .map((job) => {
        const base = project(job._coords, W, H);
        const key = `${job._coords.lat},${job._coords.lng}`;
        const n = (seen[key] = (seen[key] || 0) + 1) - 1;
        const angle = n * 2.4;
        const r = n === 0 ? 0 : 16 + n * 3;
        return { job, x: base.x + Math.cos(angle) * r, y: base.y + Math.sin(angle) * r };
      });
  }, [jobs]);

  const selected = jobs.find((j) => j.id === selectedId) || null;
  const kmToPx = W / (0.105 * 105.2); // x-axis scale: px per km at Mumbai's latitude

  return (
    <div className="mjm">
      <div className="mjm__canvas">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Map of South and Central Mumbai showing available jobs"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <clipPath id="mjm-clip">
              <rect width={W} height={H} rx="14" />
            </clipPath>
          </defs>
          <g clipPath="url(#mjm-clip)">
            <rect width={W} height={H} className="mjm__sea" />
            <path d={toPath(LAND)} className="mjm__land" />

            <path d={toLine(WESTERN_LINE)} className="mjm__rail" />
            <path d={toLine(CENTRAL_LINE)} className="mjm__rail" />

            {/* distance rings from Fort */}
            {[2, 5].map((km) => (
              <g key={km}>
                <circle cx={origin.x} cy={origin.y} r={km * kmToPx} className="mjm__ring" />
                <text x={origin.x + km * kmToPx * 0.71} y={origin.y - km * kmToPx * 0.71} className="mjm__ringlabel">
                  {km} km
                </text>
              </g>
            ))}

            <text x="20" y="660" className="mjm__water">Arabian Sea</text>
            <text x="445" y="420" className="mjm__water">Mumbai Harbour</text>
            <text x="40" y="525" className="mjm__water" opacity="0.8">Back Bay</text>

            {MUMBAI_AREAS.filter((a) => LABELLED.has(a.name)).map((a) => {
              const p = project(a, W, H);
              const nearEdge = p.x < 60; // keep labels on the page for far-west areas
              return (
                <text
                  key={a.name}
                  x={nearEdge ? p.x + 8 : p.x}
                  y={p.y + 4}
                  textAnchor={nearEdge ? 'start' : 'middle'}
                  className="mjm__area"
                >
                  {a.name}
                </text>
              );
            })}

            {/* Fort: the reference point for "nearest" sorting */}
            <g transform={`translate(${origin.x} ${origin.y})`}>
              <circle r="7" className="mjm__origin" />
              <circle r="2.5" fill="#fff" />
              <text y="22" textAnchor="middle" className="mjm__originlabel">Fort (you)</text>
            </g>

            {placed.map(({ job, x, y }) => {
              const isSel = job.id === selectedId;
              const label = compactPay(job);
              return (
                <g
                  key={job.id}
                  transform={`translate(${x} ${y})`}
                  className={`mjm__pin ${isSel ? 'is-selected' : ''} ${job.urgent ? 'is-urgent' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${job.title}, ${job._area || 'Mumbai'}, ${job.payRate}`}
                  onClick={() => onSelect(job.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(job.id);
                    }
                  }}
                >
                  <circle r={isSel ? 15 : 11} className="mjm__pinhalo" />
                  <circle r={isSel ? 9 : 7} className="mjm__pindot" />
                  {label && (
                    <g transform="translate(0 -20)">
                      <rect x={-(label.length * 3.4 + 6)} y="-10" width={label.length * 6.8 + 12} height="16" rx="8" className="mjm__paybg" />
                      <text textAnchor="middle" y="2" className="mjm__paytext">{label}</text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
        <div className="mjm__legend">
          <span><i className="mjm__dot mjm__dot--job" /> Job</span>
          <span><i className="mjm__dot mjm__dot--urgent" /> Urgent</span>
          <span><i className="mjm__dot mjm__dot--origin" /> Fort</span>
        </div>
      </div>

      <div className="mjm__selected" aria-live="polite">
        {selected ? (
          <>
            <div className="mjm__selected-top">
              <span className="badge badge--blue">{selected.category || 'General'}</span>
              {selected.urgent && <span className="badge badge--gold">Urgent</span>}
            </div>
            <h3 className="mjm__selected-title">
              <Link to={`/jobs/${selected.id}`}>{selected.title}</Link>
            </h3>
            <p className="mjm__selected-co">{selected.companyName}</p>
            <div className="mjm__selected-meta">
              <span><MapPin size={12} /> {selected.location}</span>
              {selected._distance != null && (
                <span><Navigation size={12} /> {formatDistance(selected._distance)} from Fort</span>
              )}
              {selected.duration && <span><Clock size={12} /> {selected.duration}</span>}
            </div>
            <div className="mjm__selected-foot">
              <div>
                <small>Compensation</small>
                <strong>{selected.payRate}</strong>
              </div>
              <Link to={`/jobs/${selected.id}`} className="btn btn--blue btn--sm">
                View &amp; pitch <ArrowRight size={13} />
              </Link>
            </div>
          </>
        ) : (
          <p className="mjm__hint">Tap a pin to see the job and send your pitch.</p>
        )}
      </div>
    </div>
  );
}
