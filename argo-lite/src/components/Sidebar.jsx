import SidebarMenu from 'react-bootstrap-sidebar-menu';
import React from "react";
import uniq from "lodash/uniq";
import { Tab2, Tabs2, Tag, Classes } from "@blueprintjs/core";
import NodesPanel from "./panels/NodesPanel";
import EdgesPanel from "./panels/EdgesPanel";
import LabelsPanel from "./panels/LabelsPanel";
import NodesFilterPanel from "./panels/NodesFilterPanel";
import StatGroupPanel from "./panels/StatGroupPanel"
import appState from "../stores/index";
import classnames from "classnames";
import { observer } from "mobx-react/index";
import { observable, computed, action, runInAction } from "mobx";
import {
    Button
} from "@blueprintjs/core";


@observer
class Sidebar extends React.Component {
    openCity(cityName) {
        var i;
        var x = document.getElementsByClassName("city");
        for (i = 0; i < x.length; i++) {
            x[i].style.display = "none";
        }
        var x = document.getElementsByClassName("sidebarButton");
        for (i = 0; i < x.length; i++) {
            x[i].style.background = "black";
        }
        document.getElementById(cityName).style.display = "block";
        document.getElementById(cityName + 'Tab').style.background = "gray";

    }
    // AverageDegree=()=>{
    //     links.reduce((dist, l) => dist + l.edgeDist, 0) / 2
    // }

    SelectionDistanceFromLatLonIn = () => {
        const selectNodes = appState.graph.selectedNodes;
        const average = (array) => array.reduce((a, b) => a + b) / array.length;

        if (appState.graph.mapClicked) {

            const edgeSelection = appState.graph.mapClicked.linkObjs
            if (!edgeSelection || edgeSelection.length == 0) return [null, []];
            this.edgeSelection = edgeSelection
            const edgeDistance = edgeSelection.map(e => {
                if (e.edgeDist > 0) {
                    return e.edgeDist
                } else {
                    return 0
                }

            })
            return [average(edgeDistance).toFixed(3), edgeDistance];

        }

        if (selectNodes.length > 1) {
            //// calculate only the connected distance 
            const edgeSelection = appState.graph.frame.getEdgeWithinSelectionForDensity(appState.graph.selectedNodes)
            if (edgeSelection.length == 0) return [null, []];
            this.edgeSelection = edgeSelection
            const edgeDistance = edgeSelection.map(e => {
                if (e.edgeDist > 0) {
                    return e.edgeDist
                } else {
                    return 0
                }

            })
            return [average(edgeDistance).toFixed(3), edgeDistance];

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



        } else {   // when no node is selected, return the distribution of the whole network 

            let edgeSelection = []
            appState.graph.frame.getNodeList().forEach(node => {
                if (node.linkObjs && node.linkObjs.length > 0) {
                    edgeSelection.push(...node.linkObjs)
                }

            })

            if (edgeSelection.length > 0) {
                let uniqEdgeSelection = uniq(edgeSelection)
                this.edgeSelection = uniqEdgeSelection
                if (uniqEdgeSelection.length > 0) {
                    let edgeDistance = uniqEdgeSelection.map(e => {
                        if (e.edgeDist > 0) {
                            return e.edgeDist
                        } else {
                            return 0
                        }

                    })
                    // console.log(edgeDistance)
                    return [average(edgeDistance).toFixed(3), edgeDistance];

                } else {
                    return [null, []]
                }

            } else {
                return [null, []]
            }


            // return null
        }

    }

