import { useEffect, useMemo  } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import {latLngBounds} from 'leaflet'
import appState from '../stores';

export default function ZoomMap() {
    const map = useMap();

    const bounds = useMemo(() => {
        if (appState.graph.frame.selection.length ==0) return;

        const nodeLoc = appState.graph.frame.selection.map(function(node){
            return [parseFloat(node.data.ref.LatY) , parseFloat(node.data.ref.LonX)]
        })
        console.log(nodeLoc)
        const b = latLngBounds() // seemed to work without having to pass init arg
        nodeLoc.forEach(coords => {
            b.extend(coords)
        })
        map.flyToBounds(b)
    }, [appState.graph.frame.selection])

    return null;
}