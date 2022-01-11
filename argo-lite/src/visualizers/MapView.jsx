import React from 'react';
// import L from 'leaflet';
import { MapContainer, CircleMarker, TileLayer, Tooltip, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import appState from '../stores';
import { observer } from 'mobx-react';
import { observable, computed, action, runInAction } from "mobx";
import "leaflet-area-select";
import AreaSelect from "../components/AreaSelect"
var def = require("../graph-frontend/src/imports").default;
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
    if(appState.graph.currentlyHovered){
      for (var j = 0; j < appState.graph.currentlyHovered.links.length; j++) {
        neighborIDs.push(appState.graph.currentlyHovered.links[j].fromId);
        neighborIDs.push(appState.graph.currentlyHovered.links[j].toId);
      }
    } 
    return neighborIDs
  }

  @computed
  get zoomLevelCenter(){
    
  }


 dec2hexString = (dec) =>{
    return '0x' + (dec+0x10000).toString(16).substr(-4).toUpperCase();
 }

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

  setEdgePathOption = (edge)=>{
    if(appState.graph.currentlyHovered ){
      if(edge.fromId == appState.graph.currentlyHovered.id || edge.toId == appState.graph.currentlyHovered.id){
        return { color: edge.data.withinFamily? appState.graph.edges.color: appState.graph.edges.crossColor, weight: '1', opacity: '1' }
      }else{
        return { color: edge.data.withinFamily? appState.graph.edges.color: appState.graph.edges.crossColor, weight: '1', opacity: '0' }
      }
    }else{
      return { color: edge.data.withinFamily? appState.graph.edges.color: appState.graph.edges.crossColor, weight: '1', opacity: '1' }
    }
  }

  setNodePathOption = (node)=>{

    // return {fillColor: node.renderData.color , fillOpacity: node.renderData.draw_object.material.opacity, stroke: node.renderData.draw_object.children[0].material.color}

    // //no hover and selection 
    if(!appState.graph.currentlyHovered && appState.graph.selectedNodes.length == 0){
      return {fillColor: node.renderData.color , fillOpacity: 0.8, stroke: false, zIndex:'auto'}
    }

    // select area highlight 
    if (appState.graph.selectedNodes.length > 0) {
      if (appState.graph.selectedNodes.indexOf(node) == -1) {
        return { fillColor: node.renderData.color , fillOpacity: 0.3, stroke: false, zIndex:'auto' }
      } else {

        return { fillColor: node.renderData.color , fillOpacity: 0.8, stroke: def.NODE_HIGHLIGHT, zIndex:'10000' }
      }
    }
    // //currently hovered node highlight 
    if(appState.graph.currentlyHovered ){
      // currently node
      if(node.id === appState.graph.currentlyHovered.id){
        return { fillColor: node.renderData.color , fillOpacity: 0.8, stroke: def.NODE_HIGHLIGHT, zIndex:'10000' }
      }else if(this.neighborNodesID.indexOf(node.id) !== -1){ // neighbors 
        return { fillColor: node.renderData.color , fillOpacity: 0.8, stroke: def.NODE_HIGHLIGHT, zIndex:'10000' }
      }else{ //others 
      return { fillColor: node.renderData.color , fillOpacity: 0.3, stroke: false, zIndex:'auto' }
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
        zoom={4}
        center={[37, -100]}
      >
        <TileLayer url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=8f6a7e18-709d-4fe8-9dc9-fcce7bfa30d8" />
        <AreaSelect />


        {appState.graph.rawGraph.edges[0].fromlocLatY !== undefined && appState.graph.rawGraph.edges[0].fromlocLatY !== 360 &&
        
        appState.graph.frame.getEdgeList().map((edge, i) => {
          // if (this.frameNode.indexOf(edge.source_id) !== -1 && this.frameNode.indexOf(edge.target_id) !== -1) {
         
            var edgepositions = [[edge.data.fromlocLatY, edge.data.fromlocLonX], [edge.data.tolocLatY, edge.data.tolocLonX]]
            
            return (
              <Polyline key={i} pathOptions={this.setEdgePathOption(edge)} positions={edgepositions} />

            );
          
          
          

        })
      }

        {appState.graph.rawGraph.nodes[0].LatY !== undefined && appState.graph.rawGraph.nodes[0].LonX !== undefined &&
          appState.graph.frame.getNodeList().map((node, i) => {
            
              return (
                <CircleMarker
                  key={node.id}
                  center={[node.data.ref.LatY, node.data.ref.LonX]}
                  radius={ node.data.size}
                  pathOptions={this.setNodePathOption(node)}
  
                  // fillColor={this.setCircleColor(node)}
                  // fillOpacity={0.5}
                  // stroke={false}
                  data={node}
                  eventHandlers={{
                    mouseover: (e) => {
                      // var currentNode = e.target.options.data
                      appState.graph.currentlyHovered = e.target.options.data
                      appState.graph.frame.highlightNode(e.target.options.data, true);
                      appState.graph.frame.highlightEdges(e.target.options.data, true);
                      
                  
                      // e.target.options.data.renderData.draw_object.children[0].material.color.setHex(def.NODE_HIGHLIGHT);
                      // e.target.options.data.renderData.draw_object.children[0].visible = true
                      
                      // appState.graph.frame.lastHover = e.target.options.data
                      // appState.graph.frame.highlightNode(e.target.options.data, true)
                      // e.target.setStyle({fillOpacity: 1, fillColor:'red'})
                      // console.log(e.target.options.data)
                    },
                    mouseout: (e) => {
                      appState.graph.frame.graph.forEachNode(n => {
                        appState.graph.frame.colorNodeOpacity(n, 1);
                        appState.graph.frame.colorNodeEdge(n, 0.5, 0.5);
                        appState.graph.frame.highlightNode(n, false, def.ADJACENT_HIGHLIGHT);
                      });
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