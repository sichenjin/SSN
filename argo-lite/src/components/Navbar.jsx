import React from "react";
import classnames from "classnames";
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
  MenuDivider,
  Navbar
} from "@blueprintjs/core";


import "bootstrap/dist/css/bootstrap.min.css";


import { observer } from "mobx-react";

import appState from "../stores/index";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import argologo_dark from '../images/Snoman title.png';
import argologo_light from '../images/Snoman logo.png';
import { toaster } from '../notifications/client';
import { LOGO_URL, GITHUB_URL, SAMPLE_GRAPH_SNAPSHOTS } from '../constants';



import axios from 'axios'
import { observable, computed,reaction, action, runInAction } from "mobx";

import { Tab2, Tabs2, Tag } from "@blueprintjs/core";
import NodesPanel from "./panels/NodesPanel";
import EdgesPanel from "./panels/EdgesPanel";
import LabelsPanel from "./panels/LabelsPanel";
import NodesFilterPanel from "./panels/NodesFilterPanel";

@observer
class RegularNavbar extends React.Component {
  @observable modularity = undefined;

  // reaction(
  //   () => appState.graph.smartPause.smartPaused,
  //   () => {
  //       this.forceUpdate()
  //     }
    
  // );

  
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
    axios.post('https://snoman.herokuapp.com/flask/convexhull', querydict).then(
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
    axios.post('http://snoman.herokuapp.com/flask/densitydistance', querydict).then(
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
      <nav className={classnames([Classes.NAVBAR], 'navbar-head')} style={{display:"block", height:"5vh"}}>
        <div className={classnames([Classes.NAVBAR_GROUP, Classes.ALIGN_LEFT])} style={{height:"100%"}}>
          <a href={LOGO_URL} target="_blank">
            <img title="Snoman" id="SNoMAN logo"
              src={appState.preferences.darkMode ? argologo_dark : argologo_light}
              height="28px"></img>
          </a>
          <span>SNoMaN</span>
          <div className={classnames([Classes.NAVBAR_HEADING])} style={{height:"100%"}}></div>
          {/* <a
            href="https://poloclub.github.io/argo-graph/"
            target='_blank'
            style={{
              padding: '6px 10px 6px 10px',
              backgroundColor: 'pink',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none'
            }}
          >
            Learn more about Argo
          </a> */}
          <Popover
            content={
              <Menu>
                <MenuItem text="Load Sample" iconName="graph">
                  {
                    SAMPLE_GRAPH_SNAPSHOTS.map((sample) => {
                      const sampleSnapshotTitle = sample[0];
                      const sampleSnapshotStrapiUuid = sample[1];

                      return (
                        <MenuItem
                          style={{ width: "300px" }}
                          key={sampleSnapshotTitle}
                          iconName="graph"
                          text={sampleSnapshotTitle}
                          onClick={() => {
                            window.loadAndDisplaySnapshotFromStrapi(sampleSnapshotStrapiUuid);
                          }}
                        />
                      );
                    })
                  }

                </MenuItem>
                <MenuDivider />
                <MenuItem
                  iconName="import"
                  text="Import from CSV..."
                  onClick={() => (appState.import.dialogOpen = true)}
                />
                {/* <MenuItem
                  iconName="import"
                  text="Import from GEXF..."
                  onClick={() => (appState.import.gexfDialogOpen = true)}
                /> */}
                {/* <MenuItem
                  iconName="pt-icon-document-open"
                  text="Open Snapshot"
                  onClick={() => { appState.preferences.openSnapshotDialogOpen = true }}
                />
                <MenuDivider /> */}
                {/* <MenuItem
                  iconName="download"
                  text="Save Snapshot"
                  onClick={() => {
                    appState.project.stringCopyOfSnapshot = appState.graph.saveImmediateStates();
                    appState.project.isSaveSnapshotDialogOpen = true
                  }}
                /> */}
                {/* <MenuItem
                  iconName="pt-icon-document-share"
                  text="Publish and Share Snapshot"
                  onClick={() => { appState.preferences.shareDialogOpen = true }}
                /> */}
              </Menu>
            }
            position={Position.BOTTOM}
            style={{height:"100%"}}
          >
            <Button
              className={classnames([Classes.BUTTON, Classes.MINIMAL])}
              style={{height:"100%"}}
              iconName="document"
            >
              File
            </Button>
          </Popover>
          <Popover
            content={
              <Menu>
                <MenuItem
                  text="View Table"
                  iconName="pt-icon-database"
                  onClick={() => {
                    appState.graph.frame.pauseLayout();
                    appState.preferences.dataSheetDialogOpen = true;
                    this.forceUpdate();
                  }}
                />
                <MenuItem
                  text="Statistics"
                  iconName="pt-icon-timeline-bar-chart"
                  onClick={() => { appState.preferences.statisticsDialogOpen = true }}
                />
                {/* <MenuItem text="Community Detection" iconName="graph">
                  <MenuItem
                    text="Convex Hull"
                    onClick={() => {
                      appState.graph.showNodes(appState.graph.rawGraph.nodes.map(n => n.id));
                    }}
                  />
                  <MenuItem
                    text="Show only nodes with top 5 PageRank"
                    onClick={() => {
                      appState.graph.hideNodes(appState.graph.rawGraph.nodes.map(n => n.id));
                      const sortedNodeList = [...appState.graph.rawGraph.nodes];
                      sortedNodeList.sort((n1, n2) => {
                        if (n1["pagerank"] && n2["pagerank"]) {
                          return n2["pagerank"] - n1["pagerank"];
                        }
                        return 0;
                      });
                      const ids = [];
                      for (let i = 0; i < 5 && i < sortedNodeList.length; i++) {
                        ids.push(sortedNodeList[i].id);
                      }
                      appState.graph.showNodes(ids);
                    }}
                  />
                  <MenuItem
                    text="Show only nodes with top 5 Degree"
                    onClick={() => {
                      appState.graph.hideNodes(appState.graph.rawGraph.nodes.map(n => n.id));
                      const sortedNodeList = [...appState.graph.rawGraph.nodes];
                      sortedNodeList.sort((n1, n2) => {
                        if (n1["degree"] && n2["degree"]) {
                          return n2["degree"] - n1["degree"];
                        }
                        return 0;
                      });
                      const ids = [];
                      for (let i = 0; i < 5 && i < sortedNodeList.length; i++) {
                        ids.push(sortedNodeList[i].id);
                      }
                      appState.graph.showNodes(ids);
                    }}
                  />
                  <MenuItem
                    text="Hide All Nodes"
                    onClick={() => {
                      appState.graph.hideNodes(appState.graph.rawGraph.nodes.map(n => n.id));
                    }}
                  />
                </MenuItem> */}
              </Menu>
            }
            position={Position.BOTTOM}
          >
            <Button
              className={classnames([Classes.BUTTON, Classes.MINIMAL])}
              iconName="pt-icon-wrench"
            >
              View
            </Button>
          </Popover>
        </div>
        <div className={classnames([Classes.NAVBAR_GROUP, Classes.ALIGN_LEFT]) } style={{height:"100%"}}>
          <span className={Classes.NAVBAR_DIVIDER} style={{height:"100%"}}/>
          {appState.graph.hasGraph && appState.graph.frame && (
            <div style={{ display: "inline" }}>

              {/** Smart Pause functionality: pauses graph when no interaction */}
              {(() => {
                let self = this;
                setInterval(function () {
                  let timeNow = Date.now();
                  /**stops initial default active layout*/
                  if (appState.graph.smartPause.defaultActive.isActive) {
                    if (timeNow - appState.graph.smartPause.defaultActive.startTime > appState.graph.smartPause.defaultActive.duration
                      || appState.graph.smartPause.interactingWithGraph) {
                      appState.graph.smartPause.defaultActive.isActive = false;
                    }
                  } else {
                    /**smart pausing*/
                    if (!appState.graph.frame.paused &&
                      !appState.graph.smartPause.interactingWithGraph) {
                      appState.graph.frame.pauseLayout();
                      appState.graph.frame.paused = true;
                      appState.graph.smartPause.smartPaused = true;
                      self.forceUpdate();
                    }
                    /**old code using lastUnpaused:*/
                    /**
                     * if(!appState.graph.frame.paused && 
                      appState.graph.smartPause.lastUnpaused && 
                      !appState.graph.smartPause.interactingWithGraph && timeNow - appState.graph.smartPause.lastUnpaused > 300){
                        appState.graph.frame.pauseLayout();
                        appState.graph.frame.paused = true;
                        appState.graph.smartPause.smartPaused = true;
                        self.forceUpdate();
                    }
                     */

                    /**un-smart pausing*/
                    if (appState.graph.smartPause.smartPaused && appState.graph.smartPause.interactingWithGraph) {
                      appState.graph.frame.resumeLayout();
                      appState.graph.frame.paused = false;
                      appState.graph.smartPause.smartPaused = false;
                      self.forceUpdate();
                    }
                  }
                }, 10)
              })()}

{<Tooltip
                content={(appState.graph.frame.paused) ? "Resume Layout Algorithm" : "Pause Layout Algorithm"}
                position={Position.BOTTOM}
              >
                <Button
                  className={classnames([Classes.BUTTON, Classes.MINIMAL])}
                  iconName={(!appState.graph.smartPause.smartPaused && appState.graph.frame.paused) ? "play" : "pause"}
                  text={(!appState.graph.smartPause.smartPaused && appState.graph.frame.paused) ? "Resume Force-Directed Layout" : "Pause Force-Directed Layout"}
                  onClick={() => {
                    if (appState.graph.frame.paused && !appState.graph.smartPause.smartPaused) {
                      /**graph is going from "pause layout" mode to "resume layout"*/

                      /** graph runs for default duration when unpaused */
                      appState.graph.runActiveLayout();

                      appState.graph.frame.resumeLayout();
                      this.forceUpdate();
                      /**appState.graph.smartPause.lastUnpaused = Date.now(); //old code using lastUnpaused*/
                    } else if (appState.graph.smartPause.smartPaused) {
                      /**graph is going from smart paused "resume layout" mode to "pause layout" mode*/
                      appState.graph.frame.paused = true;
                      appState.graph.smartPause.smartPaused = false;
                    } else {
                      /**graph is going from in "resume layout" mode to "pause layout" mode*/
                      appState.graph.frame.pauseLayout();
                      this.forceUpdate();
                    }
                  }}
                />
              </Tooltip>
              }
              {/* {                    {appState.graph.hasGraph && <Button className={"pt-small"} text="Clear Selection and Filter" onClick={() => (appState.graph.overrides = new Map())} />}} */}
              <div className="pt-button-group">
              <a className="pt-button pt-icon-refresh"  role="button" onClick={() => {
                appState.graph.mapClicked = undefined;
                appState.graph.selectedNodes = [];
                appState.graph.frame.selection = []
                appState.graph.filter  = {}
                appState.graph.currentlyHovered = undefined;
                // appState.graph.mapClicked = undefined;
                appState.graph.edgeselection = [];
                appState.graph.degreeselection = [];
                appState.graph.degreebrushed = false;
                appState.graph.distanceDensityCurrentlyHovered = undefined;
                appState.graph.distanceDensityCurrentlyClicked = [];
                appState.graph.clearBrush = true;
                appState.graph.filterNodes()
                appState.graph.frame.updateSelectionOpacity()
                // this.forceUpdate();
              }}> Clear All Selections and Filters</a>
              </div>
            </div>
          )}
          {/* {!appState.graph.smartPause.smartPaused && this.forceUpdate()} */}
        </div>
        <div
          className={classnames([Classes.NAVBAR_GROUP, Classes.ALIGN_RIGHT])} style={{height:"100%"}}
        >
          {/* <Button
            className={classnames([Classes.BUTTON, Classes.MINIMAL])}
            iconName="graph"
            onClick={() => {
              appState.project.isRenameSnapshotDialogOpen = true;
            }}
          >
            {appState.graph.metadata.snapshotName || "Untitled Graph"}
          </Button> */}
          <span className={Classes.NAVBAR_DIVIDER} />
          {/* <Button
            className={classnames([Classes.BUTTON, Classes.MINIMAL])}
            iconName="cog"
            onClick={() => {
              appState.preferences.dialogOpen = true;
            }}
          /> */}
          <Button
            className={classnames([Classes.BUTTON, Classes.MINIMAL])}
            style={{height:"100%"}}
            iconName="help"
            onClick={() => {
              appState.preferences.helpDialogOpen = true;
            }}
          />
          <Button
            className={classnames([Classes.BUTTON, Classes.MINIMAL])}
            style={{height:"100%"}}
            iconName="minimize"
            onClick={() => {
              appState.preferences.turnOnMinimalMode()
            }}
          />
          <span className={Classes.NAVBAR_DIVIDER} style={{height:"100%"}}/>
          <a
            href={GITHUB_URL}
            target='_blank'
            style={{
              color: appState.preferences.darkMode ? 'white' : 'black',
              fontSize: '120%',
              textDecoration: 'none'
            }}
          >
            <FontAwesomeIcon icon={faGithub} />
          </a>
        </div>
      </nav>
    );
  }
}

