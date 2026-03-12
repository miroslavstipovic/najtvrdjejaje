'use client'

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icon
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = defaultIcon

interface LocationPickerProps {
  initialLat: number
  initialLng: number
  onSelect: (lat: number, lng: number) => void
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function LocationPicker({ initialLat, initialLng, onSelect }: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng])

  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition([lat, lng])
    onSelect(lat, lng)
  }

  return (
    <div className="relative">
      <div className="absolute top-3 left-3 z-[1000] bg-white px-4 py-2 rounded-lg shadow-md text-sm font-medium text-gray-700">
        🖱️ Kliknite na mapu za odabir lokacije
      </div>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '400px', width: '100%' }}
        className="rounded-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onLocationSelect={handleLocationSelect} />
        <Marker position={position} />
      </MapContainer>
      <div className="mt-3 text-center text-sm text-gray-600">
        Odabrana pozicija: <span className="font-medium">{position[0].toFixed(6)}, {position[1].toFixed(6)}</span>
      </div>
    </div>
  )
}

