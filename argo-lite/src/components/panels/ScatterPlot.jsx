import React from "react";
import classnames from "classnames";
import uniq from "lodash/uniq";
import { Button, Classes } from "@blueprintjs/core";
import appState from "../../stores";
import { observer } from "mobx-react/index";
import { observable, computed, action, runInAction } from "mobx";
import {
  scaleLinear,
  scalePoint,
  max,
  min,
  axisLeft,
  axisBottom,
  select,
  group,
} from "d3";
import { brush, brushY } from "d3-brush";
import XYSelect from "../utils/XYSelect";
import SVGBrush from "react-svg-brush";
import path from "ngraph.path";
import * as SvgSaver from "svgsaver";
import { CSVLink, CSVDownload } from "react-csv";
import { transform } from "lodash";
// import SvgSaver from svgsaver

var def = require("../../graph-frontend/src/imports").default;

// const settings = {
//   width: 150,
//   height: 150,
//   padding: 10,
//   // numDataPoints: 50,
//   // maxRange: () => Math.random() * 1000
// };

@observer
class ScatterPlot extends React.Component {
  @observable data = appState.graph.frame
    .getNodeList()
    .filter(
      (node) =>
        !isNaN(parseFloat(node.data.ref[appState.graph.scatterplot.x])) &&
        !isNaN(parseFloat(node.data.ref[appState.graph.scatterplot.y]))
    );

  margin = { top: 40, right: 10, bottom: 60, left: 70 };
  // clustermargin = {top: 50, right: 50, bottom: 50, left: 50}
  width = window.innerWidth * 0.48 - this.margin.left - this.margin.right;
  height = window.innerHeight * 0.35 - this.margin.top - this.margin.bottom;
  cr = 3;
  maxhop = undefined;
  formatXtext = [];
  infinityhop = [];

  constructor(props) {
    super(props);
    this.circles = React.createRef();
    this.state = { csvarray: [] };
  }

  downloadCSV = () => {
    appState.graph.frame
      .getNodeList()
      .filter(
        (node) =>
          !isNaN(parseFloat(node.data.ref[appState.graph.scatterplot.x])) &&
          !isNaN(parseFloat(node.data.ref[appState.graph.scatterplot.y]))
      );
    let column1, column2;

    let header = [];
    this.setState({
      csvarray: [],
    });
    // // this.state.;
    // if (appState.graph.scatterplot.x === 'shortest path') {
    //   column1 = this.infinityhop
    //   header.push('shortest path')
    // } else if (appState.graph.scatterplot.x === 'pair distance') {
    //   column1 = appState.graph.rawGraph.paths.map((path, i) => {
    //     return parseFloat(path['distance'])
    //   })
    //   header.push('pair distance')
    // } else {
    //   header.push(appState.graph.scatterplot.x)
    //   column1 = appState.graph.frame.getNodeList().map((d) => {
    //     return parseFloat(d.data.ref[appState.graph.scatterplot.x])
    //   })
    // }

    // if (appState.graph.scatterplot.y === 'shortest path') {
    //   column2 = this.infinityhop
    //   header.push('shortest path')
    // } else if (appState.graph.scatterplot.y === 'pair distance') {
    //   column2 = appState.graph.rawGraph.paths.map((path, i) => {
    //     return parseFloat(path['distance'])
    //   })
    //   header.push('pair distance')
    // } else {
    //   header.push(appState.graph.scatterplot.y)
    //   column2 = appState.graph.frame.getNodeList().map((d) => {
    //     return parseFloat(d.data.ref[appState.graph.scatterplot.y])
    //   })
    // }

    //download for all
    let temp = [];
    header = appState.graph.metadata.nodeComputed.filter(
      (n) => n !== "shortest path" && n !== "pair distance"
    );
    header.unshift("id");
    temp.push(header);
    // temp[0].unshift('id')
    appState.graph.frame.getNodeList().forEach((node) => {
      const noderow = [];
      // noderow.push(node.id)
      header.forEach((column) => {
        noderow.push(node.data.ref[column]);
      });
      temp.push(noderow);
    });

    // temp.push(header)
    // for (var i = 0; i < column2.length && i < column1.length; i++) {
    //   temp.push([column1[i], column2[i]]);
    // }
    this.setState({
      csvarray: temp,
    });
  };

