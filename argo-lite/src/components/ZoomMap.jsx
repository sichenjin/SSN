import { useEffect, useMemo } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { latLngBounds } from 'leaflet'
import appState from '../stores';
import { observer } from "mobx-react";

// @observer
export function ZoomMap() {
  const map = useMap();

  const bounds = useMemo(() => {
    if (appState.graph.firstload) {
      // if (appState.graph.frame.getNodeList() >0){
      const nodeLoc = appState.graph.frame.getNodeList().map(function (node) {
        return [parseFloat(node.data.ref.LatY), parseFloat(node.data.ref.LonX)]
      })
      const b = latLngBounds() // seemed to work without having to pass init arg
      nodeLoc.forEach(coords => {
        b.extend(coords)
      })
      if (Object.keys(b).length > 0) {
        map.fitBounds(b)
      }

      // }
      appState.graph.firstload = false
      return null;
    }   //first load
    if (!appState.graph.autoZoom) return;
    if (appState.graph.frame.selection.length == 0) {
      // if (appState.graph.frame.getNodeList() >0){
      const nodeLoc = appState.graph.frame.getNodeList().map(function (node) {
        return [parseFloat(node.data.ref.LatY), parseFloat(node.data.ref.LonX)]
      })
      const b = latLngBounds() // seemed to work without having to pass init arg
      nodeLoc.forEach(coords => {
        b.extend(coords)
      })
      if (Object.keys(b).length > 0) {
        map.fitBounds(b)
      }

      // }
      return null;
    }   //no selection 
    if (appState.graph.frame.selection.length == 1) { // only one node is selected 
      const nodeLoc = appState.graph.frame.selection.map(function (node) {
        return [parseFloat(node.data.ref.LatY), parseFloat(node.data.ref.LonX)]
      })
      const b = latLngBounds() // seemed to work without having to pass init arg
      nodeLoc.forEach(coords => {
        b.extend(coords)
      })
      if (Object.keys(b).length > 0) {
        map.fitBounds(b)
      }
      return;
    }

    const nodeLoc = appState.graph.frame.selection.map(function (node) {
      return [parseFloat(node.data.ref.LatY), parseFloat(node.data.ref.LonX)]
    })
    // console.log(nodeLoc)
    const b = latLngBounds() // seemed to work without having to pass init arg
    nodeLoc.forEach(coords => {
      b.extend(coords)
    })
    if (Object.keys(b).length > 0) {
      map.fitBounds(b)
    }
  }, [appState.graph.frame.selection])

  return null;
}


export function MapClick() {

  const map = useMapEvents({
    click(e) {
      if (appState.useToolbartoSelect) {
        appState.useToolbartoSelect = false
      } else {
        appState.graph.frame.selection = []
        appState.graph.selectedNodes = []
        appState.graph.edgeselection = []
        appState.graph.mapClicked = null
        appState.graph.areaSelected = undefined;
        // appState.graph.networkClicked = null
        appState.graph.watchAppearance = appState.graph.watchAppearance + 1
        appState.graph.frame.updateSelectionOpacity()

      }


    }
  })
  return null;
}

export function DetectKeyPress() {
  document.addEventListener('keydown', (event) => {
    appState.graph.keydown = true
  }, false);
  document.addEventListener('keyup', (event) => {
    appState.graph.keydown = false
  }, false);
  return null;
}


