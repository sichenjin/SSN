import React from "react";
import classnames from "classnames";
import uniq from "lodash/uniq";

import { Classes } from "@blueprintjs/core";
import appState from "../../stores";
import { observer } from "mobx-react/index";
import { observable, computed, action, runInAction } from "mobx";
import {
  Histogram,
  DensitySeries,
  BarSeries,
  withParentSize,
  XAxis,
  YAxis,
} from "@data-ui/histogram";
// import  Histogram  from "./Histogram"
import SVGBrush from "react-svg-brush";

import { min, max, scaleLinear, map, range, select } from "d3";
import { bin } from "d3-array";
import * as d3 from "d3";
import { filter, forEach } from "lodash";
// import { min } from "lodash";

@observer
class SelectionDetail extends React.Component {
  //
  margin = { top: 32, right: 30, bottom: 70, left: 40 };
  // { top: 32, right: 32, bottom: 64, left: 64 }
  containerDiv = document.querySelector("#graph-container");
  allwidth = this.containerDiv.offsetWidth / 2;
  single_allwidth = this.containerDiv.offsetWidth;
  allheight = (this.containerDiv.offsetHeight / 3) * 2;
  width = this.allwidth - this.margin.left - this.margin.right;
  height = this.allheight - this.margin.top - this.margin.bottom;
  brushmargin = this.margin;
  brushwidth = this.width;
  distBinData = [];
  degreeBinData = [];
  edgeSelection = [];

  @action
  SelectionDistanceFromLatLonIn = () => {
    const selectNodes = appState.graph.selectedNodes;
    const average = (array) => array.reduce((a, b) => a + b) / array.length;
    this.SelectionDensity();

    if (appState.graph.mapClicked) {
      const edgeSelection = appState.graph.mapClicked.linkObjs;
      if (!edgeSelection || edgeSelection.length == 0) {
        appState.graph.avgdist = 0;
        return [null, []];
      }
      this.edgeSelection = edgeSelection;
      const edgeDistance = edgeSelection.map((e) => {
        if (e.edgeDist > 0) {
          return e.edgeDist;
        } else {
          return 0;
        }
      });
      appState.graph.avgdist = average(edgeDistance).toFixed(2);
      return [appState.graph.avgdist, edgeDistance];
    }

    if (selectNodes.length > 1) {
      //// calculate only the connected distance
      const edgeSelection =
        appState.graph.frame.getEdgeWithinSelectionForDensity(
          appState.graph.selectedNodes
        );
      if (edgeSelection.length == 0) {
        appState.graph.avgdist = 0;
        return [null, []];
      }
      this.edgeSelection = edgeSelection;
      const edgeDistance = edgeSelection.map((e) => {
        if (e.edgeDist > 0) {
          return e.edgeDist;
        } else {
          return 0;
        }
      });
      appState.graph.avgdist = average(edgeDistance).toFixed(2);
      return [appState.graph.avgdist, edgeDistance];

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
      // when no node is selected, return the distribution of the whole network

      let edgeSelection = [];
      appState.graph.frame.getNodeList().forEach((node) => {
        if (node.linkObjs && node.linkObjs.length > 0) {
          edgeSelection.push(...node.linkObjs);
        }
      });

      if (edgeSelection.length > 0) {
        let uniqEdgeSelection = uniq(edgeSelection);
        this.edgeSelection = uniqEdgeSelection;
        if (uniqEdgeSelection.length > 0) {
          let edgeDistance = uniqEdgeSelection.map((e) => {
            if (e.edgeDist > 0) {
              return e.edgeDist;
            } else {
              return 0;
            }
          });
          // console.log(edgeDistance)
          appState.graph.avgdist = average(edgeDistance).toFixed(2);
          return [appState.graph.avgdist, edgeDistance];
        } else {
          return [null, []];
        }
      } else {
        return [null, []];
      }

      // return null
    }
  };

