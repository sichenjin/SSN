import React from 'react';
// import L from 'leaflet';
import { MapContainer, CircleMarker, TileLayer,Tooltip,Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import appState from '../stores';
import { observer } from 'mobx-react';

@observer
class MapView extends React.Component {
  componentDidMount() {
  //   // create map
  //   this.map = L.map('map', {
  //     center: [37, 95],
  //     zoom: 3,
  //     layers: [
  //       L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  //         attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  //       }),
  //     ]
  //   });
  
  }

  onMouseOut = (e) => {
    console.log('onMouseOut', e)
  }

  onMouseOver = (e) => {
    console.log('onMouseOver', e)
  }

  render() {

    
    // console.log(appState.graph.rawGraph.nodes)
    //Family: (...)
    // ID: (...)
    // Label: (...)
    // LatY: (...)
    // LonX: (...)
    // NY: (...)
    // degree: (...)
    // id: (...)
    // isHidden: (...)
    // node_id: (...)
    // pagerank: (...)

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
          // bounds={[
          //   [data.minLat - bufferLat, data.minLong - bufferLong],
          //   [data.maxLat + bufferLat, data.maxLong + bufferLong]
          // ]}
        >
          <TileLayer url="http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />


          {appState.graph.rawGraph.nodes[0].LatY !== undefined && appState.graph.rawGraph.nodes[0].LonX!== undefined  && 
          appState.graph.rawGraph.nodes.map((node, i) => {
            return (
              <CircleMarker
                key={i}
                center={[node.LatY, node.LonX]}
                radius={5000 * node.pagerank}
                fillColor={'blue'}
                fillOpacity={0.5}
                stroke={false}
                data ={node} 
                eventHandlers={{
                  mouseover: (e) => {
                    // appState.graph.currentlyHovered = e.target.options.data
                    e.target.setStyle({fillOpacity: 1, fillColor:'red'})
                    console.log(e.target.options.data)
                  },
                  mouseout: (e) => {
                    // appState.graph.currentlyHovered = 
                    e.target.setStyle({fillOpacity: 0.5,fillColor:'blue' })
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

          appState.graph.rawGraph.edges.map((edge, i) => {
            var edgepositions = [[edge.fromlocLatY,edge.fromlocLonX], [edge.tolocLatY,edge.tolocLonX]]
            return (
              <Polyline key={i} pathOptions={{color: 'black',weight:'1', opacity:'0.5'}} positions={edgepositions} />
              
            );
          })
          }


      </MapContainer>
    </div>
  }
}

export default MapView;