  onBrushStart = ({ target, type, selection, sourceEvent }) => {
    appState.graph.frame.selection = [];
    appState.graph.selectedNodes = [];
    appState.graph.edgeselection = [];
    appState.graph.mapClicked = null;
    appState.graph.clearBrush = false;
  };
  onBrush = ({ target, type, selection, sourceEvent }) => {};
  onBrushEnd = ({ target, type, selection, sourceEvent }) => {
    appState.graph.selectedNodes = [];
    const selectionNodeID = [];
    const svgElement = select(this.svg);
    const circles = svgElement.selectAll("circle");
    if (selection) {
      const brushBounds = {
        x0: selection[0][0] - this.margin.left,
        x1: selection[1][0] - this.margin.left,
        y0: selection[0][1] - this.margin.top - this.cr,
        y1: selection[1][1] - this.margin.top - this.cr,
      };
      // console.log(
      //   selection[0][1],
      //   selection[1][1],
      //   brushBounds.y1,
      //   brushBounds.y0
      // );
      // console the number of circles
      // console.log("circle_num", circles.size());
      let filteredlinks = [];
      circles.each(function (d, i) {
        const nodecx = parseFloat(select(this).attr("cx"));
        const nodecy = parseFloat(select(this).attr("cy"));
        // console.log(nodecx, nodecy);
        if (
          nodecx >= brushBounds.x0 &&
          nodecx <= brushBounds.x1 &&
          nodecy >= brushBounds.y0 &&
          nodecy <= brushBounds.y1
        ) {
          // if not degree-degree plot
          if (
            appState.graph.scatterplot.x !== "nodes with larger degree" &&
            appState.graph.scatterplot.y !== "nodes with smaller degree"
          ) {
            selectionNodeID.push(select(this).attr("id"));
          } else {
            console.log(
              select(this).attr("from_id"),
              select(this).attr("to_id")
            );
            // degree-degree plot
            // selectionNodeID.push(select(this).attr("from_id"));
            // selectionNodeID.push(select(this).attr("to_id"));
            // find edges based on from_id and to_id, add them to edgeselection
            let linkobjs = [];
            appState.graph.frame.getNodeList().forEach((node) => {
              if (node.linkObjs && node.linkObjs.length > 0) {
                linkobjs.push(...node.linkObjs);
              }
            });
            // console.log(linkobjs);
            linkobjs.forEach((edge) => {
              // console.log(edge.source.id, edge.target.id);

              if (
                (edge.source.id === select(this).attr("from_id") &&
                  edge.target.id === select(this).attr("to_id")) ||
                (edge.target.id === select(this).attr("from_id") &&
                  edge.source.id === select(this).attr("to_id"))
              ) {
                console.log("filtered edge");
                filteredlinks.push(edge);
              }
            });
            console.log(filteredlinks);
            // const filteredge = linkobjs.filter(
            //   (edge) =>
            //     (edge.source.id === select(this).attr("from_id") &&
            //       edge.target.id === select(this).attr("to_id")) ||
            //     (edge.target.id === select(this).attr("from_id") &&
            //       edge.source.id === select(this).attr("to_id"))
            // );
            appState.graph.edgeselection = filteredlinks;
            // appState.graph.frame.getEdgeList().forEach((edge) => {
            //   console.log(edge);
            //   if (
            //     edge.fromId === select(this).attr("from_id") &&
            //     edge.toId === select(this).attr("to_id")
            //   ) {
            //     console.log("findedge");
            //     appState.graph.edgeselection.push(edge);
            //   }
            // });
            // console.log(appState.graph.edgeselection);
          }
          // selectionNodeID.push(select(this).attr("id"));
        }
      });

      const selectionNode = appState.graph.frame.getNodeList().filter((node) =>
        // console.log(node)
        selectionNodeID.includes(node.id)
      );
      appState.graph.frame.selection = selectionNode;
      appState.graph.selectedNodes = selectionNode;

      appState.graph.frame.highlightEdgeInDegreePlot(filteredlinks);
      // console.log(selectionNode)
      appState.graph.frame.updateSelectionOpacity();
    } else {
      //click to clear selection
      appState.graph.frame.selection = [];
      appState.graph.frame.updateSelectionOpacity();
    }
  };

  renderBrush = () => (
    <SVGBrush
      // Defines the boundary of the brush.
      // Strictly uses the format [[x0, y0], [x1, y1]] for both 1d and 2d brush.
      // Note: d3 allows the format [x, y] for 1d brush.
      // transform={"translate(0," + this.margin.top +")"}
      selection={appState.graph.clearBrush ? null : undefined}
      extent={[
        [this.margin.left, this.margin.top],
        [this.width + this.margin.left, this.height + this.margin.top],
      ]}
      // Obtain mouse positions relative to the current svg during mouse events.
      // By default, getEventMouse returns [event.clientX, event.clientY]
      getEventMouse={(event) => {
        const { clientX, clientY } = event;
        const { left, top } = this.svg.getBoundingClientRect();
        // console.log([clientX - left, clientY - top])
        return [clientX - left, clientY - top];
      }}
      brushType="2d" // "x"
      onBrushStart={this.onBrushStart}
      onBrush={this.onBrush}
      onBrushEnd={this.onBrushEnd}
    />
  );

  // componentDidMount() {
  //   var svg = select('.scatterchart');
  //   //Do svg stuff
  //   const brush = brushY()
  //     .on("brush", brushed);

  // svg.append("g")
  // .call(brush);
  //   function brushed({selection}) {
  //     console.log(selection)
  //   }

  // }