    // @computed
    SelectionDensity = () => {

        // undirect graph
        console.log("ashdakjs")
        if (appState.graph.selectedNodes.length > 1) {
            const edgeSelection = appState.graph.frame.getEdgeWithinSelectionForDensity(appState.graph.selectedNodes)
            // console.log(edgeSelection.length);
            if (edgeSelection.length == 0) return [0, 0, 0];
            // this.edgeSelection = [...edgeSelection]

            const nodelength = appState.graph.selectedNodes.length;
            const selectionDen = (edgeSelection.length / (nodelength * (nodelength - 1))) * 2;
            const avgdegree = appState.graph.selectedNodes.reduce((de, l) => de + l.data.ref.degree, 0) / appState.graph.selectedNodes.length
            return [selectionDen.toFixed(3), edgeSelection.length, avgdegree]
        } else if (appState.graph.selectedNodes.length == 1 && appState.graph.selectedNodes[0]) {
            const thenode = appState.graph.selectedNodes[0]
            const selectneighbors = appState.graph.frame.getNeighborNodesFromGraph(thenode)
            const edgeSelection = appState.graph.frame.getEdgeWithinSelectionForDensity(selectneighbors)
            // console.log(edgeSelection.length);
            if (edgeSelection.length == 0) return [0, 0, 0];
            // this.edgeSelection = [...edgeSelection]
            const avgdegree = selectneighbors.reduce((de, l) => de + l.data.ref.degree, 0) / selectneighbors.length
            const nodelength = selectneighbors.length;
            const selectionDen = (edgeSelection.length / (nodelength * (nodelength - 1))) * 2;
            return [selectionDen.toFixed(3), edgeSelection.length, avgdegree]

        }


    }

    rerunDiameter = ()=>{
        // console.log("rerun degree")
        //create rawgraph based on selected nodes
        if (appState.graph.tempRawGraph) {
            appState.graph.rediameter = appState.graph.rerundiameter(appState.graph.tempRawGraph)
        }else{
            appState.graph.rediameter= 0
        }

    }
    rerunCluster = ()=>{
        // console.log("rerun degree")
        //create rawgraph based on selected nodes
        if (appState.graph.tempRawGraph) {
            appState.graph.reclustercoe = appState.graph.reruncluster(appState.graph.tempRawGraph).toFixed(2)
        }else{
            appState.graph.reclustercoe= 0
        }

    }
    rerunComponent = ()=>{
        // console.log("rerun degree")
        //create rawgraph based on selected nodes
        if (appState.graph.tempRawGraph) {
            appState.graph.recomponent = appState.graph.reruncomponent(appState.graph.tempRawGraph)
        }else{
            appState.graph.recomponent= 0
        }

    }

