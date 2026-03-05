
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { geocodeAddress } from "@/lib/geo";
import { Delivery } from "@shared/schema";

// Custom icons using CSS/SVG
const pickupIcon = L.divIcon({
  className: "custom-pickup-marker",
  html: `
    <div style="background-color: #3b82f6; width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const deliveryIcon = L.divIcon({
  className: "custom-delivery-marker",
  html: `
    <div style="background-color: #ef4444; width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const courierIcon = L.divIcon({
  className: "custom-courier-marker",
  html: `
    <div style="background-color: #ff8c00; width: 44px; height: 44px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4); animation: pulse 2s infinite;">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="5.5" cy="17.5" r="2.5"/>
        <circle cx="18.5" cy="17.5" r="2.5"/>
        <path d="M15 6H8a2 2 0 0 0-2 2v2"/>
        <path d="M12 6V3a1 1 0 0 1 1-1h2"/>
        <path d="M10 17V6"/>
        <path d="M14 17V6"/>
        <path d="m15 10 3 3v2h-2"/>
      </svg>
    </div>
    <style>
      @keyframes pulse {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 140, 0, 0.7); }
        70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(255, 140, 0, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 140, 0, 0); }
      }
    </style>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

interface DeliveryMapProps {
  deliveries: Delivery[];
  courierLocation?: [number, number];
  height?: string;
}

function MapBounds({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [map, bounds]);
  return null;
}

export function DeliveryMap({ deliveries = [], courierLocation, height = "400px" }: DeliveryMapProps) {
  const [coordsMap, setCoordsMap] = useState<Record<number, { pickup: [number, number] | null, delivery: [number, number] | null }>>({});

  useEffect(() => {
    if (!deliveries) return;
    deliveries.forEach(async (delivery) => {
      if (!coordsMap[delivery.id]) {
        const [pickup, deliveryCoords] = await Promise.all([
          geocodeAddress(delivery.pickupAddress),
          geocodeAddress(delivery.deliveryAddress)
        ]);
        setCoordsMap(prev => ({
          ...prev,
          [delivery.id]: { pickup, delivery: deliveryCoords }
        }));
      }
    });
  }, [deliveries]);

  const bounds = L.latLngBounds([]);
  if (courierLocation && !isNaN(courierLocation[0]) && !isNaN(courierLocation[1])) {
    bounds.extend(courierLocation);
  }
  
  Object.values(coordsMap).forEach(coords => {
    if (coords.pickup) bounds.extend(coords.pickup);
    if (coords.delivery) bounds.extend(coords.delivery);
  });

  const center: [number, number] = (courierLocation && !isNaN(courierLocation[0]) && !isNaN(courierLocation[1])) 
    ? courierLocation 
    : [-23.5505, -46.6333];

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-border" style={{ height }}>
      <MapContainer center={center} zoom={13} style={{ width: "100%", height: "100%", zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {courierLocation && !isNaN(courierLocation[0]) && !isNaN(courierLocation[1]) && (
          <Marker position={courierLocation} icon={courierIcon}>
            <Popup>
              <div className="font-bold">Sua Localização</div>
              <div className="text-xs">Você está aqui</div>
            </Popup>
          </Marker>
        )}
        
        {deliveries?.map(delivery => {
          const coords = coordsMap[delivery.id];
          if (!coords) return null;

          return (
            <React.Fragment key={delivery.id}>
              {coords.pickup && (
                <Marker position={coords.pickup} icon={pickupIcon}>
                  <Popup>
                    <div className="font-bold text-blue-600">Coleta - Pedido #{delivery.orderNumber}</div>
                    <div className="text-xs">{delivery.pickupAddress}</div>
                    <div className="mt-1 font-semibold">Cliente: {delivery.customerName}</div>
                  </Popup>
                </Marker>
              )}
              {coords.delivery && (
                <Marker position={coords.delivery} icon={deliveryIcon}>
                  <Popup>
                    <div className="font-bold text-red-600">Entrega - Pedido #{delivery.orderNumber}</div>
                    <div className="text-xs">{delivery.deliveryAddress}</div>
                    <div className="mt-1 font-semibold">Cliente: {delivery.customerName}</div>
                  </Popup>
                </Marker>
              )}
            </React.Fragment>
          );
        })}

        {bounds.isValid() && <MapBounds bounds={bounds} />}
      </MapContainer>
    </div>
  );
}
