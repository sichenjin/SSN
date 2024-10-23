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
  MenuDivider,
} from "@blueprintjs/core";

import appState from "../../stores";
import createGraph from "ngraph.graph";
import path from "ngraph.path";

import axios from "axios";
import { observable, computed, action, runInAction } from "mobx";

@observer
class StatGroupPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  runLocalANN = () => {
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Radius of the Earth in kilometers
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance;
    };

    const computeANN = (c_id, cc_nodes, order) => {
      let observedDistance = 0;

      cc_nodes.forEach((node) => {
        // Calculate distances to all other nodes
        const distances = cc_nodes
          .filter((n) => n.id !== node.id)
          .map((n) => ({
            id: n.id,
            dist: calculateDistance(node.LatY, node.LonX, n.LatY, n.LonX),
          }));

        // Sort by distance and pick the 'order' number of neighbors
        distances.sort((a, b) => a.dist - b.dist);
        // console.log(distances);
        // console.log(order);
        // console.log(cc_nodes);
        // const nearestNeighbors = distances.slice(0, order);
        // const order_neighbor = distances[order - 1];
        const knn_dist = distances[order - 1].dist;
        observedDistance += knn_dist;
      });

      const c_n = cc_nodes.length;
      // A is the minimal enclosing rectangle area around all nodes in the current community
      let A = 0;
      let minLat = Infinity,
        maxLat = -Infinity,
        minLon = Infinity,
        maxLon = -Infinity;
      cc_nodes.forEach((node) => {
        if (node.LatY < minLat) minLat = node.LatY;
        if (node.LatY > maxLat) maxLat = node.LatY;
        if (node.LonX < minLon) minLon = node.LonX;
        if (node.LonX > maxLon) maxLon = node.LonX;
      });
      const width = calculateDistance(minLat, minLon, minLat, maxLon);
      const height = calculateDistance(minLat, minLon, maxLat, minLon);
      A = width * height;
      let expectedDistance = 0.5 / Math.sqrt(c_n / A);
      appState.graph.community_expect_ann_dict[c_id] = expectedDistance;
      return observedDistance / c_n; // Average Nearest Neighbor Distance
    };

    // Run ANN for each community
    const nodes = appState.graph.rawGraph.nodes;
    if (!nodes[0]["community"]) {
      // this.runcommunity();
      // pop up a prompt box to ask user to run community detection first
      alert("Please run community detection first");
      return;
    }
    // calculate local ANN for each community to create ANN vs. neighbor order plots for each community, where x axis represents the order of neighbors and y axis represents the ANN value.
    const maxOrder = appState.graph.ann_order; // how many neighbor orders to compute
    // create a community dict where the keys are community ids and the values are the nodes in that community
    const communityDict = {};
    // createa community ann dict to store the ANN values for each community, where the keys are community ids and the values are the ANN values for each order
    // initialize annValuesDict with empty arrays for each community
    const annValuesDict = {};
    nodes.forEach((node) => {
      // skip nodes that are not in any community
      if (node.community === "-1") {
        return;
      }
      if (!communityDict[node.community]) {
        communityDict[node.community] = [];
      }
      if (!annValuesDict[node.community]) {
        annValuesDict[node.community] = [];
      }
      communityDict[node.community].push(node);
    });
    console.log(communityDict);
    // record the color for each community in community_color_dict
    const c_color_dict = {};
    const frame_nodes = appState.graph.frame.getNodeList();
    for (const [c_id, c_nodes] of Object.entries(communityDict)) {
      const sample_node = c_nodes[0];
      frame_nodes.forEach((node) => {
        if (sample_node.id === node.id) {
          c_color_dict[c_id] = node.renderData.color;
        }
      });
    }
    appState.graph.community_color_dict = c_color_dict;
    // compute ANN for each community
    for (let order = 1; order <= maxOrder; order++) {
      for (const [c_id, c_nodes] of Object.entries(communityDict)) {
        if (c_nodes.length <= order) {
          // skip communities that have fewer nodes than the order
          annValuesDict[c_id].push(null);
          continue;
        }
        const ann = computeANN(c_id, c_nodes, order); // return a float ann value for the current order for this community
        // push ann to the annValuesDict with no order because the index of the array is the order
        annValuesDict[c_id].push(ann);
      }
    }
    console.log(annValuesDict);
    // Randomly select N number of nodes in the network (where N =  max(size(modules))
    // Run ANN on this sample and put it in the community_ann_dict with key = "sample"
    let sample_N = maxOrder + 1;
    // randomly select N nodes from the network
    const sample_nodes = [];
    const sample_nodes_id = [];
    while (sample_nodes.length < sample_N) {
      const random_node = nodes[Math.floor(Math.random() * nodes.length)];
      if (!sample_nodes_id.includes(random_node.id)) {
        sample_nodes.push(random_node);
        sample_nodes_id.push(random_node.id);
      }
    }

    annValuesDict["sample"] = [];
    for (let order = 1; order <= maxOrder; order++) {
      const sample_ann = computeANN("sample", sample_nodes, order);
      annValuesDict["sample"].push(sample_ann);
    }
    console.log(annValuesDict);
    appState.graph.community_ann_dict = annValuesDict;
    appState.graph.community_color_dict["sample"] = "#000000";
    appState.graph.scatterplot.x = "order";
    appState.graph.scatterplot.y = "ANN";
  };

  runcommunity = () => {
    appState.graph.convexPolygons = [];

    var fromedgelist = appState.graph.rawGraph.edges.map((edge) => {
      return edge.source_id;
    });
    var toedgelist = appState.graph.rawGraph.edges.map((edge) => {
      return edge.target_id;
    });
    var querydict = {
      type: "edgelist",
      message: {
        name: "community",
      },
      fromedgelist: fromedgelist,
      toedgelist: toedgelist,
    };
    axios.post("https://snoman.herokuapp.com/flask/community", querydict).then(
      // https://snoman.herokuapp.com/flask/community', querydict).then(
      (response) => {
        var communityDict = response.data.message;
        console.log(communityDict);
        appState.graph.modularity = response.data.modularity;
        appState.graph.rawGraph.nodes.forEach((node) => {
          var unicommunity =
            Math.max.apply(null, Object.values(communityDict)) + 1;
          if (node.degree > 0 && !communityDict[node.id]) {
            node.community = String.fromCharCode(unicommunity + 95);
            unicommunity = unicommunity + 1;
          } else if (communityDict[node.id]) {
            node.community = String.fromCharCode(communityDict[node.id] + 95);
          } else {
            node.community = "-1";
          }
        });
        const nodesArr = appState.graph.rawGraph.nodes;
        const nodekeyList = Object.keys(nodesArr[1]);
        const nodePropertyTypes = {};
        nodekeyList.forEach(function (k) {
          nodePropertyTypes[k] = typeof nodesArr[1][k];
        });
        const uniqueValue = {};
        nodekeyList.forEach(function (k, i) {
          if (nodePropertyTypes[k] == "string") {
            uniqueValue[k] = [...new Set(nodesArr.map((item) => item[k]))];
          } else {
            const valuea = nodesArr.map(function (el) {
              return el[k];
            });
            const minv = Math.min(...valuea);
            const maxv = Math.max(...valuea);
            uniqueValue[k] = [minv, maxv];
          }
        });
        appState.graph.metadata.nodePropertyTypes = nodePropertyTypes;
        appState.graph.metadata.uniqueValue = uniqueValue;
        appState.graph.metadata.nodeProperties = nodekeyList;

        appState.graph.nodes.color.scale = "Nominal Scale";
        appState.graph.nodes.colorBy = "community";

        appState.graph.nodes.convexhullby = "community";
        appState.graph.nodes.groupby = "community";
        appState.graph.watchAppearance = appState.graph.watchAppearance + 1; //force update

        // console.log(result);
      },
      (error) => {
        console.log(error);
      }
    );
  };

  avgConnectionDist = () => {
    appState.graph.rawGraph.nodes.forEach(function (node) {
      const links = appState.graph.frame.getNode(node["id"]).linkObjs;
      if (links) {
        const cdistance = links.reduce((dist, l) => dist + l.edgeDist, 0);
        node["average distance"] = cdistance / node.degree;
        node["average distance"] = node["average distance"].toFixed(2);
      } else {
        node["average distance"] = 0;
      }
    });

    appState.graph.scatterplot.x = "average distance";
    appState.graph.scatterplot.y = "degree";
    appState.graph.metadata.nodeComputed.push("average distance");
    appState.graph.nodes.colorBy = "average distance";
    appState.graph.nodes.color.scale = "Linear Scale";
    appState.graph.watchAppearance = appState.graph.watchAppearance + 1;
  };

  runKfullfillment = () => {
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Radius of the Earth in kilometers
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance;
    };

    // Function to find the K nearest neighbors for each node
    const findKfulfillment = (nodes, edges) => {
      const neighbors = {};

      for (const currentNode of nodes) {
        // find nearest neighbors
        const currentId = currentNode.id;
        currentNode["nearestnn"] = [];
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

            currentNode["nearestnn"].push({
              id: otherNode.id,
              distance: distance,
            });
          }
        }

        // Sort neighbors by distance and keep the closest K
        currentNode["nearestnn"].sort((a, b) => a.distance - b.distance);
        const k = currentNode["degree"];
        currentNode["nearestnn"] = currentNode["nearestnn"].slice(0, k);

        //find connected node id
        currentNode["connected node"] = [];
        for (const edge of edges) {
          if (
            edge.source_id == currentNode["id"] ||
            edge.target_id == currentNode["id"]
          ) {
            currentNode["connected node"].push(edge.source_id);
            currentNode["connected node"].push(edge.target_id);
          }
        }
        currentNode["connected node"].filter((n) => n !== currentNode["id"]);

        // calculate kfulfillment
        const cnn = new Set(currentNode["connected node"]);
        currentNode["connected node"] = Array.from(cnn);
        const snn = new Set(currentNode["nearestnn"].map((n) => n.id));

        const intersection = [...cnn].filter((item) => snn.has(item));
        if (currentNode["degree"] === 0) {
          currentNode["k-Fulfillment"] = 0;
        } else {
          currentNode["k-Fulfillment"] =
            intersection.length / currentNode["degree"];
        }
      }
    };

    findKfulfillment(
      appState.graph.rawGraph.nodes,
      appState.graph.rawGraph.edges
    );
    appState.graph.metadata.nodeComputed.push("k-Fulfillment");
    appState.graph.scatterplot.x = "k-Fulfillment";
    appState.graph.scatterplot.y = "degree";
    appState.graph.nodes.colorBy = "k-Fulfillment";
    appState.graph.nodes.color.scale = "Linear Scale";
    appState.graph.watchAppearance = appState.graph.watchAppearance + 1;
  };

  runGlobalFlatRatio = () => {
    const nodes = appState.graph.rawGraph.nodes;
    const iter = 5;
    const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        // Generate a random index from 0 to i
        const randomIndex = Math.floor(Math.random() * (i + 1));

        // Swap elements array[i] and array[randomIndex]
        const temp = array[i];
        array[i] = array[randomIndex];
        array[randomIndex] = temp;
      }
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Radius of the Earth in kilometers
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance;
    };

    const gBarSumDistances = (
      nodeOrders,
      nodesWKnn,
      distanceMatrix,
      degreeConstraintMatrix
    ) => {
      const degreeCount = new Map();
      nodeOrders.forEach((node) => degreeCount.set(node, 0));

      const nodesLabels = nodesWKnn.map((n) => n["id"]);
      const n = nodesLabels.length;
      const connectionCounted = {};
      for (const nl of nodesLabels) {
        connectionCounted[nl] = {};
      }

      let totalDistance = 0;

      for (let i = 0; i < nodeOrders.length; i++) {
        const node = nodeOrders[i];
        const neighbors = nodesWKnn.filter((obj) => {
          return obj["id"] === node;
        })[0]["nearestnn"];

        const neighborsid = neighbors.map((n) => n["id"]);

        for (const neighbor of neighborsid) {
          if (
            !connectionCounted[node][neighbor] &&
            degreeCount.get(node) <
              appState.graph.frame.getNode(node).data.ref.degree &&
            degreeCount.get(neighbor) <
              appState.graph.frame.getNode(neighbor).data.ref.degree
          ) {
            totalDistance += distanceMatrix[node][neighbor];
            degreeCount.set(node, degreeCount.get(node) + 1);
            degreeCount.set(neighbor, degreeCount.get(neighbor) + 1);
            connectionCounted[node][neighbor] = true;
            connectionCounted[neighbor][node] = true;
            // console.log("Added distance for", node, neighbor, "in order:", nodeOrders);
          }
        }
      }
      return totalDistance;
    };

    //calcualte knn
    if (!nodes[0]["nearestnn"]) {
      for (const currentNode of nodes) {
        // find nearest neighbors
        const currentId = currentNode.id;
        currentNode["nearestnn"] = [];
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

            currentNode["nearestnn"].push({
              id: otherNode.id,
              distance: distance,
            });
          }
        }

        // Sort neighbors by distance and keep the closest K
        currentNode["nearestnn"].sort((a, b) => a.distance - b.distance);
        const k = currentNode["degree"];
        currentNode["nearestnn"] = currentNode["nearestnn"].slice(0, k);
      }
    }

    // Generate iteration number of node orders
    const nodeOrders = [];
    for (let i = 0; i < iter; i++) {
      nodeOrders.push(nodes.map((n) => n["id"]));
      shuffleArray(nodeOrders[i]); // Shuffle the node order
    }

    // Precompute the distance matrix
    const nodesLabels = nodes.map((n) => n["id"]);
    const n = nodesLabels.length;
    const distanceMatrix = {};
    for (const nl of nodesLabels) {
      distanceMatrix[nl] = {};
      for (const ll of nodesLabels) {
        distanceMatrix[nl][ll] = 0;
      }
    }

    for (let i = 0; i < n; i++) {
      // Skip diagonal values
      for (let j = i + 1; j < n; j++) {
        const distance = calculateDistance(
          nodes[i].LatY,
          nodes[i].LonX,
          nodes[j].LatY,
          nodes[j].LonX
        );

        // Update both upper and lower side of the matrix since the network is undirected
        distanceMatrix[nodes[i]["id"]][nodes[j]["id"]] = distance;
        distanceMatrix[nodes[j]["id"]][nodes[i]["id"]] = distance;
      }
    }

    // Precompute the degree constraint matrix
    const degreeConstraintMatrix = nodes.map((x) => x["degree"]);

    // Calculate average distance of G_bar under iterations.
    const avgGBarSum =
      nodeOrders
        .map((order) =>
          gBarSumDistances(order, nodes, distanceMatrix, degreeConstraintMatrix)
        )
        .reduce((a, b) => a + b, 0) / iter;
    const links = appState.graph.frame
      .getNodeList()
      .map((n) => n.linkObjs)
      .flat()
      .filter((i) => i);
    const gSum = links.reduce((dist, l) => dist + l.edgeDist, 0) / 2;

    appState.graph.globalFlatRatio = avgGBarSum / gSum;
  };

  runLocalFlatRatio = () => {
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Radius of the Earth in kilometers
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance;
    };

    const findFlatRatio = (nodes) => {
      const neighbors = {};

      if (nodes[0]["nearestnn"]) {
        // don't calculate nearest neighbors again
        //calculate connected node distance directly
        for (const currentNode of nodes) {
          const currentId = currentNode.id;
          const links = appState.graph.frame.getNode(currentId).linkObjs;
          if (links) {
            const cdistance = links.reduce((dist, l) => dist + l.edgeDist, 0);
            const ndistance = currentNode["nearestnn"].reduce(
              (dist, l) => dist + l.distance,
              0
            );
            // calculate flat ratio
            currentNode["flattening ratio"] = ndistance / cdistance;
            if (!isFinite(currentNode["flattening ratio"])) {
              currentNode["flattening ratio"] = 0;
            }
          } else {
            currentNode["flattening ratio"] = 0;
          }
        }
      } else {
        for (const currentNode of nodes) {
          // find nearest neighbors
          const currentId = currentNode.id;
          currentNode["nearestnn"] = [];
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

              currentNode["nearestnn"].push({
                id: otherNode.id,
                distance: distance,
              });
            }
          }

          // Sort neighbors by distance and keep the closest K
          currentNode["nearestnn"].sort((a, b) => a.distance - b.distance);
          const k = currentNode["degree"];
          currentNode["nearestnn"] = currentNode["nearestnn"].slice(0, k);

          //calculate connected node distance
          const links = appState.graph.frame.getNode(currentId).linkObjs;
          if (links) {
            const cdistance = links.reduce((dist, l) => dist + l.edgeDist, 0);
            const ndistance = currentNode["nearestnn"].reduce(
              (dist, l) => dist + l.distance,
              0
            );
            // calculate flat ratio
            currentNode["flattening ratio"] = ndistance / cdistance;
            if (!isFinite(currentNode["flattening ratio"])) {
              currentNode["flattening ratio"] = 0;
            }
          } else {
            currentNode["flattening ratio"] = 0;
          }
        }
      }
    };

    findFlatRatio(appState.graph.rawGraph.nodes);
    appState.graph.metadata.nodeComputed.push("flattening ratio");
    appState.graph.scatterplot.x = "flattening ratio";
    appState.graph.scatterplot.y = "degree";
    appState.graph.nodes.colorBy = "flattening ratio";
    appState.graph.nodes.color.scale = "Linear Scale";
    appState.graph.watchAppearance = appState.graph.watchAppearance + 1;
  };

  runGlobalANN = () => {
    // ANN = D_observed / D_expected https://pro.arcgis.com/en/pro-app/latest/tool-reference/spatial-statistics/h-how-average-nearest-neighbor-distance-spatial-st.htm
    // D_observed = the observed average distance between each node and its nearest neighbors
    // D_expected = the expected average distance between each node and its nearest neighbors = 0.5 / sqrt(n / A)
    // n = number of nodes, A = area of minimum enclosing rectangle around all nodes.
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Radius of the Earth in kilometers
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance;
    };
    // if ANN has not been calculated, calculate it
    if (!appState.graph.globalANN) {
      const nodes = appState.graph.rawGraph.nodes;
      nodes.forEach((node) => {
        const neighbors = nodes.filter((n) => n.id !== node.id);
        neighbors.forEach((neighbor) => {
          neighbor.distance = calculateDistance(
            node.LatY,
            node.LonX,
            neighbor.LatY,
            neighbor.LonX
          );
        });
        // sort neighbors by distance, the first one is the nearest neighbor
        neighbors.sort((a, b) => a.distance - b.distance);
        // console.log(neighbors);
        node.nn = neighbors[0];
      });
      const n = nodes.length;
      let d_observed = 0;
      nodes.forEach((node) => {
        d_observed += node.nn.distance;
      });
      d_observed /= n;
      appState.graph.global_D_observed = d_observed;
      // A is the minimal enclosing rectangle area around all nodes
      let minLat = Infinity,
        maxLat = -Infinity,
        minLon = Infinity,
        maxLon = -Infinity;
      nodes.forEach((node) => {
        if (node.LatY < minLat) minLat = node.LatY;
        if (node.LatY > maxLat) maxLat = node.LatY;
        if (node.LonX < minLon) minLon = node.LonX;
        if (node.LonX > maxLon) maxLon = node.LonX;
      });
      const width = calculateDistance(minLat, minLon, minLat, maxLon);
      const height = calculateDistance(minLat, minLon, maxLat, minLon);
      const A = width * height;
      appState.graph.global_D_expected = 0.5 / Math.sqrt(n / A);
      appState.graph.globalANN =
        appState.graph.global_D_observed / appState.graph.global_D_expected;
      console.log("global ann", appState.graph.globalANN);
    }
  };

  runShortestPath = () => {
    const calDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
      var p = 0.017453292519943295; // Math.PI / 180
      var c = Math.cos;
      var a =
        0.5 -
        c((lat2 - lat1) * p) / 2 +
        (c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;

      return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    };

    const graph = createGraph();

    // hardcode LatY and LonX for sample dataset
    appState.graph.rawGraph.nodes.forEach((node) =>
      graph.addNode(node["id"].toString(), {
        LatY: parseFloat(node["LatY"]),
        LonX: parseFloat(node["LonX"]),
      })
    );
    appState.graph.rawGraph.edges.forEach((edge) =>
      graph.addLink(edge["source_id"], edge["target_id"])
    );

    const shortestPathPairs = () => {
      let pathFinder = path.aGreedy(graph);
      const pathsArr = [];
      const pathsSet = new Set();

      graph.forEachNode(function (fromnode) {
        graph.forEachNode(function (tonode) {
          if (fromnode.id !== tonode.id) {
            const pathKey1 = `${fromnode.id}👉${tonode.id}`;
            const pathKey2 = `${tonode.id}👉${fromnode.id}`;
            const edgeinfo = appState.graph.rawGraph.edges.filter((edge) => {
              return (
                edge.source_id === fromnode.id && edge.target_id === tonode.id
              );
            });
            let pairdist = calDistanceFromLatLonInKm(
              fromnode.data.LatY,
              fromnode.data.LonX,
              tonode.data.LatY,
              tonode.data.LonX
            );

            // undirected graph:
            // only add once for undirected graph
            if (!pathsSet.has(pathKey1) && !pathsSet.has(pathKey2)) {
              pathsSet.add(pathKey1);
              pathsSet.add(pathKey2);
              pathsArr.push({
                source: fromnode.id,
                target: tonode.id,
                path: pathFinder.find(fromnode.id, tonode.id),
                distance: pairdist,
              });
            }

            //directed graph:
          }
        });
      });
      // console.log(nodesArr.length)
      // console.log(pathsArr.length)
      return pathsArr;
    };
    appState.graph.rawGraph.paths = shortestPathPairs();
    appState.graph.metadata.nodeComputed.push("shortest path");
    appState.graph.metadata.nodeComputed.push("pair distance");
    appState.graph.scatterplot.x = "pair distance";
    appState.graph.scatterplot.y = "shortest path";
  };

  runDataAssortativity = () => {
    // Implement the degree-degree plot, where each circle represents an edge, and the x and y coordinates are the larger/smaler degrees of the src/target nodes, respectively. Note that it doesn't ensure that the src node is on the x-axis and the target node is on the y-axis.
    const edges = appState.graph.frame.getEdgeList();
    // check if the src/target degree is already calculated
    if (!(edges[0].sourceDegree && edges[0].targetDegree)) {
      const nodes = appState.graph.frame.getNodeList();
      // console.log(edges);
      const edgeDegrees = edges.map((edge) => {
        const source_id = edge.fromId;
        const target_id = edge.toId;
        const source = nodes.find((node) => node.id === source_id);
        const target = nodes.find((node) => node.id === target_id);
        const sourceDegree = source.data.ref.degree;
        const targetDegree = target.data.ref.degree;
        edge.sourceDegree = parseInt(sourceDegree);
        edge.targetDegree = parseInt(targetDegree);
        // console.log(sourceDegree, targetDegree);
        // if src_id === target_id, skip it
        if (source_id === target_id) {
          return null;
        }
        return {
          source: Math.min(sourceDegree, targetDegree),
          target: Math.max(sourceDegree, targetDegree),
        };
      });
    }
    // console.log(edgeDegrees);
    appState.graph.scatterplot.x = "nodes with larger degree";
    appState.graph.scatterplot.y = "nodes with smaller degree";
    // this.forceUpdate();
  };

  findcliques = () => {
    var fromedgelist = appState.graph.rawGraph.edges.map((edge) => {
      return edge.source_id;
    });
    var toedgelist = appState.graph.rawGraph.edges.map((edge) => {
      return edge.target_id;
    });
    var querydict = {
      type: "edgelist",
      message: {
        name: "clique",
      },
      fromedgelist: fromedgelist,
      toedgelist: toedgelist,
    };
    axios.post("https://snoman.herokuapp.com/flask/Cliques", querydict).then(
      (response) => {
        var cliques = response.data.message;
        console.log(cliques);
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
  };

  convexhull = (group) => {
    var querydict;
    if (group === "community") {
      querydict = {
        type: "edgelist",
        message: {
          name: "convex",
        },
        group: group,
        nodes: appState.graph.rawGraph.nodes.filter(
          (n) => n["community"] !== "-1"
        ),
      };
    } else {
      querydict = {
        type: "edgelist",
        message: {
          name: "convex",
        },
        group: group,
        nodes: appState.graph.rawGraph.nodes,
      };
    }

    // var fromedgelist = appState.graph.rawGraph.edges.map((edge) => {
    //     return edge.source_id
    // })
    // var toedgelist = appState.graph.rawGraph.edges.map((edge) => {
    //     return edge.target_id
    // })

    axios.post("https://snoman.herokuapp.com/flask/convexhull", querydict).then(
      // https://snoman.herokuapp.com/flask/convexhull', querydict).then(
      (response) => {
        var jsondata = JSON.parse(response.data);
        var convexDict = jsondata.message;

        appState.graph.rawGraph.nodes.forEach((node) => {
          node.isconvex = convexDict[node.id];
        });
        const nodesArr = appState.graph.rawGraph.nodes;
        const nodekeyList = Object.keys(nodesArr[1]);
        const nodePropertyTypes = {};
        nodekeyList.forEach(function (k) {
          nodePropertyTypes[k] = typeof nodesArr[1][k];
        });
        const uniqueValue = {};
        nodekeyList.forEach(function (k, i) {
          if (nodePropertyTypes[k] == "string") {
            uniqueValue[k] = [...new Set(nodesArr.map((item) => item[k]))];
          } else {
            const valuea = nodesArr.map(function (el) {
              return el[k];
            });
            const minv = Math.min(...valuea);
            const maxv = Math.max(...valuea);
            uniqueValue[k] = [minv, maxv];
          }
        });
        appState.graph.metadata.nodePropertyTypes = nodePropertyTypes;
        appState.graph.metadata.uniqueValue = uniqueValue;
        appState.graph.metadata.nodeProperties = nodekeyList;

        appState.graph.nodes.color.scale = "Nominal Scale";
        appState.graph.nodes.colorBy = group;
        appState.graph.convexPolygonsShow = true;
        appState.graph.watchAppearance = appState.graph.watchAppearance + 1;

        // const selectionNode = appState.graph.frame.getNodeList().filter(node =>
        //     // console.log(node)
        //     node.data.ref.isconvex

        // )
        // // highlight for the mapview
        // appState.graph.convexNodes = selectionNode
        appState.graph.convexPolygons = jsondata.multipolygon;
        console.log(appState.graph.convexPolygons);
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
  };

  density_distance = (group) => {
    // var fromedgelist = appState.graph.rawGraph.edges.map((edge) => {
    //     return edge.source_id
    // })
    // var toedgelist = appState.graph.rawGraph.edges.map((edge) => {
    //     return edge.target_id
    // })

    var querydict;
    if (group === "community") {
      querydict = {
        type: "edgelist",
        message: {
          name: "density_distance",
        },
        group: group,
        nodes: appState.graph.rawGraph.nodes.filter(
          (n) => n["community"] !== "-1"
        ),
        edges: appState.graph.rawGraph.edges,
      };
    } else {
      querydict = {
        type: "edgelist",
        message: {
          name: "density_distance",
        },
        group: group,
        nodes: appState.graph.rawGraph.nodes,
        edges: appState.graph.rawGraph.edges,
      };
    }

    // var querydict = {
    //     "type": 'edgelist',
    //     "message": {
    //         'name': 'density_distance'
    //     },
    //     "group": group,
    //     "nodes": appState.graph.rawGraph.nodes,
    //     "edges": appState.graph.rawGraph.edges

    // }
    axios
      .post("https://snoman.herokuapp.com/flask/densitydistance", querydict)
      .then(
        (response) => {
          var jsondata = JSON.parse(response.data);
          // var convexDict = jsondata.message;

          appState.graph.metadata.nodeComputed.push("standard distance");
          appState.graph.metadata.nodeComputed.push("network density");

          appState.graph.densityDistance = jsondata.density_distance;
          appState.graph.scatterplot.y = "standard distance";
          appState.graph.scatterplot.x = "network density";
          appState.graph.groupby = group;
          appState.graph.nodes.colorBy = group;
          appState.graph.nodes.color.scale = "Nominal Scale";
          appState.graph.watchAppearance = appState.graph.watchAppearance + 1;
        },
        (error) => {
          console.log(error);
        }
      );
  };

  render() {
    return (
      <div>
        <p className="stat-section-heading">Distance and Shortest Path</p>
        <Button
          className="bp4-button"
          style={{ zIndex: "1000" }}
          onClick={this.avgConnectionDist}
        >
          Run Average Distance
        </Button>
        <br></br>
        <Button
          className="bp4-button"
          style={{ zIndex: "1000" }}
          onClick={this.runShortestPath}
        >
          Run Shortest Path
        </Button>
        <br></br>
        <Button
          className="bp4-button"
          style={{ zIndex: "1000" }}
          onClick={this.runDataAssortativity}
        >
          Run Data Assortativity
        </Button>
        <br></br>
        <Button
          className="bp4-button"
          style={{ zIndex: "1000" }}
          onClick={this.runGlobalANN}
        >
          Run Global ANN
        </Button>
        {appState.graph.globalANN ? (
          <text className="ann-tag" style={{ fontSize: "8px" }}>
            {parseFloat(appState.graph.global_D_observed).toFixed(3) +
              "/" +
              parseFloat(appState.graph.global_D_expected).toFixed(3) +
              "=" +
              parseFloat(appState.graph.globalANN).toFixed(3)}
          </text>
        ) : null}
        <br></br>
        <hr />
        <p className="stat-section-heading">Efficient Distance Analysis</p>
        <Button
          className="bp4-button"
          style={{ zIndex: "1000" }}
          onClick={this.runLocalFlatRatio}
        >
          Run Local Flattening Ratio
        </Button>
        <br></br>
        <Button
          className="bp4-button"
          style={{ zIndex: "1000" }}
          onClick={this.runKfullfillment}
        >
          Run K-fullfillment
        </Button>
        <br></br>
        <Button
          className="bp4-button"
          style={{ zIndex: "1000" }}
          onClick={this.runGlobalFlatRatio}
        >
          Run Global Flattening Ratio
        </Button>
        {appState.graph.globalFlatRatio ? (
          <text className="gf-tag" style={{ fontSize: "8px" }}>
            {parseFloat(appState.graph.globalFlatRatio).toFixed(3)}
          </text>
        ) : null}
        <br></br>
        <hr />
        <p className="stat-section-heading">Group-related Functions</p>
        <Button
          className="bp4-button"
          style={{ zIndex: "1000" }}
          onClick={this.runcommunity}
        >
          Run Community Detection
        </Button>
        {/* <button style={{height: "100%"}} onClick={this.runcommunity} type="button">
                            Run Community
                        </button> */}
        {appState.graph.modularity ? (
          <text className="modularity-tag" style={{ fontSize: "8px" }}>
            {"Q value: " + parseFloat(appState.graph.modularity).toFixed(3)}
          </text>
        ) : null}
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
        <Button
          className="bp4-button"
          style={{ zIndex: "1000" }}
          onClick={this.runLocalANN}
        >
          Run Community ANN
        </Button>

        <div>
          <p style={{ display: "inline", fontSize: "12px" }}>
            Convex Hull By:{" "}
          </p>
          <span style={{}}>
            <SimpleSelect
              items={appState.graph.filterKeyList.filter(
                (it) =>
                  it !== "ID" &&
                  (it === "community" ||
                    isNaN(appState.graph.rawGraph.nodes[0][it]))
              )}
              onSelect={(it) => {
                appState.graph.convexhullby = it;
                this.convexhull(it);
                appState.graph.convexPolygonsShow = true;
                //followed by cluster by function
                appState.graph.groupby = it;
                this.density_distance(it);
              }}
              value={appState.graph.convexhullby}
            />
          </span>
        </div>
        <div>
          <p style={{ display: "inline", fontSize: "12px" }}>Group By: </p>
          <span style={{}}>
            <SimpleSelect
              items={appState.graph.filterKeyList.filter(
                (it) =>
                  it !== "ID" &&
                  (it === "community" ||
                    isNaN(appState.graph.rawGraph.nodes[0][it]))
              )}
              onSelect={(it) => {
                appState.graph.groupby = it;
                this.density_distance(it);
              }}
              value={appState.graph.groupby}
            />
          </span>
        </div>
      </div>
    );
  }
}

export default StatGroupPanel;
