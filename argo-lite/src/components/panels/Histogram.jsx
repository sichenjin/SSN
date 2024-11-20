
// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/histogram

// var def = require("../../graph-frontend/src/imports").default;
// var d3 = def.d3;
import React from "react";
import classnames from "classnames";
import uniq from "lodash/uniq";
import { Classes } from "@blueprintjs/core";
import {max,scaleLinear,map, range,select} from "d3"
import {bin} from "d3-array"
import * as d3 from "d3"
import { observer } from "mobx-react/index";
import { observable, computed, action, runInAction } from "mobx";
import SVGBrush from 'react-svg-brush';

@observer
class Histogram extends React.Component {

  constructor(props) {
    super(props);
    
  }

  margin = {top: 10, right: 30, bottom: 30, left: 40}
  width = 200 - this.margin.left - this.margin.right
  height = 150 - this.margin.top - this.margin.bottom


  componentDidMount(){

    this.svg = d3.select('#hist').append("svg")
    .attr("id", this.props.id)
    .attr("width", this.width + this.margin.left + this.margin.right)
    .attr("height", this.height + this.margin.top + this.margin.bottom)
    .append("g")
    .attr("transform", 
          "translate(" + this.margin.left + "," + this.margin.top + ")");
   this.histogram(this.props.data,this.svg)
  //  this.renderBrush()

  }

  

