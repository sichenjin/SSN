import { useEffect } from "react";
// import { useMap } from "react-leaflet";
import L from "leaflet";

export default function LocationFilter() {
//   const map = useMap();

var locationFilter = new L.LocationFilter().addTo(map);
useEffect(() => {
    // if (!map.selectArea) return;

    locationFilter.on("enabled");

    locationFilter.on("change", function (e) {
        // Do something when the bounds change.
        // Bounds are available in `e.bounds`.
        console.log(locationFilter.getBounds())
    });

    // now switch it off
    locationFilter.on("disabled");
  }, []);

  return null;

}
