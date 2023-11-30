import { observable, computed, action, runInAction } from "mobx";
import createGraph from "ngraph.graph";
import { scales } from "../constants/index";
import uniq from "lodash/uniq";
import { averageClusteringCoefficient, connectedComponents, graphDensity, averageDegree, exactGraphDiameter , reaverageClusteringCoefficient, reconnectedComponents} from "../services/AlgorithmUtils";
import { ContextMenu, MenuFactory, MenuItemFactory } from "@blueprintjs/core";
import { Frame } from "../graph-frontend";
// import appState from '../stores';

export default class GraphStore {

  // @observable
  initialGlobalConfig = {
    nodes: {
      colorBy: "degree",
      color: {
        scale: "Linear Scale",
        from: "#448AFF",
        to: "#E91E63",
        nominalColor: ["#0073bc", "#ff3333","#e377c2", "#98df8a", "#ff7f0e", "#a55194", "#2ca02c", "#aec7e8", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#1f77b4", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5", "#9c9ede", "#8c6d31", "#ffbb78", "#bd9e39"]
      },
      sizeBy: "degree",
      size: {
        min: 2,
        max: 6,
        scale: "Linear Scale"
      },
      labelBy: "node_id",
      shape: "circle",
      labelSize: 1,
      labelLength: 10,
      // filter:{}
    },
    edges: {
      color: "#7f7f7f",
      crossColor: "#0055aa"
    },
    scatterplot: {
      x: 'degree',
      y: 'distance to center'
    }
  }

  @observable watchAppearance = 1;
  @observable nodes = this.initialGlobalConfig.nodes;
  @observable edges = this.initialGlobalConfig.edges;
  @observable scatterplot = this.initialGlobalConfig.scatterplot;

  @observable enableDegree = true;
  @observable enableDensity = true;
  @observable enableDiameter = false;
  @observable enableCoefficient = true;
  @observable enableComponent = true;
  @observable modularity = undefined;
  @observable globalFlatRatio = undefined;
  @observable keydown = false;
  clusteringco = 0;
  graphDiameter = 0;
  connectcom = 0;


  //access to process.js "self"
  @observable process = undefined;

  // Updated by frame event
  @observable selectedNodes = [];

  filter = {}


  @observable convexNodes = [];
  @observable convexPolygons = [];
  @observable convexPolygonsShow = true;

  @observable mapEdgeShow = true;
  @observable autoZoom = false;
  @observable firstload =true;



  // Currently hovered node
  @observable currentlyHovered = undefined;

  // Currently Clicked to frozen node on map
  @observable mapClicked = undefined;
  @observable areaSelected = undefined;
  @observable clearBrush = false;


  @observable selectedEdge = 0;
  @observable avgDegree = 0;
  @observable avgdist = 0;
  @observable avgdensity = 0;
  @observable clustercoe = 0;
  @observable rediameter = '';
  @observable reclustercoe = '';
  @observable recomponent = '';

 tempRawGraph = undefined;

  //  // Currently Clicked to frozen node on network
  //  @observable networkClicked = undefined;

  // Currently hovered path in the scatterplot view 
  @observable pathHovered = undefined;
  /**
   * Stores data relevant to smart pause feature
   */
  @observable smartPause = {
    defaultActive: { //data for when graph layout is resumed and smart pause is not in effect 
      isActive: true, //true when layout is resumed and smart pause is not in effect
      startTime: Date.now(), //keeps track of most recent time graph was unpaused
      duration: 10000, //duration of resumed layout
    },
    //lastUnpaused: undefined, //old code using lastUnpaused
    smartPaused: true, //true when resumed, but graph layout is paused due to inactivity
    interactingWithGraph: false, //true when node is clicked or dragged. TODO: refactor to more understandable name
  }

  // Directed or not
  @observable directedOrNot = false;

  // Edge thickness based on 
  @observable edgeThicknessByDistance = false;

  // Color by distance
  @observable colorByDistance = false;

  // Cache the single node that's been selected last time
  // and will not update unless exactly one node is selected again
  // useful for NeighborDialog
  _lastSelectedSingleNode = null;
  @computed
  get lastSelectedSingleNode() {
    if (this.selectedNodes.length === 1) {
      this._lastSelectedSingleNode = this.selectedNodes[0];
    }
    return this._lastSelectedSingleNode;
  }
  // Updated by frame event. Not being listened, only used to save label visibility.
  nodesShowingLabels = [];
  // Used by autorun during snapshot loading.
  @observable initialNodesShowingLabels = [];

  @observable
  overrideConfig = {
    color: "#000",
    size: 5,
    label: "",
    shape: "circle"
  };

  @observable
  rawGraph = {
    nodes: [],
    edges: []
  };

  //saved states from loaded graph snapshot
  @observable savedStates = null;

  @observable
  metadata = {
    fullNodes: 0,
    fullEdges: 0,
    nodeProperties: [],
    nodePropertyTypes: [],
    uniqueValue: {},
    nodeComputed: ["pagerank", "degree", 'centrality', 'distance to center'  ,  'betweenness', 'closeness',  'betweeness centrality', 'closeness centrality', 'distance to group center'],
    edgeProperties: [],
    snapshotName: "loading..." // Optional: for display in Argo-lite only
  };

  @observable
  densityDistance = []

  @observable
  edgeselection = []

  @observable
  degreeselection = []

  @observable
  degreebrushed = false

  //name of currently hovered family group on the cluster cluster scatterplot 
  @observable
  distanceDensityCurrentlyHovered = undefined

  @observable
  distanceDensityCurrentlyClicked = []

  @observable
  groupby = 'NULL'

  @observable
  convexhullby = 'NULL'

  // used for listing all the properties, either original or computed
  @computed
  get allPropertiesKeyList() {
    return uniq([
      ...this.metadata.nodeProperties,
      ...this.metadata.nodeComputed
    ]).filter(k => k !== 'id'); // since node_id is already present
  }

  @computed
  get filterKeyList() {
    const removeList = ['isHidden', 'id', 'Longitude', 'Latitude', 'LatY', 'LonX', 'dist to center', 'dist_to_center', 'centrality', 'shortest path', 'pair distance', 'node_id', 'standard distance', 'network density', 'SHORT', "ORGANIZATION", 'isconvex', 'nearestnn']
    return uniq([
      ...this.metadata.nodeProperties,
      ...this.metadata.nodeComputed
    ]).filter(k => removeList.indexOf(k) === -1); // since node_id is already present
  }

  @computed
  get allComputedPropertiesKeyList() {

    const uniq_compute = uniq([
      ...this.metadata.nodeComputed
    ]).filter(k => k !== 'id'); // since node_id is already present

    const capitalizeString =(inputString)=> {
      const connectingWords = ['in', 'to']; // Add more connecting words as needed
    
      return inputString.replace(/\w+/g, function(word) {
        return connectingWords.includes(word.toLowerCase()) ? word : word.charAt(0).toUpperCase() + word.slice(1);
      });
    }
    
    const uppercase_compute = uniq_compute.map((u) => {
      return capitalizeString(u)
    })
    return uppercase_compute
  }

  @computed
  get selectedNeighborIDs() {



    if (this.selectedNodes.length > 0) {
      const neighborIDs = []
      for (var j = 0; j < this.selectedNodes.length; j++) {
        if (!this.selectedNodes[j] || !this.selectedNodes[j].links) continue
        this.selectedNodes[j].links.forEach((link) => {
          neighborIDs.push(link.fromId);
          neighborIDs.push(link.toId);
        })

      }
      if (neighborIDs.length > 0) {
        const uniqNeighborIDs = uniq([
          ...neighborIDs
        ])
        return uniqNeighborIDs
      } else {
        return []
      }
    } else {
      return []
    }


  }





  @observable.ref frame = null;
  @observable.ref positions = null;
  @observable pinnedNodes = null;

  @observable overrides = new Map();
  @observable searchOrder = "degree";

  hasGraphLoaded = false;

  @computed
  get hasGraph() {
    if (this.rawGraph.nodes.length > 0) {
      this.hasGraphLoaded = true;
    }
    return this.hasGraphLoaded;
  }

  // @computed
  // get ordinalDomain(colorBy){
  //   return this.rawGraph.nodes.map(function(n){
  //     n[colorBy]
  //   })
  // }
  @computed
  get minMax() {
    const ret = {};
    for (const p of [
      ...this.metadata.nodeProperties,
      ...this.metadata.nodeComputed
    ]) {
      let min = Number.MAX_VALUE;
      let max = Number.MIN_VALUE;

      for (const n of this.rawGraph.nodes) {
        min = Math.max(Math.min(min, n[p]), 0.0000001);
        max = Math.max(max, n[p]);
      }

      ret[p] = [min, max];
    }
    return ret;
  }

  @computed
  get nodeSizeScale() {
    return scales[this.nodes.size.scale]()
      .domain(this.minMax[this.nodes.sizeBy])
      .range([this.nodes.size.min, this.nodes.size.max]);
  }

  @computed
  get nodeColorScale() {
    if (this.nodes.color.scale == "Nominal Scale") { //nominal scale 
      const nominalColor =  ["#0073bc", "#ff3333", "#ff7f0e", "#a55194", "#2ca02c", "#aec7e8", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#1f77b4", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5", "#9c9ede", "#8c6d31", "#ffbb78", "#bd9e39"]

      return scales[this.nodes.color.scale]()
        .domain([...new Set(this.rawGraph.nodes.map(item => item[this.nodes.colorBy]))])
        .range(nominalColor);
    } else { //linear and log scale 
      return scales[this.nodes.color.scale]()
        .domain(this.minMax[this.nodes.colorBy])
        .range([this.nodes.color.from, this.nodes.color.to]);
    }

  }



  // @computed
  // get nodeColorCategory() {
  //   return scales[this.nodes.color.scale]()
  //     .domain(this.minMax[this.nodes.colorBy])
  //     .range([this.nodes.color.from, this.nodes.color.to]);
  // }


  // Return raw graph nodes that is neighbor with the selected node,
  // excluding the node itself.
  getNeighborNodesFromRawGraph(selectedNodeId) {
    const setOfNeighborIds = new Set();
    this.rawGraph.edges.forEach(e => {
      const source = e.source_id.toString();
      const target = e.target_id.toString();
      if (source === selectedNodeId && target !== selectedNodeId) {
        setOfNeighborIds.add(target);
      }
      if (target === selectedNodeId && source !== selectedNodeId) {
        setOfNeighborIds.add(source);
      }
    });
    return this.rawGraph.nodes.filter(node => setOfNeighborIds.has(node.id.toString()));
  }



  // Triggers autorun in stores/index.js to sent computedGraph to graph-frontend.
  @computed
  get computedGraph() {
    const graph = createGraph();
    this.rawGraph.nodes.forEach(n => {
      // If isHidden flag is defined and true, ignore the node in graph-frontend.
      if (n.isHidden) {
        return;
      }
      const override = this.overrides.get(n.id.toString());
      graph.addNode(n.id.toString(), {
        label: (override && override.get("label")) || n[this.nodes.labelBy],
        size:
          (override && override.get("size")) ||
          this.nodeSizeScale(n[this.nodes.sizeBy]),
        color:
          (override && override.get("color")) ||
          this.nodeColorScale(n[this.nodes.colorBy]),
        shape: (override && override.get("shape")) || n[this.nodes.shape],
        ref: n
      });
    });

    this.rawGraph.edges.forEach(e => {
      // If isHidden flag is defined and true on an associated node,
      // leave out its related edges.
      if (graph.hasNode(e.source_id.toString()) && graph.hasNode(e.target_id.toString())) {
        graph.addLink(e.source_id.toString(), e.target_id.toString(), e);
      }
    });

    return graph;
  }

  @computed
  get numHiddenNodes() {
    return this.rawGraph.nodes.filter(n => n.isHidden).length;
  }

  filterNodes() {
    runInAction('filter nodes', () => {
      if (this.selectedNodes.length > 0) {
      this.selectedNodes = this.selectedNodes.filter(x => x !== undefined)
    }

    if (this.frame.selection.length > 0) {
      this.frame.selection = this.frame.selection.filter(x => x !== undefined)
    }

   
      if (Object.keys(this.filter).length === 0){
        this.rawGraph.nodes = this.rawGraph.nodes.map(n => {return { ...n, isHidden: false }});
      }

      if (Object.keys(this.filter).length !== 0) {


        this.rawGraph.nodes = this.rawGraph.nodes.map(n => {
          var satisfy = true
          for (const fkey in this.filter) {
            if (this.metadata.nodePropertyTypes[fkey] == 'string') {
              if (this.filter[fkey].length > 0 && (!this.filter[fkey].includes(n[fkey]))) {
                satisfy = false
              }
            } else {  // number range 
              if (this.filter[fkey] && (n[fkey] < this.filter[fkey]['min'] || n[fkey] > this.filter[fkey]['max'])) {
                satisfy = false
              }
            }
          }
          if (satisfy) {
            return { ...n, isHidden: false };
          }
          return { ...n, isHidden: true };
        });

      }
      if (this.selectedNodes.length > 0) {
        this.selectedNodes = this.selectedNodes.filter(x => x !== undefined)
      }

      if (this.frame.selection.length > 0) {
        this.frame.selection = this.frame.selection.filter(x => x !== undefined)
      }
      this.frame.getNodeList().forEach((node)=>{node.renderData.draw_object.children[0].visible=false})


    });
     // this.runActiveLayout()
    //  appState.graph.watchAppearance = appState.graph.watchAppearance +1
  }

  showNodes(nodeids) {
    runInAction('show hidden nodes by ids', () => {
      this.rawGraph.nodes = this.rawGraph.nodes.map(n => {
        if (nodeids.includes(n.id)) {
          return { ...n, isHidden: false };
        }
        return n;
      });
    });
  }

  hideNodes(nodeids) {
    runInAction('hide nodes by ids', () => {
      this.frame.removeNodesByIds(nodeids);
      this.rawGraph.nodes = this.rawGraph.nodes.map(n => {
        if (nodeids.includes(n.id)) {
          return { ...n, isHidden: true };
        }
        return n;
      });
    });
  }

  removeNodes(nodeids) {
    runInAction('remove nodes by ids', () => {
      this.frame.removeNodesByIds(nodeids);
      this.rawGraph.nodes = this.rawGraph.nodes.filter(
        n => !nodeids.includes(n.id)
      );
      this.rawGraph.edges = this.rawGraph.edges.filter(
        e => !nodeids.includes(e.source_id) && !nodeids.includes(e.target_id)
      );
    });
  }

  getSnapshot() {
    const snapshot = {
      rawGraph: this.rawGraph,
      overrides: this.overrides,
      nodesShowingLabels: this.nodesShowingLabels,
      positions: this.frame.getPositions(),
      pinnedNodes: Array.from(this.frame.getPinnedNodes()),
      metadata: this.metadata,
      global: {
        nodes: this.nodes,
        edges: this.edges,
      },
    };
    return snapshot;
  }

  /**
   * [Argo-lite] Saves graph snapshot as String
   * 
   * Note that Argo-lite snapshot contains all graph data
   * and metadata except nodes/edges deleted by users.
   * This is different from Argo-electron snapshot.
   */
  saveImmediateStates(optionalConfig) {
    const snapshot = this.getSnapshot();
    // TODO: add corresponding options on frontend
    // The optional options allows users to leave out
    // certain app state when saving snapshot
    if (optionalConfig) {
      if (optionalConfig.noPosition) {
        snapshot.positions = undefined;
      }
      if (optionalConfig.noGlobal) {
        snapshot.global = undefined;
      }
      if (optionalConfig.noOverride) {
        snapshot.overrides = undefined;
      }
    }
    return JSON.stringify(snapshot);
  }


  recalculateRawgraph(initialgraph) {
    // Since the CSV lib we use uses int index when there's not header/column names specified
    // but the frontend selector always convert int to string values, we need to
    // manually convert the user-selected fromId and toId values back to int.
    // Note that this should only be done when there's no header provided on the CSV (hasColumns == false).
    //hardcode
    const fromId = "source_id"
    const toId = "target_id"
    const mapId = "ID"
    const mapLon = "LonX"
    const mapLat = "LatY"
    // Create temporary data structures.
    // rawGraph: { nodes: nodesArr, edges: edgesArr, paths: pathsArr },
    let nodesArr =
    initialgraph.rawGraph.nodes.map(
        n => ({ ...n, LonX: parseFloat(n["LonX"]), LatY: parseFloat(n["LatY"]) }));
    // let nodesArr = initialgraph.rawGraph.nodes;
    let edgesArr = initialgraph.rawGraph.edges;
    // let pathsDict = {};
  
    // const graph = createGraph();
    // const degreeDict = {};
    // if (config.hasNodeFile) {
    //   // nodesArr = await readCSV(appState.import.selectedNodeFileFromInput, config.nodes.hasColumns, config.delimiter);
    //   nodesArr = initialgraph.nodes;
    //   nodesArr.forEach(node => graph.addNode(node[mapId].toString(),
    //     { id: node[mapId].toString(), LatY: parseFloat(node[config.nodes.mapping.LatY]),LonX: parseFloat(node[config.nodes.mapping.LonX]),degree: 0, ...node }));
    //   nodesArr =
    //     nodesArr.map(
    //       n => ({ ...n, id: n[config.nodes.mapping.id].toString(), degree: 0, pagerank: 0, centrality: parseFloat(n['centrality']), 'dist to center': parseFloat(n['distance to center']), LonX: parseFloat(n[config.nodes.mapping.LonX]), LatY: parseFloat(n[config.nodes.mapping.LatY]) }));
    //   nodesArr.forEach(n => degreeDict[n.id] = 0);
    // }
    // const edges = await readCSV(appState.import.selectedEdgeFileFromInput, config.edges.hasColumns, config.delimiter);
    // if (config.edges.createMissing) {
    //   edges.forEach((it) => {
    //     const from = it[fromId].toString();
    //     const to = it[toId].toString();
    //     if (!graph.hasNode(from)) {
    //       graph.addNode(from, { id: from, degree: 0 });
    //       nodesArr.push({ id: from, degree: 0, pagerank: 0 });
    //       degreeDict[from] = 0;
    //     }
    //     if (!graph.hasNode(to)) {
    //       graph.addNode(to, { id: to, degree: 0 });
    //       nodesArr.push({ id: to, degree: 0, pagerank: 0 });
    //       degreeDict[to] = 0;
    //     }
    //   });
    // }
  
    // const edgesSet = new Set();
  
    // const edgesArr = [];
  
    // const addEdge = (from, to, fromlocLatY, fromlocLonX, tolocLatY, tolocLonX, withinState, withinFamily) => {
    //   const edgeKey = `${from}👉${to}`;
    //   if (edgesSet.has(edgeKey)) {
    //     return;
    //   }
    //   edgesSet.add(edgeKey);
    //   var data = {
    //     fromlocLatY: fromlocLatY,
    //     fromlocLonX: fromlocLonX,
    //     tolocLatY: tolocLatY,
    //     tolocLonX: tolocLonX,
    //     withinState: withinState,
    //     withinFamily: withinFamily,
  
    //   }
    //   graph.addLink(from, to, data);
  
    //   degreeDict[from] += 1;
    //   degreeDict[to] += 1;
    //   edgesArr.push({
    //     source_id: from,
    //     target_id: to,
    //     fromlocLatY: fromlocLatY,
    //     fromlocLonX: fromlocLonX,
    //     tolocLatY: tolocLatY,
    //     tolocLonX: tolocLonX,
    //     withinState: withinState,
    //     withinFamily: withinFamily
    //   });
    // };
  
    if (nodesArr[0].LatY !== undefined && nodesArr[0].LonX !== undefined) {  //node has spatial location info
      edgesArr.forEach(it => {
        const fromnode = nodesArr.filter((node)=>{return node.id === it[fromId].toString()})
        const tonode = nodesArr.filter((node)=>{return node.id === it[toId].toString()})
        const Nonloc = 360
        if(fromnode.length > 0 && tonode.length >0){
        it.fromlocLatY = parseFloat(fromnode[0].LatY)
        it.fromlocLonX = parseFloat(fromnode[0].LonX)
        it.tolocLatY = parseFloat(tonode[0].LatY)
        it.tolocLonX = parseFloat(tonode[0].LonX) }
        else{
        it.fromlocLatY = Nonloc
        it.fromlocLonX = Nonloc
        it.tolocLatY = Nonloc
        it.tolocLonX = Nonloc
        }// observable array???
        it.withinState = true
        it.withinFamily = true
        
        // addEdge(from, to, fromlocLatY, fromlocLonX, tolocLatY, tolocLonX, withinState, withinFamily);
        
      });
    } 

    const calDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
      var p = 0.017453292519943295;    // Math.PI / 180
      var c = Math.cos;
      var a = 0.5 - c((lat2 - lat1) * p) / 2 +
        c(lat1 * p) * c(lat2 * p) *
        (1 - c((lon2 - lon1) * p)) / 2;
  
      return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    }
  
    // calculate the diatance to centern/ average lat/lon
    // const calDIstanceToCenter = () => {
    //   const latlist = nodesArr.map(n => n['LatY'])
    //   const lonlist = nodesArr.map(n => n['LonX'])
    //   const average = (array) => array.reduce((a, b) => a + b) / array.length;
    //   var avgLat
    //   var avgLon
    //   if (latlist.length > 0 && lonlist.length > 0) {
    //     avgLat = average(latlist)
    //     avgLon = average(lonlist)
    //     nodesArr.forEach(function (n, i) {
    //       n['distance to center'] = calDistanceFromLatLonInKm(avgLat, avgLon, latlist[i], lonlist[i])
    //     })
    //   }
    // }
  
  
    const calMedianCenter = ()=>{
      const latlist = nodesArr.map(n => parseFloat(n['LatY']))
      const lonlist = nodesArr.map(n => parseFloat(n['LonX']))
      const medianCenter = (values)=>{
        if(values.length ===0) throw new Error("No inputs");
  
        const result1 = [...values].sort((a, b) => a - b)
      
        // values.sort(function(a,b){
        //   return a-b;
        // });
      
        var half = Math.floor(result1.length / 2);
        
        if (result1.length % 2)
          return result1[half];
        
        return (result1[half - 1] + result1[half]) / 2.0;
      }
  
      if (latlist.length > 0 && lonlist.length > 0) {
        const medianLat = medianCenter(latlist)
        const medianLon = medianCenter(lonlist)
        nodesArr.forEach(function (n, i) {
          n['distance to center'] = calDistanceFromLatLonInKm(medianLat, medianLon, latlist[i], lonlist[i])
        })
      }
  
  
    }
  
    if (nodesArr[0]['LonX'] && nodesArr[0]['LatY']) {
      // calDIstanceToCenter();
    calMedianCenter();
  
    }

    // const shortestPathPairs = () => {
    //   let pathFinder = path.aGreedy(graph);
      // const pathsArr = []
    //   const pathsSet = new Set();
  
  
  
    //   graph.forEachNode(function (fromnode) {
  
    //     graph.forEachNode(function (tonode) {
    //       if (fromnode.id !== tonode.id) {
    //         const pathKey1 = `${fromnode.id}👉${tonode.id}`;
    //         const pathKey2 = `${tonode.id}👉${fromnode.id}`;
    //         // undirected graph:
    //         // only add once for undirected graph 
    //         if (!(pathsSet.has(pathKey1)) && !(pathsSet.has(pathKey2)) ) {
    //           pathsSet.add(pathKey1);
    //           pathsSet.add(pathKey2);
    //           pathsArr.push({
    //            "source":fromnode.id,
    //            "target":tonode.id,
    //           "path": pathFinder.find(fromnode.id, tonode.id),
    //           "distance": calDistanceFromLatLonInKm(fromnode.data.LatY, fromnode.data.LonX, tonode.data.LatY, tonode.data.LonX)
            
    //          })
    //         }
             
    //         //directed graph: 
    //       }
  
    //     })
  
    //   })
    //   // console.log(nodesArr.length)
    //   // console.log(pathsArr.length)
    //   return pathsArr
  
    // }
    // const pathsArr = shortestPathPairs();
    // const rank = pageRank(graph);
  
    // nodesArr = nodesArr.map(n => ({ ...n, node_id: n.id, pagerank: rank[n.id], degree: parseInt(degreeDict[n.id] / 2) }));
    const nodekeyList = Object.keys(nodesArr[0])
    const nodePropertyTypes = {}
    nodekeyList.forEach(function (k) {
      nodePropertyTypes[k] = typeof (nodesArr[0][k])
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
    return {
      rawGraph: { nodes: nodesArr, edges: edgesArr, paths: [] },
      metadata: {
        snapshotName: 'Untitled Graph',
        fullNodes: nodesArr.length,
        fullEdges: edgesArr.length, //Math.floor(edgesArr.length / 2), // Counting undirected edges
        nodeProperties: nodekeyList,
        nodePropertyTypes: nodePropertyTypes,
        uniqueValue: uniqueValue,
        nodeComputed: ['pagerank', 'degree', 'distance to center' ,  'betweenness', 'closeness'],
        edgeProperties: ['source_id', 'target_id'],
       
      },
    }

  }



  @action
  loadImmediateStates(savedStatesStr) {
    this.runActiveLayout();
    const savedStates = JSON.parse(savedStatesStr);
    this.savedStates = savedStates;
    if (!savedStates) {
      return;
    }
    const savedOverrides = new Map(
      Object.entries(savedStates.overrides).map(([k, v]) => [
        k,
        new Map(Object.entries(v))
      ])
    );
    this.overrides.clear();
    this.overrides.merge(savedOverrides);

    
    if (savedStates.global) {
      this.nodes = savedStates.global.nodes;
      this.edges = savedStates.global.edges ? savedStates.global.edges : this.edges;
    }
    // The following lines trigger autoruns.
    // recalculate rawgraph 
    const recalculateGraph = this.recalculateRawgraph(savedStates);
    this.rawGraph = recalculateGraph.rawGraph;
    this.metadata = recalculateGraph.metadata;
    // this.rawGraph = savedStates.rawGraph;
    // if (savedStates.metadata) {
    //   this.metadata = savedStates.metadata;
    // }
    
  
    // appState.import.loading = false;
    //
    if (savedStates.positions) {
      this.positions = savedStates.positions;
    }
    if (savedStates.nodesShowingLabels) {
      this.initialNodesShowingLabels = savedStates.nodesShowingLabels;
      this.nodesShowingLabels = savedStates.nodesShowingLabels;
    }

    //stores data pinned nodes in appState
    if (savedStates.pinnedNodes) {
      this.pinnedNodes = new Set(savedStates.pinnedNodes);
    }

    this.scatterplot.x = 'degree';
    this.scatterplot.y = 'distance to center';


    // this.runActiveLayout();
    // appState.graph.frame.paused = true;
  //   appState.graph.frame.paused = false;
  // appState.graph.frame.resumeLayout();
  //                 this.forceUpdate();
  

                      // this.frame.resumeLayout();
                      // this.forceUpdate();
  }


  //resumes graph layout for a set duration before smart-pausing
  runActiveLayout  () {
    if (this.frame) {
      this.frame.paused = false;
    }
    this.smartPause.defaultActive.isActive = true;
    this.smartPause.defaultActive.startTime = Date.now();
    this.smartPause.smartPaused = false;
    // this.frame.paused = true;
    
  }

  //selects which nodes should be pinned based on saved state of loaded snapshot
  pinNodes() {
    if (this.pinnedNodes && this.pinnedNodes.size >0) {
      let nodesToPin = [];
      let that = this; //"this" will not work inside of forEach, so it needs to be stored
      this.process.graph.forEachNode(function (n) {
        if (that.pinnedNodes.has(n.id)) {
          nodesToPin.push(n);
        }
      });
      this.frame.setPinnedNodes(nodesToPin);
    }
  }

  setUpFrame() {
    const graphFrame = new Frame(this.computedGraph);
    graphFrame.init();
    graphFrame.display();
    this.frame = graphFrame;
    graphFrame.ee.on("select-nodes", nodes => {
      this.selectedNodes = nodes;
    });
    graphFrame.ee.on("show-node-label", nodes => {
      this.nodesShowingLabels = nodes;
    });
    graphFrame.ee.on("right-click", data => {
      const menu = MenuFactory({
        children: [
          MenuItemFactory({
            onClick: () => {
              this.frame.toggleSelectedLabels();
            },
            text: 'Toggle Labels',
            key: 'Toggle Labels'
          }),
          MenuItemFactory({
            onClick: () => {
              this.frame.unpinSelectedNodes();
            },
            text: 'Unpin Selected',
            key: 'Unpin Selected'
          }),
          MenuItemFactory({
            onClick: () => {
              this.frame.pinSelectedNodes();
            },
            text: 'Pin Selected',
            key: 'Pin Selected'
          }),
          this.frame.rightClickedNode && MenuItemFactory({
            onClick: () => {
              if (this.frame.rightClickedNode) {
                const rightClickedNodeId = this.frame.rightClickedNode.data.ref.id.toString();
                const neighbors = this.getNeighborNodesFromRawGraph(rightClickedNodeId);
                neighbors.sort((n1, n2) => {
                  if (n1["pagerank"] && n2["pagerank"]) {
                    return n2["pagerank"] - n1["pagerank"];
                  }
                  return 0;
                });
                const ids = [];
                for (let i = 0; i < 5 && i < neighbors.length; i++) {
                  ids.push(neighbors[i].id);
                }
                this.showNodes(ids);
              }
            },
            text: 'Show 5 Neighbors with Highest PageRank',
            key: 'Show 5 Neighbors with Highest PageRank'
          }),
        ]
      });
      ContextMenu.show(menu, { left: data.pageX, top: data.pageY }, () => {
        // onMenuClose
        console.log("ContextMenu closed");
      });
    });
  }

  /*
   * Graph algorithms used in StatisticsDialog.
   */

  averageClustering() {
    if(this.frame){
      const shonodeid = this.frame.getNodeList().map(n=>n.id)
    
    const shownodes = this.rawGraph.nodes.filter((n)=>(shonodeid.includes(n.id)))
    const showedges = this.rawGraph.edges.filter((e)=>(shonodeid.includes(e.source_id) && shonodeid.includes(e.target_id)))
    const snapshot = {
      rawGraph: {
        nodes:shownodes,
        edges:showedges
      },
    };
    return averageClusteringCoefficient(snapshot);
    }

    const snapshot = {
      rawGraph: this.rawGraph,
    };
    return averageClusteringCoefficient(snapshot);
  }


  components() {
    if(this.frame){
      const shonodeid = this.frame.getNodeList().map(n=>n.id)
    
    const shownodes = this.rawGraph.nodes.filter((n)=>(shonodeid.includes(n.id)))
    const showedges = this.rawGraph.edges.filter((e)=>(shonodeid.includes(e.source_id) && shonodeid.includes(e.target_id)))
    const snapshot = {
      rawGraph: {
        nodes:shownodes,
        edges:showedges
      },
    };
    return connectedComponents(snapshot);
    }
    

    const snapshot = {
      rawGraph: this.rawGraph,
    };
    return connectedComponents(snapshot);
  }

 
  density() {
    const snapshot = {
      rawGraph: this.rawGraph,
    };
    return graphDensity(snapshot);
  }

  filtergraphDensity(){
    const nodeCount = this.frame.getNodeList().length;
    const edgeCount = this.frame.getEdgeList().filter(n=>n.fromId!==n.toId).length ;
    return (2 * edgeCount) / ((nodeCount) * (nodeCount - 1));
  }

 
  degree() {
    const snapshot = {
      rawGraph: this.rawGraph,
    };
    return averageDegree(snapshot);
  }

  avgDe(){
    let sum = 0;
    this.frame.getNodeList().forEach(e => {
            sum += e.data.ref.degree;
        }
    )
    return sum / this.frame.getNodeList().length;
  }

  avgDist(){

    const average = (array) => array.reduce((a, b) => a + b) / array.length;
    const edgeSelection = [];
    this.frame.getNodeList().forEach(node => {
      if(node.linkObjs && node.linkObjs.length>0){
        edgeSelection.push(...node.linkObjs)
      }
      
    })

    if (edgeSelection.length > 0) {
      const uniqEdgeSelection = uniq(edgeSelection)
      
      if (uniqEdgeSelection.length > 0) {
        const edgeDistance = uniqEdgeSelection.map(e=>{
          if(e.edgeDist >0){
            return e.edgeDist
          }else {
            return 0
          }
         
        })
        // console.log(edgeDistance)
        return average(edgeDistance).toFixed(2);

      } else {
        return 0
      }

    } else {
      return 0
    }
  }


  diameter() {
    if(this.frame){
      const shonodeid = this.frame.getNodeList().map(n=>n.id)
    
    const shownodes = this.rawGraph.nodes.filter((n)=>(shonodeid.includes(n.id)))
    const showedges = this.rawGraph.edges.filter((e)=>(shonodeid.includes(e.source_id) && shonodeid.includes(e.target_id)))
    const snapshot = {
      rawGraph: {
        nodes:shownodes,
        edges:showedges
      },
    };
    return exactGraphDiameter(snapshot);
    }
    
    const snapshot = {
      rawGraph: this.rawGraph,
    };
    return exactGraphDiameter(snapshot);
  }

  rerundiameter(temraw){
    const snapshot = {
      rawGraph: temraw,
    };
    return exactGraphDiameter(snapshot);
  }

  reruncluster(temraw){
    const snapshot = {
      rawGraph: temraw,
    };
    return reaverageClusteringCoefficient(snapshot);
  }

  reruncomponent(temraw){
    const snapshot = {
      rawGraph: temraw,
    };
    return connectedComponents(snapshot);
  }
}