  @action
  SelectionDensity = () => {
    // undirect graph

    if (appState.graph.selectedNodes.length > 1) {
      const edgeSelection =
        appState.graph.frame.getEdgeWithinSelectionForDensity(
          appState.graph.selectedNodes
        );
      // console.log(edgeSelection.length);
      if (edgeSelection.length == 0) {
        appState.graph.tempRawGraph = undefined;
        return 0;
      }
      // this.edgeSelection = [...edgeSelection]

      const nodelength = appState.graph.selectedNodes.length;
      const selectionDen =
        (edgeSelection.length / (nodelength * (nodelength - 1))) * 2;
      appState.graph.selectedEdge = edgeSelection.length;
      appState.graph.avgDegree =
        appState.graph.selectedNodes.reduce(
          (de, l) => de + l.data.ref.degree,
          0
        ) / appState.graph.selectedNodes.length;
      appState.graph.avgDegree = appState.graph.avgDegree.toFixed(3);
      appState.graph.avgdensity = selectionDen.toFixed(3);
      const selectnodesID = appState.graph.selectedNodes.map((n) => n.id);
      appState.graph.rediameter = "";
      appState.graph.reclustercoe = "";
      appState.graph.recomponent = "";
      appState.graph.tempRawGraph = {
        nodes: appState.graph.rawGraph.nodes.filter((n) =>
          selectnodesID.includes(n.id)
        ),
        edges: appState.graph.rawGraph.edges.filter(
          (e) =>
            selectnodesID.includes(e.source_id) &&
            selectnodesID.includes(e.target_id)
        ),
      };
      return selectionDen.toFixed(3);
    } else if (appState.graph.mapClicked) {
      const thenode = appState.graph.mapClicked;
      const selectneighbors =
        appState.graph.frame.getNeighborNodesFromGraph(thenode);
      const edgeSelection =
        appState.graph.frame.getEdgeWithinSelectionForDensity(selectneighbors);
      // console.log(edgeSelection.length);
      if (edgeSelection.length == 0) return 0;
      // this.edgeSelection = [...edgeSelection]

      const nodelength = selectneighbors.length;
      const selectionDen =
        (edgeSelection.length / (nodelength * (nodelength - 1))) * 2;
      appState.graph.selectedEdge = edgeSelection.length;
      appState.graph.avgDegree =
        selectneighbors.reduce((de, l) => de + l.data.ref.degree, 0) /
        selectneighbors.length;
      appState.graph.avgDegree = appState.graph.avgDegree.toFixed(3);
      appState.graph.avgdensity = selectionDen.toFixed(3);
      const selectnodesID = selectneighbors.map((n) => n.data.ref.id);
      selectnodesID.push(appState.graph.mapClicked.id);
      appState.graph.rediameter = "";
      appState.graph.reclustercoe = "";
      appState.graph.recomponent = "";
      appState.graph.tempRawGraph = {
        nodes: appState.graph.rawGraph.nodes.filter((n) =>
          selectnodesID.includes(n.id)
        ),
        edges: appState.graph.rawGraph.edges.filter(
          (e) =>
            selectnodesID.includes(e.source_id) &&
            selectnodesID.includes(e.target_id)
        ),
      };
      return selectionDen.toFixed(3);
    }
  };
  // margin =

  onEdgeBrushStart = ({ target, type, selection, sourceEvent }) => {
    // appState.graph.frame.selection = []
    // appState.graph.selectedNodes = []
    appState.graph.edgeselection = [];
    appState.graph.clearBrush = false;
    // rehighlight all edges in sociogram
    appState.graph.frame.highlightAllEdges();
  };
  onEdgeBrush = ({ target, type, selection, sourceEvent }) => {};
  onEdgeBrushEnd = ({ target, type, selection, sourceEvent }) => {
    const selectionRectID = [];
    const svgElement = select(this.edgesvg);
    const rects = svgElement.selectAll(".vx-bar");
    const brushBounds = {
      x0: selection[0][0] - this.brushmargin.left,
      x1: selection[1][0] - this.brushmargin.left,
      y0: selection[0][1],
      y1: selection[1][1],
    };

    rects.each(function (d, i) {
      const rectx = parseFloat(select(this).attr("x"));
      // const recty = parseFloat(select(this).attr("y"))
      if (rectx >= brushBounds.x0 && rectx <= brushBounds.x1) {
        selectionRectID.push(i);
      }
    });

    // console.log(this.distBinData)
    // console.log(selectionRectID)
    // const filterDistBin = this.distBinData.filter((d, i) => i % 2 != 1)
    const filterDistBin2 = this.distBinData.filter(
      (d, i) => selectionRectID.indexOf(i) !== -1
    );
    // console.log(this.distBinData)
    const distbuffer_min = min(filterDistBin2.map((d) => d.mind));
    const distbuffer_max = max(filterDistBin2.map((d) => d.maxd));
    // console.log(this.edgeSelection)
    const filteredge = this.edgeSelection.filter(
      (edge) =>
        edge.edgeDist >= distbuffer_min && edge.edgeDist <= distbuffer_max
    );

    appState.graph.edgeselection = filteredge;
    appState.graph.frame.highlightedgeWithinDist(
      distbuffer_min,
      distbuffer_max
    );
    // this.distBinData = []
    // const selectionNode = appState.graph.frame.getNodeList().filter(node =>
    //   // console.log(node)
    //   selectionNodeID.includes(node.id)

    // )
    // appState.graph.frame.selection = selectionNode
    // appState.graph.selectedNodes = selectionNode

    // // console.log(selectionNode)
    // appState.graph.frame.updateSelectionOpacity()
    console.log(appState.graph.edgeselection);
    // console.log(selection)
    // console.log(selectionRectID)
  };

  renderEdgeBrush = () => (
    <SVGBrush
      // Defines the boundary of the brush.
      // Strictly uses the format [[x0, y0], [x1, y1]] for both 1d and 2d brush.
      // Note: d3 allows the format [x, y] for 1d brush.
      selection={appState.graph.clearBrush ? null : undefined}
      extent={[
        [this.margin.left, this.brushmargin.top],
        [
          this.allwidth - this.brushmargin.right,
          this.allheight - this.brushmargin.bottom,
        ],
      ]}
      // Obtain mouse positions relative to the current svg during mouse events.
      // By default, getEventMouse returns [event.clientX, event.clientY]
      getEventMouse={(event) => {
        const { clientX, clientY } = event;
        const { left, top } = this.edgesvg.getBoundingClientRect();
        // console.log([clientX - left, clientY - top])
        if (clientX - left < 0) {
          console.log("Here");
          return [0, clientY - top];
        }
        return [clientX - left, clientY - top];
      }}
      brushType="x" // "x"
      onBrushStart={this.onEdgeBrushStart}
      onBrush={this.onEdgeBrush}
      onBrushEnd={this.onEdgeBrushEnd}
    />
  );

