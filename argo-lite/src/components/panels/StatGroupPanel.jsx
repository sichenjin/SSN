
import React from "react";
import { observer } from "mobx-react";
import classnames from "classnames";
import SimpleSelect from "../utils/SimpleSelect";
import {
    Button,
    Classes,
    InputGroup,
    Intent,
    Position,
    Tooltip,
    Popover,
    Menu,
    MenuItem,
    MenuDivider
} from "@blueprintjs/core";

import appState from "../../stores";
import createGraph from 'ngraph.graph';
import path from 'ngraph.path';


import axios from 'axios'
import { observable, computed, action, runInAction } from "mobx";


@observer
class StatGroupPanel extends React.Component {

    constructor(props) {
        super(props);
        this.state = {

        };
    }


    runcommunity = () => {
        appState.graph.convexPolygons = []

        var fromedgelist = appState.graph.rawGraph.edges.map((edge) => {
            return edge.source_id
        })
        var toedgelist = appState.graph.rawGraph.edges.map((edge) => {
            return edge.target_id
        })
        var querydict = {
            "type": 'edgelist',
            "message": {
                'name': 'community'
            },
            "fromedgelist": fromedgelist,
            "toedgelist": toedgelist
        }
        axios.post('https://snoman.herokuapp.com/flask/community', querydict).then(
            // https://snoman.herokuapp.com/flask/community', querydict).then(
            (response) => {
                var communityDict = response.data.message;
                appState.graph.modularity = response.data.modularity;
                appState.graph.rawGraph.nodes.forEach((node) => {
                    node.community = communityDict[node.id] ? String.fromCharCode(communityDict[node.id] + 97) : 'a'
                })
                const nodesArr = appState.graph.rawGraph.nodes
                const nodekeyList = Object.keys(nodesArr[1])
                const nodePropertyTypes = {}
                nodekeyList.forEach(function (k) {
                    nodePropertyTypes[k] = typeof (nodesArr[1][k])
                })
                const uniqueValue = {}
                nodekeyList.forEach(function (k, i) {

                    if (nodePropertyTypes[k] == 'string') {
                        uniqueValue[k] = [...new Set(nodesArr.map(item => item[k]))]
                    } else {
                        const valuea = nodesArr.map(function (el) { return el[k]; })
                        const minv = Math.min(...valuea)
                        const maxv = Math.max(...valuea)
                        uniqueValue[k] = [minv, maxv]
                    }
                })
                appState.graph.metadata.nodePropertyTypes = nodePropertyTypes
                appState.graph.metadata.uniqueValue = uniqueValue
                appState.graph.metadata.nodeProperties = nodekeyList

                appState.graph.nodes.color.scale = "Nominal Scale"
                appState.graph.nodes.colorBy = "community"

                appState.graph.nodes.convexhullby = "community"
                appState.graph.nodes.groupby = "community"
                appState.graph.watchAppearance = appState.graph.watchAppearance + 1


                // console.log(result);
            },
            (error) => {
                console.log(error);
            }
        );
    }

    runKfullfillment = () => {
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // Radius of the Earth in kilometers
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            return distance;
        }

        // Function to find the K nearest neighbors for each node
        const findKfulfillment = (nodes, edges) => {
            const neighbors = {};


            for (const currentNode of nodes) {
                // find nearest neighbors
                const currentId = currentNode.id;
                currentNode['nearestnn'] = []
                // neighbors[currentId] = [];

                // Calculate distances to all other nodes
                for (const otherNode of nodes) {
                    if (currentNode !== otherNode) {
                        const distance = calculateDistance(
                            currentNode.LatY,
                            currentNode.LonX,
                            otherNode.LatY,
                            otherNode.LonX
                        );

                        currentNode['nearestnn'].push({
                            id: otherNode.id,
                            distance: distance
                        });
                    }
                }

                // Sort neighbors by distance and keep the closest K
                currentNode['nearestnn'].sort((a, b) => a.distance - b.distance);
                const k = currentNode['degree']
                currentNode['nearestnn'] = currentNode['nearestnn'].slice(0, k);

                //find connected node id
                currentNode['connected node'] = []
                for (const edge of edges) {
                    if (edge.source_id == currentNode['id'] || edge.target_id == currentNode["id"]) {
                        currentNode['connected node'].push(edge.source_id)
                        currentNode['connected node'].push(edge.target_id)
                    }
                }
                currentNode['connected node'].filter((n) => n !== currentNode['id']);



                // calculate kfulfillment
                const cnn = new Set(currentNode['connected node']);
                currentNode['connected node'] = Array.from(cnn)
                const snn = new Set(currentNode['nearestnn'].map(n => n.id));

                const intersection = [...cnn].filter(item => snn.has(item));
                if (currentNode['degree'] === 0) {
                    currentNode['k-fulfillment'] = 0
                } else {
                    currentNode['k-fulfillment'] = intersection.length / currentNode['degree']
                }

            }


        }

