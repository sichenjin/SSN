import React from 'react';
// import L from 'leaflet';
import { MapContainer, CircleMarker, TileLayer, Tooltip, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import appState from '../stores';
import { observer } from 'mobx-react';
import { observable, computed, action, runInAction } from "mobx";
import "leaflet-area-select";
import AreaSelect from "../components/AreaSelect"
import {ZoomMap,MapClick} from "../components/ZoomMap"
import { useMap } from "react-leaflet";
var def = require("../graph-frontend/src/imports").default;
var d3 = def.d3;
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
  // @observable neighborTosID = []
  // @observable neighborFromsID = []



  @computed
  get neighborNodesID() {
    const neighborIDs = []
    // const neighborTosID = []
    if (appState.graph.currentlyHovered) {
      for (var j = 0; j < appState.graph.currentlyHovered.links.length; j++) {
        neighborIDs.push(appState.graph.currentlyHovered.links[j].fromId);
        neighborIDs.push(appState.graph.currentlyHovered.links[j].toId);
      }
    }

    if (appState.graph.mapClicked) {
      for (var j = 0; j < appState.graph.mapClicked.links.length; j++) {
        neighborIDs.push(appState.graph.mapClicked.links[j].fromId);
        neighborIDs.push(appState.graph.mapClicked.links[j].toId);
      }
    }
    return neighborIDs
  }

  @computed
  get nodesSelectedID(){
    var edgesOfNodes = []
    if(appState.graph.selectedNodes.length > 0){
      edgesOfNodes = appState.graph.selectedNodes.map(function(node){
        return node.id
      })
    }
    return edgesOfNodes
  }

  // distance(fromlocLatY, fromlocLonX,tolocLatY,tolocLonX) {
  //   const dx2 = Math.pow(fromlocLonX - tolocLonX, 2);
  //   const dy2 = Math.pow(fromlocLatY - tolocLatY, 2);
  
  //   return Math.sqrt(dx2 + dy2);
  // }

  // hypotenuse = Math.sqrt(1 + 1)

  // segments= d3.scaleLinear()
  //     .domain([0, this.hypotenuse])
  //     .range([1, 10])


  // generateSegments(nodes, links) {
  //   // generate separate graph for edge bundling
  //   // nodes: all nodes including control nodes
  //   // links: all individual segments (source to target)
  //   // paths: all segments combined into single path for drawing
  //   let bundle = {nodes: [], links: [], paths: []};
  
  //   // make existing nodes fixed
  //   bundle.nodes = nodes.map(function(d, i) {
  //     d.fx = d.LonX;
  //     d.fy = d.LatY;
  //     return d;
  //   });
    
  //   links.forEach(function(d, i) {
  //     // calculate the distance between the source and target
  //     let length = this.distance(d.data.fromlocLatY, d.data.fromlocLonX,d.data.tolocLatY,d.data.tolocLonX);
  
  //     // calculate total number of inner nodes for this link
  //     let total = Math.round(this.segments(length));
  
  //     // create scales from source to target
  //     let xscale = d3.scaleLinear()
  //       .domain([0, total + 1]) // source, inner nodes, target
  //       .range([d.data.fromlocLonX, d.data.tolocLonX]);
  
  //     let yscale = d3.scaleLinear()
  //       .domain([0, total + 1])
  //       .range([d.data.fromlocLatY, d.data.tolocLatY]);
  
  //     // initialize source node
  //     let source = d.source;
  //     let target = null;
  
  //     // add all points to local path
  //     let local = [source];
  
  //     for (let j = 1; j <= total; j++) {
  //       // calculate target node
  //       target = {
  //         x: xscale(j),
  //         y: yscale(j)
  //       };
  
  //       local.push(target);
  //       bundle.nodes.push(target);
  
  //       bundle.links.push({
  //         source: source,
  //         target: target
  //       });
  
  //       source = target;
  //     }
  
  //     local.push(d.target);
  
  //     // add last link to target node
  //     bundle.links.push({
  //       source: target,
  //       target: d.target
  //     });
  
  //     bundle.paths.push(local);
  //   });
  
  //   return bundle;
  // }
  


  dec2hexString = (dec) => {
    return '0x' + (dec + 0x10000).toString(16).substr(-4).toUpperCase();
  }

  onMouseOut = (e) => {
    console.log('onMouseOut', e)
  }

  


  setEdgePathOption = (edge) => {
    if (!appState.graph.currentlyHovered && appState.graph.selectedNodes.length == 0 && !appState.graph.mapClicked) {
      return  { color:  appState.graph.edges.color , weight: '1', opacity: '1' }

      // { color: edge.data.withinFamily ? appState.graph.edges.color : appState.graph.edges.crossColor, weight: '1', opacity: '1' }
    }

    


    if (appState.graph.currentlyHovered ) {
      if (edge.fromId == appState.graph.currentlyHovered.id || edge.toId == appState.graph.currentlyHovered.id ) {
        return { color: appState.graph.edges.crossColor, weight: '3', opacity: '1' }
      } else {
        return { color:appState.graph.edges.color , weight: '0.7', opacity: '0.2' }
      }
    }
    
    if (appState.graph.mapClicked ) {
      if (edge.fromId == appState.graph.mapClicked.id || edge.toId == appState.graph.mapClicked.id ) {
        return { color: appState.graph.edges.crossColor, weight: '3', opacity: '1' }
      } else {
        return { color:appState.graph.edges.color , weight: '0.7', opacity: '0.2' }
      }
    }
    
    if (appState.graph.selectedNodes.length > 0) {
      if ( this.nodesSelectedID.indexOf(edge.fromId) !== -1 && this.nodesSelectedID.indexOf(edge.toId) !== -1 ) 
        {
        return { color: appState.graph.edges.crossColor, weight: '3', opacity: '1' }
      } else {
        return { color: appState.graph.edges.color, weight: '0.7', opacity: '0.2' }
      }
    }
  }

  setNodePathOption = (node) => {

    //the order of if condition matters, because of return first 

    // return {fillColor: node.renderData.color , fillOpacity: node.renderData.draw_object.material.opacity, stroke: node.renderData.draw_object.children[0].material.color}

    // //no hover and selection 
    if (!appState.graph.currentlyHovered && appState.graph.selectedNodes.length == 0 && !appState.graph.mapClicked) {
      return { fillColor: node.renderData.color, fillOpacity: 0.8, stroke: false, zIndex: 'auto' }
    }

    
    // //currently hovered node highlight 
    if (appState.graph.currentlyHovered ) {
      // currently node
      if (node.id === appState.graph.currentlyHovered.id ) {
        return { fillColor: node.renderData.color, fillOpacity: 0.8, stroke: def.NODE_HIGHLIGHT, zIndex: '10000' }
      } else if (this.neighborNodesID.indexOf(node.id) !== -1) { // neighbors 
        return { fillColor: node.renderData.color, fillOpacity: 0.8, stroke: def.NODE_HIGHLIGHT, zIndex: '10000' }
      } else { //others 
        return { fillColor: node.renderData.color, fillOpacity: 0.3, stroke: false, zIndex: 'auto' }
      }
    }

    if (appState.graph.mapClicked ) {
      // currently node
      if (node.id === appState.graph.mapClicked.id ) {
        return { fillColor: node.renderData.color, fillOpacity: 0.8, stroke: def.NODE_HIGHLIGHT, zIndex: '10000' }
      } else if (this.neighborNodesID.indexOf(node.id) !== -1) { // neighbors 
        return { fillColor: node.renderData.color, fillOpacity: 0.8, stroke: def.NODE_HIGHLIGHT, zIndex: '10000' }
      } else { //others 
        return { fillColor: node.renderData.color, fillOpacity: 0.3, stroke: false, zIndex: 'auto' }
      }
    }

    // select area highlight 
    if (appState.graph.selectedNodes.length > 0) {
      if (appState.graph.selectedNodes.indexOf(node) == -1) {
        return { fillColor: node.renderData.color, fillOpacity: 0.3, stroke: false, zIndex: 'auto' }
      } else {

        return { fillColor: node.renderData.color, fillOpacity: 0.8, stroke: def.NODE_HIGHLIGHT, zIndex: '10000' }
      }
    }

  }


  // setPathOption = (node) => {
  //   if (appState.graph.frame.selection.length > 0) {
  //     if (appState.graph.frame.selection.indexOf(node) == -1) {
  //       return { fillColor: 'blue', fillOpacity: 0.5, stroke: false, zIndex:'auto' }
  //     } else {

  //       return { fillColor: 'red', fillOpacity: 1, stroke: false,zIndex: '10000' }
  //     }
  //   }
  //   if (appState.graph.currentlyHovered && node.id === appState.graph.currentlyHovered.id) {
  //     return { fillColor: 'red', fillOpacity: 1, stroke: false }
  //   } else {
  //     return { fillColor: 'blue', fillOpacity: 0.5, stroke: false }
  //   }


  // }



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
        zoom={9}
        center={[37.1, -80.5]}
      >
        <TileLayer url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=8f6a7e18-709d-4fe8-9dc9-fcce7bfa30d8" />
        <AreaSelect />
        <ZoomMap />
        <MapClick />


        {appState.graph.rawGraph.edges[0].fromlocLatY !== undefined && appState.graph.rawGraph.edges[0].fromlocLatY !== 360 &&

          appState.graph.frame && appState.graph.frame.getEdgeList().map((edge, i) => {
            // if (this.frameNode.indexOf(edge.source_id) !== -1 && this.frameNode.indexOf(edge.target_id) !== -1) {

            var edgepositions = [[edge.data.fromlocLatY, edge.data.fromlocLonX], [edge.data.tolocLatY, edge.data.tolocLonX]]

            return (
              <Polyline key={i} pathOptions={this.setEdgePathOption(edge)} positions={edgepositions} />

            );




          })
        }

        {appState.graph.rawGraph.nodes[0].LatY !== undefined && appState.graph.rawGraph.nodes[0].LonX !== undefined &&
          appState.graph.frame && appState.graph.frame.getNodeList().map((node, i) => {

            return (
              <CircleMarker
                key={node.id}
                center={[node.data.ref.LatY, node.data.ref.LonX]}
                radius={node.data.size*1.5}
                pathOptions={this.setNodePathOption(node)}

                
                data={node}
                eventHandlers={{
                  click: (e) => {
                    if(!appState.graph.mapClicked){ //no clicked circle before 
                      appState.graph.mapClicked = e.target.options.data  //control map update 
                      // appState.graph.currentlyHovered = null
                      appState.graph.frame.highlightNode(e.target.options.data, true);   //control socio update 
                      appState.graph.frame.highlightEdges(e.target.options.data, true);
                    }else{  // click again to unselect 
                      appState.graph.mapClicked = null
                    }

                    
                  },
                  mouseover: (e) => {
                    if(appState.graph.mapClicked) return;
                    // var currentNode = e.target.options.data
                    // appState.graph.selectedNodes = []
                    // appState.graph.frame.selection = []
                    appState.graph.currentlyHovered = e.target.options.data  // control map update 
                    appState.graph.frame.highlightNode(e.target.options.data, true);   // control cosio update 
                    appState.graph.frame.highlightEdges(e.target.options.data, true);


                    // e.target.options.data.renderData.draw_object.children[0].material.color.setHex(def.NODE_HIGHLIGHT);
                    // e.target.options.data.renderData.draw_object.children[0].visible = true

                    // appState.graph.frame.lastHover = e.target.options.data
                    // appState.graph.frame.highlightNode(e.target.options.data, true)
                    // e.target.setStyle({fillOpacity: 1, fillColor:'red'})
                    // console.log(e.target.options.data)
                  },
                  mouseout: (e) => {
                    if(appState.graph.mapClicked) return; 
                  
                    appState.graph.frame.graph.forEachNode(function(n){
                      if(n !== appState.graph.mapClicked){
                        appState.graph.frame.colorNodeOpacity(n, 1);
                      
                      appState.graph.frame.highlightNode(n, false, def.ADJACENT_HIGHLIGHT);
                      }
                    }
                    );
                    appState.graph.frame.colorNodeEdge(null);
                    appState.graph.currentlyHovered = null;
                    
                    
                    // e.target.options.data.renderData.draw_object.children[0].material.color.set(
                    //   e.target.options.data.renderData.hcolor
                    // )
                    // e.target.options.data.renderData.draw_object.children[0].visible = false

                    // appState.graph.currentlyHovered = null
                    // appState.graph.frame.highlightNode(e.target.options.data,false)
                    // e.target.setStyle({ fillOpacity: 0.5, fillColor: 'blue' })

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







      </MapContainer>
     
    </div>
  }
}

export default MapView;