  render() {
    if (appState.graph.hasGraph) {
      let x, y;
      // set up x/y axes scales
      if (
        appState.graph.scatterplot.x === "network density" ||
        appState.graph.scatterplot.x === "standard distance"
      ) {
        x = scaleLinear()
          .domain([
            0,
            max(appState.graph.densityDistance, function (d) {
              return parseFloat(d[appState.graph.scatterplot.x]);
            }),
          ])
          .range([0, this.width]);
      } else if (appState.graph.scatterplot.x === "shortest path") {
        const shortpathhop = appState.graph.rawGraph.paths.map(function (
          path,
          i
        ) {
          return path["path"].length - 1;
        });
        shortpathhop.sort();
        this.maxhop = shortpathhop[shortpathhop.length - 1];

        this.infinityhop = shortpathhop.map((pathlen, i) => {
          if (pathlen == -1) {
            return this.maxhop + 1;
          } else {
            return pathlen;
          }
        });
        this.infinityhop.sort();
        // console.log()
        // this.formatXtext =  [...new Set(this.infinityhop)].map((pathlen,i)=>{
        //   if(pathlen == (this.maxhop +1)){
        //     return 'None'
        //   }else{
        //     return pathlen.toString()
        //   }
        // })
        // console.log(this.formatXtext)
        x = scalePoint().domain(this.infinityhop).range([0, this.width]);
      } else if (appState.graph.scatterplot.x === "pair distance") {
        const pairdistance = appState.graph.rawGraph.paths.map((path, i) => {
          return parseFloat(path["distance"]);
        });
        x = scaleLinear()
          .domain([0, max(pairdistance)])
          .range([0, this.width]);
      } else if (appState.graph.scatterplot.x === "nodes with larger degree") {
        const largerDegrees = appState.graph.frame.getEdgeList().map((edge) => {
          return max([edge.sourceDegree, edge.targetDegree]);
        });
        x = scaleLinear()
          .domain([0, max(largerDegrees)])
          .range([0, this.width]);
      } else if (appState.graph.scatterplot.x === "order") {
        x = scaleLinear()
          .domain([0, appState.graph.ann_order])
          .range([0, this.width]);
        console.log(x);
      } else {
        x = scaleLinear()
          .domain([
            0,
            max(appState.graph.frame.getNodeList(), function (d) {
              return parseFloat(d.data.ref[appState.graph.scatterplot.x]);
            }),
          ])
          .range([0, this.width]);
        console.log(x);
      }

      if (
        appState.graph.scatterplot.y === "network density" ||
        appState.graph.scatterplot.y === "standard distance"
      ) {
        y = scaleLinear()
          .domain([
            0,
            max(appState.graph.densityDistance, function (d) {
              return parseFloat(d[appState.graph.scatterplot.y]);
            }),
          ])
          .range([this.height, 0]);
      } else if (appState.graph.scatterplot.y === "shortest path") {
        const shortpathhop = appState.graph.rawGraph.paths.map(function (
          path,
          i
        ) {
          return path["path"].length - 1;
        });
        shortpathhop.sort();
        this.maxhop = shortpathhop[shortpathhop.length - 1];

        this.infinityhop = shortpathhop.map((pathlen, i) => {
          if (pathlen == -1) {
            return this.maxhop + 1;
          } else {
            return pathlen;
          }
        });
        this.infinityhop.sort().reverse();

        y = scalePoint().domain(this.infinityhop).range([0, this.height]);
      } else if (appState.graph.scatterplot.y === "pair distance") {
        const pairdistance = appState.graph.rawGraph.paths.map(function (
          path,
          i
        ) {
          return parseFloat(path["distance"]);
        });
        y = scaleLinear()
          .domain([0, max(pairdistance)])
          .range([this.height, 0]);
      } else if (appState.graph.scatterplot.y === "nodes with smaller degree") {
        const smallerDegrees = appState.graph.frame
          .getEdgeList()
          .map((edge) => {
            return min([edge.sourceDegree, edge.targetDegree]);
          });
        y = scaleLinear()
          .domain([0, max(smallerDegrees)])
          .range([this.height, 0]);
      } else if (appState.graph.scatterplot.y === "ANN") {
        // get the max ann value from community_ann_dict, where the key is the community id, and the value is the ann value list. find the max value among all value lists.
        const max_ann = max(
          Object.values(appState.graph.community_ann_dict),
          (ann_list) => max(ann_list)
        );
        console.log(max_ann);
        y = scaleLinear().domain([0, max_ann]).range([this.height, 0]);
      } else {
        y = scaleLinear()
          .domain([
            0,
            max(appState.graph.frame.getNodeList(), function (d) {
              return parseFloat(d.data.ref[appState.graph.scatterplot.y]);
            }),
          ])
          .range([this.height, 0]);
        console.log(y);
      }
      const capitalizeString = (inputString) => {
        const connectingWords = ["in", "to"]; // Add more connecting words as needed

        return inputString.replace(/\w+/g, function (word) {
          return connectingWords.includes(word.toLowerCase())
            ? word
            : word.charAt(0).toUpperCase() + word.slice(1);
        });
      };

      // if (isLoggedIn) {
      //   button = <LogoutButton onClick={this.handleLogoutClick} />;
      // } else {
      //   button = <LoginButton onClick={this.handleLoginClick} />;
      // }

      return (
        <div>
          {/* <div style={{ width:'50vw', transform:'translate(10px,10px)'}} className={classnames(Classes.CARD, "sub-option")}> */}

          <div style={{ display: "inline" }}>
            <p
              className="scatter-plot-font"
              style={{ display: "inline", fontSize: "12px" }}
            >
              X by:{" "}
            </p>
            <span>
              <XYSelect
                className="scatter-plot-font"
                style={{ display: "inline" }}
                items={appState.graph.allComputedPropertiesKeyList.map((s) =>
                  capitalizeString(s)
                )}
                onSelect={(it) =>
                  (appState.graph.scatterplot.x = it
                    .split(" ")
                    .map((s) => s.charAt(0).toLowerCase() + s.substring(1))
                    .join(" "))
                }
                value={capitalizeString(appState.graph.scatterplot.x)}
              />
            </span>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <p
              className="scatter-plot-font"
              style={{ display: "inline", fontSize: "12px" }}
            >
              Y by:{" "}
            </p>
            <span>
              <XYSelect
                className="scatter-plot-font"
                items={appState.graph.allComputedPropertiesKeyList}
                onSelect={(it) =>
                  (appState.graph.scatterplot.y = it
                    .split(" ")
                    .map((s) => s.charAt(0).toLowerCase() + s.substring(1))
                    .join(" "))
                }
                value={capitalizeString(appState.graph.scatterplot.y)}
              />
            </span>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <text id="scattertitle" style={{}}>
              {" "}
              {(appState.graph.scatterplot.x === "shortest path" &&
                appState.graph.scatterplot.y === "pair distance") ||
              (appState.graph.scatterplot.y === "shortest path" &&
                appState.graph.scatterplot.x === "pair distance")
                ? "Route Factor Diagram"
                : (appState.graph.scatterplot.y == "network density" &&
                    appState.graph.scatterplot.x == "standard distance") ||
                  (appState.graph.scatterplot.y == "standard distance" &&
                    appState.graph.scatterplot.x == "network density")
                ? "Cluster-Cluster Plot"
                : appState.graph.scatterplot.x == "nodes with larger degree" &&
                  appState.graph.scatterplot.y == "nodes with smaller degree"
                ? "Degree-Degree Plot"
                : appState.graph.scatterplot.x == "order" &&
                  appState.graph.scatterplot.y == "ANN"
                ? "ANN Plot"
                : "Centrality-Centrality Plot"}
            </text>
          </div>

          <div style={{ display: "inline" }}></div>
          {/* </div> */}
          <div>
            <svg
              width={this.width + this.margin.right + this.margin.left + 10}
              height={this.height + this.margin.top + this.margin.bottom}
              className="scatterchart"
              id="scatterplot"
              ref={(input) => (this.svg = input)}
              // ref = {ref}
            >
              <g
                transform={
                  "translate(" + this.margin.left + "," + this.margin.top + ")"
                }
                width={this.width}
                height={this.height}
                className="main"
              >
                {appState.graph.hasGraph && (
                  <RenderCircles
                    scale={{ x, y }}
                    cr={this.cr}
                    ref={this.circles}
                    maxhop={this.maxhop}
                    infinityhop={this.infinityhop}
                  />
                )}
                <text
                  style={{ transform: "translate(20vw, 27.5vh)" }}
                  fontSize="11px"
                >
                  {appState.graph.scatterplot.x === "standard distance" ||
                  appState.graph.scatterplot.x === "distance to center"
                    ? capitalizeString(appState.graph.scatterplot.x) + " (km)"
                    : capitalizeString(appState.graph.scatterplot.x)}
                </text>
                <Axis
                  axis="x"
                  transform={"translate(0," + this.height + ")"}
                  scale={
                    appState.graph.scatterplot.x === "shortest path"
                      ? axisBottom()
                          .scale(x)
                          .tickFormat((label) => {
                            if (parseInt(label) == this.maxhop + 1) {
                              return "None";
                            } else {
                              return label;
                            }
                          })
                      : axisBottom().scale(x)
                  }
                />
                <text
                  style={{ transform: "translate(-45px, 18vh) rotate(-90deg)" }}
                  // transform={"translate(-1vw, 21vh) rotate(-90deg)"}
                  fontSize="11px"
                >
                  {appState.graph.scatterplot.y === "standard distance" ||
                  appState.graph.scatterplot.y === "distance to center"
                    ? capitalizeString(appState.graph.scatterplot.y) + " (km)"
                    : capitalizeString(appState.graph.scatterplot.y)}
                </text>
                <Axis
                  axis="y"
                  transform="translate(0,0)"
                  scale={
                    appState.graph.scatterplot.y === "shortest path"
                      ? axisLeft()
                          .scale(y)
                          .tickFormat((label) => {
                            if (parseInt(label) == this.maxhop + 1) {
                              return "None";
                            } else {
                              return label;
                            }
                          })
                      : axisLeft().scale(y)
                  }
                  // decorate={(s) => {
                  //   s.enter()
                  //     .select('text')
                  //     .style('text-anchor', 'start')
                  //     .attr('transform', 'rotate(45 -10 10)');
                  // }}
                />
              </g>
              {appState.graph.scatterplot.y !== "shortest path" &&
                appState.graph.scatterplot.x !== "shortest path" &&
                appState.graph.scatterplot.y !== "network density" &&
                appState.graph.scatterplot.x !== "standard distance" &&
                appState.graph.scatterplot.y !== "standard distance" &&
                appState.graph.scatterplot.x !== "network density" &&
                appState.graph.scatterplot.y !== "pair distance" &&
                appState.graph.scatterplot.x !== "pair distance" &&
                appState.graph.scatterplot.x !== "nodes with larger degree" &&
                appState.graph.scatterplot.y !== "nodes with smaller degree" &&
                appState.graph.scatterplot.x !== "order" &&
                appState.graph.scatterplot.y !== "ANN" &&
                this.renderBrush()}
            </svg>
          </div>

          <Button
            className="bp4-button"
            style={{ transform: "translate(38vw, 1vh)" }}
            onClick={() => {
              var svgsaver = new SvgSaver(); // creates a new instance
              var svg = document.querySelector("#scatterplot"); // find the SVG element
              svgsaver.asSvg(svg);
            }}
          >
            Download Image
          </Button>

          {
            <CSVLink
              data={this.state.csvarray}
              onClick={this.downloadCSV}
              asyncOnClick={true}
              filename="bsedata.csv"
            >
              <Button
                className="bp4-button"
                style={{ transform: "translate(18vw, 1.0vh)" }}
              >
                Download CSV
              </Button>
            </CSVLink>
          }
        </div>
      );
    }
  }
}

