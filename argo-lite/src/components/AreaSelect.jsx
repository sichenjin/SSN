import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import appState from '../stores';

var def = require("../graph-frontend/src/imports").default;

function uniqueArrayByAttribute(arr, attribute) {
  const uniqueMap = new Map();
  const result = [];

  arr.forEach((item) => {
    if (!uniqueMap.has(item[attribute])) {
      uniqueMap.set(item[attribute], true);
      result.push(item);
    }
  });

  return result;
}

export default function AreaSelect() {
  const map = useMap();

  useEffect(() => {
    if (!map.selectArea) return;

    map.selectArea.enable();

    map.on("areaselectstart", (e) => {
        //empty selection 
        // appState.graph.frame.selection.forEach(function(node){
        //   node.renderData.draw_object.children[0].material.color.set(
        //     node.renderData.hcolor
        //   )
        //   node.renderData.draw_object.children[0].visible = false
        // })
        // appState.graph.frame.selection = []
        // appState.graph.selectedNodes = []
        // appState.graph.edgeselection = []
        appState.graph.areaSelected = undefined;


      });

    map.on("areaselected", (e) => {
      console.log(e.bounds.toBBoxString()); // lon, lat, lon, lat
      L.rectangle(e.bounds, { color: "blue", weight: 1 });
      // const mapselection = []
      // if(appState.graph.rawGraph.nodes[0].LatY !== undefined){
      //   map.eachLayer((pointLayer) => { 
      //       if (pointLayer instanceof L.CircleMarker && e.bounds.contains(pointLayer.getLatLng())) {
      //           mapselection.push(pointLayer.options.data)
      //           pointLayer.options.data.renderData.draw_object.children[0].material.color.setHex(def.NODE_HIGHLIGHT);
      //           pointLayer.options.data.renderData.draw_object.children[0].visible = true
      //           appState.graph.frame.colorNodeOpacity(pointLayer.options.data,1)
      //       }
      //       // else if(pointLayer instanceof L.CircleMarker){
      //       //   pointLayer.options.data.renderData.draw_object.children[0].material.color.setHex(pointLayer.options.data.renderData.hcolor);
      //       //   pointLayer.options.data.renderData.draw_object.children[0].visible = false
      //       //   appState.graph.frame.colorNodeOpacity(pointLayer.options.data,0.5)
      //       // }
      //     }
      //       )
      // }

      // const northeast = e.bounds.getNorthEast()
      // const southwest = e.bounds.getSouthWest()


      const selectionNode = appState.graph.frame.getNodeList().filter(node =>( 
        e.bounds.contains(L.latLng(node.data.ref.LatY, node.data.ref.LonX)))
      )
      
      // //highlight selected nodes 
      // if (appState.graph.selectedNodes.length > 0) {
      //   if (appState.graph.selectedNodes.indexOf(node) == -1) {
      //     return { fillColor: node.renderData.color , fillOpacity: 0.3, stroke: node.renderData.draw_object.children[0].material.color, zIndex:'auto' }
      //   } else {
  
      //     return { fillColor: node.renderData.color , fillOpacity: 0.9, stroke: def.NODE_HIGHLIGHT, zIndex:'10000' }
      //   }
      // }
      // appState.graph.selectedNodes = []
      if (selectionNode.length === 0) return 
      appState.graph.selectedNodes.push(...selectionNode)
      appState.graph.highlightCommonNodes = false
      appState.graph.selectedSets.push(selectionNode)
      appState.graph.frame.selection.push(...selectionNode)
      appState.graph.selectedNodes = uniqueArrayByAttribute(appState.graph.selectedNodes, 'id');
      appState.graph.frame.selection = uniqueArrayByAttribute(appState.graph.frame.selection, 'id');
      if(appState.graph.pickUpAlter){
        appState.graph.frame.updateSelectionOutOpacity();
      }else if(appState.graph.highlightCommonNodes){
        self.updateSelectionCommonOpacity();
       }else{
        appState.graph.frame.updateSelectionOpacity();
      }
      
      appState.graph.watchAppearance = appState.graph.watchAppearance + 1
      //clear previsou selection
      // appState.graph.selectedNodes = selectionNode
      // appState.graph.frame.selection = selectionNode
      // appState.graph.frame.updateSelectionOutOpacity();

      appState.graph.areaSelected = true;
      
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
