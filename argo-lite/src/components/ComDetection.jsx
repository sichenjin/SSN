import React from "react";
import classnames from "classnames";
import { observer } from "mobx-react";
import appState from "../stores/index";
import { Button, Classes, Switch, Tag } from "@blueprintjs/core";
import { observable, computed, action, runInAction } from "mobx";

import axios from 'axios'


@observer
class ComDetection extends React.Component {
    @observable modularity = undefined;

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
        axios.post('http://127.0.0.1:5000/flask/community', querydict).then(
            (response) => {
                var communityDict = response.data.message;
                this.modularity = response.data.modularity;
                appState.graph.rawGraph.nodes.forEach((node) => {
                    node.community = communityDict[node.id] ? communityDict[node.id] : -1
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
                appState.graph.metadata.uniqueValue = uniqueValue
                appState.graph.metadata.nodeProperties = nodekeyList
                appState.graph.metadata.nodePropertyTypes = nodePropertyTypes
                appState.graph.nodes.colorBy = "community"
                appState.graph.nodes.color.scale = "Nominal Scale"
                // console.log(result);
            },
            (error) => {
                console.log(error);
            }
        );
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
        axios.post('http://http://127.0.0.1:5000/flask/Cliques', querydict).then(
            // 'https://snoman.herokuapp.com/flask/Cliques'
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
                // appState.graph.metadata.uniqueValue = uniqueValue
                // appState.graph.metadata.nodeProperties = nodekeyList
                // appState.graph.metadata.nodePropertyTypes= nodePropertyTypes
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
        axios.post('http://127.0.0.1:5000/flask/convexhull', querydict).then(
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
                appState.graph.metadata.uniqueValue = uniqueValue
                appState.graph.metadata.nodeProperties = nodekeyList
                appState.graph.metadata.nodePropertyTypes = nodePropertyTypes


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
        axios.post('http://127.0.0.1:5000/flask/densitydistance', querydict).then(
            (response) => {
                var jsondata = JSON.parse(response.data)
                // var convexDict = jsondata.message;

                appState.graph.metadata.nodeComputed.push('standard distance')
                appState.graph.metadata.nodeComputed.push('network density')

                appState.graph.densityDistance = jsondata.density_distance
                appState.graph.scatterplot.y = 'standard distance'
                appState.graph.scatterplot.x = 'network density'
                appState.graph.groupby = group


            },
            (error) => {
                console.log(error);
            }
        );
    }





    render() {
        return (
            <div>
                <Button
                className="bp4-button"
                    style={{ position: 'absolute', top: '55vh', left: '5vw', zIndex: '1000' }}
                    onClick={this.runcommunity}>Run Community</Button>
                {/* {this.modularity? <Tag className="network-tag">{this.modularity}</Tag>: null} */}
                {/* <Button
                    style={{ position: 'absolute', top: '50px', left: '500px', zIndex: '1000' }}
                    onClick={this.findcliques}>Find Cliques</Button> */}
                <Button
                className="bp4-button"
                    style={{ position: 'absolute', top: '55vh', left: '18vw', zIndex: '1000' }}
                    onClick={() => this.convexhull('Family')}>Convex Hull by Group</Button>

                <Button
                className="bp4-button"
                    style={{ position: 'absolute', top: '55vh', left: '35vw', zIndex: '1000' }}
                    onClick={() => this.density_distance('Family')}>Cluster Cluster</Button>
                
            </div>

        )

    }

}


export default ComDetection;