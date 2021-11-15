import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import appState from '../stores';

export default function AreaSelect() {
  const map = useMap();

  useEffect(() => {
    if (!map.selectArea) return;

    map.selectArea.enable();

    map.on("areaselectstart", (e) => {
        //empty selection 
        appState.graph.frame.selection = []
      });

    map.on("areaselected", (e) => {
      console.log(e.bounds.toBBoxString()); // lon, lat, lon, lat
      L.rectangle(e.bounds, { color: "blue", weight: 1 });
      var mapselection = []
      if(appState.graph.rawGraph.nodes[0].LatY !== undefined){
        map.eachLayer((pointLayer) => { 
            if (pointLayer instanceof L.CircleMarker && e.bounds.contains(pointLayer.getLatLng())) {
                mapselection.push(pointLayer.options.data)
            }}
            )
      }
      appState.graph.selectedNodes = [...mapselection]
      appState.graph.frame.selection = [...mapselection]
      console.log(appState.graph.selectedNodes)
    });

    // You can restrict selection area like this:
    const bounds = map.getBounds().pad(-0.25); // save current map bounds as restriction area
    // check restricted area on start and move
    map.selectArea.setValidate((layerPoint) => {
      return bounds.contains(this._map.layerPointToLatLng(layerPoint));
    });

    // now switch it off
    map.selectArea.setValidate();
  }, []);

  return null;
}
