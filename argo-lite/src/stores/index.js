import { autorun, runInAction } from "mobx";
import { Intent } from "@blueprintjs/core";

import PreferencesStore from "./PreferencesStore";
import GraphStore from "./GraphStore";
// import MapStore from "./MapStore";
import ImportStore from "./ImportStore";
import ProjectStore from "./ProjectStore";
// import { peakCSV } from "../services/CSVUtils";
import parse from "csv-parse/lib/sync";
import SearchStore from "./SearchStore";
import { runSearch } from "../ipc/client";

import { BACKEND_URL, SAMPLE_GRAPH_SNAPSHOTS} from "../constants";
import { toaster } from '../notifications/client';

import {LocalFileData,constructFileFromLocalFileData} from "get-file-object-from-local-path"

// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

export class AppState {
  constructor() {
    this.preferences = new PreferencesStore();
    this.graph = new GraphStore();
    // this.mapview = new MapStore();
    this.import = new ImportStore();
    this.search = new SearchStore();
    this.project = new ProjectStore();
  //   this.map = <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={false}>
  //   <TileLayer
  //     attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  //     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  //   />
  //   <Marker position={[51.505, -0.09]}>
  //     <Popup>
  //       A pretty CSS3 popup. <br /> Easily customizable.
  //     </Popup>
  //   </Marker>
  // </MapContainer>

  }
}

const appState = new AppState();

window.appState = appState;

appState.useToolbartoSelect = false

const loadSnapshotFromURL = (url) => {
  return fetch(url, {
    method: 'GET',
    mode: 'cors'
  }).then(response => response.text()).catch(error => {
    toaster.show({
      message: 'Failed to fetch graph snapshot',
      intent: Intent.DANGER,
      timeout: -1
    });
    console.error(error);
  });
};

const loadSnapshotFromStrapi = (uuid) => {
  const url = `${BACKEND_URL}/snapshots?uuid=${uuid}`;
  return fetch(url, {
    method: 'GET',
    mode: 'cors'
  }).then(response => response.json()).then(json => json[0].body).catch(error => {
    toaster.show({
      message: 'Failed to fetch graph snapshot',
      intent: Intent.DANGER,
      timeout: -1
    });
    console.error(error);
  });
};

const loadAndDisplaySnapshotFromURL = (url) => {
  loadSnapshotFromURL(url).then(snapshotString => {
    // use filename/last segment of URL as title in Navbar
    appState.graph.metadata.snapshotName = url.split('/').pop() || url.split('/').pop().pop();
    appState.graph.loadImmediateStates(snapshotString);
  });
};

const loadAndDisplaySnapshotFromStrapi = (uuid) => {
  appState.graph.convexPolygons =[]
  appState.graph.modularity = undefined
  appState.graph.convexhullby = "NULL"
  appState.graph.groupby = "NULL"
  appState.graph.mapClicked = undefined;
  appState.graph.selectedNodes = [];
  appState.graph.filter = {}
  appState.graph.currentlyHovered = undefined;
  // appState.graph.mapClicked = undefined;
  appState.graph.convexNodes = [];
  appState.graph.convexPolygons = [];
  appState.graph.pathHovered = undefined;
  appState.graph.initialNodesShowingLabels = [];
  appState.graph.densityDistance = [];
  appState.graph.edgeselection = [];
  appState.graph.degreeselection = [];
  appState.graph.degreebrushed = false;
  appState.graph.distanceDensityCurrentlyHovered = undefined;
  appState.graph.distanceDensityCurrentlyClicked = [];
  appState.graph.pinnedNodes = null;
  appState.import.loading = true
  appState.graph.clearBrush = false;
  
  appState.graph.mapEdgeShow = true;
  appState.graph.autoZoom = true;
  appState.graph.keydown = false;
  appState.graph.clusteringco = 0;
  appState.graph.graphDiameter = 0;
  appState.graph.connectcom = 0;

 
  loadSnapshotFromStrapi(uuid).then(snapshotString => {
    // TODO: use more sensible snapshot name
    appState.graph.metadata.snapshotName = 'Shared';
    appState.graph.loadImmediateStates(snapshotString);
    appState.import.loading = false;
  });
};

window.loadAndDisplaySnapshotFromURL = loadAndDisplaySnapshotFromURL;
window.loadAndDisplaySnapshotFromStrapi = loadAndDisplaySnapshotFromStrapi;

// var getFileBlob = function (url, cb) {
//   var xhr = new XMLHttpRequest();
//   xhr.open("GET", url);
//   xhr.responseType = "blob";
//   xhr.addEventListener('load', function() {
//       cb(xhr.response);
//   });
//   xhr.send();
// };

