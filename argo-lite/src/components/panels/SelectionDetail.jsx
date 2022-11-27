import React from "react";
import classnames from "classnames";
import uniq from "lodash/uniq";
import { Classes } from "@blueprintjs/core";
import appState from "../../stores";
import { observer } from "mobx-react/index";
import { observable, computed, action, runInAction } from "mobx";
import { Histogram, DensitySeries, BarSeries, withParentSize, XAxis, YAxis } from '@data-ui/histogram';
// import  Histogram  from "./Histogram"
import SVGBrush from 'react-svg-brush';

import { min, max, scaleLinear, map, range, select } from "d3"
import { bin } from "d3-array"
import * as d3 from "d3"
import { filter } from "lodash";
// import { min } from "lodash";


@observer
class SelectionDetail extends React.Component {

  // 
  margin = { top: 32, right: 30, bottom: 64, left: 30 }
  // { top: 32, right: 32, bottom: 64, left: 64 }
  allwidth = 180
  allheight = 180
  width = this.allwidth - this.margin.left - this.margin.right
  height = this.allheight - this.margin.top - this.margin.bottom
  brushmargin = this.margin
  brushwidth = this.width
  distBinData = []
  edgeSelection = []


  SelectionDistanceFromLatLonIn = () => {
    const selectNodes = appState.graph.selectedNodes;
    const average = (array) => array.reduce((a, b) => a + b) / array.length;

    if (selectNodes.length > 1) {
      //// calculate only the connected distance 
      const edgeSelection = appState.graph.frame.getEdgeWithinSelection(appState.graph.selectedNodes)
      if (edgeSelection.length == 0) return [null, []];
      this.edgeSelection = edgeSelection
      const edgeDistance = edgeSelection.map(e => e.edgeDist)
      return [average(edgeDistance).toFixed(3),edgeDistance];

      //// calculate average distance between all selected nodes 
      // const edgeDistance = []
      // appState.graph.frame.lineIndices.forEach((edge)=>{
      //   if (appState.graph.selectedNodes.includes(edge.source ) && appState.graph.selectedNodes.includes(edge.target ) ){
      //     edgeDistance.push(edge.edgeDist)

      //   }
      // })
      // if(edgeDistance.length>0){
      //   return [average(edgeDistance).toFixed(3), edgeDistance];
      // }else{
      //   return  [null, []]
      // }

      // for (let i = 0; i < selectNodes.length; i++) {
      //   for (let j = i + 1; j < selectNodes.length; j++) {
      //     const lon1 = selectNodes[i].data.ref.LonX
      //     const lat1 = selectNodes[i].data.ref.LatY
      //     const lon2 = selectNodes[j].data.ref.LonX
      //     const lat2 = selectNodes[j].data.ref.LatY
      //     const edgeDist = appState.graph.frame.getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2)
      //     edgeDistance.push(edgeDist)
      //   }
      // }
      
      

    } else {
      return null
    }

  }

  SelectionDensity = () => {

    const edgeSelection = appState.graph.frame.getEdgeWithinSelection(appState.graph.selectedNodes)
    if (edgeSelection.length == 0) return 0;
    this.edgeSelection =  [...edgeSelection]
    const nodelength = appState.graph.selectedNodes.length;
    const selectionDen = edgeSelection.length / (nodelength * (nodelength - 1))
    return selectionDen.toFixed(3)


  }
  // margin = 


  onEdgeBrushStart = ({ target, type, selection, sourceEvent }) => {
    // appState.graph.frame.selection = []
    // appState.graph.selectedNodes = []
    appState.graph.edgeselection = []

  }
  onEdgeBrush = ({ target, type, selection, sourceEvent }) => {

  }
  onEdgeBrushEnd = ({ target, type, selection, sourceEvent }) => {
    const selectionRectID = []
    const svgElement = select(this.edgesvg)
    const rects = svgElement.selectAll(".vx-bar")
    const brushBounds = {
      x0: selection[0][0] - this.brushmargin.left,
      x1: selection[1][0] - this.brushmargin.left,
      y0: selection[0][1],
      y1: selection[1][1],
    }

    rects.each(function (d, i) {
      const rectx = parseFloat(select(this).attr("x"))
      // const recty = parseFloat(select(this).attr("y"))
      if (rectx >= brushBounds.x0 && rectx <= brushBounds.x1) {
        selectionRectID.push(i)
      }

    })

    

    console.log(this.distBinData)
    // const filterDistBin = this.distBinData.filter((d,i)=>i%2 !=1)
    const filterDistBin2 = this.distBinData.filter((d,i)=>selectionRectID.indexOf(i)!==-1)
    console.log(this.distBinData)
    const distbuffer_min = min(filterDistBin2.map((d)=>d.mind))
    const distbuffer_max = max(filterDistBin2.map((d)=>d.maxd))
    console.log(this.edgeSelection)
    const filteredge = this.edgeSelection.filter(edge => (edge.edgeDist>= distbuffer_min && edge.edgeDist<=distbuffer_max))
  

    appState.graph.edgeselection = [...filteredge]
    // this.distBinData = []
    // const selectionNode = appState.graph.frame.getNodeList().filter(node =>
    //   // console.log(node)
    //   selectionNodeID.includes(node.id)

    // )
    // appState.graph.frame.selection = selectionNode
    // appState.graph.selectedNodes = selectionNode


    // // console.log(selectionNode)
    // appState.graph.frame.updateSelectionOpacity()
    console.log( appState.graph.edgeselection)
    // console.log(selection)
    // console.log(selectionRectID)

  }

