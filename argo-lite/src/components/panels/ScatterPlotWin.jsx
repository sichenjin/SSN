import React from "react";
import classnames from "classnames";
import uniq from "lodash/uniq";
import { Button, Classes } from "@blueprintjs/core";
import appState from "../../stores";
import { observer } from "mobx-react/index";
import { observable, computed, action, runInAction } from "mobx";
import { scaleLinear, scalePoint, max, axisLeft, axisBottom, select } from "d3"
import { brush, brushY } from "d3-brush";
import SimpleSelect from "../utils/SimpleSelect";
import SVGBrush from 'react-svg-brush';
import path from 'ngraph.path';
import * as SvgSaver from 'svgsaver';
import { CSVLink, CSVDownload } from "react-csv";
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
class ScatterPlotWin extends React.Component {
    constructor(props) {
      super(props);
      
    }
  
    render() {
      const w = window,
      d = document,
      e = d.documentElement,
      g = d.getElementsByTagName("body")[0],
      windowWidth = w.innerWidth || e.clientWidth || g.clientWidth,
      windowHeight = w.innerHeight || e.clientHeight || g.clientHeight;
      return (
        
<div
      className={"tg-pt-dialog-resizable-draggable"}
      style={{ top: 0, left: 0, position: "fixed" }}
    >
         <Rnd
        style={{backgroundColor:'red'}}
        bounds={"body"}
        default={{
          x: window.innerWidth/3,
          y: window.innerHeight/3,
          width: 320,
          height: 200,
        }}
      > 
      <ScatterPlot/>
        
        
      </Rnd>
    </div>
     
  
      )
    }}
    
export default ScatterPlotWin;

@observer
class ScatterPlot extends React.Component {

  @observable data = appState.graph.frame.getNodeList().filter(node => !isNaN(parseFloat(node.data.ref[appState.graph.scatterplot.x])) && !isNaN(parseFloat(node.data.ref[appState.graph.scatterplot.y])))
  // @observable x = scaleLinear()
  //   .domain([
  //     0,
  //     max(appState.graph.frame.getNodeList(), function (d) {
  //       return parseFloat(d.data.ref[appState.graph.scatterplot.x])
  //     })
  //   ])
  //   .range([0, this.width])
   

  
  // @observable y = scaleLinear()
  //   .domain([
  //     0,
  //     max(appState.graph.frame.getNodeList(), function (d) {
  //       return parseFloat(d.data.ref[appState.graph.scatterplot.y])
  //     })
  //   ])
  //   .range([this.height, 0])

  // this.props.data.filter(node => !isNaN(parseFloat(node.data.ref[appState.graph.scatterplot.x])) && !isNaN(parseFloat(node.data.ref[appState.graph.scatterplot.y])))
  // .filter(node => node.data.ref.degree !== 0 && !isNaN(parseFloat(node.data.ref.dist_to_center)))

  margin = { top: 10, right: 10, bottom: 50, left: 50 }
  width = window.innerWidth/3 - this.margin.left - this.margin.right
  height = window.innerHeight/3 - this.margin.top - this.margin.bottom
  cr = 3
  maxhop = undefined
  formatXtext = []
  infinityhop = []
  

  constructor(props) {
    super(props)
    this.circles = React.createRef();
    this.state = { csvarray: [] }
  }

