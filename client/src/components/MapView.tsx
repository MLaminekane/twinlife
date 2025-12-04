import { useMemo, useState } from 'react'
import Map, { NavigationControl, ScaleControl, Source, Layer } from 'react-map-gl'
import { useStore } from '../state/store'
import { zonePolygons, ZoneKey } from '../config/zones'
import { pointInPoly, centroid, deterministicRand } from '../lib/mapUtils'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZ3VudGhlcmRhcmsiLCJhIjoiY21oZTNxeTU0MGFqMDJscHVqbGw1cXlhMyJ9.KRym-Qviipx04U9AQnkODg'

// Saguenay focus and simple local projection from scene units -> WGS84
const CITY = { lon: -71.065, lat: 48.428 }
const DEG_LAT_PER_M = 1 / 111320 // ~meters per deg latitude
const DEG_LON_PER_M = 1 / (111320 * Math.cos((CITY.lat * Math.PI) / 180))
const METERS_PER_UNIT = 50 // scene unit to meters scale

function unitToLngLat(x: number, z: number): [number, number] {
  const dLon = x * METERS_PER_UNIT * DEG_LON_PER_M
  const dLat = -z * METERS_PER_UNIT * DEG_LAT_PER_M
  return [CITY.lon + dLon, CITY.lat + dLat]
}

