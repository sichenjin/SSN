import React from 'react';
import L from 'leaflet';

class Map extends React.Component {
  componentDidMount() {
    // create map
    this.map = L.map('map', {
      center: [49.8419, 24.0315],
      zoom: 3,
      layers: [
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }),
      ]
    });
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
    ></div>
  }
}

export default Map;