  downloadCSV = ()=>{
    appState.graph.frame.getNodeList().filter(node => !isNaN(parseFloat(node.data.ref[appState.graph.scatterplot.x])) && !isNaN(parseFloat(node.data.ref[appState.graph.scatterplot.y])))
    let column1, column2
    
    let header = [];
    this.setState({
      csvarray : []
    });
    // this.state.;
    if(appState.graph.scatterplot.x === 'shortest path'){
      column1 = this.infinityhop
      header.push('shortest path')
    }else if(appState.graph.scatterplot.x === 'pair distance'){
      column1 = appState.graph.rawGraph.paths.map((path,i)=>{
        return parseFloat(path['distance'])
      })
      header.push('pair distance')
    }else{
      header.push(appState.graph.scatterplot.x)
      column1 = appState.graph.frame.getNodeList().map((d) =>{
        return parseFloat(d.data.ref[appState.graph.scatterplot.x])
      })
    }

    if(appState.graph.scatterplot.y === 'shortest path'){
      column2 = this.infinityhop
      header.push('shortest path')
    }else if(appState.graph.scatterplot.y === 'pair distance'){
      column2 = appState.graph.rawGraph.paths.map((path,i)=>{
        return parseFloat(path['distance'])
      })
      header.push('pair distance')
    }else{
      header.push(appState.graph.scatterplot.y)
      column2 = appState.graph.frame.getNodeList().map((d) =>{
        return parseFloat(d.data.ref[appState.graph.scatterplot.y])
      })
    }
     
    let temp = []
    temp.push(header) 
    for (var i=0; i<column2.length && i<column1.length; i++){
      temp.push([column1[i], column2[i]]);
    }
    this.setState({
      csvarray : temp
    });
    

  }

