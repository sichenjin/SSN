import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import appState from '../stores';

var def = require("../graph-frontend/src/imports").default;


export default function AreaSelect() {
  const map = useMap();

  useEffect(() => {
    if (!map.selectArea) return;

    map.selectArea.enable();

    map.on("areaselectstart", (e) => {
        //empty selection 
        appState.graph.frame.selection.forEach(function(node){
          node.renderData.draw_object.children[0].material.color.set(
            node.renderData.hcolor
          )
          node.renderData.draw_object.children[0].visible = false
        })
        appState.graph.frame.selection = []
        appState.graph.selectedNodes = []



      });

    map.on("areaselected", (e) => {
      console.log(e.bounds.toBBoxString()); // lon, lat, lon, lat
      L.rectangle(e.bounds, { color: "blue", weight: 1 });
      var mapselection = []
      if(appState.graph.rawGraph.nodes[0].LatY !== undefined){
        map.eachLayer((pointLayer) => { 
            if (pointLayer instanceof L.CircleMarker && e.bounds.contains(pointLayer.getLatLng())) {
                mapselection.push(pointLayer.options.data)
                pointLayer.options.data.renderData.draw_object.children[0].material.color.setHex(def.NODE_HIGHLIGHT);
                pointLayer.options.data.renderData.draw_object.children[0].visible = true
            }}
            )
      }
      appState.graph.selectedNodes = [...mapselection]
      appState.graph.frame.selection = [...mapselection]
      // console.log(appState.graph.selectedNodes)
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