  onDegreeBrushStart = ({ target, type, selection, sourceEvent }) => {
    // appState.graph.frame.selection = []
    // appState.graph.selectedNodes = []
    // appState.graph.filter['degree'] ={
    //   "min":-1,
    //   "max":Infinity
    // }

    // appState.graph.filterNodes()
    appState.graph.clearBrush = false;
  };
  onDegreeBrush = ({ target, type, selection, sourceEvent }) => {};
  onNoNodeDegreeBrushEnd = ({ target, type, selection, sourceEvent }) => {
    const selectionRectID = [];
    const svgElement = select(this.degreesvg);
    const rects = svgElement.selectAll(".vx-bar");
    if (selection) {
      const brushBounds = {
        x0: selection[0][0] - this.margin.left,
        x1: selection[1][0] - this.margin.left,
        y0: selection[0][1],
        y1: selection[1][1],
      };

      rects.each(function (d, i) {
        const rectx = parseFloat(select(this).attr("x"));
        // const recty = parseFloat(select(this).attr("y"))
        if (rectx >= brushBounds.x0 && rectx <= brushBounds.x1) {
          selectionRectID.push(i);
        }
      });

      //  if(selectionRectID.length>0){
      const filterdegreeBin2 = this.degreeBinData.filter(
        (d, i) => selectionRectID.indexOf(i) !== -1
      );
      const degreebuffer_min = min(filterdegreeBin2.map((d) => d.mind));
      const degreebuffer_max = max(filterdegreeBin2.map((d) => d.maxd));

      const selectionNode = appState.graph.frame
        .getNodeList()
        .filter(
          (node) =>
            node.data.ref.degree >= degreebuffer_min &&
            node.data.ref.degree <= degreebuffer_max
        );

      // when no node statisfy, should dehighlight
      appState.graph.frame.degreehighlight = selectionNode;
      appState.graph.frame.updateDegreeHistOpacity();
      appState.graph.degreeselection = selectionNode;
      appState.graph.degreebrushed = true;
    } else {
      // click on brush should clear
      appState.graph.frame.selection = [];
      appState.graph.frame.updateSelectionOpacity();
      appState.graph.degreeselection = [];
      appState.graph.degreebrushed = false;
    }
  };

  onSelectDegreeBrushEnd = ({ target, type, selection, sourceEvent }) => {
    const selectionRectID = [];
    const svgElement = select(this.degreesvg);
    const rects = svgElement.selectAll(".vx-bar");
    if (selection) {
      const brushBounds = {
        x0: selection[0][0] - this.margin.left,
        x1: selection[1][0] - this.margin.left,
        y0: selection[0][1],
        y1: selection[1][1],
      };

      rects.each(function (d, i) {
        const rectx = parseFloat(select(this).attr("x"));
        // const recty = parseFloat(select(this).attr("y"))
        if (rectx >= brushBounds.x0 && rectx <= brushBounds.x1) {
          selectionRectID.push(i);
        }
      });

      const filterdegreeBin2 = this.degreeBinData.filter(
        (d, i) => selectionRectID.indexOf(i) !== -1
      );
      const degreebuffer_min = min(filterdegreeBin2.map((d) => d.mind));
      const degreebuffer_max = max(filterdegreeBin2.map((d) => d.maxd));

      var selectionNode;
      if (appState.graph.selectedNodes.length > 1) {
        selectionNode = appState.graph.selectedNodes.filter(
          (node) =>
            node.data.ref.degree >= degreebuffer_min &&
            node.data.ref.degree <= degreebuffer_max
        );
      } else if (
        appState.graph.selectedNodes.length == 1 &&
        appState.graph.selectedNodes[0]
      ) {
        const thenode = appState.graph.selectedNodes[0];
        const selectneighbors =
          appState.graph.frame.getNeighborNodesFromGraph(thenode);
        selectionNode = selectneighbors.filter(
          (node) =>
            node.data.ref.degree >= degreebuffer_min &&
            node.data.ref.degree <= degreebuffer_max
        );
      }

      appState.graph.frame.degreehighlight = selectionNode;
      appState.graph.frame.updateDegreeHistOpacity();
      appState.graph.degreeselection = selectionNode;
      appState.graph.degreebrushed = true;
    } else {
      if (appState.graph.selectedNodes.length > 1) {
        appState.graph.frame.selection = appState.graph.selectedNodes;
        appState.graph.frame.updateSelectionOpacity();
        appState.graph.degreeselection = [];
        appState.graph.degreebrushed = false;
      } else if (
        appState.graph.selectedNodes.length == 1 &&
        appState.graph.selectedNodes[0]
      ) {
        const thenode = appState.graph.selectedNodes[0];
        const selectionNode =
          appState.graph.frame.getNeighborNodesFromGraph(thenode);
        appState.graph.frame.degreehighlight = selectionNode;
        appState.graph.frame.updateDegreeHistOpacity();
        appState.graph.degreeselection = selectionNode;
        appState.graph.degreebrushed = true;
      }
    }
  };

