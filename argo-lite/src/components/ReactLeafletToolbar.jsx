import React from "react";
import appState, { AppState } from "../stores/index";

import { useMap } from "react-leaflet";

import { FeatureGroup, Circle } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw"


class ReactLeafletToolbar extends React.Component {
    
    onCreate(e) {
        this.clearMap()
        const selectionNode = appState.graph.frame.getNodeList().filter(node =>( 
            e.layer._bounds.contains(L.latLng(node.data.ref.LatY, node.data.ref.LonX)))
        )
        appState.graph.selectedNodes = selectionNode
        appState.graph.frame.selection = selectionNode
        appState.graph.frame.updateSelectionOpacity()
        appState.useToolbartoSelect = true
    }
    clearMap() {
        const map = useMap();
        map.eachLayer(function (layer) {
          map.removeLayer(layer);
        });
      }
    render() {
        return (
            <FeatureGroup>
            <EditControl
            position='bottomleft'
            onEdited={this._onEditPath}
            onCreated={this.onCreate}
            onDeleted={this._onDeleted}
            draw={{
                marker: false,
                polygon: false,
                circlemarker: false,
                circle: false,
                polyline: false
            }}
            edit={{
                edit: false
            }}
            />
            <Circle center={[51.51, -0.06]} radius={200} />
            </FeatureGroup>
        )
    }
}

export default ReactLeafletToolbar;