  histogram = (data, svg)=> {
    // Compute values.
   

// parse the date / time
// var parseDate = d3.timeParse("%d-%m-%Y");

// set the ranges
var x = d3.scaleLinear()
          .domain([0, max(data)])
          .rangeRound([0, this.width]);
var y = d3.scaleLinear()
          .range([this.height, 0]);

// set the parameters for the histogram
const binCount = 10
const [dmin, dmax] = d3.extent(data); 
const thresholds = d3.range(dmin, dmax, (dmax - dmin) / 10); 

var histogram = d3.histogram()
    .value(function(d) { return d; })
    .domain(x.domain())
    .thresholds(thresholds);

// append the svg object to the body of the page
// append a 'group' element to 'svg'
// moves the 'group' element to the top left margin
// const svg= select('#edgedis')


// get the data



  
  // group the data for the bars
  var bins = histogram(data);

  // Scale the range of the data in the y domain
  y.domain([0, d3.max(bins, function(d) { return d.length; })]);

  // append the bar rectangles to the svg element
  svg.selectAll("rect")
      .data(bins)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", 1)
      .attr("transform", function(d) {
		  return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
      .attr("width", (d) =>{ return x(d.x1) - x(d.x0) -1 ; })
      .attr("height", (d)=> { return this.height - y(d.length); })
      .style("fill", "steelblue");

  // add the x Axis
  svg.append("g")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(x));

  // add the y Axis
  svg.append("g")
      .call(d3.axisLeft(y));
      

  }

  onBrushStart = ({ target, type, selection, sourceEvent }) => {
    // appState.graph.frame.selection = []
    // appState.graph.selectedNodes = []

  }
  onBrush = ({ target, type, selection, sourceEvent }) => {

  }
  onBrushEnd = ({ target, type, selection, sourceEvent }) => {
    const selectionRectID = []
    const svgElement = select(this.svg)
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


    // const selectionNode = appState.graph.frame.getNodeList().filter(node =>
    //   // console.log(node)
    //   selectionNodeID.includes(node.id)

    // )
    // appState.graph.frame.selection = selectionNode
    // appState.graph.selectedNodes = selectionNode


    // // console.log(selectionNode)
    // appState.graph.frame.updateSelectionOpacity()
    console.log(selection)
    console.log(selectionRectID)

  }

  renderBrush = () => (
    <SVGBrush
      // Defines the boundary of the brush.
      // Strictly uses the format [[x0, y0], [x1, y1]] for both 1d and 2d brush.
      // Note: d3 allows the format [x, y] for 1d brush.
      extent={
        [[this.margin.left, this.margin.top], [this.margin.left + this.width, this.margin.top + this.height]]
      }
      // Obtain mouse positions relative to the current svg during mouse events.
      // By default, getEventMouse returns [event.clientX, event.clientY]
      getEventMouse={event => {
        const { clientX, clientY } = event;
        const { left, top } = this.svg.getBoundingClientRect();
        // console.log([clientX - left, clientY - top])
        return [clientX - left, clientY - top];
      }}
      brushType="x" // "x"
      onBrushStart={this.onBrushStart}
      onBrush={this.onBrush}
      onBrushEnd={this.onBrushEnd}
    />
  )


  render() {
    return  (
      <div id = 'hist'
      style={{
        width: this.width+this.margin.left+this.margin.right, 
        height: this.height+this.margin.top+this.margin.bottom
      }}>

{this.renderBrush()}
        
        
      </div>
      
    );
  }

}
export default Histogram;


// const Histogram = (data, {
//     value = d => d, // convenience alias for x
//     domain, // convenience alias for xDomain
//     label, // convenience alias for xLabel
//     format, // convenience alias for xFormat
//     type = scaleLinear, // convenience alias for xType
//     x = value, // given d in data, returns the (quantitative) x-value
//     y = () => 1, // given d in data, returns the (quantitative) weight
//     thresholds = 40, // approximate number of bins to generate, or threshold function
//     normalize, // whether to normalize values to a total of 100%
//     marginTop = 20, // top margin, in pixels
//     marginRight = 30, // right margin, in pixels
//     marginBottom = 30, // bottom margin, in pixels
//     marginLeft = 40, // left margin, in pixels
//     width = 640, // outer width of chart, in pixels
//     height = 400, // outer height of chart, in pixels
//     insetLeft = 0.5, // inset left edge of bar
//     insetRight = 0.5, // inset right edge of bar
//     xType = type, // type of x-scale
//     xDomain = domain, // [xmin, xmax]
//     xRange = [marginLeft, width - marginRight], // [left, right]
//     xLabel = label, // a label for the x-axis
//     xFormat = format, // a format specifier string for the x-axis
//     yType = scaleLinear, // type of y-scale
//     yDomain, // [ymin, ymax]
//     yRange = [height - marginBottom, marginTop], // [bottom, top]
//     yLabel = "↑ Frequency", // a label for the y-axis
//     yFormat = normalize ? "%" : undefined, // a format specifier string for the y-axis
//     color = "currentColor" // bar fill color
//   } )=> {
//     // Compute values.
//     const X = map(data, x);
//     const Y0 = map(data, y);
//     const I = range(X.length);
  
//     // Compute bins.
//     const bins = bin().thresholds(thresholds).value(i => X[i])(I);
//     const Y = Array.from(bins, I => d3.sum(I, i => Y0[i]));
//     if (normalize) {
//       const total = d3.sum(Y);
//       for (let i = 0; i < Y.length; ++i) Y[i] /= total;
//     }
  
//     // Compute default domains.
//     if (xDomain === undefined) xDomain = [bins[0].x0, bins[bins.length - 1].x1];
//     if (yDomain === undefined) yDomain = [0, d3.max(Y)];
  
//     // Construct scales and axes.
//     const xScale = xType(xDomain, xRange);
//     const yScale = yType(yDomain, yRange);
//     const xAxis = d3.axisBottom(xScale).ticks(width / 80, xFormat).tickSizeOuter(0);
//     const yAxis = d3.axisLeft(yScale).ticks(height / 40, yFormat);
//     yFormat = yScale.tickFormat(100, yFormat);
  
//     const svg = d3.create("svg")
//         .attr("width", width)
//         .attr("height", height)
//         .attr("viewBox", [0, 0, width, height])
//         .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  
//     svg.append("g")
//         .attr("transform", `translate(${marginLeft},0)`)
//         .call(yAxis)
//         .call(g => g.select(".domain").remove())
//         .call(g => g.selectAll(".tick line").clone()
//             .attr("x2", width - marginLeft - marginRight)
//             .attr("stroke-opacity", 0.1))
//         .call(g => g.append("text")
//             .attr("x", -marginLeft)
//             .attr("y", 10)
//             .attr("fill", "currentColor")
//             .attr("text-anchor", "start")
//             .text(yLabel));
  
//     svg.append("g")
//         .attr("fill", color)
//       .selectAll("rect")
//       .data(bins)
//       .enter()
//       .append('rect')
//         .attr("x", d => xScale(d.x0) + insetLeft)
//         .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - insetLeft - insetRight))
//         .attr("y", (d, i) => yScale(Y[i]))
//         .attr("height", (d, i) => yScale(0) - yScale(Y[i]))
//       .append("title")
//         .text((d, i) => [`${d.x0} ≤ x < ${d.x1}`, yFormat(Y[i])].join("\n"));
  
//     svg.append("g")
//         .attr("transform", `translate(0,${height - marginBottom})`)
//         .call(xAxis)
//         .call(g => g.append("text")
//             .attr("x", width - marginRight)
//             .attr("y", 27)
//             .attr("fill", "currentColor")
//             .attr("text-anchor", "end")
//             .text(xLabel));
  
//             // console.log(svg.node())
//     return svg.node();
//   }