        findKfulfillment(appState.graph.rawGraph.nodes, appState.graph.rawGraph.edges)
        appState.graph.metadata.nodeComputed.push('k-fulfillment')
        appState.graph.scatterplot.x = 'k-fulfillment'
        appState.graph.scatterplot.y = 'degree'


    }
    runLocalFlatRatio = () => {
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // Radius of the Earth in kilometers
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            return distance;
        }

        const findFlatRatio = (nodes) => {
            const neighbors = {};

            if (nodes[0]['nearestnn']) {
                // don't calculate nearest neighbors again
                //calculate connected node distance directly
                for (const currentNode of nodes) {
                    const currentId = currentNode.id;
                    const links = appState.graph.frame.getNode(currentId).linkObjs
                    if (links) {
                        const cdistance = links.reduce((dist, l) => dist + l.edgeDist, 0);
                        const ndistance = currentNode['nearestnn'].reduce((dist, l) => dist + l.distance, 0);
                        // calculate flat ratio
                        currentNode['flattening ratio'] = ndistance / cdistance
                        if(!isFinite(currentNode['flattening ratio'])){
                            currentNode['flattening ratio'] = 0
                        }
                    }else{
                        currentNode['flattening ratio'] = 0
                    }

                }
            } else {
                for (const currentNode of nodes) {
                    // find nearest neighbors
                    const currentId = currentNode.id;
                    currentNode['nearestnn'] = []
                    // neighbors[currentId] = [];

                    // Calculate distances to all other nodes
                    for (const otherNode of nodes) {
                        if (currentNode !== otherNode) {
                            const distance = calculateDistance(
                                currentNode.LatY,
                                currentNode.LonX,
                                otherNode.LatY,
                                otherNode.LonX
                            );

                            currentNode['nearestnn'].push({
                                id: otherNode.id,
                                distance: distance
                            });
                        }
                    }

                    // Sort neighbors by distance and keep the closest K
                    currentNode['nearestnn'].sort((a, b) => a.distance - b.distance);
                    const k = currentNode['degree']
                    currentNode['nearestnn'] = currentNode['nearestnn'].slice(0, k);

                    //calculate connected node distance
                    const links = appState.graph.frame.getNode(currentId).linkObjs
                    if (links) {
                        const cdistance = links.reduce((dist, l) => dist + l.edgeDist, 0);
                        const ndistance = currentNode['nearestnn'].reduce((dist, l) => dist + l.distance, 0);
                        // calculate flat ratio
                        currentNode['flattening ratio'] = ndistance / cdistance
                        if(!isFinite(currentNode['flattening ratio'])){
                            currentNode['flattening ratio'] = 0
                        }
                    } else {
                        currentNode['flattening ratio'] = 0
                    }



                }
            }



        }

        findFlatRatio(appState.graph.rawGraph.nodes)
        appState.graph.metadata.nodeComputed.push('flattening ratio')
        appState.graph.scatterplot.x = 'flattening ratio'
        appState.graph.scatterplot.y = 'degree'

    }

    runShortestPath = () => {


        const calDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
            var p = 0.017453292519943295;    // Math.PI / 180
            var c = Math.cos;
            var a = 0.5 - c((lat2 - lat1) * p) / 2 +
                c(lat1 * p) * c(lat2 * p) *
                (1 - c((lon2 - lon1) * p)) / 2;

            return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
        }

        const graph = createGraph();

        // hardcode LatY and LonX for sample dataset 
        appState.graph.rawGraph.nodes.forEach(node => graph.addNode(node["id"].toString(), { LatY: parseFloat(node["LatY"]), LonX: parseFloat(node["LonX"]) }))
        appState.graph.rawGraph.edges.forEach(edge => graph.addLink(edge["source_id"], edge["target_id"]));

        const shortestPathPairs = () => {
            let pathFinder = path.aGreedy(graph);
            const pathsArr = []
            const pathsSet = new Set();



            graph.forEachNode(function (fromnode) {

                graph.forEachNode(function (tonode) {
                    if (fromnode.id !== tonode.id) {
                        const pathKey1 = `${fromnode.id}👉${tonode.id}`;
                        const pathKey2 = `${tonode.id}👉${fromnode.id}`;
                        const edgeinfo = appState.graph.rawGraph.edges.filter((edge) => {
                            return (edge.source_id === fromnode.id && edge.target_id === tonode.id)
                        })
                        let pairdist = calDistanceFromLatLonInKm(fromnode.data.LatY, fromnode.data.LonX, tonode.data.LatY, tonode.data.LonX)



                        // undirected graph:
                        // only add once for undirected graph 
                        if (!(pathsSet.has(pathKey1)) && !(pathsSet.has(pathKey2))) {
                            pathsSet.add(pathKey1);
                            pathsSet.add(pathKey2);
                            pathsArr.push({
                                "source": fromnode.id,
                                "target": tonode.id,
                                "path": pathFinder.find(fromnode.id, tonode.id),
                                "distance": pairdist

                            })
                        }

                        //directed graph: 
                    }

                })

            })
            // console.log(nodesArr.length)
            // console.log(pathsArr.length)
            return pathsArr

        }
        appState.graph.rawGraph.paths = shortestPathPairs();
        appState.graph.metadata.nodeComputed.push('shortest path')
        appState.graph.metadata.nodeComputed.push('pair distance')
        appState.graph.scatterplot.x = 'pair distance'
        appState.graph.scatterplot.y = 'shortest path'

    }

    findcliques = () => {

        var fromedgelist = appState.graph.rawGraph.edges.map((edge) => {
            return edge.source_id
        })
        var toedgelist = appState.graph.rawGraph.edges.map((edge) => {
            return edge.target_id
        })
        var querydict = {
            "type": 'edgelist',
            "message": {
                'name': 'clique'
            },
            "fromedgelist": fromedgelist,
            "toedgelist": toedgelist
        }
        axios.post('https://snoman.herokuapp.com/flask/Cliques', querydict).then(
            (response) => {
                var cliques = response.data.message;
                console.log(cliques)
                // appState.graph.rawGraph.nodes.forEach((node) => {
                //     node.community = communityDict[node.id]
                // })
                // const nodesArr = appState.graph.rawGraph.nodes
                // const nodekeyList = Object.keys(nodesArr[1])
                // const nodePropertyTypes = {}
                // nodekeyList.forEach(function (k) {
                //     nodePropertyTypes[k] = typeof (nodesArr[1][k])
                // })
                // const uniqueValue = {}
                // nodekeyList.forEach(function (k, i) {

                //     if (nodePropertyTypes[k] == 'string') {
                //         uniqueValue[k] = [...new Set(nodesArr.map(item => item[k]))]
                //     } else {
                //         const valuea = nodesArr.map(function (el) { return el[k]; })
                //         const minv = Math.min(...valuea)
                //         const maxv = Math.max(...valuea)
                //         uniqueValue[k] = [minv, maxv]
                //     }
                // })
                // appState.graph.metadata.nodePropertyTypes= nodePropertyTypes
                // appState.graph.metadata.uniqueValue = uniqueValue
                // appState.graph.metadata.nodeProperties = nodekeyList

                // console.log(result);
            },
            (error) => {
                console.log(error);
            }
        );
    }

    convexhull = (group) => {

        var fromedgelist = appState.graph.rawGraph.edges.map((edge) => {
            return edge.source_id
        })
        var toedgelist = appState.graph.rawGraph.edges.map((edge) => {
            return edge.target_id
        })
        var querydict = {
            "type": 'edgelist',
            "message": {
                'name': 'convex'
            },
            "group": group,
            "nodes": appState.graph.rawGraph.nodes

        }
        axios.post('https://snoman.herokuapp.com/flask/convexhull', querydict).then(

            // https://snoman.herokuapp.com/flask/convexhull', querydict).then(
            (response) => {
                var jsondata = JSON.parse(response.data)
                var convexDict = jsondata.message;


                appState.graph.rawGraph.nodes.forEach((node) => {
                    node.isconvex = convexDict[node.id]
                })
                const nodesArr = appState.graph.rawGraph.nodes
                const nodekeyList = Object.keys(nodesArr[1])
                const nodePropertyTypes = {}
                nodekeyList.forEach(function (k) {
                    nodePropertyTypes[k] = typeof (nodesArr[1][k])
                })
                const uniqueValue = {}
                nodekeyList.forEach(function (k, i) {

                    if (nodePropertyTypes[k] == 'string') {
                        uniqueValue[k] = [...new Set(nodesArr.map(item => item[k]))]
                    } else {
                        const valuea = nodesArr.map(function (el) { return el[k]; })
                        const minv = Math.min(...valuea)
                        const maxv = Math.max(...valuea)
                        uniqueValue[k] = [minv, maxv]
                    }
                })
                appState.graph.metadata.nodePropertyTypes = nodePropertyTypes
                appState.graph.metadata.uniqueValue = uniqueValue
                appState.graph.metadata.nodeProperties = nodekeyList


                appState.graph.nodes.color.scale = "Nominal Scale"
                appState.graph.nodes.colorBy = group
                appState.graph.convexPolygonsShow = true
                appState.graph.watchAppearance = appState.graph.watchAppearance + 1

                // const selectionNode = appState.graph.frame.getNodeList().filter(node =>
                //     // console.log(node)
                //     node.data.ref.isconvex

                // )
                // // highlight for the mapview 
                // appState.graph.convexNodes = selectionNode
                appState.graph.convexPolygons = jsondata.multipolygon;
                console.log(appState.graph.convexPolygons)
                //highlight in the network view 
                // appState.graph.frame.graph.forEachNode(n => {  //fisrt dehighlight all the nodes  
                //     appState.graph.frame.colorNodeOpacity(n, 0.2);

                // });

                // appState.graph.frame.lineIndices.forEach(function (link) {
                //     link.linecolor.r = self.darkMode ? 0.25 : 0.89; //black/white
                //     link.linecolor.g = self.darkMode ? 0.25 : 0.89;
                //     link.linecolor.b = self.darkMode ? 0.25 : 0.89;
                // })

                // for (var i = 0; i < selectionNode.length; i++) {
                //     appState.graph.frame.colorNodeOpacity(selectionNode[i], 1);
                //   }



            },
            (error) => {
                console.log(error);
            }
        );
    }


    density_distance = (group) => {

        // var fromedgelist = appState.graph.rawGraph.edges.map((edge) => {
        //     return edge.source_id
        // })
        // var toedgelist = appState.graph.rawGraph.edges.map((edge) => {
        //     return edge.target_id
        // })
        var querydict = {
            "type": 'edgelist',
            "message": {
                'name': 'density_distance'
            },
            "group": group,
            "nodes": appState.graph.rawGraph.nodes,
            "edges": appState.graph.rawGraph.edges


        }
        axios.post('https://snoman.herokuapp.com/flask/densitydistance', querydict).then(
            (response) => {
                var jsondata = JSON.parse(response.data)
                // var convexDict = jsondata.message;

                appState.graph.metadata.nodeComputed.push('standard distance')
                appState.graph.metadata.nodeComputed.push('network density')

                appState.graph.densityDistance = jsondata.density_distance
                appState.graph.scatterplot.y = 'standard distance'
                appState.graph.scatterplot.x = 'network density'
                appState.graph.groupby = group
                appState.graph.nodes.colorBy = group
                appState.graph.nodes.color.scale = "Nominal Scale"
                appState.graph.watchAppearance = appState.graph.watchAppearance + 1


            },
            (error) => {
                console.log(error)

            }
        );
    }

    render() {

        return (
            (
                <div>
                    <Button
                        className="bp4-button"
                        style={{ zIndex: '1000' }}
                        onClick={this.runLocalFlatRatio}>Run Local Flattening Ratio</Button>
                    <Button
                        className="bp4-button"
                        style={{ zIndex: '1000' }}
                        onClick={this.runKfullfillment}>Run  K-fullfillment</Button>
                    <Button
                        className="bp4-button"
                        style={{ zIndex: '1000' }}
                        onClick={this.runShortestPath}>Run Shortest Path</Button>
                    <Button
                        className="bp4-button"
                        style={{ zIndex: '1000' }}
                        onClick={this.runcommunity}>Run Community</Button>
                    {/* <button style={{height: "100%"}} onClick={this.runcommunity} type="button">
                            Run Community
                        </button> */}
                    {appState.graph.modularity ? <text className="modularity-tag" style={{ fontSize: "8px" }} >{"Q value: " + parseFloat(appState.graph.modularity).toFixed(3)}</text> : null}
                    {/* <Button
                        style={{ position: 'absolute', top: '50px', left: '500px', zIndex: '1000' }}
                        onClick={this.findcliques}>Find Cliques</Button> */}
                    {/* <Button
                        className="bp4-button"
                        style={{ zIndex: '1000' }}
                        onClick={() => this.convexhull('Family')}>Convex Hull by Group</Button>

                    <Button
                        className="bp4-button"
                        style={{ zIndex: '1000' }}
                        onClick={() => this.density_distance('Family')}>Cluster Cluster</Button> */}


                    <div>
                        <p style={{ display: "inline", fontSize: "12px" }}>Convex Hull By: </p>
                        <span style={{}}>
                            <SimpleSelect
                                items={appState.graph.filterKeyList}
                                onSelect={it => {
                                    appState.graph.convexhullby = it
                                    this.convexhull(it)
                                    appState.graph.convexPolygonsShow = true
                                }}
                                value={appState.graph.convexhullby}
                            />
                        </span>
                    </div>
                    <div>
                        <p style={{ display: "inline", fontSize: "12px" }}>Cluster By: </p>
                        <span style={{}}>
                            <SimpleSelect
                                items={appState.graph.filterKeyList}
                                onSelect={it => {
                                    appState.graph.groupby = it
                                    this.density_distance(it)
                                }}
                                value={appState.graph.groupby}
                            />
                        </span>
                    </div>
                </div>

            )
        );
    }
}

export default StatGroupPanel;

