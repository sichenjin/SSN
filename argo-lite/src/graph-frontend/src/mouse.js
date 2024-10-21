var def = require("./imports").default;
var THREE = def.THREE;
var Edge = def.Edge;
var Node = def.Node;
var OrbitControls = def.OrbitControls;
var d3 = def.d3;
var ee = def.ee;
var $ = require("jquery");
const { default: appState } = require("../../stores");

module.exports = function (self) {
  /**
   * Mouse move event that selections nodes in selection box
   */
  self.onMouseMove = function (selection, mouseX, mouseY, button, ctrl) {
    // check if left button is not down
    self.mouseX = mouseX;
    self.mouseY = mouseY;
    if (self.leftMouseDown && self.mouseDown) {
      appState.graph.mapClicked = null;
      appState.graph.areaSelected = undefined;
      // appState.graph.networkClicked = null

      // left-clicked empty space (i.e., not clicking a node)
      if (!self.dragging && self.selection.indexOf(selection) == -1 && !ctrl) {
        self.clearSelection();
        // appState.graph.mapClicked = null
        // appState.graph.degreeselection = []
        // appState.graph.degreebrushed = false
      }

      if (!self.dragging) {
        // add nodes enclosed by selection box into node selection
        self.checkSelection(mouseX, mouseY);
      }
    }

    if (self.selection.length > 0) {
      // reactivate (in D3's terminology: reheat) the force layout
      if (self.dragging) {
        self.force.alpha(1);
      }
      // update position of nodes in selection
      self.updateSelection(mouseX, mouseY);
      // console.log(self.selection)
      // console.log(appState.graph.selectedNodes)
      self.selection = self.uniqueArrayByAttribute(self.selection, "id");
    }

    if (!self.mouseDown) {
      // console.log("mouse up");
      self.onHover(selection);
      self.mouseStart = new THREE.Vector3(mouseX, mouseY, 0);
    } else {
      // if mouse is in minimap, do nothing else
      if (self.isMouseCoordinatesOnMinimap && self.mapShowing) {
        self.minimap.panToMousePosition(
          self.minimap.mouseX,
          self.minimap.mouseY
        );
        return;
      }

      // update selection box size/position
      if (self.leftMouseDown && !self.dragging) {
        if (self.showBox) {
          self.selectBox.visible = true;
          self.showBox = false;
        }
        self.selectBox.position.x = mouseX;
        self.selectBox.position.y = mouseY;
        var diffx = self.mouseStart.x - mouseX;
        var diffy = self.mouseStart.y - mouseY;
        self.selectBox.scale.set(diffx, diffy, 1);
      } else {
        self.selectBox.visible = false;
      }
    }
  };

  /**
   * Mouse hover over node event that highlights the node and neighbors at mouse position
   */
  self.onHover = function (node) {
    if (appState.graph.mapClicked) return;
    if (
      appState.graph.pathHovered &&
      appState.graph.pathHovered.pathnode.length > 0
    )
      return;
    if (self.selection.length > 0) return;
    if (self.lastHover && self.selection.indexOf(self.lastHover) == -1) {
      self.highlightNode(self.lastHover, false);
      self.lastHover.renderData.textHolder.children[0].element.hideme = true;
      self.highlightEdges(node, false);
    }
    self.lastHover = node;
    if (node) {
      // self.highlightNode(node, true);
      // node.renderData.textHolder.children[0].element.hideme = false;
      // self.highlightEdges(node, true);
      self.highlightClickNode(node);
      //set currently hovered node
      appState.graph.currentlyHovered = node;
    } else if (self.selection.length == 0) {
      self.graph.forEachNode((n) => {
        // console.log(n);
        // if n is the target/src node of any edge in appState.graph.edgeselection, highlight or change opacity
        // use node id to check if n is in appState.graph.edgeselection
        appState.graph.edgeselection.forEach((edge) => {
          if (edge.target == n.id || edge.source == n.id) {
            self.colorNodeOpacity(n, 1);
            self.highlightNode(n, false, def.ADJACENT_HIGHLIGHT);
            self.colorNodeEdge(n);
          }
        });
      });
      if (appState.graph.edgeselection.length == 0) {
        self.colorNodeEdge(null);
      }
      appState.graph.currentlyHovered = null;
    }
    // if (self.prevHighlights != undefined) {
    //   for (var i = 0; i < self.prevHighlights.length; i++) {
    //     self.colorNodeOpacity(self.prevHighlights[i], 1);
    //     self.highlightNode(self.prevHighlights[i], true, def.SEARCH_HIGHLIGHT);
    //   }
    // }
  };

  // vars to get time at mouse press and time at mouse release
  var startTime = 0;
  var endTime = 0;
  /**
   * Mouse down event to start a selection box or start dragging a node
   */
  self.onMouseDown = function (selection, mouseX, mouseY, button, ctrl) {
    // console.log("triggered")
    // if mouse is in minimap, do nothing else
    if (self.isMouseCoordinatesOnMinimap && self.mapShowing) {
      self.mouseDown = true;
      self.minimap.panToMousePosition(self.minimap.mouseX, self.minimap.mouseY);
      return;
    }

    self.leftMouseDown = true;
    if (self.leftMouseDown) {
      self.mouseDown = true;
      self.mouseStart = new THREE.Vector3(mouseX, mouseY, 0);
      if (button == 0 && !self.dragging) {
        self.showBox = true;
      }

      if (self.selection.indexOf(selection) == -1 && !ctrl) {
        for (var i = 0; i < self.selection.length; i++) {
          self.selection[i].renderData.isSelected = false;
          if (!def.NODE_NO_HIGHLIGHT) {
            self.selection[
              i
            ].renderData.draw_object.children[0].visible = false;
            // self.selection[
            //   i
            // ].renderData.draw_object.material.opacity = 0.2;
          } else {
            self.selection[i].renderData.draw_object.material.color.set(
              new THREE.Color(self.selection[i].renderData.color)
            );
          }
          self.selection[
            i
          ].renderData.textHolder.children[0].element.hideme = true;
          // self.selection[
          //   i
          // ].renderData.draw_object.material.opacity = 0.2;
        }
        self.selection = [];
      }

      if (selection) {
        //when any node is clicked, un-smartpause if smartpaused
        //appState.graph.smartPause.lastUnpaused = Date.now(); //old code using lastUnpaused
        appState.graph.smartPause.interactingWithGraph = true;
      }

      //captures click times to measure time distance between clicks
      oldStartTime = startTime;
      startTime = Date.now();

      //keeps track of time difference
      clickDifference = startTime - oldStartTime;

      //sets whether or not last click was
      //double click or not
      // console.log(clickDifference)
      if (clickDifference < 1500) {
        self.doubleClicked = true;
        console.log("doubleclicked");
        // console.log(selection)
      } else {
        self.doubleClicked = false;
        console.log(clickDifference);
      }

      //selects single node when dragged
      if (selection) {
        self.dragging = selection;
        if (self.selection.indexOf(selection) == -1) {
          self.selection.push(selection);

          selection.renderData.isSelected = false;
        }
      }

      //   if(self.selection.length == 1){

      //     appState.graph.mapClicked = self.selection[0]

      // }
      // console.log(selection)

      if (selection) {
        self.dragging = selection;
        //only pins node if double-clicked
        if (self.doubleClicked) {
          //passing in 'selection' node to pass information for node to pin
          // self.updateSelection(self.dragging.x, self.dragging.y, selection);
          // if(appState.graph.selectedNodes.indexOf(selection)){
          //   appState.graph.selectedNodes = appState.graph.selectedNodes.filter((obj) => obj.id !== selection.id);
          // }else {
          //   appState.graph.selectedNodes.push(selection)
          // }
        } else if (ctrl) {
          self.selection.splice(self.selection.indexOf(selection), 1);
          selection.renderData.isSelected = false;
          if (!def.NODE_NO_HIGHLIGHT) {
            selection.renderData.draw_object.children[0].visible = false;
            // selection.renderData.draw_object.material.opacity = 0.2;
          } else {
            selection.renderData.draw_object.material.color.set(
              new THREE.Color(self.selection[i].renderData.color)
            );
          }
          selection.renderData.textHolder.children[0].element.hideme = true;
          // selection.renderData.draw_object.material.opacity = 0.2;
          self.dragging = null;
        }
      } else {
        if (self.newNodeIds) {
          self.highlightNodeIds([], true);
          self.newNodeIds = undefined;
        }
      }
    }
  };

  self.areArraysIdentical = function (arr1, arr2) {
    if (arr1.length !== arr2.length) {
      return false; // If the lengths are different, the arrays can't be identical
    }

    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false; // If any elements differ, the arrays are not identical
      }
    }

    return true; // If all elements match, the arrays are identical
  };

  //unique by attribute for a list of dict
  self.uniqueArrayByAttribute = function (arr, attribute) {
    const uniqueMap = new Map();
    const result = [];

    arr.forEach((item) => {
      if (!uniqueMap.has(item[attribute])) {
        uniqueMap.set(item[attribute], true);
        result.push(item);
      }
    });

    return result;
  };

  /**
   * Mouse up event that closes selection flags and emits selection to Argo
   */
  self.onMouseUp = function (selection, mouseX, mouseY, button, ctrl) {
    endTime = Date.now();
    self.mouseDown = false;

    //when not clicking, nodes aren't being interacted with
    appState.graph.smartPause.interactingWithGraph = false;
    appState.graph.mapClicked = null;
    appState.graph.areaSelected = undefined;
    appState.graph.degreeselection = [];
    appState.graph.degreebrushed = false;
    appState.graph.highlightCommonNodes = false;
    appState.graph.showIntersect = false;
    if (appState.graph.pickUpAlter) {
      self.updateSelectionOutOpacity();
    } else {
      self.updateSelectionOpacity();
    }

    // self.lastTimeSelectionLength = self.selection.length
    //selection is the node when mouse is up on, self.selection are the nodes when brushed, slef.selectBox.visible can help tell if it is selected by dragging or click
    if (ctrl) {
      appState.graph.selectedSets.push(
        self.selection.slice(self.lastTimeSelectionLength)
      );
      self.lastTimeSelectionLength = self.selection.length;
    } else if (self.selectBox.visible) {
      // not ctrled but when dragging not clicking, then start a new set collection
      appState.graph.selectedSets = [];
      appState.graph.selectedSets.push(self.selection);
      self.lastTimeSelectionLength = self.selection.length;
    }

    if (selection && !self.selectBox.visible) {
      // when mouse up on one node while not dragging, the node is selected, add or remove the node to/from mapclickedarray and its neighbors to setSelected and do highlight
      const thenode = selection;

      //when double click, select / remove the single node from selection
      if (self.doubleClicked) {
        if (appState.graph.selectedNodes.indexOf(thenode) > 0) {
          //if in selection then remove
          appState.graph.selectedNodes = appState.graph.selectedNodes.filter(
            (obj) => obj.id !== thenode.id
          );
          //dehighlight self
          self.selection = appState.graph.selectedNodes;
          self.colorNodeOpacity(thenode, 0.2);
          self.decolorNodeEdge(thenode);
        } else {
          appState.graph.selectedNodes.push(thenode);
          self.selection = appState.graph.selectedNodes;
          //dehighlight self
          self.colorNodeOpacity(thenode, 1);
          self.changeSingleNodeColorEdge(thenode);
        }
      }

      //click to add ego-centric network to selection
      if (appState.graph.mapClickedArray.indexOf(thenode) < 0) {
        appState.graph.mapClickedArray.push(thenode);
        const thenodeneightbor = self.getNeighborNodesFromGraph(thenode);
        appState.graph.selectedSets.push(thenodeneightbor);
        // thenodeneightbor.forEach((n)=>{
        //   appState.graph.selectedNodes.push(n)
        // })
        appState.graph.selectedNodes =
          appState.graph.selectedNodes.concat(thenodeneightbor);
        // appState.graph.selectedNodes.push(...thenodeneightbor)
        appState.graph.selectedNodes = self.uniqueArrayByAttribute(
          appState.graph.selectedNodes,
          "id"
        );

        self.selection = appState.graph.selectedNodes;

        self.highlightClickArrayNode(appState.graph.mapClickedArray);
      } else {
        appState.graph.mapClickedArray = appState.graph.mapClickedArray.filter(
          (obj) => obj.id !== thenode.id
        );
        const toRemoveSets = self.getNeighborNodesFromGraph(thenode);
        appState.graph.selectedSets = appState.graph.selectedSets.filter(
          (nodeset) => !self.areArraysIdentical(nodeset, toRemoveSets)
        );
        let thenodeneighbors = [];
        appState.graph.mapClickedArray.forEach((mapClicked) => {
          const nodeneighbor = self.getNeighborNodesFromGraph(mapClicked);
          nodeneighbor.forEach((n) => {
            thenodeneighbors.push(n);
          });
          // thenodeneighbors.push(...nodeneighbor)
        });

        appState.graph.selectedNodes = self.uniqueArrayByAttribute(
          thenodeneighbors,
          "id"
        );
        self.selection = appState.graph.selectedNodes;

        self.highlightClickArrayNode(appState.graph.mapClickedArray);
      }

      // appState.graph.networkClicked = thenode
    }

    if (self.selection.length == 0) {
      appState.graph.mapClicked = null;
      appState.graph.mapClickedArray = [];
      appState.graph.selectedNodes = [];
      appState.graph.selectedSets = [];
      self.lastTimeSelectionLength = 0;
      appState.graph.commonSetNodes = [];
      appState.graph.interSetNodes = [];
      self.selection = [];
      appState.graph.areaSelected = undefined;
    }

    // if(self.selection.length>0){
    //   const tselection = self.selection.map(n=>n)
    //   appState.graph.selectedNodes = tselection
    // }

    // Left or right mouse button
    if (true) {
      self.showBox = false;
      self.dragging = null;
      self.selectBox.visible = false;

      self.ee.emit("select-nodes", self.selection);
      // self.ee.emit("select-edges", self.selection);
    }
  };

  /**
   * Right click event to save right clicked node
   */
  self.onRightClick = function (selection) {
    if (selection) {
      self.rightClickedNode = selection;
    } else {
      self.rightClickedNode = null;
    }
  };

  /**
   * Right click event that emits context menu event to Argo
   */
  self.onRightClickCoords = function (event) {
    // Don't show menu if dragging camera
    if (endTime - startTime < 200) {
      self.ee.emit("right-click", {
        pageX: event.pageX,
        pageY: event.pageY,
      });
    }
  };
};
