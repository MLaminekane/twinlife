import { useMemo, useState } from 'react'
import Map, { Layer, NavigationControl, ScaleControl, Source } from 'react-map-gl'
import { worldToGeo } from '../lib/world'
import { useStore } from '../state/store'
import { zonePolygons } from '../config/zones'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

const DEFAULT_CENTER = { longitude: -71.065, latitude: 48.428, zoom: 11.7 }

export function MapView() {
  const [open, setOpen] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const people = useStore(state => state.people)
  const buildings = useStore(state => state.buildings)
  const hoveredId = useStore(state => state.hoveredBuildingId)
  const setHovered = useStore(state => state.setHoveredBuilding)
  const setSelectedBuilding = useStore(state => state.setSelectedBuilding)

  if (!open) {
    return (
      <button
        className="btn"
        style={{ position: 'absolute', left: 10, bottom: 10, zIndex: 20 }}
        onClick={() => setOpen(true)}
      >
        🗺️ Ville
      </button>
    )
  }

  const peopleGeoJSON = useMemo(() => {
    const featureCollection = {
      type: 'FeatureCollection',
      features: people.map(person => {
        const building = buildings.find(candidate => candidate.id === person.currentBuildingId)
        const [lng, lat] = building
          ? [building.geoPosition[0] + ((person.id % 7) - 3) * 0.00008, building.geoPosition[1] + (((person.id * 3) % 7) - 3) * 0.00005]
          : worldToGeo(person.position)
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: {
            id: person.id,
            presence: person.presence,
          },
        }
      }),
    }

    return featureCollection as any
  }, [buildings, people])

  const zonesGeo = useMemo(() => ({
    type: 'FeatureCollection',
    features: zonePolygons.map(zone => ({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [zone.coordinates] },
      properties: { zone: zone.id, color: zone.color, name: zone.name },
    })),
  }) as any, [])

  const buildingsGeo = useMemo(() => ({
    type: 'FeatureCollection',
    features: buildings.map(building => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: building.geoPosition },
      properties: {
        id: building.id,
        zone: building.zone,
        name: building.name,
        occupancy: building.occupancy,
        capacity: building.capacity,
        load: building.capacity ? building.occupancy / building.capacity : 0,
      },
    })),
  }) as any, [buildings])

  const containerStyle: React.CSSProperties = expanded
    ? { position: 'absolute', inset: 10, borderRadius: 12, overflow: 'hidden', border: '1px solid #1f2937', zIndex: 20, boxShadow: '0 8px 28px rgba(0,0,0,0.35)' }
    : { position: 'absolute', left: 10, bottom: 10, width: 320, height: 260, borderRadius: 12, overflow: 'hidden', border: '1px solid #1f2937', zIndex: 20, boxShadow: '0 8px 28px rgba(0,0,0,0.35)' }

  return (
    <div style={containerStyle}>
      <div style={{ position: 'absolute', right: 8, top: 6, display: 'flex', gap: 8, zIndex: 21 }}>
        <button className="btn" onClick={() => setExpanded(value => !value)}>{expanded ? '↙︎' : '⤢'}</button>
        <button className="btn" onClick={() => setOpen(false)}>✖</button>
      </div>
      <Map
        mapboxAccessToken={TOKEN}
        initialViewState={DEFAULT_CENTER}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
        maxBounds={[[-71.40, 48.25], [-70.80, 48.60]]}
        interactiveLayerIds={['bldg-circles']}
        onMouseMove={(event: any) => {
          const featureId = event.features?.[0]?.properties?.id
          setHovered(featureId ?? null)
        }}
        onClick={(event: any) => {
          const featureId = event.features?.[0]?.properties?.id
          setHovered(featureId ?? null)
          setSelectedBuilding(featureId ?? null)
        }}
      >
        <NavigationControl position="top-left" />
        <ScaleControl maxWidth={120} unit="metric" />

        <Source id="zones" type="geojson" data={zonesGeo}>
          <Layer id="zones-fill" type="fill" paint={{ 'fill-color': ['get', 'color'], 'fill-opacity': 0.12 }} />
          <Layer id="zones-outline" type="line" paint={{ 'line-color': ['get', 'color'], 'line-opacity': 0.6, 'line-width': 1.2 }} />
        </Source>

        <Source id="people" type="geojson" data={peopleGeoJSON}>
          <Layer
            id="people-heat"
            type="heatmap"
            paint={{
              'heatmap-weight': ['case', ['==', ['get', 'presence'], 'walking'], 1, 0.6],
              'heatmap-intensity': 0.7,
              'heatmap-radius': 20,
              'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 14, 0.35],
            }}
          />
          <Layer
            id="people-circles"
            type="circle"
            minzoom={13}
            paint={{
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 2.5, 16, 5],
              'circle-color': ['case', ['==', ['get', 'presence'], 'walking'], '#f59e0b', '#4ade80'],
              'circle-opacity': 0.8,
              'circle-stroke-width': 0.75,
              'circle-stroke-color': '#0f172a',
            }}
          />
        </Source>

        <Source id="buildings" type="geojson" data={buildingsGeo}>
          <Layer
            id="bldg-circles"
            type="circle"
            paint={{
              'circle-radius': hoveredId ? ['case', ['==', ['get', 'id'], hoveredId], 9, 5] : 5,
              'circle-color': [
                'interpolate',
                ['linear'],
                ['coalesce', ['get', 'load'], 0],
                0, '#22c55e',
                0.65, '#f59e0b',
                1, '#ef4444',
              ],
              'circle-opacity': 0.92,
              'circle-stroke-width': hoveredId ? ['case', ['==', ['get', 'id'], hoveredId], 2.5, 1] : 1,
              'circle-stroke-color': hoveredId ? ['case', ['==', ['get', 'id'], hoveredId], '#ffffff', '#0b1220'] : '#0b1220',
            }}
          />
        </Source>
      </Map>
    </div>
  )
}
