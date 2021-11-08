import React from 'react';
// import L from 'leaflet';
import { MapContainer, CircleMarker, TileLayer,Tooltip } from "react-leaflet";
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
                radius={1000 * node.pagerank}
                fillOpacity={0.5}
                stroke={false}
              >
                {/* <Tooltip direction="right" offset={[-8, -2]} opacity={1}>
                  <span>{city["name"] + ": " + "Population" + " " + city["population"]}</span>
                </Tooltip> */}
              </CircleMarker>
            );
          })}
      </MapContainer>
    </div>
  }
}

export default MapView;