// var blobToFile = function (blob, name) {
//   blob.lastModifiedDate = new Date();
//   blob.name = name;
//   return blob;
// };

// var getFileObject = function(filePathOrUrl, cb) {
//  getFileBlob(filePathOrUrl, function (blob) {
//     cb(blobToFile(blob, 'test.jpg'));
//  });
// };

window.loadInitialSampleGraph = async () => {
  // const nodeFileData = new LocalFileData('/Users/jsc/repositories/SSN/argo-lite/MafiaNodes_2.csv')
  // const nodeFile = constructFileFromLocalFileData(nodeFileData)
  // console.log(nodeFile)
  // appState.import.selectedNodeFileFromInput = nodeFile

  // const edgeFileData = new LocalFileData('/Users/jsc/repositories/SSN/argo-lite/MafiaEdges_2.csv')
  // const edgeFile = constructFileFromLocalFileData(edgeFileData)
  // console.log(edgeFile)
  // appState.import.selectedEdgeFileFromInput = edgeFile

  

  // default fallback url
  let url = "https://argo-graph-lite.s3.amazonaws.com/lesmiserables.json"

  // check url hash
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    // If the hash component begins with http.
    if (hash.length >= 4 && hash.startsWith('http')) {
      try {
        url = decodeURIComponent(hash);
      } catch (e) {
        console.error(e);
        alert('Provided URL is not valid.');
      }
    } else {
      // If the hash component does not begin with http
      // treat it as a uuid in strapi.
      loadAndDisplaySnapshotFromStrapi(hash);
      return;
    }
    
  }
  // loadAndDisplaySnapshotFromURL(url)
  loadAndDisplaySnapshotFromStrapi(SAMPLE_GRAPH_SNAPSHOTS[0][1]);
};

window.saveSnapshotToString = () => {
  const snapshotString = appState.graph.saveImmediateStates();
  return snapshotString;
};

// Load initial sample graph when Argo Lite is ready
window.addEventListener('load', (event) => {
  window.loadInitialSampleGraph();
});

const updateTimeout = null;

// Load graph on frontend once the rawGraph has been returned from IPC
// Once a graph has been loaded and displayed, even if nodes are all deleted, still consider it "hasGraph"
autorun(() => {
  if (!appState.graph.hasGraph && appState.graph.rawGraph.nodes.length > 0) {
    appState.graph.hasGraph = true;
  }
}) 

// // update MapView
autorun(() => {
  if (appState.graph.rawGraph.nodes.length > 0 ) {  // has spatial information 
    //
  }
}) 

autorun(() => {
  if (appState.graph.frame) {
    console.log("Triggered");
    // appState.graph.frame.selection = []
    appState.graph.frame.updateGraph(appState.graph.computedGraph); //loads nodes on screen when snapshot loaded
    appState.graph.frame.setAllNodesShapeWithOverride(appState.graph.nodes.shape, appState.graph.overrides);
    appState.graph.frame.setLabelRelativeSize(appState.graph.nodes.labelSize);
    appState.graph.frame.setLabelLength(appState.graph.nodes.labelLength);
    appState.graph.frame.updateSelectionOpacity();
    appState.graph.frame.clearSelection();
    // if (appState.graph.selectedNodes && appState.graph.selectedNodes.length >0 ){
    //   appState.graph.selectedNodes = appState.graph.selectedNodes.filter(x => x !== undefined)
    // }
    // if (appState.graph.frame.selection.length > 0) {
    //   this.frame.selection = this.frame.selection.filter(x => x !== undefined)
    // }
  }

  //pins nodes only after nodes are loaded
  appState.graph.pinNodes();
});


// // // resume layout by default 
autorun(() => {
  
  // appState.graph.runActiveLayout();
  // setTimeout(function(){appState.graph.frame.paused = true},9000);
  appState.graph.frame.paused = true;
  // appState.graph.frame.resumeLayout();
                  // this.forceUpdate();
}) 


autorun(() => {
  if (appState.graph.frame && appState.graph.positions) {
    // If positions are saved in a snapshot, pause layout upon loading.
    appState.graph.frame.updatePositions(appState.graph.positions);
    appState.graph.positions = null;
    console.log('[autorun] Positions updated.');

  }
  if (appState.graph.frame && appState.graph.initialNodesShowingLabels) {
    appState.graph.frame.showLabels(appState.graph.initialNodesShowingLabels);
    appState.graph.initialNodesShowingLabels = null;
  }

  if (appState.graph.frame && appState.graph.frame.getNodeList().length>0){  //dehilight border when innitially load 
    appState.graph.frame.getNodeList().forEach((node)=>{node.renderData.draw_object.children[0].visible=false})
  }
});