@observer
class MinimalNavbar extends React.Component {
  render() {
    return appState.graph.frame && (
      <div>
        <div
          className={classnames("minimal-navbar-left")}
          style={{
            backgroundColor: appState.preferences.darkMode ? '#30404D' : '#FFFFFF',
          }}
        >
          <Tooltip
            content={(appState.graph.frame.paused) ? "Resume Layout Algorithm" : "Pause Layout Algorithm"}
            position={Position.BOTTOM}
          >
             <div className="pt-button-group">
            <a
              className={classnames("pt-button pt-icon-maximize", (!appState.graph.smartPause.smartPaused && appState.graph.frame.paused) ? "pt-icon-play" : "pt-icon-pause")}
              role="button"
              onClick={() => {
                if (appState.graph.frame.paused && !appState.graph.smartPause.smartPaused) {
                  /**graph is going from "pause layout" mode to "resume layout"*/

                  /** graph runs for default duration when unpaused */
                  appState.graph.runActiveLayout();

                  appState.graph.frame.resumeLayout();
                  this.forceUpdate();
                  /**appState.graph.smartPause.lastUnpaused = Date.now(); //old code using lastUnpaused*/
                } else if (appState.graph.smartPause.smartPaused) {
                  /**graph is going from smart paused "resume layout" mode to "pause layout" mode*/
                  appState.graph.frame.paused = true;
                  appState.graph.smartPause.smartPaused = false;
                } else {
                  /**graph is going from in "resume layout" mode to "pause layout" mode*/
                  appState.graph.frame.pauseLayout();
                  this.forceUpdate();
                }
              }}
            // onClick={() => {
            //   if (appState.graph.frame.paused) {
            //     appState.graph.frame.resumeLayout();
            //     this.forceUpdate();
            //   } else {
            //     appState.graph.frame.pauseLayout();
            //     this.forceUpdate();
            //   }
            // }}
            />
          </div>
          </Tooltip>
         
        </div>
        <div
          className={classnames("minimal-navbar-right")}
          style={{
            backgroundColor: appState.preferences.darkMode ? '#30404D' : '#FFFFFF',
          }}
        >
          <div className="pt-button-group">
            <a className="pt-button pt-icon-maximize"  role="button" onClick={() => appState.preferences.turnOffMinimalMode()}></a>
            <a className="pt-button pt-icon-help"  role="button" onClick={() => appState.preferences.helpDialogOpen = true}></a>
            <a className="pt-button pt-icon-document-open"  role="button" href={window.location} target="_blank"></a>
          </div>
        </div>
      </div>
    );
  }
}

@observer
class NavbarSelector extends React.Component {
  render() {
    return appState.preferences.isNavbarInMinimalMode ? <MinimalNavbar /> : <RegularNavbar />;
  }
}

export default NavbarSelector;