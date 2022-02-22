import { useEffect, useMemo  } from "react";
import { useMap,useMapEvents } from "react-leaflet";
import L from "leaflet";
import {latLngBounds} from 'leaflet'
import appState from '../stores';

export function ZoomMap() {
    const map = useMap();

    const bounds = useMemo(() => {
        if (appState.graph.frame.selection.length ==0) return;  //no selection 
        if (appState.graph.frame.selection.length ==1) return;  // only one node is selected 

        const nodeLoc = appState.graph.frame.selection.map(function(node){
            return [parseFloat(node.data.ref.LatY) , parseFloat(node.data.ref.LonX)]
        })
        // console.log(nodeLoc)
        const b = latLngBounds() // seemed to work without having to pass init arg
        nodeLoc.forEach(coords => {
            b.extend(coords)
        })
        map.flyToBounds(b)
    }, [appState.graph.frame.selection])

    return null;
}


export function MapClick() {
    
    const map = useMapEvents({
      click(e) {
        //   console.log(e)
        // appState.graph.mapClicked = null
      }
    })
    return null;
  }


  