    render() {
        if (appState.graph.frame && appState.graph.selectedNodes.length > 1 && this.SelectionDistanceFromLatLonIn() && this.SelectionDistanceFromLatLonIn()[0]) {
            return appState.graph.frame && (
                <SidebarMenu>
                    <div class="sidebar-container">
                        <div class="w3-bar w3-black">
                            <button id="AppearanceTab" class="sidebarButton w3-bar-item-button w3-bar-item w3-button" onClick={this.openCity.bind(this, "Appearance")}>Appearance</button>
                            <button id="FilterTab" class="sidebarButton w3-bar-item-button w3-bar-item w3-button" onClick={this.openCity.bind(this, "Filter")}>Filter</button>
                            <button id="StatisticsTab" class="sidebarButton w3-bar-item-button w3-bar-item w3-button" onClick={this.openCity.bind(this, "Statistics")}>Statistics</button>
                        </div>
                        <div id="Appearance" class="city">
                            {/* <text style={{fontSize: "12px"}}>Appearance </text> */}
                            <Tabs2 animate id="graph-options">
                                <Tab2 id="a_nodes" title="Nodes" panel={<NodesPanel />} />
                                <Tab2 id="a_edges" title="Edges" panel={<EdgesPanel />} />
                                <Tab2 id="a_labels" title="Labels" panel={<LabelsPanel />} />
                                {/* <Tab2 id="layout" title="Layout" panel={<LayoutPanel />} /> */}
                                <Tabs2.Expander />
                            </Tabs2>
                        </div>
                        <div id="Filter" class="city" style={{ display: "None" }}>
                            {/* <text style={{fontSize: "12px"}}>Filter Options</text> */}
                            <Tabs2 animate id="filter-options">
                                <Tab2 id="f_nodes" panel={<NodesFilterPanel />} />
                                {/* <Tab2 id="f_edges" title="Edges" panel={<EdgesPanel />} /> */}
                                {/* <Tab2 id="f_layout" title="Layout" panel={<EdgesPanel />} /> */}
                                <Tabs2.Expander />
                            </Tabs2>
                        </div>
                        <div id="Statistics" class="city" style={{ display: "None" }}>
                            <text style={{ fontSize: "12px" }}></text>
                            <Tabs2 animate id="filter-options">
                                <Tab2 id="s_layout" panel={<StatGroupPanel />} />
                                <Tabs2.Expander />
                            </Tabs2>
                        </div>
                        <hr />
                        <div id="statTable" className={classnames(Classes.DIALOG_BODY)}>
                            <table className={Classes.TABLE} style={{ width: '100%' }}>

                                <tbody>
                                    {/* <thead> */}
                                    <tr>
                                        <th colspan="2" style={{ textAlign: "center" }}>Network Statistics</th>

                                    </tr>
                                    {/* </thead> */}
                                    {/* <caption>Network Statistics</caption> */}
                                    <tr>
                                        <td># Nodes</td>
                                        <td>{appState.graph.selectedNodes.length}</td>
                                    </tr>
                                    <tr>
                                        <td># Edges</td>

                                        <td>{appState.graph.hasGraph ? appState.graph.selectedEdge : 'loading graph'}</td>
                                    </tr>
                                    <tr>
                                        <td>Average Degree</td>
                                        <td>
                                            {appState.graph.hasGraph ? appState.graph.avgDegree : 'loading graph'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Average Distance</td>
                                        <td>
                                            {appState.graph.hasGraph ? appState.graph.avgdist : 'loading graph'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Network Density</td>
                                        <td>
                                            {appState.graph.hasGraph ? appState.graph.avgdensity : 'loading graph'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Network Diameter
                                            <br></br>
                                            <Button
                                                className="bp4-button"
                                                style={{ zIndex: '1000' }}
                                                onClick={this.rerunDiameter}>rerun</Button>
                                        </td>
                                        <td>
                                            {appState.graph.hasGraph ? appState.graph.rediameter : 'loading graph'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Clustering<br></br>Coefficient
                                        <br></br>
                                            <Button
                                                className="bp4-button"
                                                style={{ zIndex: '1000' }}
                                                onClick={this.rerunCluster}>rerun</Button></td>
                                        <td>{(appState.graph.hasGraph) ? appState.graph.reclustercoe : 'loading graph'}</td>
                                    </tr>
                                    <tr>
                                        <td>Connected <br></br>Component
                                        <br></br>
                                            <Button
                                                className="bp4-button"
                                                style={{ zIndex: '1000' }}
                                                onClick={this.rerunComponent}>rerun</Button></td>
                                        <td>{(appState.graph.hasGraph) ? appState.graph.recomponent : 'loading graph'}</td>

                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </SidebarMenu>
            );
        } else if (appState.graph.frame && appState.graph.selectedNodes.length == 1 && appState.graph.selectedNodes[0] && this.SelectionDistanceFromLatLonIn() && this.SelectionDistanceFromLatLonIn()[0]) {
            //one node is clicked
            const thenode = appState.graph.selectedNodes[0]
            const selectneighbors = appState.graph.frame.getNeighborNodesFromGraph(thenode)
            // appState.graph.selectedNodes = selectneighbors
            if (selectneighbors.length > 1) {
                return appState.graph.frame && (
                    <SidebarMenu>
                        <div class="sidebar-container">
                            <div class="w3-bar w3-black">
                                <button id="AppearanceTab" class="sidebarButton w3-bar-item-button w3-bar-item w3-button" onClick={this.openCity.bind(this, "Appearance")}>Appearance</button>
                                <button id="FilterTab" class="sidebarButton w3-bar-item-button w3-bar-item w3-button" onClick={this.openCity.bind(this, "Filter")}>Filter</button>
                                <button id="StatisticsTab" class="sidebarButton w3-bar-item-button w3-bar-item w3-button" onClick={this.openCity.bind(this, "Statistics")}>Statistics</button>
                            </div>
                            <div id="Appearance" class="city">
                                {/* <text style={{fontSize: "12px"}}>Appearance </text> */}
                                <Tabs2 animate id="graph-options">
                                    <Tab2 id="a_nodes" title="Nodes" panel={<NodesPanel />} />
                                    <Tab2 id="a_edges" title="Edges" panel={<EdgesPanel />} />
                                    <Tab2 id="a_labels" title="Labels" panel={<LabelsPanel />} />
                                    {/* <Tab2 id="layout" title="Layout" panel={<LayoutPanel />} /> */}
                                    <Tabs2.Expander />
                                </Tabs2>
                            </div>
                            <div id="Filter" class="city" style={{ display: "None" }}>
                                {/* <text style={{fontSize: "12px"}}>Filter Options</text> */}
                                <Tabs2 animate id="filter-options">
                                    <Tab2 id="f_nodes" panel={<NodesFilterPanel />} />
                                    {/* <Tab2 id="f_edges" title="Edges" panel={<EdgesPanel />} /> */}
                                    {/* <Tab2 id="f_layout" title="Layout" panel={<EdgesPanel />} /> */}
                                    <Tabs2.Expander />
                                </Tabs2>
                            </div>
                            <div id="Statistics" class="city" style={{ display: "None" }}>
                                <text style={{ fontSize: "12px" }}></text>
                                <Tabs2 animate id="filter-options">
                                    <Tab2 id="s_layout" panel={<StatGroupPanel />} />
                                    <Tabs2.Expander />
                                </Tabs2>
                            </div>
                            <hr />
                            <div id="statTable" className={classnames(Classes.DIALOG_BODY)}>
                                <table className={Classes.TABLE} style={{ width: '100%' }}>

                                    <tbody>
                                        {/* <thead> */}
                                        <tr>
                                            <th colspan="2" style={{ textAlign: "center" }}>Network Statistics</th>

                                        </tr>
                                        {/* </thead> */}
                                        {/* <caption>Network Statistics</caption> */}
                                        <tr>
                                            <td># Nodes</td>
                                            <td>{selectneighbors.length}</td>
                                        </tr>
                                        <tr>
                                            <td># Edges</td>
                                            <td>{appState.graph.selectedEdge}</td>
                                        </tr>
                                        <tr>
                                            <td>Average Degree</td>
                                            <td>
                                                {appState.graph.hasGraph ? appState.graph.avgDegree : 'loading graph'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Average Distance</td>
                                            <td>
                                                {appState.graph.hasGraph ? appState.graph.avgdist : 'loading graph'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Network Density</td>
                                            <td>
                                                {appState.graph.hasGraph ? appState.graph.avgdensity : 'loading graph'}
                                            </td>
                                        </tr>
                                        <tr>
                                        <td>Network Diameter
                                            <br></br>
                                            <Button
                                                className="bp4-button"
                                                style={{ zIndex: '1000' }}
                                                onClick={this.rerunDiameter}>rerun</Button>
                                        </td>
                                        <td>
                                            {appState.graph.hasGraph ? appState.graph.rediameter : 'loading graph'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Clustering<br></br>Coefficient
                                        <br></br>
                                            <Button
                                                className="bp4-button"
                                                style={{ zIndex: '1000' }}
                                                onClick={this.rerunCluster}>rerun</Button></td>
                                        <td>{(appState.graph.hasGraph) ? appState.graph.reclustercoe : 'loading graph'}</td>
                                    </tr>
                                    <tr>
                                        <td>Connected <br></br>Component
                                        <br></br>
                                            <Button
                                                className="bp4-button"
                                                style={{ zIndex: '1000' }}
                                                onClick={this.rerunComponent}>rerun</Button></td>
                                        <td>{(appState.graph.hasGraph) ? appState.graph.recomponent : 'loading graph'}</td>

                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </SidebarMenu>
                );
            } else {
                //selection is 0
                return appState.graph.frame && (
                    <SidebarMenu>
                        <div class="sidebar-container">
                            <div class="w3-bar w3-black">
                                <button id="AppearanceTab" class="sidebarButton w3-bar-item-button w3-bar-item w3-button" onClick={this.openCity.bind(this, "Appearance")}>Appearance</button>
                                <button id="FilterTab" class="sidebarButton w3-bar-item-button w3-bar-item w3-button" onClick={this.openCity.bind(this, "Filter")}>Filter</button>
                                <button id="StatisticsTab" class="sidebarButton w3-bar-item-button w3-bar-item w3-button" onClick={this.openCity.bind(this, "Statistics")}>Statistics</button>
                            </div>
                            <div id="Appearance" class="city">
                                {/* <text style={{fontSize: "12px"}}>Appearance </text> */}
                                <Tabs2 animate id="graph-options">
                                    <Tab2 id="a_nodes" title="Nodes" panel={<NodesPanel />} />
                                    <Tab2 id="a_edges" title="Edges" panel={<EdgesPanel />} />
                                    <Tab2 id="a_labels" title="Labels" panel={<LabelsPanel />} />
                                    {/* <Tab2 id="layout" title="Layout" panel={<LayoutPanel />} /> */}
                                    <Tabs2.Expander />
                                </Tabs2>
                            </div>
                            <div id="Filter" class="city" style={{ display: "None" }}>
                                {/* <text style={{fontSize: "12px"}}>Filter Options</text> */}
                                <Tabs2 animate id="filter-options">
                                    <Tab2 id="f_nodes" panel={<NodesFilterPanel />} />
                                    {/* <Tab2 id="f_edges" title="Edges" panel={<EdgesPanel />} /> */}
                                    {/* <Tab2 id="f_layout" title="Layout" panel={<EdgesPanel />} /> */}
                                    <Tabs2.Expander />
                                </Tabs2>
                            </div>
                            <div id="Statistics" class="city" style={{ display: "None" }}>
                                <text style={{ fontSize: "12px" }}></text>
                                <Tabs2 animate id="filter-options">
                                    <Tab2 id="s_layout" panel={<StatGroupPanel />} />
                                    <Tabs2.Expander />
                                </Tabs2>
                            </div>
                            <hr />
                            <div id="statTable" className={classnames(Classes.DIALOG_BODY)}>
                                <table className={Classes.TABLE} style={{ width: '100%' }}>

                                    <tbody>
                                        {/* <thead> */}
                                        <tr>
                                            <th colspan="2" style={{ textAlign: "center" }}>Network Statistics</th>

                                        </tr>
                                        {/* </thead> */}
                                        {/* <caption>Network Statistics</caption> */}
                                        <tr>
                                            <td># Nodes</td>
                                            <td>{0}</td>
                                        </tr>
                                        <tr>
                                            <td># Edges</td>
                                            <td>{0}</td>
                                        </tr>
                                        <tr>
                                            <td>Average Degree</td>
                                            <td>
                                                {0}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Average Distance</td>
                                            <td>
                                                {0}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Network Density</td>
                                            <td>
                                                {0}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Network Diameter</td>
                                            <td>
                                                {appState.graph.hasGraph ? 0 : 'loading graph'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Clustering<br></br>Coefficient</td>
                                            <td>{(appState.graph.hasGraph) ? 0 : 'loading graph'}</td>
                                        </tr>
                                        <tr>
                                            <td>Connected <br></br>Component</td>
                                            <td>{(appState.graph.hasGraph) ? 0 : 'loading graph'}</td>

                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </SidebarMenu>
                );
            }
        }
        else if (appState.graph.frame && this.SelectionDistanceFromLatLonIn() && this.SelectionDistanceFromLatLonIn()[0]) {
            //no node is selected 
            return appState.graph.frame && (
                <SidebarMenu>
                    <div class="sidebar-container">
                        <div class="w3-bar w3-black">
                            <button id="AppearanceTab" class="sidebarButton w3-bar-item-button w3-bar-item w3-button" onClick={this.openCity.bind(this, "Appearance")}>Appearance</button>
                            <button id="FilterTab" class="sidebarButton w3-bar-item-button w3-bar-item w3-button" onClick={this.openCity.bind(this, "Filter")}>Filter</button>
                            <button id="StatisticsTab" class="sidebarButton w3-bar-item-button w3-bar-item w3-button" onClick={this.openCity.bind(this, "Statistics")}>Statistics</button>
                        </div>
                        <div id="Appearance" class="city">
                            {/* <text style={{fontSize: "12px"}}>Appearance </text> */}
                            <Tabs2 animate id="graph-options">
                                <Tab2 id="a_nodes" title="Nodes" panel={<NodesPanel />} />
                                <Tab2 id="a_edges" title="Edges" panel={<EdgesPanel />} />
                                <Tab2 id="a_labels" title="Labels" panel={<LabelsPanel />} />
                                {/* <Tab2 id="layout" title="Layout" panel={<LayoutPanel />} /> */}
                                <Tabs2.Expander />
                            </Tabs2>
                        </div>
                        <div id="Filter" class="city" style={{ display: "None" }}>
                            {/* <text style={{fontSize: "12px"}}>Filter Options</text> */}
                            <Tabs2 animate id="filter-options">
                                <Tab2 id="f_nodes" panel={<NodesFilterPanel />} />
                                {/* <Tab2 id="f_edges" title="Edges" panel={<EdgesPanel />} /> */}
                                {/* <Tab2 id="f_layout" title="Layout" panel={<EdgesPanel />} /> */}
                                <Tabs2.Expander />
                            </Tabs2>
                        </div>
                        <div id="Statistics" class="city" style={{ display: "None" }}>
                            <text style={{ fontSize: "12px" }}></text>
                            <Tabs2 animate id="filter-options">
                                <Tab2 id="s_layout" panel={<StatGroupPanel />} />
                                <Tabs2.Expander />
                            </Tabs2>
                        </div>
                        <hr />
                        <div id="statTable" className={classnames(Classes.DIALOG_BODY)}>
                            <table className={Classes.TABLE} style={{ width: '100%' }}>

                                <tbody>
                                    {/* <thead> */}
                                    <tr>
                                        <th colspan="2" style={{ textAlign: "center" }}>Network Statistics</th>

                                    </tr>
                                    {/* </thead> */}
                                    {/* <caption>Network Statistics</caption> */}
                                    <tr>
                                        <td># Nodes</td>
                                        <td>{appState.graph.metadata.fullNodes}</td>
                                    </tr>
                                    <tr>
                                        <td># Edges</td>
                                        <td>{appState.graph.metadata.fullEdges}</td>
                                    </tr>
                                    <tr>
                                        <td>Average Degree</td>
                                        <td>
                                            {appState.graph.hasGraph ? appState.graph.degree().toFixed(3) : 'loading graph'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Average Distance</td>
                                        <td>
                                            {appState.graph.frame ? appState.graph.avgDist() : 'loading graph'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Network Density</td>
                                        <td>
                                            {appState.graph.hasGraph ? appState.graph.density().toFixed(3) : 'loading graph'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Network Diameter</td>
                                        <td>
                                            {appState.graph.hasGraph ? appState.graph.diameter() : 'loading graph'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Clustering<br></br>Coefficient</td>
                                        <td>{(appState.graph.hasGraph) ? appState.graph.averageClustering().toFixed(3) : 'loading graph'}</td>
                                    </tr>
                                    <tr>
                                        <td>Connected <br></br>Component</td>
                                        <td>{(appState.graph.hasGraph) ? appState.graph.components() : 'loading graph'}</td>

                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </SidebarMenu>
            );
        }
        else {
            //everything else , no valid selection, etc. 
            return appState.graph.frame && (
                <SidebarMenu>
                    <div class="sidebar-container">
                        <div class="w3-bar w3-black">
                            <button id="AppearanceTab" class="sidebarButton w3-bar-item-button w3-bar-item w3-button" onClick={this.openCity.bind(this, "Appearance")}>Appearance</button>
                            <button id="FilterTab" class="sidebarButton w3-bar-item-button w3-bar-item w3-button" onClick={this.openCity.bind(this, "Filter")}>Filter</button>
                            <button id="StatisticsTab" class="sidebarButton w3-bar-item-button w3-bar-item w3-button" onClick={this.openCity.bind(this, "Statistics")}>Statistics</button>
                        </div>
                        <div id="Appearance" class="city">
                            {/* <text style={{fontSize: "12px"}}>Appearance </text> */}
                            <Tabs2 animate id="graph-options">
                                <Tab2 id="a_nodes" title="Nodes" panel={<NodesPanel />} />
                                <Tab2 id="a_edges" title="Edges" panel={<EdgesPanel />} />
                                <Tab2 id="a_labels" title="Labels" panel={<LabelsPanel />} />
                                {/* <Tab2 id="layout" title="Layout" panel={<LayoutPanel />} /> */}
                                <Tabs2.Expander />
                            </Tabs2>
                        </div>
                        <div id="Filter" class="city" style={{ display: "None" }}>
                            {/* <text style={{fontSize: "12px"}}>Filter Options</text> */}
                            <Tabs2 animate id="filter-options">
                                <Tab2 id="f_nodes" panel={<NodesFilterPanel />} />
                                {/* <Tab2 id="f_edges" title="Edges" panel={<EdgesPanel />} /> */}
                                {/* <Tab2 id="f_layout" title="Layout" panel={<EdgesPanel />} /> */}
                                <Tabs2.Expander />
                            </Tabs2>
                        </div>
                        <div id="Statistics" class="city" style={{ display: "None" }}>
                            <text style={{ fontSize: "12px" }}></text>
                            <Tabs2 animate id="filter-options">
                                <Tab2 id="s_layout" panel={<StatGroupPanel />} />
                                <Tabs2.Expander />
                            </Tabs2>
                        </div>
                        <hr />
                        <div id="statTable" className={classnames(Classes.DIALOG_BODY)}>
                            <table className={Classes.TABLE} style={{ width: '100%' }}>

                                <tbody>
                                    {/* <thead> */}
                                    <tr>
                                        <th colspan="2" style={{ textAlign: "center" }}>Network Statistics</th>

                                    </tr>
                                    {/* </thead> */}
                                    {/* <caption>Network Statistics</caption> */}
                                    <tr>
                                        <td># Nodes</td>
                                        <td>{0}</td>
                                    </tr>
                                    <tr>
                                        <td># Edges</td>
                                        <td>{0}</td>
                                    </tr>
                                    <tr>
                                        <td>Average Degree</td>
                                        <td>
                                            {appState.graph.hasGraph ? 0 : 'loading graph'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Average Distance</td>
                                        <td>
                                            {appState.graph.hasGraph ? 0 : 'loading graph'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Network Density</td>
                                        <td>
                                            {appState.graph.hasGraph ? 0 : 'loading graph'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Network Diameter <br></br>

                                        </td>
                                        <td>
                                            {appState.graph.hasGraph ? 0 : 'loading graph'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Clustering<br></br>Coefficient</td>
                                        <td>{(appState.graph.hasGraph) ? 0 : 'loading graph'}</td>
                                    </tr>
                                    <tr>
                                        <td>Connected <br></br>Component</td>
                                        <td>{(appState.graph.hasGraph) ? 0 : 'loading graph'}</td>

                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </SidebarMenu>
            );

        }



    }
}

export default Sidebar;