  renderNoNodeDegreeBrush = () => (
    <SVGBrush
      // Defines the boundary of the brush.
      // Strictly uses the format [[x0, y0], [x1, y1]] for both 1d and 2d brush.
      // Note: d3 allows the format [x, y] for 1d brush.
      selection={appState.graph.clearBrush ? null : undefined}
      extent={[
        [this.margin.left, this.brushmargin.top],
        [
          this.allwidth - this.brushmargin.right,
          this.allheight - this.brushmargin.bottom,
        ],
      ]}
      // Obtain mouse positions relative to the current svg during mouse events.
      // By default, getEventMouse returns [event.clientX, event.clientY]
      getEventMouse={(event) => {
        const { clientX, clientY } = event;
        const { left, top } = this.degreesvg.getBoundingClientRect();
        // console.log([clientX - left, clientY - top])
        return [clientX - left, clientY - top];
      }}
      brushType="x" // "x"
      onBrushStart={this.onDegreeBrushStart}
      onBrush={this.onDegreeBrush}
      onBrushEnd={this.onNoNodeDegreeBrushEnd}
    />
  );

  renderSelectDegreeBrush = () => (
    <SVGBrush
      // Defines the boundary of the brush.
      // Strictly uses the format [[x0, y0], [x1, y1]] for both 1d and 2d brush.
      // Note: d3 allows the format [x, y] for 1d brush.
      selection={appState.graph.clearBrush ? null : undefined}
      extent={[
        [this.margin.left, this.brushmargin.top],
        [
          this.allwidth - this.brushmargin.right,
          this.allheight - this.brushmargin.bottom,
        ],
      ]}
      // Obtain mouse positions relative to the current svg during mouse events.
      // By default, getEventMouse returns [event.clientX, event.clientY]
      getEventMouse={(event) => {
        const { clientX, clientY } = event;
        const { left, top } = this.degreesvg.getBoundingClientRect();
        // console.log([clientX - left, clientY - top])
        return [clientX - left, clientY - top];
      }}
      brushType="x" // "x"
      onBrushStart={this.onDegreeBrushStart}
      onBrush={this.onDegreeBrush}
      onBrushEnd={this.onSelectDegreeBrushEnd}
    />
  );

