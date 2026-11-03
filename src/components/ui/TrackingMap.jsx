import { useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

const TILE_SIZE = 256;
const DEFAULT_CENTER = { lat: 19.076, lng: 72.8777 };

function project(lat, lng, zoom) {
  const worldSize = TILE_SIZE * 2 ** zoom;
  const safeLat = Math.max(-85.0511, Math.min(85.0511, lat));
  const sin = Math.sin((safeLat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * worldSize,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * worldSize,
  };
}

function fitZoom(points, width, height) {
  if (points.length < 2) return 15;
  const projected = points.map((point) => project(point.lat, point.lng, 0));
  const spanX = Math.max(...projected.map((p) => p.x)) - Math.min(...projected.map((p) => p.x));
  const spanY = Math.max(...projected.map((p) => p.y)) - Math.min(...projected.map((p) => p.y));
  const availableWidth = Math.max(100, width - 120);
  const availableHeight = Math.max(100, height - 120);
  const zoomX = spanX > 0 ? Math.log2(availableWidth / spanX) : 15;
  const zoomY = spanY > 0 ? Math.log2(availableHeight / spanY) : 15;
  return Math.max(4, Math.min(17, Math.floor(Math.min(zoomX, zoomY))));
}

export default function TrackingMap({ workerGps, employerGps }) {
  const viewportRef = useRef(null);
  const [size, setSize] = useState({ width: 640, height: 380 });
  const [zoom, setZoom] = useState(15);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [loadedPoints, setLoadedPoints] = useState({ worker: false, employer: false });

  const points = useMemo(() => [
    ...(workerGps ? [{ ...workerGps, type: 'worker', label: 'Worker' }] : []),
    ...(employerGps ? [{ ...employerGps, type: 'employer', label: 'Job Location' }] : []),
  ], [workerGps, employerGps]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Fit once when each participant's first location arrives. Subsequent GPS
  // updates move the marker while preserving the user's selected zoom level.
  useEffect(() => {
    const nextLoaded = { worker: Boolean(workerGps), employer: Boolean(employerGps) };
    const newlyLoaded = (nextLoaded.worker && !loadedPoints.worker) || (nextLoaded.employer && !loadedPoints.employer);
    if (!newlyLoaded) return;
    setLoadedPoints(nextLoaded);
    if (points.length) {
      const nextCenter = points.length === 1
        ? { lat: points[0].lat, lng: points[0].lng }
        : {
            lat: (points[0].lat + points[1].lat) / 2,
            lng: (points[0].lng + points[1].lng) / 2,
          };
      setCenter(nextCenter);
      setZoom(fitZoom(points, size.width, size.height));
    }
  }, [workerGps, employerGps, points, size.width, size.height, loadedPoints]);

  const centerPx = project(center.lat, center.lng, zoom);
  const left = centerPx.x - size.width / 2;
  const top = centerPx.y - size.height / 2;
  const tileCount = 2 ** zoom;
  const tiles = [];
  for (let y = Math.floor(top / TILE_SIZE); y <= Math.floor((top + size.height) / TILE_SIZE); y += 1) {
    if (y < 0 || y >= tileCount) continue;
    for (let x = Math.floor(left / TILE_SIZE); x <= Math.floor((left + size.width) / TILE_SIZE); x += 1) {
      const wrappedX = ((x % tileCount) + tileCount) % tileCount;
      tiles.push({
        key: `${zoom}:${x}:${y}`,
        src: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`,
        left: x * TILE_SIZE - left,
        top: y * TILE_SIZE - top,
      });
    }
  }

  const markerPositions = points.map((point) => {
    const pixel = project(point.lat, point.lng, zoom);
    return { ...point, x: pixel.x - left, y: pixel.y - top };
  });

  return (
    <div
      ref={viewportRef}
      className="tracking-map-canvas"
      aria-label="Live GPS map"
      onWheel={(event) => {
        event.preventDefault();
        setZoom((value) => Math.max(3, Math.min(19, value + (event.deltaY < 0 ? 1 : -1))));
      }}
    >
      <div className="tracking-map-tiles" aria-hidden="true">
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.src}
            alt=""
            draggable="false"
            style={{ left: tile.left, top: tile.top }}
          />
        ))}
      </div>

      {workerGps && employerGps && (() => {
        const worker = markerPositions.find((point) => point.type === 'worker');
        const employer = markerPositions.find((point) => point.type === 'employer');
        return (
          <svg className="tracking-map-route" aria-hidden="true">
            <line x1={worker.x} y1={worker.y} x2={employer.x} y2={employer.y} stroke="rgba(15,23,42,.55)" strokeWidth="7" strokeLinecap="round" />
            <line x1={worker.x} y1={worker.y} x2={employer.x} y2={employer.y} stroke="#2563eb" strokeWidth="3" strokeDasharray="9 6" strokeLinecap="round" />
          </svg>
        );
      })()}

      <div className="tracking-map-markers">
        {markerPositions.map((point) => (
          <div
            key={point.type}
            className={`tracking-map-marker tracking-map-marker--${point.type}`}
            style={{ left: point.x, top: point.y }}
            title={`${point.label}: ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`}
          >
            <span className="tracking-map-marker__pin" />
            <span className="tracking-map-marker__label">{point.label}</span>
          </div>
        ))}
      </div>

      {!points.length && <div className="tracking-map-waiting">Waiting for GPS signal…</div>}
      {points.length === 1 && (
        <div className="tracking-map-single-status">
          {workerGps ? 'Employer location will appear when they open tracking' : 'Worker location will appear when they open tracking'}
        </div>
      )}

      <div className="tracking-map-zoom" aria-label="Map zoom controls">
        <button type="button" onClick={() => setZoom((value) => Math.min(19, value + 1))} aria-label="Zoom in">
          <Plus size={18} />
        </button>
        <button type="button" onClick={() => setZoom((value) => Math.max(3, value - 1))} aria-label="Zoom out">
          <Minus size={18} />
        </button>
      </div>

      <a
        className="tracking-map-attribution"
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
      >
        © OpenStreetMap contributors
      </a>
    </div>
  );
}
