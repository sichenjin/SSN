import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-polylinedecorator";

const ArrowDecorator = ({ positions }) => {
  const map = useMap();

  useEffect(() => {
    if (!positions || positions.length < 2) return;

    // Define the polyline decorator with an arrowhead
    const decorator = L.polylineDecorator(L.polyline(positions), {
      patterns: [
        {
          offset: "50%", // Arrow position along the line
          repeat: '500px', // One arrow per edge
          symbol: L.Symbol.arrowHead({
            pixelSize: 6, // Increase size here
            pathOptions: {
              color: "#6495ED", // Hardcoded arrow color
              weight: 1,
              opacity: 0.9,
            },
          }),
        },
      ],
    });

    decorator.addTo(map);
    return () => {
      map.removeLayer(decorator);
    };
  }, [map, positions]);

  return null;
};

export default ArrowDecorator;