@observer
class Axis extends React.Component {
  componentDidMount() {
    const node = this.refs[this.props.axis];
    select(node).call(this.props.scale);
  }

  render() {
    if (appState.graph.hasGraph) {
      const node = this.refs[this.props.axis];
      select(node).call(this.props.scale);

      if (this.props.axis == "x") {
        return (
          <g
            className="xaxis"
            transform={this.props.transform}
            ref={this.props.axis}
          />
        );
      } else {
        return (
          <g
            // className="xaxis"
            transform={this.props.transform}
            ref={this.props.axis}
          />
        );
      }
    }
  }
}

@observer
class RenderCircles extends React.Component {
  setScatterStyle = (node, ni) => {
    // ni is the index of the node in the array
    // const dehighlightNode = {
    //   fill: "rgba(25, 158, 199, .9)",
    //   zIndex: "0"
    // }
    // const highlightNode = {
    //   fill: "rgba(255, 1, 1, .9)",
    //   zIndex: "10000"
    // }
    if (
      appState.graph.scatterplot.y !== "shortest path" &&
      appState.graph.scatterplot.x !== "shortest path" &&
      appState.graph.scatterplot.y !== "pair distance" &&
      appState.graph.scatterplot.x !== "pair distance" &&
      appState.graph.scatterplot.y !== "standard distance" &&
      appState.graph.scatterplot.x !== "standard distance" &&
      appState.graph.scatterplot.y !== "network density" &&
      appState.graph.scatterplot.x !== "network density" &&
      appState.graph.scatterplot.x !== "nodes with larger degree" &&
      appState.graph.scatterplot.y !== "nodes with smaller degree" &&
      appState.graph.scatterplot.x !== "order" &&
      appState.graph.scatterplot.y !== "ANN"
    ) {
      if (
        !appState.graph.currentlyHovered &&
        appState.graph.selectedNodes.length == 0
      ) {
        // if no node is hovered and no node is selected
        // return the default style
        return {
          fill: node.renderData.color,
          zIndex: "0",
          stroke: false,
          fillOpacity: 0.8,
        };
      } else if (appState.graph.selectedNodes.length > 0) {
        if (appState.graph.selectedNodes.indexOf(node) == -1) {
          return {
            fill: node.renderData.color,
            zIndex: "0",
            stroke: false,
            fillOpacity: 0.1,
          };
        } else {
          return {
            fill: node.renderData.color,
            zIndex: "10000",
            stroke: def.NODE_HIGHLIGHT,
            fillOpacity: 0.8,
          };
        }
      } else if (appState.graph.currentlyHovered) {
        if (node.id === appState.graph.currentlyHovered.id) {
          return {
            fill: node.renderData.color,
            zIndex: "10000",
            stroke: def.NODE_HIGHLIGHT,
            fillOpacity: 0.8,
          };
        } else {
          return {
            fill: node.renderData.color,
            zIndex: "0",
            stroke: false,
            fillOpacity: 0.1,
          };
        }
      }
    } else if (
      (appState.graph.scatterplot.y == "network density" &&
        appState.graph.scatterplot.x == "standard distance") ||
      (appState.graph.scatterplot.y == "standard distance" &&
        appState.graph.scatterplot.x == "network density")
    ) {
      // density distance node style

      //Click
      if (appState.graph.distanceDensityCurrentlyClicked.length !== 0) {
        if (
          appState.graph.distanceDensityCurrentlyClicked.includes(
            String(node["name"])
          )
        ) {
          return {
            fill: appState.graph.nodeColorScale(node["name"]),
            zIndex: "10000",
            stroke: def.NODE_HIGHLIGHT,
            fillOpacity: 0.8,
          };
        } else {
          return {
            fill: appState.graph.nodeColorScale(node["name"]),
            zIndex: "0",
            stroke: false,
            fillOpacity: 0.1,
          };
        }
      } else {
        // no click
        return {
          fill: appState.graph.nodeColorScale(node["name"]),
          zIndex: "0",
          stroke: false,
          fillOpacity: 0.8,
        };
      }
    } else if (
      appState.graph.scatterplot.x === "nodes with larger degree" &&
      appState.graph.scatterplot.y === "nodes with smaller degree"
    ) {
      // in this case, the input param "node" is an edge
      const nodes = appState.graph.frame.getNodeList();
      const source_node = nodes.find((n) => n.id === node.fromId); // used to control the color of the circle
      // console.log(node.fromId);
      if (
        !appState.graph.currentlyHovered &&
        appState.graph.selectedNodes.length == 0
      ) {
        return {
          fill: source_node.renderData.color,
          zIndex: "0",
          stroke: false,
          fillOpacity: 0.8,
        };
      } else if (appState.graph.currentlyHovered) {
        // if there are no selected nodes but there is a hovered node
        if (
          node.from_id === appState.graph.currentlyHovered.id ||
          node.to_id === appState.graph.currentlyHovered.id
        ) {
          return {
            fill: source_node.renderData.color,
            zIndex: "10000",
            stroke: false,
            fillOpacity: 0.8,
          };
        } else {
          return {
            fill: source_node.renderData.color,
            zIndex: "0",
            stroke: def.NODE_HIGHLIGHT,
            fillOpacity: 0.1,
          };
        }
      } else {
        // if there are selected nodes
        if (
          appState.graph.selectedNodes.includes(source_node) &&
          appState.graph.selectedNodes.includes(
            nodes.find((n) => n.id === node.toId)
          )
        ) {
          return {
            fill: source_node.renderData.color,
            zIndex: "10000",
            stroke: false,
            fillOpacity: 0.8,
          };
        } else {
          return {
            fill: source_node.renderData.color,
            zIndex: "0",
            stroke: false,
            fillOpacity: 0.1,
          };
        }
      }
    } else if (
      appState.graph.scatterplot.x === "order" &&
      appState.graph.scatterplot.y === "ANN"
    ) {
      // in this case, each circle represents the xth order ann value of a community
      // the input param "node" is the community_id, traverse community_color_dict to get the color of the community
      const community_color_dict = appState.graph.community_color_dict;
      const community_id = node;
      const community_color = community_color_dict[community_id];
      return {
        fill: community_color,
        zIndex: "10000",
        stroke: false,
        fillOpacity: 0.8,
      };
    } else {
      //path node style

      //Click
      if (appState.graph.pathHoveredList.length !== 0) {
        const cpathid = `${node.source}👉${node.target}`;
        if (appState.graph.pathHoveredList.includes(cpathid)) {
          return {
            fill: "rgba(255, 1, 1, .9)",
            zIndex: "0",
            stroke: false,
            fillOpacity: 0.8,
          };
        } else {
          return {
            fill: appState.graph.edges.color,
            zIndex: "0",
            stroke: false,
            fillOpacity: 0.8,
          };
        }
      } else {
        // no click
        return {
          fill: appState.graph.edges.color,
          zIndex: "0",
          stroke: false,
          fillOpacity: 0.8,
        };
      }
      // return {

      //   fill: appState.graph.edges.color,
      //   zIndex: "0",
      //   stroke: false,
      //   fillOpacity: 0.8
      // }
    }
  };

