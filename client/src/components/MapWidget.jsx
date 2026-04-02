import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet's default icon path issues with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapWidget = ({ nodes = [] }) => {
  // Center roughly on USA or adjust dynamically
  const center = [39.8283, -98.5795]; 

  const getNodeColorHTML = (type) => {
    switch (type) {
      case 'FACTORY': return '<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>';
      case 'REGIONAL_WAREHOUSE': return '<div style="background-color: #a855f7; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>';
      case 'LOCAL_RETAILER': return '<div style="background-color: #10b981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>';
      default: return '<div style="background-color: #gray; width: 12px; height: 12px; border-radius: 50%;"></div>';
    }
  };

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden glass border-0 shadow-inner relative z-0">
      <MapContainer 
        center={center} 
        zoom={4} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {nodes.map((node) => (
          <Marker 
            key={node._id} 
            position={[node.location.coordinates[1], node.location.coordinates[0]]} // GeoJSON is [lng, lat]
            icon={L.divIcon({
              html: getNodeColorHTML(node.type),
              className: 'custom-div-icon',
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })}
          >
            <Popup className="rounded-xl">
              <div className="font-sans">
                <h4 className="font-bold text-gray-800">{node.name}</h4>
                <p className="text-xs text-gray-500 font-semibold mb-2">{node.type}</p>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-600">Inventory:</span>
                  <span className="font-bold text-blue-600">{node.inventory.current} / {node.inventory.capacity}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapWidget;