autorun(() => {
  const searchStr = appState.search.searchStr;
  if (searchStr.length >= 3) {
    runSearch(searchStr);
  } else {
    appState.search.panelOpen = false;
    appState.search.candidates.splice(0, appState.search.candidates.length);
    if (appState.graph.frame) {
      appState.graph.frame.highlightNodeIds([], true);
    }
  }
});

autorun(() => {
  if (appState.graph.selectedNodes && appState.graph.selectedNodes.length >0 ){
    appState.graph.selectedNodes = appState.graph.selectedNodes.filter(x => x !== undefined)
  }
  if (appState.graph && appState.graph.frame && appState.graph.frame.selection.length > 0) {
    this.frame.selection = this.frame.selection.filter(x => x !== undefined)
  }
})

// Argo-lite specific: extract CSV from File object and update related fields.
autorun(() => {
  const file = appState.import.selectedEdgeFileFromInput;
  const hasHeader = appState.import.importConfig.edgeFile.hasColumns;
  const delimiter = appState.import.importConfig.edgeFile.delimiter;

  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.readAsText(file);

  reader.onload = () => {
    // Read entire CSV into memory as string
    const fileAsString = reader.result;
    // Get top 20 lines. Or if there's less than 10 line, get all the lines.
    const lines = fileAsString.split('\n');
    const lineNumber = lines.length;
    const topLinesAsString = lines.map(l => l.trim()).filter((l, i) => i < 20).join('\n');
    console.log(topLinesAsString);

    // Parse the top lines
    try {
      const it = hasHeader ? parse(topLinesAsString, {
        comment: "#",
        trim: true,
        auto_parse: true,
        skip_empty_lines: true,
        columns: hasHeader,
        delimiter
      }) : parse(topLinesAsString, {
        comment: "#",
        trim: true,
        auto_parse: true,
        skip_empty_lines: true,
        columns: undefined,
        delimiter
      });
      runInAction("preview top N lines of edge file", () => {
        appState.import.importConfig.edgeFile.topN = it;
        appState.import.importConfig.edgeFile.columns = Object.keys(it[0]).map(key => `${key}`);
        appState.import.importConfig.edgeFile.mapping.fromId = appState.import.importConfig.edgeFile.columns[0];
        appState.import.importConfig.edgeFile.mapping.toId = appState.import.importConfig.edgeFile.columns[1];
        appState.import.importConfig.edgeFile.ready = true;
      });
    } catch {
      toaster.show({
        message: 'Error: Fails to parse file',
        intent: Intent.DANGER,
        timeout: -1
      });
    }
  };

  reader.onerror = () => {
    console.error(reader.error);
    toaster.show({
      message: 'Error: Fails to open file',
      intent: Intent.DANGER,
      timeout: -1
    });
  };
});

autorun(() => {
  const file = appState.import.selectedNodeFileFromInput;
  const hasHeader = appState.import.importConfig.nodeFile.hasColumns;
  const delimiter = appState.import.importConfig.nodeFile.delimiter;

  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.readAsText(file);

  reader.onload = () => {
    // Read entire CSV into memory as string
    const fileAsString = reader.result;
    // Get top 20 lines. Or if there's less than 10 line, get all the lines.
    const lines = fileAsString.split('\n');
    const lineNumber = lines.length;
    const topLinesAsString = lines.map(l => l.trim()).filter((l, i) => i < 20).join('\n');
    console.log(topLinesAsString);

    // Parse the top lines
    try {
      const it = hasHeader ? parse(topLinesAsString, {
        comment: "#",
        trim: true,
        auto_parse: true,
        skip_empty_lines: true,
        columns: hasHeader,
        delimiter
      }) : parse(topLinesAsString, {
        comment: "#",
        trim: true,
        auto_parse: true,
        skip_empty_lines: true,
        columns: undefined,
        delimiter
      });

      runInAction("preview top N lines of node file", () => {
        appState.import.importConfig.nodeFile.topN = it;
        appState.import.importConfig.nodeFile.columns = Object.keys(it[0]).map(key => `${key}`);
        appState.import.importConfig.nodeFile.mapping.id = appState.import.importConfig.nodeFile.columns[0];
        appState.import.importConfig.nodeFile.mapping.LatY = appState.import.importConfig.nodeFile.columns[1];
        appState.import.importConfig.nodeFile.mapping.LonX = appState.import.importConfig.nodeFile.columns[2];
        appState.import.importConfig.nodeFile.ready = true;
      });
    } catch {
      toaster.show({
        message: 'Error: Fails to open file',
        intent: Intent.DANGER,
        timeout: -1
      });
    }
  };

  reader.onerror = () => {
    console.error(reader.error);
    toaster.show({
      message: 'Error: Fails to open file',
      intent: Intent.DANGER,
      timeout: -1
    });
  };
});

export default appState;
