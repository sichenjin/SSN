var def = require("./imports").default;
var THREE = def.THREE;
var Edge = def.Edge;
var Node = def.Node;
var OrbitControls = def.OrbitControls;
var d3 = def.d3;
var ee = def.ee;
const { linkVertical } = require("d3");
var $ = require("jquery");
const { default: appState } = require("../../stores");

module.exports = function (self) {
  self.selectNode = function (node) {
    self.dragging = node;
    self.selection = [node];
    node.renderData.isSelected = true;
    self.updateSelection(self.mouseX, self.mouseY);
  };

  /**
   * Deselect nodes in selection list
   */
  self.clearSelection = function () {
    for (var i = 0; i < self.selection.length; i++) {
      self.selection[i].renderData.isSelected = false;
      if (!def.NODE_NO_HIGHLIGHT) {
        self.selection[i].renderData.draw_object.children[0].visible = false;
      } else {
        self.selection[i].renderData.draw_object.material.color.set(
          new THREE.Color(self.selection[i].renderData.color)
        );
      }
      self.selection[i].renderData.textHolder.children[0].element.hideme = true;
    }
    self.selection = [];
  };

  //return all the edges within the selected nodes
  self.getEdgeWithinSelection = function (selection) {
    const withinEdges = [];
    for (var i = 0; i < selection.length; i++) {
      if (selection[i] && selection[i].linkObjs) {
        selection[i].linkObjs.forEach(function (link) {
          if (
            selection.indexOf(link.source) !== -1 &&
            selection.indexOf(link.target) !== -1 &&
            link.source !== link.target &&
            withinEdges.indexOf(link) == -1
          ) {
            withinEdges.push(link);
          }
        });
      }
    }
    return withinEdges;
  };

  // //return all the edges within and out the selected nodes
  // self.getEdgeOfCommonSetSelection = function (selection, commonnodes) {
  //   const withinoutEdges = []
  //   for (var i = 0; i < selection.length; i++) {
  //     if (selection[i] && selection[i].linkObjs) {
  //       selection[i].linkObjs.forEach(function (link) {
  //         if ((selection.indexOf(link.source) !== -1 || selection.indexOf(link.target) !== -1) && link.source !== link.target && withinoutEdges.indexOf(link) == -1) {
  //           withinoutEdges.push(link)
  //         }
  //       })
  //     }
  //   }
  //   return withinoutEdges;
  // }

  //return all the edges within and out the selected nodes
  self.getEdgeWithinOutSelection = function (selection) {
    const withinoutEdges = [];
    for (var i = 0; i < selection.length; i++) {
      if (selection[i] && selection[i].linkObjs) {
        selection[i].linkObjs.forEach(function (link) {
          if (
            (selection.indexOf(link.source) !== -1 ||
              selection.indexOf(link.target) !== -1) &&
            link.source !== link.target &&
            withinoutEdges.indexOf(link) == -1
          ) {
            withinoutEdges.push(link);
          }
        });
      }
    }
    return withinoutEdges;
  };

  self.findIntersection = function (arrays) {
    if (!Array.isArray(arrays) || arrays.length === 0) {
      return [];
    }

    return arrays.reduce((intersection, currentArray) => {
      if (!Array.isArray(currentArray)) {
        return intersection;
      }

      return intersection.filter((value) => currentArray.includes(value));
    });
  };

  self.getCommonNodesBetweenSets = function (selectionsets) {
    const setsnodes = selectionsets.map((selection) => {
      const onesetlinks = selection
        .map((node) => node.linkObjs)
        .flat()
        .filter((item) => item !== undefined && item !== null);
      const onesetinoutnodes = onesetlinks
        .map((link) => [link.source, link.target])
        .flat();
      return onesetinoutnodes;
    });
    const commonnodes = self.findIntersection(setsnodes);
    return self.uniqueArrayByAttribute(commonnodes, "id");
  };

  //return all the edges within distance
  self.getEdgeWithinDist = function (mindist, maxdist) {
    const withinoutEdges = [];
    self.graph.forEachNode((n) => {
      if (n.linkObjs && n.linkObjs.length > 0) {
        n.linkObjs.forEach(function (link) {
          if (link.edgeDist > mindist && link.edgeDist < maxdist) {
            withinoutEdges.push(link);
          }
        });
      }
    });

    return withinoutEdges;
  };

  self.getEdgeWithinSelectionForDensity = function (selection) {
    const withinEdges = [];
    const edgekeys = [];
    for (var i = 0; i < selection.length; i++) {
      if (selection[i] && selection[i].linkObjs) {
        selection[i].linkObjs.forEach(function (link) {
          const key1 = `${link.source.id}👉 ${link.target.id}`;
          const key2 = `${link.target.id}👉 ${link.source.id}`;
          if (
            selection.indexOf(link.source) !== -1 &&
            selection.indexOf(link.target) !== -1 &&
            link.source !== link.target &&
            edgekeys.indexOf(key1) == -1
          ) {
            withinEdges.push(link);
            edgekeys.push(key1);
            edgekeys.push(key2);
            // edgecount = edgecount+1
          }
        });
      }
    }
    return withinEdges;
  };

  //highlight nodes and edges within selection
  self.updateDegreeHistOpacity = function () {
    if (self.degreehighlight.length > 0) {
      if (self.degreehighlight.length == 1 && appState.graph.colorByDistance) {
        const calDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
          var p = 0.017453292519943295; // Math.PI / 180
          var c = Math.cos;
          var a =
            0.5 -
            c((lat2 - lat1) * p) / 2 +
            (c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;

          return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
        };
        var sumOfAllDistance = 0;
        var n = 0;
        var max = 0;
        self.graph.forEachNode((n) => {
          var dist = calDistanceFromLatLonInKm(
            n.data.ref.LatY,
            n.data.ref.LonX,
            self.degreehighlight[0].data.ref.LatY,
            self.degreehighlight[0].data.ref.LonX
          );
          if (dist > max) {
            max = dist;
          }
        });
        self.graph.forEachNode((n) => {
          // self.colorNodeColor(n, "#0000FF");
          var dist = calDistanceFromLatLonInKm(
            n.data.ref.LatY,
            n.data.ref.LonX,
            self.degreehighlight[0].data.ref.LatY,
            self.degreehighlight[0].data.ref.LonX
          );
          console.log(
            n.data.ref.LatY,
            n.data.ref.LonX,
            self.degreehighlight[0]["LatY"],
            self.degreehighlight[0]["LatX"]
          );
          self.colorNode(n, 0x0000ff);
          if (dist == 0) {
            self.colorNodeOpacity(n, 1);
          } else if (dist < max / 4) {
            self.colorNodeOpacity(n, 0.2);
          } else if (dist < (2 * max) / 4) {
            self.colorNodeOpacity(n, 0.4);
          } else if (dist < (3 * max) / 4) {
            self.colorNodeOpacity(n, 0.6);
          } else {
            self.colorNodeOpacity(n, 0.8);
          }
        });
      } else {
        self.graph.forEachNode((n) => {
          //fisrt dehighlight all the nodes
          self.colorNodeOpacity(n, 0.2);
        });
        // self.colorNodeEdge(null);    // this is to highlight all

        //fisrt dehighlight all the edges
        self.lineIndices.forEach(function (link) {
          link.linecolor.r = self.darkMode ? 0.25 : 0.89; //black/white
          link.linecolor.g = self.darkMode ? 0.25 : 0.89;
          link.linecolor.b = self.darkMode ? 0.25 : 0.89;
        });

        //hilight within edges
        let red = new THREE.Color(appState.graph.edges.color).r;
        let blue = new THREE.Color(appState.graph.edges.color).g;
        let green = new THREE.Color(appState.graph.edges.color).b;
        const withinEdges = self.getEdgeWithinSelection(self.degreehighlight);

        for (var i = 0; i < withinEdges.length; i++) {
          withinEdges[i].linecolor.r = red;
          withinEdges[i].linecolor.g = blue;
          withinEdges[i].linecolor.b = green;
        }
        self.arrow.material.color.setRGB(red, blue, green);

        //highlight nodes
        for (var i = 0; i < self.degreehighlight.length; i++) {
          self.colorNodeOpacity(self.degreehighlight[i], 1);
        }
      }
    } else {
      //when no nodes satisfying the condition, all 0.2 opacity
      self.graph.forEachNode((n) => {
        self.colorNodeOpacity(n, 0.2);
      });
      self.colorNodeEdge(null);
    }
  };

  //highlight nodes and edges within selection
  self.updateSelectionOpacity = function () {
    // if()
    if (self.selection.length > 0) {
      if (self.selection.length == 1 && appState.graph.colorByDistance) {
        const calDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
          var p = 0.017453292519943295; // Math.PI / 180
          var c = Math.cos;
          var a =
            0.5 -
            c((lat2 - lat1) * p) / 2 +
            (c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;

          return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
        };
        var sumOfAllDistance = 0;
        var n = 0;
        var max = 0;
        self.graph.forEachNode((n) => {
          var dist = calDistanceFromLatLonInKm(
            n.data.ref.LatY,
            n.data.ref.LonX,
            self.selection[0].data.ref.LatY,
            self.selection[0].data.ref.LonX
          );
          if (dist > max) {
            max = dist;
          }
        });
        self.graph.forEachNode((n) => {
          // self.colorNodeColor(n, "#0000FF");
          var dist = calDistanceFromLatLonInKm(
            n.data.ref.LatY,
            n.data.ref.LonX,
            self.selection[0].data.ref.LatY,
            self.selection[0].data.ref.LonX
          );
          console.log(
            n.data.ref.LatY,
            n.data.ref.LonX,
            self.selection[0]["LatY"],
            self.selection[0]["LatX"]
          );
          self.colorNode(n, 0x0000ff);
          if (dist == 0) {
            self.colorNodeOpacity(n, 1);
          } else if (dist < max / 4) {
            self.colorNodeOpacity(n, 0.2);
          } else if (dist < (2 * max) / 4) {
            self.colorNodeOpacity(n, 0.4);
          } else if (dist < (3 * max) / 4) {
            self.colorNodeOpacity(n, 0.6);
          } else {
            self.colorNodeOpacity(n, 0.8);
          }
        });
      } else {
        self.graph.forEachNode((n) => {
          //fisrt dehighlight all the nodes
          self.colorNodeOpacity(n, 0.2);
        });
        // self.colorNodeEdge(null);    // this is to highlight all

        //fisrt dehighlight all the edges
        self.lineIndices.forEach(function (link) {
          link.linecolor.r = self.darkMode ? 0.25 : 0.89; //black/white
          link.linecolor.g = self.darkMode ? 0.25 : 0.89;
          link.linecolor.b = self.darkMode ? 0.25 : 0.89;
        });

        //hilight within edges
        let red = new THREE.Color(appState.graph.edges.color).r;
        let blue = new THREE.Color(appState.graph.edges.color).g;
        let green = new THREE.Color(appState.graph.edges.color).b;
        const withinEdges = self.getEdgeWithinSelection(self.selection);

        for (var i = 0; i < withinEdges.length; i++) {
          withinEdges[i].linecolor.r = red;
          withinEdges[i].linecolor.g = blue;
          withinEdges[i].linecolor.b = green;
        }
        self.arrow.material.color.setRGB(red, blue, green);

        //highlight nodes
        for (var i = 0; i < self.selection.length; i++) {
          self.colorNodeOpacity(self.selection[i], 1);
        }
      }
    } else {
      //when no nodes are selected, all 1 opacity
      self.graph.forEachNode((n) => {
        self.colorNodeOpacity(n, 1);
      });
      self.colorNodeEdge(null);
    }
  };

  self.highlightAllEdges = function () {
    let red = new THREE.Color(appState.graph.edges.color).r;
    let blue = new THREE.Color(appState.graph.edges.color).g;
    let green = new THREE.Color(appState.graph.edges.color).b;
    self.lineIndices.forEach(function (link) {
      link.linecolor.r = red; //black/white
      link.linecolor.g = blue;
      link.linecolor.b = green;
    });
    self.arrow.material.color.setRGB(red, blue, green);
  };

  //highlight  edges within distance range
  self.highlightedgeWithinDist = function (mindist, maxdist) {
    let red = new THREE.Color(appState.graph.edges.color).r;
    let blue = new THREE.Color(appState.graph.edges.color).g;
    let green = new THREE.Color(appState.graph.edges.color).b;
    //fisrt dehighlight all the edges
    self.lineIndices.forEach(function (link) {
      // console.log(link);
      if (link.edgeDist >= mindist && link.edgeDist <= maxdist) {
        link.linecolor.r = red;
        link.linecolor.g = blue;
        link.linecolor.b = green;
      } else {
        link.linecolor.r = self.darkMode ? 0.25 : 0.89; //black/white
        link.linecolor.g = self.darkMode ? 0.25 : 0.89;
        link.linecolor.b = self.darkMode ? 0.25 : 0.89;
      }
    });
    self.arrow.material.color.setRGB(red, blue, green);

    //hilight  edges within distance

    // const withinEdges = self.getEdgeWithinDist(mindist,maxdist)

    // for (var i = 0; i < withinEdges.length; i++) {
    //   withinEdges[i].linecolor.r = red;
    //   withinEdges[i].linecolor.g = blue;
    //   withinEdges[i].linecolor.b = green;
    // }
    // self.arrow.material.color.setRGB(red, blue, green);
  };

  // highlight edges selected in degree-degree plot
  self.highlightEdgeInDegreePlot = function (edges) {
    let red = new THREE.Color(appState.graph.edges.color).r;
    let blue = new THREE.Color(appState.graph.edges.color).g;
    let green = new THREE.Color(appState.graph.edges.color).b;
    //fisrt dehighlight all the edges
    self.lineIndices.forEach(function (link) {
      edges.forEach(function (edge) {
        if (
          (link.source.id === edge.source.id &&
            link.target.id === edge.target.id) ||
          (link.target.id === edge.source.id &&
            link.source.id === edge.target.id)
        ) {
          console.log("test", red, blue, green);
          link.linecolor.r = red;
          link.linecolor.g = blue;
          link.linecolor.b = green;
        } else {
          console.log("test2", link);
          link.linecolor.r = self.darkMode ? 0.25 : 0.89; //black/white
          link.linecolor.g = self.darkMode ? 0.25 : 0.89;
          link.linecolor.b = self.darkMode ? 0.25 : 0.89;
        }
      });
      // if (edges.indexOf(link) !== -1) {
      //   // if the edge is in the selected edges
      //   link.linecolor.r = red;
      //   link.linecolor.g = blue;
      //   link.linecolor.b = green;
      // } else {
      //   link.linecolor.r = self.darkMode ? 0.25 : 0.89; //black/white
      //   link.linecolor.g = self.darkMode ? 0.25 : 0.89;
      //   link.linecolor.b = self.darkMode ? 0.25 : 0.89;
      // }
    });
    self.arrow.material.color.setRGB(red, blue, green);
  };

  // highlight interset nodes of the selection sets with lower transparency, nodes within selection are with lower transparency
  self.updateSelectionInterOpacity = function () {
    // if()
    if (self.selection.length > 0) {
      if (self.selection.length == 1 && appState.graph.colorByDistance) {
        const calDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
          var p = 0.017453292519943295; // Math.PI / 180
          var c = Math.cos;
          var a =
            0.5 -
            c((lat2 - lat1) * p) / 2 +
            (c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;

          return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
        };
        var sumOfAllDistance = 0;
        var n = 0;
        var max = 0;
        self.graph.forEachNode((n) => {
          var dist = calDistanceFromLatLonInKm(
            n.data.ref.LatY,
            n.data.ref.LonX,
            self.selection[0].data.ref.LatY,
            self.selection[0].data.ref.LonX
          );
          if (dist > max) {
            max = dist;
          }
        });
        self.graph.forEachNode((n) => {
          // self.colorNodeColor(n, "#0000FF");
          var dist = calDistanceFromLatLonInKm(
            n.data.ref.LatY,
            n.data.ref.LonX,
            self.selection[0].data.ref.LatY,
            self.selection[0].data.ref.LonX
          );
          console.log(
            n.data.ref.LatY,
            n.data.ref.LonX,
            self.selection[0]["LatY"],
            self.selection[0]["LatX"]
          );
          self.colorNode(n, 0x0000ff);
          if (dist == 0) {
            self.colorNodeOpacity(n, 1);
          } else if (dist < max / 4) {
            self.colorNodeOpacity(n, 0.2);
          } else if (dist < (2 * max) / 4) {
            self.colorNodeOpacity(n, 0.4);
          } else if (dist < (3 * max) / 4) {
            self.colorNodeOpacity(n, 0.6);
          } else {
            self.colorNodeOpacity(n, 0.8);
          }
        });
      } else {
        // self.colorNodeEdge(null);    // this is to highlight all
        //hilight within edges
        let red = new THREE.Color(appState.graph.edges.color).r;
        let blue = new THREE.Color(appState.graph.edges.color).g;
        let green = new THREE.Color(appState.graph.edges.color).b;
        if (appState.graph.mapClickedArray.length > 0) {
          const mapClickedArraryID = appState.graph.mapClickedArray.map(
            (n) => n.id
          );
          const interSetNodesID = appState.graph.interSetNodes.map((n) => n.id);
          // const selectionID = appState.graph.selectedSets.map(n => n.id)
          self.lineIndices.forEach(function (link) {
            if (
              (interSetNodesID.indexOf(link.source.id) !== -1 &&
                mapClickedArraryID.indexOf(link.target.id) !== -1) ||
              (interSetNodesID.indexOf(link.target.id) !== -1 &&
                mapClickedArraryID.indexOf(link.source.id) !== -1)
            ) {
              link.linecolor.r = red;
              link.linecolor.g = blue;
              link.linecolor.b = green;
            } else {
              link.linecolor.r = self.darkMode ? 0.25 : 0.89; //black/white
              link.linecolor.g = self.darkMode ? 0.25 : 0.89;
              link.linecolor.b = self.darkMode ? 0.25 : 0.89;
            }
          });
        } else {
          //dehighlight all the edges, when perform intersection between drag selected sets but not between egocentric networks
          self.lineIndices.forEach(function (link) {
            link.linecolor.r = self.darkMode ? 0.25 : 0.89; //black/white
            link.linecolor.g = self.darkMode ? 0.25 : 0.89;
            link.linecolor.b = self.darkMode ? 0.25 : 0.89;
          });
        }
        self.arrow.material.color.setRGB(red, blue, green);

        self.graph.forEachNode((n) => {
          //fisrt dehighlight all the nodes
          self.colorNodeOpacity(n, 0.2);
        });
        //slightly highlight nodes in selection
        for (var i = 0; i < appState.graph.selectedNodes.length; i++) {
          self.colorNodeOpacity(appState.graph.selectedNodes[i], 0.5);
        }

        //highlight nodes in intersection
        for (var i = 0; i < appState.graph.interSetNodes.length; i++) {
          self.colorNodeOpacity(appState.graph.interSetNodes[i], 1);
        }
      }
    } else {
      //when no nodes are selected, all 1 opacity
      self.graph.forEachNode((n) => {
        self.colorNodeOpacity(n, 1);
      });
      self.colorNodeEdge(null);
    }
  };

  // highlight common nodes of the selection sets with lower transparency, nodes within selection are highlighted
  self.updateSelectionCommonOpacity = function () {
    // if()
    if (self.selection.length > 0) {
      if (self.selection.length == 1 && appState.graph.colorByDistance) {
        const calDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
          var p = 0.017453292519943295; // Math.PI / 180
          var c = Math.cos;
          var a =
            0.5 -
            c((lat2 - lat1) * p) / 2 +
            (c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;

          return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
        };
        var sumOfAllDistance = 0;
        var n = 0;
        var max = 0;
        self.graph.forEachNode((n) => {
          var dist = calDistanceFromLatLonInKm(
            n.data.ref.LatY,
            n.data.ref.LonX,
            self.selection[0].data.ref.LatY,
            self.selection[0].data.ref.LonX
          );
          if (dist > max) {
            max = dist;
          }
        });
        self.graph.forEachNode((n) => {
          // self.colorNodeColor(n, "#0000FF");
          var dist = calDistanceFromLatLonInKm(
            n.data.ref.LatY,
            n.data.ref.LonX,
            self.selection[0].data.ref.LatY,
            self.selection[0].data.ref.LonX
          );
          console.log(
            n.data.ref.LatY,
            n.data.ref.LonX,
            self.selection[0]["LatY"],
            self.selection[0]["LatX"]
          );
          self.colorNode(n, 0x0000ff);
          if (dist == 0) {
            self.colorNodeOpacity(n, 1);
          } else if (dist < max / 4) {
            self.colorNodeOpacity(n, 0.2);
          } else if (dist < (2 * max) / 4) {
            self.colorNodeOpacity(n, 0.4);
          } else if (dist < (3 * max) / 4) {
            self.colorNodeOpacity(n, 0.6);
          } else {
            self.colorNodeOpacity(n, 0.8);
          }
        });
      } else {
        self.graph.forEachNode((n) => {
          //fisrt dehighlight all the nodes
          self.colorNodeOpacity(n, 0.2);
        });
        // self.colorNodeEdge(null);    // this is to highlight all

        // //fisrt dehighlight all the edges
        // self.lineIndices.forEach(function (link) {
        //   link.linecolor.r = self.darkMode ? 0.25 : 0.89; //black/white
        //   link.linecolor.g = self.darkMode ? 0.25 : 0.89;
        //   link.linecolor.b = self.darkMode ? 0.25 : 0.89;
        // })

        //hilight within edges
        let red = new THREE.Color(appState.graph.edges.color).r;
        let blue = new THREE.Color(appState.graph.edges.color).g;
        let green = new THREE.Color(appState.graph.edges.color).b;
        // const withinEdges = self.getEdgeWithinOutSelection(self.selection)

        //fisrt dehighlight all the edges
        const commonSetNodesID = appState.graph.commonSetNodes.map((n) => n.id);
        const selectionID = self.selection.map((n) => n.id);
        self.lineIndices.forEach(function (link) {
          if (
            (commonSetNodesID.indexOf(link.source.id) !== -1 &&
              selectionID.indexOf(link.target.id) !== -1) ||
            (commonSetNodesID.indexOf(link.target.id) !== -1 &&
              selectionID.indexOf(link.source.id) !== -1)
          ) {
            link.linecolor.r = red;
            link.linecolor.g = blue;
            link.linecolor.b = green;
          } else {
            link.linecolor.r = self.darkMode ? 0.25 : 0.89; //black/white
            link.linecolor.g = self.darkMode ? 0.25 : 0.89;
            link.linecolor.b = self.darkMode ? 0.25 : 0.89;
          }
        });

        // for (var i = 0; i < withinEdges.length; i++) {
        //   withinEdges[i].linecolor.r = red;
        //   withinEdges[i].linecolor.g = blue;
        //   withinEdges[i].linecolor.b = green;
        // }
        self.arrow.material.color.setRGB(red, blue, green);

        //slightly highlight common nodes
        for (var i = 0; i < appState.graph.commonSetNodes.length; i++) {
          // slightly highlight neighbors
          // const neighborNodes = self.getNeighborNodesFromGraph(self.selection[i])
          // for (var i = 0; i < neighborNodes.length; i++) {
          //   self.colorNodeOpacity(neighborNodes[i], 0.5);
          // }
          //fully highlight nodes
          self.colorNodeOpacity(appState.graph.commonSetNodes[i], 0.5);
        }

        //highlight nodes in selections
        for (var i = 0; i < self.selection.length; i++) {
          // slightly highlight neighbors
          // const neighborNodes = self.getNeighborNodesFromGraph(self.selection[i])
          // for (var i = 0; i < neighborNodes.length; i++) {
          //   self.colorNodeOpacity(neighborNodes[i], 0.5);
          // }
          //fully highlight nodes
          self.colorNodeOpacity(self.selection[i], 1);
        }
      }
    } else {
      //when no nodes are selected, all 1 opacity
      self.graph.forEachNode((n) => {
        self.colorNodeOpacity(n, 1);
      });
      self.colorNodeEdge(null);
    }
  };

  //highlight map selected nodes: highlight nodes and edges branching out from selection and neighbor nodes of the selection with lower transparency
  self.updateSelectionOutOpacity = function () {
    // if()
    if (self.selection.length > 0) {
      if (self.selection.length == 1 && appState.graph.colorByDistance) {
        const calDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
          var p = 0.017453292519943295; // Math.PI / 180
          var c = Math.cos;
          var a =
            0.5 -
            c((lat2 - lat1) * p) / 2 +
            (c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;

          return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
        };
        var sumOfAllDistance = 0;
        var n = 0;
        var max = 0;
        self.graph.forEachNode((n) => {
          var dist = calDistanceFromLatLonInKm(
            n.data.ref.LatY,
            n.data.ref.LonX,
            self.selection[0].data.ref.LatY,
            self.selection[0].data.ref.LonX
          );
          if (dist > max) {
            max = dist;
          }
        });
        self.graph.forEachNode((n) => {
          // self.colorNodeColor(n, "#0000FF");
          var dist = calDistanceFromLatLonInKm(
            n.data.ref.LatY,
            n.data.ref.LonX,
            self.selection[0].data.ref.LatY,
            self.selection[0].data.ref.LonX
          );
          console.log(
            n.data.ref.LatY,
            n.data.ref.LonX,
            self.selection[0]["LatY"],
            self.selection[0]["LatX"]
          );
          self.colorNode(n, 0x0000ff);
          if (dist == 0) {
            self.colorNodeOpacity(n, 1);
          } else if (dist < max / 4) {
            self.colorNodeOpacity(n, 0.2);
          } else if (dist < (2 * max) / 4) {
            self.colorNodeOpacity(n, 0.4);
          } else if (dist < (3 * max) / 4) {
            self.colorNodeOpacity(n, 0.6);
          } else {
            self.colorNodeOpacity(n, 0.8);
          }
        });
      } else {
        self.graph.forEachNode((n) => {
          //fisrt dehighlight all the nodes
          self.colorNodeOpacity(n, 0.2);
        });
        // self.colorNodeEdge(null);    // this is to highlight all

        //fisrt dehighlight all the edges
        self.lineIndices.forEach(function (link) {
          link.linecolor.r = self.darkMode ? 0.25 : 0.89; //black/white
          link.linecolor.g = self.darkMode ? 0.25 : 0.89;
          link.linecolor.b = self.darkMode ? 0.25 : 0.89;
        });

        //hilight within edges
        let red = new THREE.Color(appState.graph.edges.color).r;
        let blue = new THREE.Color(appState.graph.edges.color).g;
        let green = new THREE.Color(appState.graph.edges.color).b;
        const withinEdges = self.getEdgeWithinOutSelection(self.selection);

        for (var i = 0; i < withinEdges.length; i++) {
          withinEdges[i].linecolor.r = red;
          withinEdges[i].linecolor.g = blue;
          withinEdges[i].linecolor.b = green;
        }
        self.arrow.material.color.setRGB(red, blue, green);

        const allneighbors = withinEdges
          .map((e) => e.source)
          .concat(withinEdges.map((e) => e.target));
        for (var i = 0; i < allneighbors.length; i++) {
          // slightly highlight neighbors
          // const neighborNodes = self.getNeighborNodesFromGraph(self.selection[i])
          // for (var i = 0; i < neighborNodes.length; i++) {
          //   self.colorNodeOpacity(neighborNodes[i], 0.5);
          // }
          //fully highlight nodes
          self.colorNodeOpacity(allneighbors[i], 0.5);
        }

        for (var i = 0; i < self.selection.length; i++) {
          // slightly highlight neighbors
          // const neighborNodes = self.getNeighborNodesFromGraph(self.selection[i])
          // for (var i = 0; i < neighborNodes.length; i++) {
          //   self.colorNodeOpacity(neighborNodes[i], 0.5);
          // }
          //fully highlight nodes
          self.colorNodeOpacity(self.selection[i], 1);
        }
      }
    } else {
      //when no nodes are selected, all 1 opacity
      self.graph.forEachNode((n) => {
        self.colorNodeOpacity(n, 1);
      });
      self.colorNodeEdge(null);
    }
  };

  //highlight clicked nodes and their neighbors
  self.highlightClickArrayNode = function (nodearray) {
    if (nodearray.length > 0) {
      self.graph.forEachNode((n) => {
        //fisrt dehighlight all the nodes
        self.colorNodeOpacity(n, 0.2);
      });
      //   // self.colorNodeEdge(null);    // this is to highlight all

      //   //fisrt dehighlight all the edges
      //   self.lineIndices.forEach(function (link) {
      //     link.linecolor.r = self.darkMode ? 0.25 : 0.89; //black/white
      //     link.linecolor.g = self.darkMode ? 0.25 : 0.89;
      //     link.linecolor.b = self.darkMode ? 0.25 : 0.89;
      //   })

      //   //hilight neighbor edges
      //   let red = new THREE.Color(appState.graph.edges.color).r;
      //   let blue = new THREE.Color(appState.graph.edges.color).g;
      //   let green = new THREE.Color(appState.graph.edges.color).b;
      //   const withinEdges = node.linkObjs

      //   for (var i = 0; i < withinEdges.length; i++) {
      //     withinEdges[i].linecolor.r = red;
      //     withinEdges[i].linecolor.g = blue;
      //     withinEdges[i].linecolor.b = green;
      //   }
      //   self.arrow.material.color.setRGB(red, blue, green);

      //highlight nodes
      nodearray.forEach((node) => {
        const neighborNodes = self.getNeighborNodesFromGraph(node);
        for (var i = 0; i < neighborNodes.length; i++) {
          self.colorNodeOpacity(neighborNodes[i], 1);
        }
        self.colorNodeArrayEdge(nodearray);
      });

      // } else {        //when no nodes are given, all 1 opacity
      //   self.graph.forEachNode(n => {
      //     self.colorNodeOpacity(n, 1);

      //   });
      //   self.colorNodeEdge(null);
      // }

      // self.highlightNode(node, true);
      // node.renderData.textHolder.children[0].element.hideme = false;
    }
  };

  //highlight a single clicked node and its neighbor edges only
  self.highlightClickNode = function (node) {
    if (node) {
      self.graph.forEachNode((n) => {
        //fisrt dehighlight all the nodes
        self.colorNodeOpacity(n, 0.2);
      });
      //   // self.colorNodeEdge(null);    // this is to highlight all

      //   //fisrt dehighlight all the edges
      //   self.lineIndices.forEach(function (link) {
      //     link.linecolor.r = self.darkMode ? 0.25 : 0.89; //black/white
      //     link.linecolor.g = self.darkMode ? 0.25 : 0.89;
      //     link.linecolor.b = self.darkMode ? 0.25 : 0.89;
      //   })

      //   //hilight neighbor edges
      //   let red = new THREE.Color(appState.graph.edges.color).r;
      //   let blue = new THREE.Color(appState.graph.edges.color).g;
      //   let green = new THREE.Color(appState.graph.edges.color).b;
      //   const withinEdges = node.linkObjs

      //   for (var i = 0; i < withinEdges.length; i++) {
      //     withinEdges[i].linecolor.r = red;
      //     withinEdges[i].linecolor.g = blue;
      //     withinEdges[i].linecolor.b = green;
      //   }
      //   self.arrow.material.color.setRGB(red, blue, green);

      //highlight nodes
      const neighborNodes = self.getNeighborNodesFromGraph(node);
      for (var i = 0; i < neighborNodes.length; i++) {
        self.colorNodeOpacity(neighborNodes[i], 1);
      }

      // } else {        //when no nodes are given, all 1 opacity
      //   self.graph.forEachNode(n => {
      //     self.colorNodeOpacity(n, 1);

      //   });
      //   self.colorNodeEdge(null);
      // }

      // self.highlightNode(node, true);
      // node.renderData.textHolder.children[0].element.hideme = false;
      self.colorNodeEdge(node);
    }
  };

  self.getNeighborNodesFromGraph = function (node) {
    const nodeNeighbor = [];
    const froms = [];
    const tos = [];
    if (!node) return;
    for (var i = 0; i < node.links.length; i++) {
      froms.push(node.links[i].fromId);
      tos.push(node.links[i].toId);
    }
    self.graph.forEachNode((n) => {
      if (froms.indexOf(n.id) != -1 || tos.indexOf(n.id) != -1) {
        nodeNeighbor.push(n);
      }
    });
    return nodeNeighbor;
  };

  // get only neighbors from a set of nodes, exclude selected nodes, only neighbors
  self.getOnlyNeighborNodesFromGraph = function (nodes) {
    const nodeNeighbor = [];
    const froms = [];
    const tos = [];
    if (nodes.length < 1) return;
    for (var i = 0; i < node.links.length; i++) {
      froms.push(node.links[i].fromId);
      tos.push(node.links[i].toId);
    }
    self.graph.forEachNode((n) => {
      if (froms.indexOf(n.id) != -1 || tos.indexOf(n.id) != -1) {
        nodeNeighbor.push(n);
      }
    });
    return nodeNeighbor;
  };

  /**
   *  Update positions of all objects in self.selection
   *  based on diff between mouse position and self.dragging position
   */
  self.updateSelection = function (mouseX, mouseY, selection) {
    if (self.dragging) {
      var diffx = mouseX - self.dragging.x;
      var diffy = mouseY - self.dragging.y;
    }

    //'selection' only passed if a single node is double clicked
    let clickedNode = selection;
    //if not already pinned, then pin the node upon double-click
    if (clickedNode && !clickedNode.pinnedx) {
      clickedNode.pinnedx = true;
      clickedNode.pinnedy = true;
      appState.graph.mapClicked = clickedNode;
      self.highlightNode(clickedNode, true);
      self.highlightEdges(clickedNode, true);
      const neighborNodes = self.getNeighborNodesFromGraph(clickedNode);
      self.selection = neighborNodes;
      // console.log(self.selection)
    } else if (clickedNode && clickedNode.pinnedx) {
      //if already pinned, then unpin upon double-click
      clickedNode.pinnedx = false;
      clickedNode.pinnedy = false;
      appState.graph.mapClicked = null;

      self.selection = [];
    }

    // if(self.selection.length!==0){
    //   self.graph.forEachNode(n => {
    //     self.colorNodeOpacity(n, 0.2);
    //   });
    // }else{
    //   self.graph.forEachNode(n => {
    //     self.colorNodeOpacity(n, 1);
    //   });
    // }

    for (var i = 0; i < self.selection.length; i++) {
      if (self.dragging) {
        self.selection[i].x += diffx;
        self.selection[i].y += diffy;
        self.selection[i].fx = self.selection[i].x;
        self.selection[i].fy = self.selection[i].y;
        //pins multiple nodes when dragging
        if (!clickedNode) {
          self.selection[i].pinnedx = true;
          self.selection[i].pinnedy = true;
        }
      }
      if (!def.NODE_NO_HIGHLIGHT) {
        self.selection[i].renderData.draw_object.children[0].visible = true;
      } else {
        self.selection[i].renderData.draw_object.material.color.set(
          new THREE.Color(self.selection[i].renderData.color)
        );
        // self.colorNodeOpacity(self.selection[i], 1);
      }
      self.selection[
        i
      ].renderData.textHolder.children[0].element.hideme = false;
    }
  };

  /**
   *  Find any objects within the current box selection and add it to self.selection
   */
  self.checkSelection = function (mouseX, mouseY) {
    if (!self.dragging) {
      self.mouseEnd = new THREE.Vector3(mouseX, mouseY, 0);
      if (self.mouseStart.x < self.mouseEnd.x) {
        var left = self.mouseStart;
        var right = self.mouseEnd;
      } else {
        var left = self.mouseEnd;
        var right = self.mouseStart;
      }

      self.graph.forEachNode(function (node) {
        let npos;
        if (self.options.layout == "ngraph") {
          npos = self.force.getNodePosition(node.id);
        } else if (self.options.layout == "d3") {
          npos = node;
        }
        if (self.insideBox(left, right, npos.x, npos.y)) {
          self.selection.push(node);
          //indicates nodes were in selection box
          //when mouse is lifted
          //self.multNodesHighlighted = true;
        }
      });
    }
  };

  /**
   *  returns true if pos is in box with top left l and bottom right r
   */
  self.insideBox = function (l, r, posx, posy) {
    return (
      posx < r.x &&
      posx > l.x &&
      ((posy > r.y && posy < l.y) || (posy < r.y && posy > l.y))
    );
  };
};
