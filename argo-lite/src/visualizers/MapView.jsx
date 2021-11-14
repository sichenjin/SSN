import React from 'react';
// import L from 'leaflet';
import { MapContainer, CircleMarker, TileLayer, Tooltip, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import appState from '../stores';
import { observer } from 'mobx-react';
import "leaflet-area-select";
import AreaSelect from "../components/AreaSelect"
// import LocationFilter from "../components/LocationFilter"

@observer
class MapView extends React.Component {
  componentDidMount() {

  }

  // frameNode = []
  // {
    
  //   if (appState.graph.rawGraph.nodes[0].LatY !== undefined) {
  //     frameNode = appState.graph.frame.getNodeIdList()
  //   }
     
  
  // }

  onMouseOut = (e) => {
    console.log('onMouseOut', e)
  }

  setCircleColor = (node) => {
    // console.log(circle)
    if (appState.graph.currentlyHovered && node.id === appState.graph.currentlyHovered.id) {
      return 'red'
    } else {
      return 'blue'
    }
  }

  setPathOption = (node) => {
    if (appState.graph.selectedNodes.length > 0) {
      if (appState.graph.selectedNodes.indexOf(node) == -1) {
        return { fillColor: 'blue', fillOpacity: 0.5, stroke: false }
      } else {

        return { fillColor: 'red', fillOpacity: 1, stroke: false }
      }
    }
    if (appState.graph.currentlyHovered && node.id === appState.graph.currentlyHovered.id) {
      return { fillColor: 'red', fillOpacity: 1, stroke: false }
    } else {
      return { fillColor: 'blue', fillOpacity: 0.5, stroke: false }
    }


  }



  render() {




    return <div id="map"
      style={{
        width: "50vw",
        height: "100vh",
        flex: "1",
        zIndex: "10"
        // position: "absolute"
      }}
    >
      <MapContainer
        // style={{ height: "480px", width: "100%" }}
        zoom={4}
        center={[37, -100]}
      >
        <TileLayer url="http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <AreaSelect />


        

        {appState.graph.rawGraph.nodes[0].LatY !== undefined && appState.graph.rawGraph.nodes[0].LonX !== undefined &&
          appState.graph.frame.getNodeList().map((node, i) => {
            return (
              <CircleMarker
                key={node.id}
                center={[node.data.ref.LatY, node.data.ref.LonX]}
                radius={5000 * node.data.ref.pagerank}
                pathOptions={this.setPathOption(node)}

                // fillColor={this.setCircleColor(node)}
                // fillOpacity={0.5}
                // stroke={false}
                data={node}
                eventHandlers={{
                  mouseover: (e) => {
                    appState.graph.currentlyHovered = e.target.options.data
                    appState.graph.frame.lastHover = e.target.options.data
                    appState.graph.frame.highlightNode(e.target.options.data, true)
                    // e.target.setStyle({fillOpacity: 1, fillColor:'red'})
                    // console.log(e.target.options.data)
                  },
                  mouseout: (e) => {
                    // appState.graph.currentlyHovered = null
                    // appState.graph.frame.highlightNode(e.target.options.data,false)
                    e.target.setStyle({ fillOpacity: 0.5, fillColor: 'blue' })

                    // console.log('marker out', e)
                  }
                }}
              // onMouseOver = {this.onMouseOver}
              // {(e) => {
              //   // appState.graph.currentlyHovered = 
              //   e.target.setStyle({fillOpacity: 1, stroke: true, color:'black', weight:3})
              // }}
              // onMouseOut={this.onMouseOut}
              // {(e) => e.target.setStyle({fillOpacity: 0.5,stroke: false })}
              >

              </CircleMarker>
            );
          })


        }


        {appState.graph.rawGraph.edges[0].fromlocLatY !== undefined && appState.graph.rawGraph.edges[0].fromlocLatY !== 360 &&
        
          appState.graph.frame.getEdgeList().map((edge, i) => {
            // if (this.frameNode.indexOf(edge.source_id) !== -1 && this.frameNode.indexOf(edge.target_id) !== -1) {
              var edgepositions = [[edge.data.fromlocLatY, edge.data.fromlocLonX], [edge.data.tolocLatY, edge.data.tolocLonX]]
              return (
                <Polyline key={i} pathOptions={{ color: 'black', weight: '1', opacity: '0.5' }} positions={edgepositions} />

              );
            

          })
        }




      </MapContainer>
    </div>
  }
}

export default MapView;