  render() {
    this.prevTick = "";
    this.maxDegreeDict = {};
    this.maxDegreeCount = 0;
    this.maxDistanceCount = 0;

    if (
      appState.graph.selectedNodes.length > 1 &&
      this.SelectionDistanceFromLatLonIn() &&
      this.SelectionDistanceFromLatLonIn()[0]
    ) {
      // self = this

      // Array(100).fill().map(Math.random);

      return (
        <div
          className={
            classnames()
            // 'overlay-card',
            // "right-overlay-card",
            // "transparent-frame"
          }
          style={{
            // width: '40vw',
            height: "40vh",
            // border:'#C0C0C0',
            // borderStyle:'solid',
          }}
        >
          <div className={classnames(Classes.CARD, "node-details-table")}>
            <table
              className={classnames(
                Classes.TABLE,
                Classes.TABLE_STRIPED,
                "node-details-table-content"
              )}
              style={{
                width: "100%",
                padding: "0",
                fontSize: "12px",
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
                  <td style={{ padding: "5px 10px" }}>
                    {" "}
                    {appState.graph.selectedNodes.length +
                      " nodes are selected"}
                  </td>
                  {/* <td style={{ padding: '5px 10px', whiteSpace: 'normal' }}>{formatLongFloat(this.props.node[it])}</td> */}
                </tr>
                {/* <tr>
                  <td style={{ padding: '5px 10px' }}> {'The average distance is ' + this.SelectionDistanceFromLatLonIn()[0] + ' km'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '5px 10px' }}> {'The network density (undirected network) is ' + this.SelectionDensity()}</td>
                </tr> */}
                {/* {appState.graph.allPropertiesKeyList.map((it, i) => (
                  
                ))} */}
              </tbody>
            </table>
          </div>

          <div style={{ height: "100%" }}>
            {/* <text className="distribution-title" >Distance Distribution</text> */}
            <svg
              width={"100%"}
              height={"35vh"}
              // className="hist"
              id="edgesvg"
              ref={(input) => (this.edgesvg = input)}
              // ref = {ref}
            >
              <text
                x="50%"
                y="10%"
                text-anchor="middle"
                fontSize="12px"
                fontSizeAdjust="inherit"
              >
                Edge Distance Distribution
              </text>
              <Histogram
                ariaLabel="distance_dis"
                orientation="vertical"
                label="Edge Distance Distribution"
                height={this.allheight}
                width={this.single_allwidth}
                cumulative={false}
                normalized={false}
                binCount={25}
                margin={this.margin}
                valueAccessor={(datum) => {
                  return datum;
                }}
                binType="numeric"
              >
                <BarSeries
                  animated={false}
                  rawData={this.SelectionDistanceFromLatLonIn()[1]}
                  fill={(d, i) => {
                    if (i === 0) {
                      this.maxDistanceCount = 0;
                      this.distBinData = [];
                    }
                    if (d.data.length > this.maxDistanceCount) {
                      this.maxDistanceCount = d.data.length;
                    }
                    if (d.data.length > 0) {
                      this.distBinData.push({
                        mind: min(d.data),
                        maxd: max(d.data),
                      });
                    } else {
                      this.distBinData.push({
                        mind: Infinity,
                        maxd: -1,
                      });
                    }

                    // console.log(this.distBinData)
                    // console.log(i)
                    // console.log(d)
                    return "#08519c";
                  }}
                />
                <XAxis
                  numTicks={5}
                  label="Edge Distance (km)"
                  fontSize="12px"
                  tickLabelProps={(d, i) => ({ angle: 45 })}
                />
                {this.SelectionDistanceFromLatLonIn()[1].length < 10 ? (
                  <YAxis
                    label="Frequency"
                    fontSize="12px"
                    tickFormat={(tick, ti) => {
                      console.log(tick, this.maxDistanceCount / 2);
                      if (parseInt(tick).toString() == this.prevTick) {
                        return "";
                      } else {
                        this.prevTick = parseInt(tick).toString();
                        return parseInt(tick).toString();
                      }

                      // return parseInt(tick * this.SelectionDistanceFromLatLonIn()[1].length).toString() == "0" ? "" : parseInt(tick * this.SelectionDistanceFromLatLonIn()[1].length).toString()
                    }}
                  />
                ) : (
                  <YAxis
                    label="Frequency"
                    fontSize="12px"
                    tickFormat={(tick, ti) => {
                      return parseInt(tick).toString();

                      // return parseInt(tick * this.SelectionDistanceFromLatLonIn()[1].length).toString() == "0" ? "" : parseInt(tick * this.SelectionDistanceFromLatLonIn()[1].length).toString()
                    }}
                  />
                )}
              </Histogram>
              {this.renderEdgeBrush()}
            </svg>
            {/* <svg
              width={"50%"}
              height={"35vh"}
              // className="hist"
              id="degreesvg"
              ref={(input) => (this.degreesvg = input)}
              // ref = {ref}
            > */}
            {/* <text x="50%" y="10%" text-anchor="middle" fontSize="12px" fontSizeAdjust="inherit">Node Degree Distribution</text>
                <Histogram
                  ariaLabel="degree_dis"
                  orientation="vertical"
                  height={this.allheight}
                  width={this.allwidth}
                  margin={this.margin}
                  cumulative={false}
                  normalized={false}
                  binCount={25}
                  valueAccessor={(datum) => datum}
                  binType="numeric"
                >
                  <BarSeries
                    fill={(d, i) => {
                      if (i === 0) {
                        this.maxDistanceCount = 0;
                        this.degreeBinData = []
                      }
                      if (d.data.length > this.maxDistanceCount) {
                        this.maxDistanceCount = d.data.length;
                      }
                      if (d.data.length > 0) {
                        this.degreeBinData.push({
                          mind: min(d.data),
                          maxd: max(d.data)
                        })
                      } else {
                        this.degreeBinData.push({
                          mind: Infinity,
                          maxd: -1
                        })
                      }



                      // console.log(this.distBinData)
                      // console.log(i)
                      // console.log(d)
                      return "#08519c"
                    }}
                    animated={false}
                    rawData={appState.graph.selectedNodes.map((node, i) => {
                      if (i == 0) {
                        this.maxDegreeCount = 0;
                      }
                      if (node.data.ref.degree in this.maxDegreeDict) {
                        this.maxDegreeDict[node.data.ref.degree] += 1;
                        if (this.maxDegreeDict[node.data.ref.degree] > this.maxDegreeCount) {
                          this.maxDegreeCount = this.maxDegreeDict[node.data.ref.degree]
                        }
                      } else {
                        this.maxDegreeDict[node.data.ref.degree] = 1;
                        if (this.maxDegreeDict[node.data.ref.degree] > this.maxDegreeCount) {
                          this.maxDegreeCount = this.maxDegreeDict[node.data.ref.degree]
                        }
                      }
                      // console.log(this.maxDegreeCount, node.data.ref.degree);
                      if(node.data.ref.degree>0){
                        return node.data.ref.degree
                      }else{
                        return 0
                      }
                    })}
                  />
                  <XAxis numTicks={5} label="Degree" fontSize="12px" tickLabelProps={(d, i) => ({ angle: 45 })} />
                  {this.SelectionDistanceFromLatLonIn()[1].length < 10 ?
                    <YAxis label="Frequency" fontSize="12px" tickFormat={
                      (tick, ti) => {
                        console.log(tick, this.prevTick);
                        if (parseInt(tick).toString() == this.prevTick) {
                          return "";
                        } 
                        else {
                          this.prevTick = parseInt(tick).toString();
                          return parseInt(tick).toString();
                        }
                          
  
                        // return parseInt(tick * this.SelectionDistanceFromLatLonIn()[1].length).toString() == "0" ? "" : parseInt(tick * this.SelectionDistanceFromLatLonIn()[1].length).toString()
                      }} />
                    :
                    <YAxis label="Frequency" fontSize="12px" tickFormat={
                      (tick, ti) => {
                          // console.log(tick);
                          if (parseInt(tick).toString() == this.prevTick) {
                            return "";
                          } 
                          else {
                            this.prevTick = parseInt(tick).toString();
                            return parseInt(tick).toString();
                          }
  
                        // return parseInt(tick * this.SelectionDistanceFromLatLonIn()[1].length).toString() == "0" ? "" : parseInt(tick * this.SelectionDistanceFromLatLonIn()[1].length).toString()
                      }} />
                  }
                </Histogram>
                {this.renderSelectDegreeBrush()} */}
            {/* </svg> */}
          </div>
        </div>
      );
    } else if (
      appState.graph.mapClicked &&
      this.SelectionDistanceFromLatLonIn() &&
      this.SelectionDistanceFromLatLonIn()[0]
    ) {
      const thenode = appState.graph.mapClicked;
      const selectneighbors =
        appState.graph.frame.getNeighborNodesFromGraph(thenode);
      // appState.graph.selectedNodes = selectneighbors
      if (selectneighbors.length > 1) {
        return (
          //
          <div
            className={
              classnames()
              // 'overlay-card',
              // "right-overlay-card",
              // "transparent-frame"
            }
            style={{
              // width: '40vw',
              height: "40vh",
              // border:'#C0C0C0',
              // borderStyle:'solid',
            }}
          >
            <div className={classnames(Classes.CARD, "node-details-table")}>
              <table
                className={classnames(
                  Classes.TABLE,
                  Classes.TABLE_STRIPED,
                  "node-details-table-content"
                )}
                style={{
                  width: "100%",
                  padding: "0",
                  fontSize: "12px",
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
                    <td style={{ padding: "5px 10px" }}>
                      {" "}
                      {selectneighbors.length + " nodes are selected"}
                    </td>
                    {/* <td style={{ padding: '5px 10px', whiteSpace: 'normal' }}>{formatLongFloat(this.props.node[it])}</td> */}
                  </tr>
                  {/* <tr>
                    <td style={{ padding: '5px 10px' }}> {'The average distance is ' + this.SelectionDistanceFromLatLonIn()[0] + ' km'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px 10px' }}> {'The network density (undirected network) is ' + this.SelectionDensity()}</td>
                  </tr> */}
                  {/* {appState.graph.allPropertiesKeyList.map((it, i) => (
                    
                  ))} */}
                </tbody>
              </table>
            </div>

            <div style={{ height: "100%" }}>
              {/* <text className="distribution-title" >Distance Distribution</text> */}
              <svg
                width={"100%"}
                height={"35vh"}
                // className="hist"
                id="edgesvg"
                ref={(input) => (this.edgesvg = input)}
                // ref = {ref}
              >
                <text
                  x="50%"
                  y="10%"
                  text-anchor="middle"
                  fontSize="12px"
                  fontSizeAdjust="inherit"
                >
                  Edge Distance Distribution
                </text>
                <Histogram
                  ariaLabel="distance_dis"
                  orientation="vertical"
                  label="Edge Distance Distribution"
                  height={this.allheight}
                  width={this.single_allwidth}
                  cumulative={false}
                  normalized={false}
                  binCount={25}
                  margin={this.margin}
                  valueAccessor={(datum) => {
                    return datum;
                  }}
                  binType="numeric"
                >
                  <BarSeries
                    animated={false}
                    rawData={this.SelectionDistanceFromLatLonIn()[1]}
                    fill={(d, i) => {
                      if (i === 0) {
                        this.maxDistanceCount = 0;
                        this.distBinData = [];
                      }
                      if (d.data.length > this.maxDistanceCount) {
                        this.maxDistanceCount = d.data.length;
                      }
                      if (d.data.length > 0) {
                        this.distBinData.push({
                          mind: min(d.data),
                          maxd: max(d.data),
                        });
                      } else {
                        this.distBinData.push({
                          mind: Infinity,
                          maxd: -1,
                        });
                      }

                      // console.log(this.distBinData)
                      // console.log(i)
                      // console.log(d)
                      return "#08519c";
                    }}
                  />
                  <XAxis
                    numTicks={5}
                    label="Edge Distance (km)"
                    fontSize="12px"
                    tickLabelProps={(d, i) => ({ angle: 45 })}
                  />
                  {this.SelectionDistanceFromLatLonIn()[1].length < 10 ? (
                    <YAxis
                      label="Frequency"
                      fontSize="12px"
                      tickFormat={(tick, ti) => {
                        console.log(tick, this.maxDistanceCount / 2);
                        if (parseInt(tick).toString() == this.prevTick) {
                          return "";
                        } else {
                          this.prevTick = parseInt(tick).toString();
                          return parseInt(tick).toString();
                        }

                        // return parseInt(tick * this.SelectionDistanceFromLatLonIn()[1].length).toString() == "0" ? "" : parseInt(tick * this.SelectionDistanceFromLatLonIn()[1].length).toString()
                      }}
                    />
                  ) : (
                    <YAxis
                      label="Frequency"
                      fontSize="12px"
                      tickFormat={(tick, ti) => {
                        return parseInt(tick).toString();

                        // return parseInt(tick * this.SelectionDistanceFromLatLonIn()[1].length).toString() == "0" ? "" : parseInt(tick * this.SelectionDistanceFromLatLonIn()[1].length).toString()
                      }}
                    />
                  )}
                </Histogram>
                {this.renderEdgeBrush()}
              </svg>
              {/* <svg
                width={"50%"}
                height={"35vh"}
                // className="hist"
                id="degreesvg"
                ref={(input) => (this.degreesvg = input)}
                // ref = {ref}
              >
                <text
                  x="50%"
                  y="10%"
                  text-anchor="middle"
                  fontSize="12px"
                  fontSizeAdjust="inherit"
                >
                  Node Degree Distribution
                </text>
                <Histogram
                  ariaLabel="degree_dis"
                  orientation="vertical"
                  height={this.allheight}
                  width={this.allwidth}
                  margin={this.margin}
                  cumulative={false}
                  normalized={false}
                  binCount={25}
                  valueAccessor={(datum) => datum}
                  binType="numeric"
                >
                  <BarSeries
                    fill={(d, i) => {
                      if (i === 0) {
                        this.maxDistanceCount = 0;
                        this.degreeBinData = [];
                      }
                      if (d.data.length > this.maxDistanceCount) {
                        this.maxDistanceCount = d.data.length;
                      }
                      if (d.data.length > 0) {
                        this.degreeBinData.push({
                          mind: min(d.data),
                          maxd: max(d.data),
                        });
                      } else {
                        this.degreeBinData.push({
                          mind: Infinity,
                          maxd: -1,
                        });
                      }

                      // console.log(this.distBinData)
                      // console.log(i)
                      // console.log(d)
                      return "#08519c";
                    }}
                    animated={false}
                    rawData={selectneighbors.map((node, i) => {
                      if (i == 0) {
                        this.maxDegreeCount = 0;
                      }
                      if (node.data.ref.degree in this.maxDegreeDict) {
                        this.maxDegreeDict[node.data.ref.degree] += 1;
                        if (
                          this.maxDegreeDict[node.data.ref.degree] >
                          this.maxDegreeCount
                        ) {
                          this.maxDegreeCount =
                            this.maxDegreeDict[node.data.ref.degree];
                        }
                      } else {
                        this.maxDegreeDict[node.data.ref.degree] = 1;
                        if (
                          this.maxDegreeDict[node.data.ref.degree] >
                          this.maxDegreeCount
                        ) {
                          this.maxDegreeCount =
                            this.maxDegreeDict[node.data.ref.degree];
                        }
                      }
                      // console.log(this.maxDegreeCount, node.data.ref.degree);
                      if (node.data.ref.degree > 0) {
                        return node.data.ref.degree;
                      } else {
                        return 0;
                      }
                    })}
                  />
                  <XAxis
                    numTicks={5}
                    label="Degree"
                    fontSize="12px"
                    tickLabelProps={(d, i) => ({ angle: 45 })}
                  />
                  {this.SelectionDistanceFromLatLonIn()[1].length < 10 ? (
                    <YAxis
                      label="Frequency"
                      fontSize="12px"
                      tickFormat={(tick, ti) => {
                        // console.log(tick, this.prevTick);
                        if (parseInt(tick).toString() == this.prevTick) {
                          return "";
                        } else {
                          this.prevTick = parseInt(tick).toString();
                          return parseInt(tick).toString();
                        }

                        // return parseInt(tick * this.SelectionDistanceFromLatLonIn()[1].length).toString() == "0" ? "" : parseInt(tick * this.SelectionDistanceFromLatLonIn()[1].length).toString()
                      }}
                    />
                  ) : (
                    <YAxis
                      label="Frequency"
                      fontSize="12px"
                      tickFormat={(tick, ti) => {
                        // console.log(tick);
                        if (parseInt(tick).toString() == this.prevTick) {
                          return "";
                        } else {
                          this.prevTick = parseInt(tick).toString();
                          return parseInt(tick).toString();
                        }

                        // return parseInt(tick * this.SelectionDistanceFromLatLonIn()[1].length).toString() == "0" ? "" : parseInt(tick * this.SelectionDistanceFromLatLonIn()[1].length).toString()
                      }}
                    />
                  )}
                </Histogram>
                {this.renderSelectDegreeBrush()}
              </svg> */}
            </div>
          </div>
        );
      } else {
        return <div></div>;
      }
    } else if (
      appState.graph.selectedNodes.length == 1 &&
      appState.graph.selectedNodes[0]
    ) {
      return (
        //
        <div
          className={
            classnames()
            // 'overlay-card',
            // "right-overlay-card",
            // "transparent-frame"
          }
          style={{
            // width: '40vw',
            height: "40vh",
            // border:'#C0C0C0',
            // borderStyle:'solid',
          }}
        >
          <div className={classnames(Classes.CARD, "node-details-table")}>
            <table
              className={classnames(
                Classes.TABLE,
                Classes.TABLE_STRIPED,
                "node-details-table-content"
              )}
              style={{
                width: "100%",
                padding: "0",
                fontSize: "12px",
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
                  <td style={{ padding: "5px 10px" }}>
                    {" "}
                    {"1 nodes are selected"}
                  </td>
                  {/* <td style={{ padding: '5px 10px', whiteSpace: 'normal' }}>{formatLongFloat(this.props.node[it])}</td> */}
                </tr>
                {/* <tr>
                  <td style={{ padding: '5px 10px' }}> {'The average distance is ' + this.SelectionDistanceFromLatLonIn()[0] + ' km'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '5px 10px' }}> {'The network density (undirected network) is ' + this.SelectionDensity()}</td>
                </tr> */}
                {/* {appState.graph.allPropertiesKeyList.map((it, i) => (
                  
                ))} */}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else if (
      this.SelectionDistanceFromLatLonIn() &&
      this.SelectionDistanceFromLatLonIn()[0]
    ) {
      // when no node is selected, show the result of the whole network
      return (
        <div
          className={
            classnames()
            // 'overlay-card',
            // "right-overlay-card",
            // "transparent-frame"
          }
          style={{
            // width: '40vw',
            height: "40vh",
            // border:'#C0C0C0',
            // borderStyle:'solid',
          }}
        >
          <div className={classnames(Classes.CARD, "node-details-table")}>
            <table
              className={classnames(
                Classes.TABLE,
                Classes.TABLE_STRIPED,
                "node-details-table-content"
              )}
              style={{
                width: "100%",
                padding: "0",
                fontSize: "12px",
              }}
            >
              <thead></thead>
              <tbody>
                <tr>
                  <td style={{ padding: "5px 10px" }}>
                    {" "}
                    {"No node is selected"} |{" "}
                    {`Size by ${
                      appState.graph.hasGraph
                        ? appState.graph.nodes.sizeBy
                        : "NULL"
                    }`}{" "}
                    |{" "}
                    {`Color by ${
                      appState.graph.hasGraph
                        ? appState.graph.nodes.colorBy
                        : "NULL"
                    }`}
                  </td>
                </tr>
                {/* <tr>
                <td style={{ padding: '5px 10px' }}> {`The average degree is ${appState.graph.hasGraph ? appState.graph.degree().toFixed(3) : 'NULL'}`}</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 10px' }}> {`The average density is ${appState.graph.hasGraph ? (appState.graph.density() ).toFixed(3) : 'NULL'}`}</td>
              </tr> */}
              </tbody>
            </table>
          </div>

          <div style={{ height: "20vw" }}>
            <svg
              width={"100%"}
              height={"35vh"}
              // className="hist"
              id="edgesvg"
              ref={(input) => (this.edgesvg = input)}
              // ref = {ref}
            >
              <text
                x="50%"
                y="10%"
                text-anchor="middle"
                fontSize="12px"
                fontSizeAdjust="inherit"
              >
                Edge Distance Distribution
              </text>
              <Histogram
                ariaLabel="distance_dis"
                orientation="vertical"
                height={this.allheight}
                width={this.single_allwidth}
                cumulative={false}
                normalized={true}
                binCount={25}
                margin={this.margin}
                valueAccessor={(datum) => {
                  return datum;
                }}
                binType="numeric"
              >
                <BarSeries
                  animated={false}
                  rawData={this.SelectionDistanceFromLatLonIn()[1]}
                  fill={(d, i) => {
                    if (i === 0) {
                      this.distBinData = [];
                    }

                    if (d.data.length > 0) {
                      this.distBinData.push({
                        mind: min(d.data),
                        maxd: max(d.data),
                      });
                    } else {
                      this.distBinData.push({
                        mind: Infinity,
                        maxd: -1,
                      });
                    }
                    return "#08519c";
                  }}
                />
                <XAxis
                  numTicks={5}
                  label="Edge Distance (km)"
                  fontSize="12px"
                  tickLabelProps={(d, i) => ({ angle: 45 })}
                />
                <YAxis
                  label="Frequency"
                  fontSize="12px"
                  tickFormat={(tick, ti) => {
                    // console.log(tick, this.SelectionDistanceFromLatLonIn()[1].length);
                    return parseInt(
                      tick * this.SelectionDistanceFromLatLonIn()[1].length
                    ).toString();
                  }}
                />
              </Histogram>
              {this.renderEdgeBrush()}
            </svg>

            {/* <text className="distribution-title">Degree Distribution</text> */}
            {/* <svg
              width={"50%"}
              height={"35vh"}
              // className="hist"
              id="degreesvg"
              ref={(input) => (this.degreesvg = input)}
              // ref = {ref}
            >
              <text
                x="50%"
                y="10%"
                text-anchor="middle"
                fontSize="12px"
                fontSizeAdjust="inherit"
              >
                Node Degree Distribution
              </text>
              <Histogram
                ariaLabel="degree_dis"
                orientation="vertical"
                height={this.allheight}
                width={this.allwidth}
                cumulative={false}
                normalized={true}
                binCount={25}
                margin={this.margin}
                valueAccessor={(datum) => {
                  return datum;
                }}
                binType="numeric"
              >
                <BarSeries
                  fill={(d, i) => {
                    if (i === 0) {
                      this.degreeBinData = [];
                    }

                    if (d.data.length > 0) {
                      this.degreeBinData.push({
                        mind: min(d.data),
                        maxd: max(d.data),
                      });
                    } else {
                      this.degreeBinData.push({
                        mind: Infinity,
                        maxd: -1,
                      });
                    }
                    return "#08519c";
                  }}
                  animated={false}
                  rawData={appState.graph.frame.getNodeList().map((node) => {
                    if (node.data.ref.degree > 0) {
                      return node.data.ref.degree;
                    } else {
                      return 0;
                    }
                  })}
                />
                <XAxis
                  numTicks={5}
                  label="Degree"
                  fontSize="12px"
                  tickLabelProps={(d, i) => ({ angle: 45 })}
                /> */}
            {/* <YAxis fontSize="12px" /> */}
            {/* <YAxis
                  numTicks={5}
                  label="Frequency"
                  fontSize="12px"
                  tickFormat={(tick, ti) => {
                    return parseInt(
                      tick * appState.graph.frame.getNodeList().length
                    ).toString();
                  }}
                />
              </Histogram>
              {this.renderNoNodeDegreeBrush()} */}
            {/* </svg> */}
          </div>
        </div>
      );
    } else {
      return <div></div>;
    }

    ///

    ///
  }
}

export default SelectionDetail;