  onBrushStart = ({ target, type, selection, sourceEvent }) => {
    appState.graph.frame.selection = []
    appState.graph.selectedNodes = []
    appState.graph.edgeselection = []

  }
  onBrush = ({ target, type, selection, sourceEvent }) => {

  }
  onBrushEnd = ({ target, type, selection, sourceEvent }) => {
    const selectionNodeID = []
    const svgElement = select(this.svg)
    const circles = svgElement.selectAll("circle")
    const brushBounds = {
      x0: selection[0][0] - this.margin.left,
      x1: selection[1][0] - this.margin.left,
      y0: selection[0][1] - this.cr,
      y1: selection[1][1] - this.cr,
    }

    circles.each(function (d, i) {
      const nodecx = parseFloat(select(this).attr("cx"))
      const nodecy = parseFloat(select(this).attr("cy"))
      if (nodecx >= brushBounds.x0 && nodecx <= brushBounds.x1 && nodecy >= brushBounds.y0 && nodecy <= brushBounds.y1) {
        selectionNodeID.push(select(this).attr("id"))
      }



    })


    const selectionNode = appState.graph.frame.getNodeList().filter(node =>
      // console.log(node)
      selectionNodeID.includes(node.id)

    )
    appState.graph.frame.selection = selectionNode
    appState.graph.selectedNodes = selectionNode


    // console.log(selectionNode)
    appState.graph.frame.updateSelectionOpacity()

  }
  renderBrush = () => (
    <SVGBrush
      // Defines the boundary of the brush.
      // Strictly uses the format [[x0, y0], [x1, y1]] for both 1d and 2d brush.
      // Note: d3 allows the format [x, y] for 1d brush.
      extent={
        [[this.margin.left, this.cr], [this.width + this.margin.left, this.height + this.cr]]
      }
      // Obtain mouse positions relative to the current svg during mouse events.
      // By default, getEventMouse returns [event.clientX, event.clientY]
      getEventMouse={event => {
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
  )


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
      let x,y
      if(appState.graph.scatterplot.x === 'shortest path'){
        const shortpathhop = appState.graph.rawGraph.paths.map(function(path,i){
          return path['path'].length -1
        })
        shortpathhop.sort()
        this.maxhop = shortpathhop[shortpathhop.length -1]

        this.infinityhop = shortpathhop.map((pathlen,i)=>{
          if(pathlen == -1){
            return this.maxhop+1
          }else{
            return pathlen
          }
        })
        this.infinityhop.sort()
        // console.log()
        // this.formatXtext =  [...new Set(this.infinityhop)].map((pathlen,i)=>{
        //   if(pathlen == (this.maxhop +1)){
        //     return 'None'
        //   }else{
        //     return pathlen.toString()
        //   }
        // })
        // console.log(this.formatXtext)
        x = scalePoint()
        .domain(this.infinityhop)
        .range([0, this.width]);
       

      }else if(appState.graph.scatterplot.x === 'pair distance'){
        const pairdistance = appState.graph.rawGraph.paths.map((path,i)=>{
          return parseFloat(path['distance'])
        })
        x = scaleLinear()
        .domain([
          0,
          max(pairdistance)
        ])
        .range([0, this.width])


      }else{
        x = scaleLinear()
        .domain([
          0,
          max(appState.graph.frame.getNodeList(), function (d) {
            return parseFloat(d.data.ref[appState.graph.scatterplot.x])
          })
        ])
        .range([0, this.width])
      }
     
      if(appState.graph.scatterplot.y === 'shortest path'){


        const shortpathhop = appState.graph.rawGraph.paths.map(function(path,i){
          return path['path'].length -1
        })
        shortpathhop.sort()
        this.maxhop = shortpathhop[shortpathhop.length -1]

        this.infinityhop = shortpathhop.map((pathlen,i)=>{
          if(pathlen == -1){
            return this.maxhop+1
          }else{
            return pathlen
          }
        })
        this.infinityhop.sort().reverse()
      
        y = scalePoint()
        .domain(this.infinityhop)
        .range([0, this.width]);
    
      }else if(appState.graph.scatterplot.y === 'pair distance'){
        const pairdistance = appState.graph.rawGraph.paths.map(function(path,i){
          return parseFloat(path['distance'])
        })
        y = scaleLinear()
        .domain([
          0,
          max(pairdistance)
        ])
        .range([this.height, 0])

      }else{
      y = scaleLinear()
        .domain([
          0,
          max(appState.graph.frame.getNodeList(), function (d) {
            return parseFloat(d.data.ref[appState.graph.scatterplot.y])
          })
        ])
        .range([this.height, 0])
      }
      


      return (
        <div>
         
          <div className={classnames(Classes.CARD, "sub-option")}>
          
            <div>
              <p style={{ display: "inline" }}>X By: </p>
              <span style={{ float: "right" }}>
                < SimpleSelect
                  items={appState.graph.allComputedPropertiesKeyList}
                  onSelect={it => (appState.graph.scatterplot.x = it)}
                  value={appState.graph.scatterplot.x}
                />
              </span>
            </div>

            <div style={{ marginTop: "10px" }}>
              <p style={{ display: "inline" }}>Y by: </p>
              <span style={{ float: "right" }}>
                <SimpleSelect
                  items={appState.graph.allComputedPropertiesKeyList}
                  onSelect={it => (appState.graph.scatterplot.y = it)}
                  value={appState.graph.scatterplot.y}
                />
              </span>
            </div>
          </div>
          <div>

            <svg
              width={this.width + this.margin.right + this.margin.left}
              height={this.height + this.margin.top + this.margin.bottom}
              className="scatterchart"
              id = "scatterplot"
              ref={input => (this.svg = input)}
            // ref = {ref}
            >
              <g
                transform={"translate(" + this.margin.left + ",3)"}
                width={this.width}
                height={this.height}
                className="main"
              >
                {appState.graph.hasGraph && <RenderCircles scale={{ x, y }} cr={this.cr} ref={this.circles} maxhop={this.maxhop} infinityhop ={this.infinityhop}/>}
                <text transform={"translate(50, 180)"} fontSize="13px">{appState.graph.scatterplot.x}</text>
                <Axis
                  axis="x"
                  transform={"translate(0," + this.height + ")"}
                  scale={(appState.graph.scatterplot.x === 'shortest path') ? 
                  axisBottom().scale(x).tickFormat((label)=>{
                    if(parseInt(label) == (this.maxhop +1)){
                      return 'None'
                    }else{
                      return label
                    }
                    
                  }): axisBottom().scale(x)
                  }
                />
                <text
                  transform={"translate(-40, 130) rotate(-90)"}
                  fontSize="13px"
                >{appState.graph.scatterplot.y}</text>
                <Axis
                  axis="y"
                  transform="translate(0,0)"
                  scale={(appState.graph.scatterplot.y === 'shortest path') ? 
                  axisLeft().scale(y).tickFormat((label)=>{
                    if(parseInt(label) == (this.maxhop +1)){
                      return 'None'
                    }else{
                      return label
                    }
                    
                  })
                     :axisLeft().scale(y)
                  }
                // decorate={(s) => {
                //   s.enter()
                //     .select('text')
                //     .style('text-anchor', 'start')
                //     .attr('transform', 'rotate(45 -10 10)');
                // }}
                />
              </g>
              { (appState.graph.scatterplot.y !== 'shortest path') && (appState.graph.scatterplot.x !== 'shortest path') 
      && (appState.graph.scatterplot.y !== 'pair distance') && (appState.graph.scatterplot.x !== 'pair distance') &&
        this.renderBrush()}
            </svg>
          </div>
          <Button 
            style={{transform: "translate(0px, -2vh)"}}
            onClick={() => {
            var svgsaver = new SvgSaver();                      // creates a new instance
            var svg = document.querySelector('#scatterplot');         // find the SVG element
            svgsaver.asSvg(svg);  
          }}>Download Image</Button>
          
          
          {(
        <CSVLink data={this.state.csvarray} onClick = {this.downloadCSV}  asyncOnClick={true} filename="bsedata.csv">
          <Button 
            style={{transform: "translate(0px, -2vh)"}}
            
            >Download CSV
          </Button>
        </CSVLink>
      )}
        </div>

      )
    }
  }
}

