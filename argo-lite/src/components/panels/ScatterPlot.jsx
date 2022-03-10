import React from "react";
import classnames from "classnames";
import uniq from "lodash/uniq";
import { Classes } from "@blueprintjs/core";
import appState from "../../stores";
import { observer } from "mobx-react/index";
import { observable, computed, action, runInAction } from "mobx";
import { scaleLinear, max, axisLeft, axisBottom, select } from "d3"
import SimpleSelect from "../utils/SimpleSelect";

var def = require("../../graph-frontend/src/imports").default;





const settings = {
  width: 150,
  height: 150,
  padding: 10,
  // numDataPoints: 50,
  // maxRange: () => Math.random() * 1000
};

@observer
class ScatterPlot extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const margin = { top: 10, right: 10, bottom: 50, left: 30 }
    const width = 200 - margin.left - margin.right
    const height = 200 - margin.top - margin.bottom
    
    // .filter(node => node.data.ref.degree !== 0 && !isNaN(parseFloat(node.data.ref.dist_to_center)));
    // this.props.data

    const x = scaleLinear()
      .domain([
        0,
        max(this.props.data, function (d) {
          return parseFloat(d.data.ref[appState.graph.scatterplot.x])
        })
      ])
      .range([0, width])

    const y = scaleLinear()
      .domain([
        0,
        max(this.props.data, function (d) {
          return parseFloat(d.data.ref[appState.graph.scatterplot.y])
        })
      ])
      .range([height, 0])

    return (
      <div>
        <div className={classnames(Classes.CARD, "sub-option")}>
          <div>
            <p style={{ display: "inline" }}>X By: </p>
            <span style={{ float: "right" }}>
              <SimpleSelect
                items={appState.graph.allComputedPropertiesKeyList}
                onSelect={it => (appState.graph.scatterplot.x = it)}
                value={appState.graph.scatterplot.x }
              />
            </span>
          </div>

          <div style={{marginTop:"10px"}}> 
                <p style={{display: "inline"}}>Y by: </p>
                <span style={{float:"right"}}>
                  <SimpleSelect
                    items={appState.graph.allComputedPropertiesKeyList}
                    onSelect={it => (appState.graph.scatterplot.y = it)}
                    value={appState.graph.scatterplot.y }
                  />
                </span>
              </div>
        </div>
        <div>

          <svg
            width={width + margin.right + margin.left}
            height={height + margin.top + margin.bottom}
            className="scatterchart"
          >
            <g
              transform={"translate(" + margin.left + ",3)"}
              width={width}
              height={height}
              className="main"
            >
              <RenderCircles data={this.props.data} scale={{ x, y }} />
              <text transform={"translate(50, 180)"} fontSize="13px">{appState.graph.scatterplot.x}</text>
              <Axis
                axis="x"
                transform={"translate(0," + height + ")"}
                scale={axisBottom().scale(x)}
              />
              <text
                transform={"translate(-22, 140) rotate(-90)"}
                fontSize="13px"
              >{appState.graph.scatterplot.y}</text>
              <Axis
                axis="y"
                transform="translate(0,0)"
                scale={axisLeft().scale(y)}
              // decorate={(s) => {
              //   s.enter()
              //     .select('text')
              //     .style('text-anchor', 'start')
              //     .attr('transform', 'rotate(45 -10 10)');
              // }}
              />
            </g>
          </svg>
        </div>
      </div>

    )
  }
}

@observer
class Axis extends React.Component {
  componentDidMount() {
    const node = this.refs[this.props.axis]
    select(node).call(this.props.scale)
  }

  render() {
    if (this.props.axis == 'x') {
      return (
        <g
          className="xaxis"
          transform={this.props.transform}
          ref={this.props.axis}
        />
      )
    } else {
      return (
        <g
          // className="xaxis"
          transform={this.props.transform}
          ref={this.props.axis}
        />
      )
    }

  }
}

@observer
class RenderCircles extends React.Component {
  setScatterStyle = (node) => {
    // const dehighlightNode = {
    //   fill: "rgba(25, 158, 199, .9)",
    //   zIndex: "0"
    // }
    // const highlightNode = {
    //   fill: "rgba(255, 1, 1, .9)",
    //   zIndex: "10000"
    // }
    if (!appState.graph.currentlyHovered) {
      return {
        fill: node.renderData.color,
        zIndex: "0",
        stroke:false,
        fillOpacity:0.8
      }
    } else {
      if (node.id === appState.graph.currentlyHovered.id) {
        return {
          fill: node.renderData.color,
          zIndex: "10000",
          stroke:def.NODE_HIGHLIGHT,
          fillOpacity:0.8
        }
      } else {
        return {
          fill: node.renderData.color,
          zIndex: "0",
          stroke:false,
          fillOpacity:0.3
        }
      }
    }
  }


  render() {
    let renderCircles = this.props.data.map((node, i) => (
      <circle
        cx={this.props.scale.x(parseFloat(node.data.ref[appState.graph.scatterplot.x]))}
        cy={this.props.scale.y(parseFloat(node.data.ref[appState.graph.scatterplot.y]))}
        r="3"
        style={this.setScatterStyle(node)}
        data-id={node.id}
        onMouseOver={(e) => {
          // console.log(e.target.dataset.id)
          const thenode = appState.graph.frame.getNode(e.target.dataset.id)
          appState.graph.currentlyHovered = thenode  // control map update 
          appState.graph.frame.highlightNode(thenode, true);   // control cosio update 
          appState.graph.frame.highlightEdges(thenode, true);

        }}
        onMouseLeave={(e) => {
          if (appState.graph.mapClicked) return;

          appState.graph.frame.graph.forEachNode(function (n) {
            // if (n !== appState.graph.mapClicked) {
            appState.graph.frame.colorNodeOpacity(n, 1);

            appState.graph.frame.highlightNode(n, false, def.ADJACENT_HIGHLIGHT);
            // }
          }
          );
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
    ))
    return <g>{renderCircles}</g>
  }
}

export default ScatterPlot;