  renderEdgeBrush = () => (
    <SVGBrush
      // Defines the boundary of the brush.
      // Strictly uses the format [[x0, y0], [x1, y1]] for both 1d and 2d brush.
      // Note: d3 allows the format [x, y] for 1d brush.
      extent={
        [[this.margin.left, this.brushmargin.top], [this.allwidth - this.brushmargin.right , this.allheight-this.brushmargin.bottom]]
      }
      // Obtain mouse positions relative to the current svg during mouse events.
      // By default, getEventMouse returns [event.clientX, event.clientY]
      getEventMouse={event => {
        const { clientX, clientY } = event;
        const { left, top } = this.edgesvg.getBoundingClientRect();
        // console.log([clientX - left, clientY - top])
        return [clientX - left, clientY - top];
      }}
      brushType="x" // "x"
      onBrushStart={this.onEdgeBrushStart}
      onBrush={this.onEdgeBrush}
      onBrushEnd={this.onEdgeBrushEnd}
    />
  )

  onDegreeBrushStart = ({ target, type, selection, sourceEvent }) => {
    // appState.graph.frame.selection = []
    // appState.graph.selectedNodes = []

  }
  onDegreeBrush = ({ target, type, selection, sourceEvent }) => {

  }
  onDegreeBrushEnd = ({ target, type, selection, sourceEvent }) => {
    const selectionRectID = []
    const svgElement = select(this.degreesvg)
    const rects = svgElement.selectAll(".vx-bar")
    const brushBounds = {
      x0: selection[0][0] - this.margin.left,
      x1: selection[1][0] - this.margin.left,
      y0: selection[0][1],
      y1: selection[1][1],
    }

    rects.each(function (d, i) {
      const rectx = parseFloat(select(this).attr("x"))
      // const recty = parseFloat(select(this).attr("y"))
      if (rectx >= brushBounds.x0 && rectx <= brushBounds.x1) {
        selectionRectID.push(i)
      }



    })

    console.log(selection)
    console.log(selectionRectID)

  }

  renderDegreeBrush = () => (
    <SVGBrush
      // Defines the boundary of the brush.
      // Strictly uses the format [[x0, y0], [x1, y1]] for both 1d and 2d brush.
      // Note: d3 allows the format [x, y] for 1d brush.
      extent={
        [[this.margin.left, this.brushmargin.top], [this.allwidth - this.brushmargin.right , this.allheight-this.brushmargin.bottom]]
      }
      // Obtain mouse positions relative to the current svg during mouse events.
      // By default, getEventMouse returns [event.clientX, event.clientY]
      getEventMouse={event => {
        const { clientX, clientY } = event;
        const { left, top } = this.degreesvg.getBoundingClientRect();
        // console.log([clientX - left, clientY - top])
        return [clientX - left, clientY - top];
      }}
      brushType="x" // "x"
      onBrushStart={this.onDegreeBrushStart}
      onBrush={this.onDegreeBrush}
      onBrushEnd={this.onDegreeBrushEnd}
    />
  )