@observer
class Axis extends React.Component {


  componentDidMount() {
    const node = this.refs[this.props.axis]
      select(node).call(this.props.scale)
    
  }

  render() {
    if (appState.graph.hasGraph) {
      const node = this.refs[this.props.axis]
      select(node).call(this.props.scale)

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
    if((appState.graph.scatterplot.y !== 'shortest path') && (appState.graph.scatterplot.x !== 'shortest path') 
      && (appState.graph.scatterplot.y !== 'pair distance') && (appState.graph.scatterplot.x !== 'pair distance')){
        if (!appState.graph.currentlyHovered && appState.graph.selectedNodes.length == 0) {
          return {
            fill: node.renderData.color,
            zIndex: "0",
            stroke: false,
            fillOpacity: 0.8
          }
        } else if (appState.graph.currentlyHovered) {
          if (node.id === appState.graph.currentlyHovered.id) {
            return {
              fill: node.renderData.color,
              zIndex: "10000",
              stroke: def.NODE_HIGHLIGHT,
              fillOpacity: 0.8
            }
          } else {
            return {
              fill: node.renderData.color,
              zIndex: "0",
              stroke: false,
              fillOpacity: 0.15
            }
          }
        } else if (appState.graph.selectedNodes.length > 0) {
          if (appState.graph.selectedNodes.indexOf(node) == -1) {
            return {
              fill: node.renderData.color,
              zIndex: "0",
              stroke: false,
              fillOpacity: 0.15
            }
          } else {
            return {
              fill: node.renderData.color,
              zIndex: "10000",
              stroke: def.NODE_HIGHLIGHT,
              fillOpacity: 0.8
            }
          }
        }
      }else{ //path node style 
        return { 
          fill: "rgba(25, 158, 199, .9)",
          zIndex: "0",
          stroke: false,
          fillOpacity: 0.8
        }
      }
    
  }

  pathFinder = path.aGreedy(appState.graph.computedGraph);


  render() {
    if (appState.graph.hasGraph) {
      let renderCircles = []
      // let ydata =[]
      if((appState.graph.scatterplot.x === 'shortest path') && (appState.graph.scatterplot.y === 'pair distance')){
        // const pathkeys = Object.keys(appState.graph.rawGraph.paths)
        renderCircles = appState.graph.rawGraph.paths.map((path,i)=>(
          <circle
          cx={path['path'].length == 0 ? this.props.scale.x(this.props.maxhop +1):this.props.scale.x(path['path'].length-1)}
          cy={this.props.scale.y(parseFloat(path['distance']))}   
          r={this.props.cr}
          style={this.setScatterStyle(path)}
          id={`${path.source}👉${path.target}`}
          data={path}
          onMouseOver={(e) => {
            // const thenode = appState.graph.frame.getNode(e.target.dataset.id)
            const [sourceid, targetid] =  e.target.getAttribute('id').split('👉')
            // e.target.getAttribute('fill') node.renderData.color,
            e.target.style.fill = 'rgba(255, 1, 1, .9)'
            // const source = appState.graph.frame.getNode(sourceid)
            // const target = appState.graph.frame.getNode(targetid)
            const thepath = this.pathFinder.find(sourceid, targetid)
            const pathnode = thepath.map((node)=>{
              return appState.graph.frame.getNode(node.id)
            })
            //control map highlight 
            appState.graph.pathHovered = {
              "sourceid":sourceid,
              "targetid":targetid, 
              "pathnode": pathnode
            } 
            // control socio update 
            appState.graph.frame.highlightPathEdgeNode(pathnode)



          }}
          onMouseLeave={(e) => {
            // if (appState.graph.mapClicked) return;
            e.target.style.fill = 'rgba(25, 158, 199, .9)'

            appState.graph.frame.graph.forEachNode(function (n) {  //highlight all the nodes 
              // if (n !== appState.graph.mapClicked) {
              appState.graph.frame.colorNodeOpacity(n, 1);  // set opacity for all the node 1

              appState.graph.frame.highlightNode(n, false, def.ADJACENT_HIGHLIGHT); //set highlight edge null
              // }
            }
            );
            appState.graph.frame.colorNodeEdge(null);  //highlight all edges 
            appState.graph.pathHovered = null;


          }}
          key={i}
        />)
        )
        

      }else if((appState.graph.scatterplot.y === 'shortest path') && (appState.graph.scatterplot.x === 'pair distance')){
        renderCircles = appState.graph.rawGraph.paths.map((path,i)=>(
          <circle
          cy={path['path'].length == 0 ? this.props.scale.y(this.props.maxhop +1):this.props.scale.y(path['path'].length-1)}
          cx={this.props.scale.x(parseFloat(path['distance']))}   
          r={this.props.cr}
          style={this.setScatterStyle(path)}
          id={`${path.source}👉${path.target}`}
          // data={node}
          onMouseOver={(e) => {
            // const thenode = appState.graph.frame.getNode(e.target.dataset.id)
            const [sourceid, targetid] =  e.target.getAttribute('id').split('👉')
            // const source = appState.graph.frame.getNode(sourceid)
            // const target = appState.graph.frame.getNode(targetid)
            const thepath = this.pathFinder.find(sourceid, targetid)
            const pathnode = thepath.map((node)=>{
              return appState.graph.frame.getNode(node.id)
            })
            //control map highlight 
            appState.graph.pathHovered = {
              "sourceid":sourceid,
              "targetid":targetid, 
              "pathnode": pathnode
            } 
            // control socio update 
            appState.graph.frame.highlightPathEdgeNode(pathnode)



          }}
          onMouseLeave={(e) => {
            // if (appState.graph.mapClicked) return;

            appState.graph.frame.graph.forEachNode(function (n) {  //highlight all the nodes 
              // if (n !== appState.graph.mapClicked) {
              appState.graph.frame.colorNodeOpacity(n, 1);  // set opacity for all the node 1

              appState.graph.frame.highlightNode(n, false, def.ADJACENT_HIGHLIGHT); //set highlight edge null
              // }
            }
            );
            appState.graph.frame.colorNodeEdge(null);  //highlight all edges 
            appState.graph.pathHovered = null;


          }}
          key={i}
        />)
        )
      }else if((appState.graph.scatterplot.y !== 'shortest path') && (appState.graph.scatterplot.x !== 'shortest path') 
      && (appState.graph.scatterplot.y !== 'pair distance') && (appState.graph.scatterplot.x !== 'pair distance')){
        renderCircles = appState.graph.frame.getNodeList().map((node, i) => (
          <circle
            cx={this.props.scale.x(parseFloat(node.data.ref[appState.graph.scatterplot.x]))}
            cy={this.props.scale.y(parseFloat(node.data.ref[appState.graph.scatterplot.y]))}
            r={this.props.cr}
            style={this.setScatterStyle(node)}
            id={node.id}
            data={node}
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
      }
      
      return <g>{renderCircles}</g>
    }
  }
}



