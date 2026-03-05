## Packages
leaflet | Core mapping library for displaying openstreetmap
react-leaflet | React bindings for Leaflet
@types/leaflet | TypeScript definitions for Leaflet

## Notes
- Uses Nominatim (OpenStreetMap) for geocoding addresses to lat/lng coordinates (no API key needed, but respect rate limits).
- Uses react-leaflet for rendering the interactive map for the courier and delivery preview.
- Haversine formula implemented locally in utils for distance calculation.
- The app uses three distinct roles (Admin, Merchant, Courier) accessible via top navigation without strict auth per MVP requirements.