  render() {





    if (appState.graph.selectedNodes.length > 0 && this.SelectionDistanceFromLatLonIn()&&this.SelectionDistanceFromLatLonIn()[0]) {
      // self = this
      // this.histogram(this.SelectionDistanceFromLatLonIn()[1],self)

      // Array(100).fill().map(Math.random);





      return (
        <div
          className={classnames(
            // 'overlay-card',
            // "right-overlay-card",
            // "transparent-frame"
          )}
          style={{
            // width: '40vw',
            height: '40vh',
            // border:'#C0C0C0',
            // borderStyle:'solid',
          }}
        >
          <div className={classnames(Classes.CARD, "node-details-table")}>
            <table
              className={classnames(Classes.TABLE, Classes.TABLE_STRIPED, "node-details-table-content")}
              style={{
                width: "100%",
                padding: '0',
              }}
            >

              <thead>
                {/* <tr>
                  <th></th>
                  <th></th>
                 
                </tr> */}
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '5px 10px' }}> {appState.graph.selectedNodes.length + ' nodes are selected'}</td>
                  {/* <td style={{ padding: '5px 10px', whiteSpace: 'normal' }}>{formatLongFloat(this.props.node[it])}</td> */}
                </tr>
                <tr>
                  <td style={{ padding: '5px 10px' }}> {'The average distance is ' + this.SelectionDistanceFromLatLonIn()[0] + ' km'}</td>
                  {/* <td style={{ padding: '5px 10px', whiteSpace: 'normal' }}>{formatLongFloat(this.props.node[it])}</td> */}
                </tr>
                <tr>
                  <td style={{ padding: '5px 10px' }}> {'The network density (undirected network) is ' + this.SelectionDensity()}</td>
                  {/* <td style={{ padding: '5px 10px', whiteSpace: 'normal' }}>{formatLongFloat(this.props.node[it])}</td> */}
                </tr>
                {/* {appState.graph.allPropertiesKeyList.map((it, i) => (
                  
                ))} */}
              </tbody>
            </table>
          </div>

          <div style={{ height: '20vw' }}>
            <text className="distribution-title" >The Distance Distribution</text>
            {/* <Histogram data = {this.SelectionDistanceFromLatLonIn()[1]} id = "edge_hist"  /> */}

            <svg
              width={this.width + this.margin.right + this.margin.left}
              height={this.height + this.margin.top + this.margin.bottom}
              // className="hist"
              id="edgesvg"
              ref={input => (this.edgesvg = input)}
            // ref = {ref}
            >
              <Histogram
                ariaLabel="distance_dis"
                orientation="vertical"
                height={this.allheight}
                width={this.allwidth}
                cumulative={false}
                normalized={true}
                binCount={25}
                margin = {this.margin}
                valueAccessor={(datum) => {
                  
                  return datum
                }}
                binType="numeric"
                
              >
                <BarSeries
                  animated
                  rawData={this.SelectionDistanceFromLatLonIn()[1]}
                  fill={(d,i)=>{
                    if(i===0){
                      this.distBinData = []
                    }
                    
                      if(d.data.length>0){
                        this.distBinData.push({
                          mind:min(d.data),
                          maxd:max(d.data)
                        })
                      }else{
                        this.distBinData.push({
                          mind:Infinity,
                          maxd:-1
                        })
                      }
                      
                    

                    // console.log(this.distBinData)
                    // console.log(i)
                    // console.log(d)
                    return "#429bf5"
                  }}
                />
                <XAxis numTicks={5} label="Edge Distance (km)" tickLabelProps={(d, i) => ({ angle: 45 })}/>
                <YAxis label="Frequency" tickFormat ={
                  (tick, ti)=>{
                    return parseInt(tick*this.SelectionDistanceFromLatLonIn()[1].length).toString()
                }}/>

                
              </Histogram>
              {this.renderEdgeBrush()}
            </svg>


            <text className="distribution-title">The Degree Distribution</text>
            <svg
                  width={this.width + this.margin.right + this.margin.left}
                  height={this.height + this.margin.top + this.margin.bottom}
                  // className="hist"
                  id="degreesvg"
                  ref={input => (this.degreesvg = input)}
                // ref = {ref}
                >

               
            <Histogram
              ariaLabel="degree_dis"
              orientation="vertical"
              height={this.allheight}
              width={this.allwidth}
              margin = {this.margin}
              cumulative={false}
              normalized={true}
              binCount={25}
              valueAccessor={(datum) => datum}
              binType="numeric"
            >
              <BarSeries
                fill="#429bf5"
                animated
                rawData={appState.graph.selectedNodes.map((node) => {
                  return node.data.ref.degree
                })}
              />
              <XAxis numTicks={5} label="Degree" tickLabelProps={(d, i) => ({ angle: 45 })}/>
              <YAxis label="Frequency" 
              tickFormat ={
                  (tick, ti)=>{
                    return parseInt(tick*appState.graph.selectedNodes.length).toString()
                }}/>
            </Histogram>
            </svg>
          </div>


        </div>
      );
    } else {
      return <div
        className={classnames(
          // 'overlay-card',
          // "right-overlay-card",
          // "transparent-frame"
        )}
        style={{
          // width: '40vw',
          height: '40vh',
          // border:'#C0C0C0',
          // borderStyle:'solid',
        }}
      >
        <div className={classnames(Classes.CARD, "node-details-table")}>
          <table
            className={classnames(Classes.TABLE, Classes.TABLE_STRIPED, "node-details-table-content")}
            style={{
              width: "100%",
              padding: '0',
            }}
          >

            <thead>

            </thead>
            <tbody>


              <tr>
                <td style={{ padding: '5px 10px' }}> {'No node is selected'}</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 10px' }}> {`The average degree is ${appState.graph.hasGraph ? appState.graph.degree.toFixed(3) : 'NULL'}`}</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 10px' }}> {`The average density is ${appState.graph.hasGraph ? (appState.graph.density / 2).toFixed(3) : 'NULL'}`}</td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>
    }

  }
}

export default SelectionDetail;