  renderLines = (community_ann_dict_clean) => {
    const lines = [];
    Object.keys(community_ann_dict_clean).forEach((key) => {
      const annList = community_ann_dict_clean[key];
      for (let i = 0; i < annList.length - 1; i++) {
        lines.push(
          <line
            x1={this.props.scale.x(i + 1)}
            y1={this.props.scale.y(annList[i])}
            x2={this.props.scale.x(i + 2)}
            y2={this.props.scale.y(annList[i + 1])}
            stroke={appState.graph.community_color_dict[key]}
            strokeWidth="1"
            strokeDasharray={key === "sample" ? "5,5" : "0"} // Apply dashed line for "sample"
            key={`${key}-${i}`}
          />
        );
      }
    });
    return lines;
  };

  render() {
    const pathFinder = path.aGreedy(appState.graph.computedGraph);
    if (appState.graph.hasGraph) {
      let renderCircles = [];
      let renderLines = [];
      // let renderLabels = []
      // let ydata =[]
      if (
        (appState.graph.scatterplot.x === "network density" &&
          appState.graph.scatterplot.y === "standard distance") ||
        (appState.graph.scatterplot.x === "standard distance" &&
          appState.graph.scatterplot.y === "network density")
      ) {
        // renderLabels = appState.graph.densityDistance.sort((a, b) => b.size - a.size).map((cluster,ci)=>())

        // appState.graph.densityDistance = ;
        renderCircles = appState.graph.densityDistance
          .sort((a, b) => b.size - a.size)
          .map((cluster, ci) => (
            <g>
              <circle
                cx={this.props.scale.x(cluster[appState.graph.scatterplot.x])}
                cy={this.props.scale.y(cluster[appState.graph.scatterplot.y])}
                r={cluster["size"] > 50 ? 25 : cluster["size"] / 2}
                style={this.setScatterStyle(cluster, ci)}
                id={`${cluster.name}`}
                // onMouseOver={(e) => {
                //   appState.graph.distanceDensityCurrentlyHovered = e.target.getAttribute('id')

                //   const selectionNode = appState.graph.frame.getNodeList().filter(node =>
                //     // console.log(node)
                //     String(node.data.ref[appState.graph.groupby]) == appState.graph.distanceDensityCurrentlyHovered

                //   )
                //   appState.graph.frame.selection = selectionNode
                //   appState.graph.selectedNodes = selectionNode

                //   // console.log(selectionNode)
                //   appState.graph.frame.updateSelectionOpacity()

                // }}
                // onMouseLeave={(e) => {

                //   if (appState.graph.mapClicked) return;
                //   appState.graph.distanceDensityCurrentlyHovered = undefined
                //   appState.graph.frame.selection = []
                //   appState.graph.selectedNodes = []
                //   appState.graph.edgeselection = []

                //   appState.graph.frame.graph.forEachNode(function (n) {  //highlight all the nodes
                //     // if (n !== appState.graph.mapClicked) {
                //     appState.graph.frame.colorNodeOpacity(n, 1);  // set opacity for all the node 1

                //     appState.graph.frame.highlightNode(n, false, def.ADJACENT_HIGHLIGHT); //set highlight edge null
                //     // }
                //   }
                //   );

                // }}
                onClick={(e) => {
                  if (
                    appState.graph.distanceDensityCurrentlyClicked.includes(
                      e.target.getAttribute("id")
                    )
                  ) {
                    appState.graph.distanceDensityCurrentlyClicked =
                      appState.graph.distanceDensityCurrentlyClicked.filter(
                        (node) => node !== e.target.getAttribute("id")
                      );
                  } else {
                    appState.graph.distanceDensityCurrentlyClicked.push(
                      e.target.getAttribute("id")
                    );
                  }

                  const selectionNode = appState.graph.frame
                    .getNodeList()
                    .filter((node) =>
                      // console.log(node)
                      appState.graph.distanceDensityCurrentlyClicked.includes(
                        String(node.data.ref[appState.graph.groupby])
                      )
                    );
                  appState.graph.frame.selection = selectionNode;
                  appState.graph.selectedNodes = selectionNode;

                  // console.log(selectionNode)
                  appState.graph.frame.updateSelectionOpacity();
                }}
                key={ci}
              />
              <text
                className="scatterplot-label"
                x={this.props.scale.x(cluster[appState.graph.scatterplot.x])}
                y={this.props.scale.y(cluster[appState.graph.scatterplot.y])}
              >
                {cluster.name}
              </text>
            </g>
          ));
      } else if (
        appState.graph.scatterplot.x === "shortest path" &&
        appState.graph.scatterplot.y === "pair distance"
      ) {
        // const pathkeys = Object.keys(appState.graph.rawGraph.paths)
        renderCircles = appState.graph.rawGraph.paths.map((path, i) => (
          <circle
            cx={
              path["path"].length == 0
                ? this.props.scale.x(this.props.maxhop + 1)
                : this.props.scale.x(path["path"].length - 1)
            }
            cy={this.props.scale.y(parseFloat(path["distance"]))}
            r={this.props.cr}
            style={this.setScatterStyle(path)}
            id={`${path.source}👉${path.target}`}
            data={path}
            onClick={(e) => {
              if (
                appState.graph.pathHoveredList.includes(
                  e.target.getAttribute("id")
                )
              ) {
                appState.graph.pathHoveredList =
                  appState.graph.pathHoveredList.filter(
                    (node) => node !== e.target.getAttribute("id")
                  );
              } else {
                appState.graph.pathHoveredList.push(
                  e.target.getAttribute("id")
                );
              }
              const pathlist = [];
              appState.graph.pathHoveredList.forEach((pathid) => {
                const [sourceid, targetid] = pathid.split("👉");
                // e.target.getAttribute('fill') node.renderData.color,
                // e.target.style.fill = 'rgba(255, 1, 1, .9)'
                // const source = appState.graph.frame.getNode(sourceid)
                // const target = appState.graph.frame.getNode(targetid)
                const thepath = pathFinder.find(sourceid, targetid);
                const pathnode = thepath.map((node) => {
                  return appState.graph.frame.getNode(node.id);
                });
                //control map highlight

                pathlist.push({
                  sourceid: sourceid,
                  targetid: targetid,
                  pathnode: pathnode,
                });
              });
              appState.graph.pathHovered = {
                sourceid: pathlist.map((n) => n.sourceid),
                targetid: pathlist.map((n) => n.targetid),
                // 'pathnode': pathlist.map(n=>n.pathnode),
              };
              appState.graph.pathHovered["pathnode"] = [];
              if (pathlist.length > 0) {
                appState.graph.pathHovered["pathnode"] = pathlist[0].pathnode;
                for (let i = 0; i < pathlist.length - 1; i++) {
                  appState.graph.pathHovered["pathnode"] =
                    appState.graph.pathHovered["pathnode"].concat(
                      pathlist[i + 1].pathnode
                    );
                }
              }

              // pathlist.forEach(p=>appState.graph.pathHovered['pathnode'].concat(p.pathnode))
              // appState.graph.pathHovered['pathnode'] = [].concat(...appState.graph.pathHovered['pathnode'])
              // control socio update
              appState.graph.frame.highlightPathEdgeNode(
                appState.graph.pathHovered["pathnode"]
              );
            }}
            // onMouseOver={(e) => {
            //   // const thenode = appState.graph.frame.getNode(e.target.dataset.id)
            //   const [sourceid, targetid] = e.target.getAttribute('id').split('👉')
            //   // e.target.getAttribute('fill') node.renderData.color,
            //   e.target.style.fill = 'rgba(255, 1, 1, .9)'
            //   // const source = appState.graph.frame.getNode(sourceid)
            //   // const target = appState.graph.frame.getNode(targetid)
            //   const thepath = pathFinder.find(sourceid, targetid)
            //   const pathnode = thepath.map((node) => {
            //     return appState.graph.frame.getNode(node.id)
            //   })
            //   //control map highlight
            //   appState.graph.pathHovered = {
            //     "sourceid": sourceid,
            //     "targetid": targetid,
            //     "pathnode": pathnode
            //   }
            //   // control socio update
            //   appState.graph.frame.highlightPathEdgeNode(pathnode)

            // }}
            // onMouseLeave={(e) => {
            //   // if (appState.graph.mapClicked) return;
            //   e.target.style.fill = appState.graph.edges.color

            //   appState.graph.frame.graph.forEachNode(function (n) {  //highlight all the nodes
            //     // if (n !== appState.graph.mapClicked) {
            //     appState.graph.frame.colorNodeOpacity(n, 1);  // set opacity for all the node 1

            //     appState.graph.frame.highlightNode(n, false, def.ADJACENT_HIGHLIGHT); //set highlight edge null
            //     // }
            //   }
            //   );
            //   appState.graph.frame.colorNodeEdge(null);  //highlight all edges
            //   appState.graph.pathHovered = null;

            // }}
            key={i}
          />
        ));
      } else if (
        appState.graph.scatterplot.y === "shortest path" &&
        appState.graph.scatterplot.x === "pair distance"
      ) {
        renderCircles = appState.graph.rawGraph.paths.map((path, i) => (
          <circle
            cy={
              path["path"].length == 0
                ? this.props.scale.y(this.props.maxhop + 1)
                : this.props.scale.y(path["path"].length - 1)
            }
            cx={this.props.scale.x(parseFloat(path["distance"]))}
            r={this.props.cr}
            style={this.setScatterStyle(path)}
            id={`${path.source}👉${path.target}`}
            // data={node}
            onClick={(e) => {
              if (
                appState.graph.pathHoveredList.includes(
                  e.target.getAttribute("id")
                )
              ) {
                appState.graph.pathHoveredList =
                  appState.graph.pathHoveredList.filter(
                    (node) => node !== e.target.getAttribute("id")
                  );
              } else {
                appState.graph.pathHoveredList.push(
                  e.target.getAttribute("id")
                );
              }
              const pathlist = [];
              appState.graph.pathHoveredList.forEach((pathid) => {
                const [sourceid, targetid] = pathid.split("👉");
                // e.target.getAttribute('fill') node.renderData.color,
                // e.target.style.fill = 'rgba(255, 1, 1, .9)'
                // const source = appState.graph.frame.getNode(sourceid)
                // const target = appState.graph.frame.getNode(targetid)
                const thepath = pathFinder.find(sourceid, targetid);
                const pathnode = thepath.map((node) => {
                  return appState.graph.frame.getNode(node.id);
                });
                //control map highlight

                pathlist.push({
                  sourceid: sourceid,
                  targetid: targetid,
                  pathnode: pathnode,
                });
              });
              appState.graph.pathHovered = {
                sourceid: pathlist.map((n) => n.sourceid),
                targetid: pathlist.map((n) => n.targetid),
                // 'pathnode': pathlist.map(n=>n.pathnode),
              };
              appState.graph.pathHovered["pathnode"] = [];
              if (pathlist.length > 0) {
                appState.graph.pathHovered["pathnode"] = pathlist[0].pathnode;
                for (let i = 0; i < pathlist.length - 1; i++) {
                  appState.graph.pathHovered["pathnode"] =
                    appState.graph.pathHovered["pathnode"].concat(
                      pathlist[i + 1].pathnode
                    );
                }
              }

              // pathlist.forEach(p=>appState.graph.pathHovered['pathnode'].concat(p.pathnode))
              // appState.graph.pathHovered['pathnode'] = [].concat(...appState.graph.pathHovered['pathnode'])
              // control socio update
              appState.graph.frame.highlightPathEdgeNode(
                appState.graph.pathHovered["pathnode"]
              );
            }}
            // onMouseOver={(e) => {
            //   // const thenode = appState.graph.frame.getNode(e.target.dataset.id)
            //   const [sourceid, targetid] = e.target.getAttribute('id').split('👉')

            //   e.target.style.fill = 'rgba(255, 1, 1, .9)'
            //   // const source = appState.graph.frame.getNode(sourceid)
            //   // const target = appState.graph.frame.getNode(targetid)
            //   const thepath = pathFinder.find(sourceid, targetid)
            //   const pathnode = thepath.map((node) => {
            //     return appState.graph.frame.getNode(node.id)
            //   })
            //   //control map highlight
            //   appState.graph.pathHovered = {
            //     "sourceid": sourceid,
            //     "targetid": targetid,
            //     "pathnode": pathnode
            //   }
            //   // control socio update
            //   appState.graph.frame.highlightPathEdgeNode(pathnode)

            // }}
            // onMouseLeave={(e) => {
            //   // if (appState.graph.mapClicked) return;
            //   e.target.style.fill = appState.graph.edges.color
            //   appState.graph.frame.graph.forEachNode(function (n) {  //highlight all the nodes
            //     // if (n !== appState.graph.mapClicked) {
            //     appState.graph.frame.colorNodeOpacity(n, 1);  // set opacity for all the node 1

            //     appState.graph.frame.highlightNode(n, false, def.ADJACENT_HIGHLIGHT); //set highlight edge null
            //     // }
            //   }
            //   );
            //   appState.graph.frame.colorNodeEdge(null);  //highlight all edges
            //   appState.graph.pathHovered = null;

            // }}
            key={i}
          />
        ));
      } else if (
        appState.graph.scatterplot.x === "nodes with larger degree" &&
        appState.graph.scatterplot.y === "nodes with smaller degree"
      ) {
        const edges = appState.graph.frame.getEdgeList();
        // console.log("Scale domain:", this.props.scale.x.domain());
        // console.log("Scale range:", this.props.scale.x.range());
        renderCircles = edges.map((edge, i) => (
          <circle
            cx={this.props.scale.x(max([edge.sourceDegree, edge.targetDegree]))}
            cy={this.props.scale.y(min([edge.sourceDegree, edge.targetDegree]))}
            r={this.props.cr}
            style={this.setScatterStyle(edge)}
            id={`${edge.fromId}👉${edge.toId}`}
            from_id={edge.fromId}
            to_id={edge.toId}
            // data={edge}
            // onClick={(e) => {
            //   const source_node = appState.graph.frame.getNode(
            //     e.target.from_id
            //   );
            //   const target_node = appState.graph.frame.getNode(e.target.to_id);
            //   if (
            //     appState.graph.currentlyHovered &&
            //     appState.graph.currentlyHovered.id === source_node.id
            //   ) {
            //     appState.graph.currentlyHovered = target_node;
            //   } else {
            //     appState.graph.currentlyHovered = source_node;
            //   }
            //   appState.graph.frame.highlightNode(
            //     appState.graph.currentlyHovered,
            //     true
            //   );
            //   appState.graph.frame.highlightEdges(
            //     appState.graph.currentlyHovered
            //   );
            // }}
            onMouseOver={(e) => {
              const thenode = appState.graph.frame.getNode(e.target.dataset.id);
              appState.graph.currentlyHovered = thenode; // control map update
              appState.graph.frame.highlightNode(thenode, true); // control cosio update
              appState.graph.frame.highlightEdges(thenode, true);
            }}
            onMouseLeave={(e) => {
              if (appState.graph.mapClicked) return;

              appState.graph.frame.graph.forEachNode(function (n) {
                appState.graph.frame.colorNodeOpacity(n, 1);
                appState.graph.frame.highlightNode(
                  n,
                  false,
                  def.ADJACENT_HIGHLIGHT
                );
              });
              appState.graph.frame.colorNodeEdge(null);
              appState.graph.currentlyHovered = null;
            }}
            key={i}
          />
        ));
      } else if (
        appState.graph.scatterplot.x === "order" &&
        appState.graph.scatterplot.y === "ANN"
      ) {
        // traverse through the community_ann_dict, each key is the community id, and the value is the ann value list
        // each community's xth order ann is represented by a circle
        // cx should traverse from 1-10, cy should be the value in ann value list
        const community_ann_dict = appState.graph.community_ann_dict;
        // remove all NaN values in ann value lists, of the value is null also remove it
        const community_ann_dict_clean = {};
        Object.keys(community_ann_dict).forEach((key) => {
          const ann_list = community_ann_dict[key];
          const clean_ann_list = ann_list.filter((ann) => ann !== null);
          if (clean_ann_list.length > 0) {
            community_ann_dict_clean[key] = clean_ann_list;
          }
        });
        console.log(community_ann_dict_clean);
        renderLines = this.renderLines(community_ann_dict_clean);
        renderCircles = Object.keys(community_ann_dict_clean).map((key, i) => {
          // console.log(community_ann_dict_clean[key])
          return community_ann_dict_clean[key].map((ann, j) => (
            // console.log("ann", ann),
            // console.log(j + 1),
            <circle
              cx={this.props.scale.x(j + 1)}
              cy={this.props.scale.y(ann)}
              r={this.props.cr}
              style={this.setScatterStyle(key)}
              id={key}
              key={i}
            />
          ));
        });
      } else if (
        appState.graph.scatterplot.y !== "shortest path" &&
        appState.graph.scatterplot.x !== "shortest path" &&
        appState.graph.scatterplot.y !== "pair distance" &&
        appState.graph.scatterplot.x !== "pair distance"
      ) {
        // console.log("ttest", appState.graph.scatterplot.x);
        renderCircles = appState.graph.frame.getNodeList().map((node, i) => (
          <circle
            cx={this.props.scale.x(
              parseFloat(node.data.ref[appState.graph.scatterplot.x])
            )}
            cy={this.props.scale.y(
              parseFloat(node.data.ref[appState.graph.scatterplot.y])
            )}
            r={this.props.cr}
            style={this.setScatterStyle(node)}
            id={node.id}
            data={node}
            onMouseOver={(e) => {
              console.log("on mouseover scatterplot");
              const thenode = appState.graph.frame.getNode(e.target.dataset.id);
              appState.graph.currentlyHovered = thenode; // control map update
              appState.graph.frame.highlightNode(thenode, true); // control cosio update
              appState.graph.frame.highlightEdges(thenode, true);
            }}
            onMouseLeave={(e) => {
              console.log("on mouseleave scatterplot");
              if (appState.graph.mapClicked) return;

              appState.graph.frame.graph.forEachNode(function (n) {
                // if (n !== appState.graph.mapClicked) {
                appState.graph.frame.colorNodeOpacity(n, 1);

                appState.graph.frame.highlightNode(
                  n,
                  false,
                  def.ADJACENT_HIGHLIGHT
                );
                // }
              });
              appState.graph.frame.colorNodeEdge(null);
              appState.graph.currentlyHovered = null;
            }}
            // eventHandlers={{
            //   mouseover: (e) => {
            //     console.log(e)
            //   }
            // }}
            // style={{ fill: "rgba(25, 158, 199, .9)" }}
            key={i}
          />
        ));
      }

      return (
        <g>
          {renderLines}
          {renderCircles}
        </g>
      );
    }
  }
}

export default ScatterPlot;