export function MapView() {
  const [open, setOpen] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const people = useStore(s => s.people)
  const buildings = useStore(s => s.buildings)
  const hoveredId = useStore(s => s.hoveredBuildingId)
  const setHovered = useStore(s => s.setHoveredBuilding)

  if (!open) {
    return (
      <button
        className="btn"
        style={{ position: 'absolute', left: 10, bottom: 10, zIndex: 20 }}
        onClick={() => setOpen(true)}
      >🗺️ Ville</button>
    )
  }

  // Build GeoJSON from people each render; cheap for ~200 points
  const peopleGeoJSON = useMemo(() => {
    const features = people.map(p => {
      const [lng, lat] = unitToLngLat(p.position[0], p.position[2])
      return { type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: { id: p.id } }
    })
    return { type: 'FeatureCollection', features } as any
  }, [people])

  // Layers: heatmap for low zoom, circles for high zoom
  const heatmapLayer = {
    id: 'people-heat',
    type: 'heatmap',
    source: 'people',
    maxzoom: 16,
    paint: {
      'heatmap-weight': 0.7,
      'heatmap-intensity': 0.6,
      'heatmap-radius': 18,
      'heatmap-opacity': ["interpolate", ["linear"], ["zoom"], 10, 0.75, 14, 0.35]
    }
  }
  const circleLayer = {
    id: 'people-circles',
    type: 'circle',
    source: 'people',
    minzoom: 13,
    paint: {
      'circle-radius': ["interpolate", ["linear"], ["zoom"], 13, 2, 16, 4.5],
      'circle-color': '#4ade80',
      'circle-opacity': 0.75,
      'circle-stroke-width': 0.75,
      'circle-stroke-color': '#0f172a'
    }
  }

  const zonesGeo = useMemo(() => {
    const features = zonePolygons.map(z => ({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [z.coordinates] },
      properties: { zone: z.id, color: z.color, name: z.name }
    }))
    return { type: 'FeatureCollection', features } as any
  }, [])

  const buildingsGeo = useMemo(() => {
    const feats = buildings.map(b => {
      // Déterminer la zone selon l'ID du bâtiment
      let zone: ZoneKey = 'campus' // Par défaut
      
      // Campus (NW) : sci, eng, med, bus, art, law, lib, gym, cafe
      if (b.id.match(/^(sci|eng|med|bus|art|law|lib|gym|cafe)$/)) {
        zone = 'campus'
      }
      // Downtown (NE) : tech, corp, startup, bank, city, office, hospital, police
      else if (b.id.includes('tech') || b.id.includes('corp') || b.id.includes('startup') || 
               b.id.includes('bank') || b.id.includes('city') || b.id.includes('office') ||
               b.id.includes('hospital') || b.id.includes('police')) {
        zone = 'downtown'
      }
      // Residential (SW) : res-*, park, school
      else if (b.id.includes('res-') || b.id.includes('park') || b.id.includes('school')) {
        zone = 'residential'
      }
      // Commercial (SE) : mall, restaurant, cinema, supermarket, hotel, spa, market
      else if (b.id.includes('mall') || b.id.includes('restaurant') || b.id.includes('cinema') ||
               b.id.includes('supermarket') || b.id.includes('hotel') || b.id.includes('spa') ||
               b.id.includes('market')) {
        zone = 'commercial'
      }
      
      const zp = zonePolygons.find(z => z.id === zone)!
      const [lng0, lat0] = unitToLngLat(b.position[0], b.position[2])
      if (pointInPoly([lng0, lat0], zp.coordinates)) {
        return { type: 'Feature', geometry: { type: 'Point', coordinates: [lng0, lat0] }, properties: { id: b.id, zone, name: b.name } }
      }
      // Otherwise sample within polygon bbox deterministically
      const xs = zp.coordinates.map(c => c[0])
      const ys = zp.coordinates.map(c => c[1])
      const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
      const seed = deterministicRand(b.id)
      let lng = minX + (maxX - minX) * ((seed * 9301 + 49297) % 1)
      let lat = minY + (maxY - minY) * ((seed * 23333 + 12345) % 1)
      // Try a few jitters to get inside
      for (let t = 0; t < 8 && !pointInPoly([lng, lat], zp.coordinates); t++) {
        lng = minX + (maxX - minX) * ((seed * (t + 2) * 1103515245 + 12345) % 1)
        lat = minY + (maxY - minY) * ((seed * (t + 3) * 134775813 + 1) % 1)
      }
      if (!pointInPoly([lng, lat], zp.coordinates)) {
        const [cx, cy] = centroid(zp.coordinates)
        lng = cx; lat = cy
      }
      return { type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: { id: b.id, zone, name: b.name } }
    })
    return { type: 'FeatureCollection', features: feats } as any
  }, [buildings])

  // (old rectangle clamp removed)

  const containerStyle: React.CSSProperties = expanded
    ? { position: 'absolute', inset: 10, borderRadius: 12, overflow: 'hidden', border: '1px solid #1f2937', zIndex: 20, boxShadow: '0 8px 28px rgba(0,0,0,0.35)' }
    : { position: 'absolute', left: 10, bottom: 10, width: 460, height: 320, borderRadius: 12, overflow: 'hidden', border: '1px solid #1f2937', zIndex: 20, boxShadow: '0 8px 28px rgba(0,0,0,0.35)' }

  return (
    <div style={containerStyle}>
      <div style={{ position: 'absolute', right: 8, top: 6, display: 'flex', gap: 8, zIndex: 21 }}>
        <button className="btn" onClick={() => setExpanded(e => !e)}>{expanded ? '↙︎' : '⤢'}</button>
        <button className="btn" onClick={() => setOpen(false)}>✖</button>
      </div>
      <Map
        mapboxAccessToken={TOKEN}
        initialViewState={{ longitude: CITY.lon, latitude: CITY.lat, zoom: expanded ? 12.2 : 11.2 }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
        maxBounds={[[-71.40, 48.25], [-70.80, 48.60]]}
        interactiveLayerIds={['bldg-circles']}
        onMouseMove={(e: any) => {
          const fid = e.features && e.features[0] && e.features[0].properties?.id
          setHovered(fid ?? null)
        }}
        onClick={(e: any) => {
          const fid = e.features && e.features[0] && e.features[0].properties?.id
          setHovered(fid ?? null)
        }}
      >
        <NavigationControl position="top-left" />
        <ScaleControl maxWidth={120} unit="metric" />
        {/* Zones fill */}
        <Source id="zones" type="geojson" data={zonesGeo}>
          <Layer id="zones-fill" type="fill" paint={{
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.12
          }} />
          <Layer id="zones-outline" type="line" paint={{
            'line-color': ['get', 'color'],
            'line-opacity': 0.6,
            'line-width': 1.2
          }} />
        </Source>
        <Source id="people" type="geojson" data={peopleGeoJSON}>
          <Layer
            id="people-heat"
            type="heatmap"
            source="people"
            maxzoom={16}
            paint={{
              'heatmap-weight': 0.7,
              'heatmap-intensity': 0.6,
              'heatmap-radius': 18,
              'heatmap-opacity': ["interpolate", ["linear"], ["zoom"], 10, 0.75, 14, 0.35]
            }}
          />
          <Layer
            id="people-circles"
            type="circle"
            source="people"
            minzoom={13}
            paint={{
              'circle-radius': ["interpolate", ["linear"], ["zoom"], 13, 2, 16, 4.5],
              'circle-color': '#4ade80',
              'circle-opacity': 0.75,
              'circle-stroke-width': 0.75,
              'circle-stroke-color': '#0f172a'
            }}
          />
        </Source>
        {/* Buildings grouped by zone */}
        <Source id="buildings" type="geojson" data={buildingsGeo}>
          <Layer id="bldg-circles" type="circle" paint={{
            'circle-radius': hoveredId ? ['case', ['==', ['get', 'id'], hoveredId], 8, 4] : 4,
            'circle-color': [
              'match', ['get', 'zone'],
              'campus', '#16a34a',
              'downtown', '#2563eb',
              'residential', '#b45309',
              'commercial', '#a21caf',
              '#94a3b8'
            ],
            'circle-opacity': hoveredId ? ['case', ['==', ['get', 'id'], hoveredId], 1, 0.9] : 0.9,
            'circle-stroke-width': hoveredId ? ['case', ['==', ['get', 'id'], hoveredId], 2, 1] : 1,
            'circle-stroke-color': hoveredId ? ['case', ['==', ['get', 'id'], hoveredId], '#ffffff', '#0b1220'] : '#0b1220'
          }} />
        </Source>
      </Map>
    </div>
  )
}
