import React from "react";
import { observer } from "mobx-react";
import classnames from "classnames";
import {
  Button,
  Classes,
  FocusStyleManager,
  NonIdealState
} from "@blueprintjs/core";
import Dialogs from "./components/Dialogs";
import NavbarSelector from "./components/Navbar";
// import ComDetection from './components/ComDetection'
import WorkspaceView from "./components/WorkspaceView";
import appState from "./stores/index";
import ThreeJSVis from "./visualizers/ThreeJSVis";
import MapView from "./visualizers/MapView";
import FloatingCards from "./components/FloatingCards";
import registerIPC from "./ipc/client";
import { fetchWorkspaceProjects } from "./ipc/client";
import { MOBILE_WIDTH_CUTOFF, MOBILE_HEIGHT_CUTOFF } from "./constants";
// import ScatterPlot from "./components/panels/ScatterPlot"
import SelectionDetail from "./components/panels/SelectionDetail";
// import Sidebar from "./components/Sidebar"
import { Tag , Switch} from "@blueprintjs/core";
// import GraphView from "./components/GraphView";

import keydown, { Keys } from "react-keydown";
import 'leaflet/dist/leaflet.css';

import { useEffect } from "react";
import axios from 'axios'

import ScatterPlot from "./components/panels/ScatterPlot";

import Sidebar from "./components/Sidebar"

registerIPC();
FocusStyleManager.onlyShowFocusOnTabs();

fetchWorkspaceProjects();

appState.preferences.loadUserConfig();

const { DELETE, BACKSPACE, P, U } = Keys;

// Respond to window resize, also triggered after frame is loaded.
function respondToResize() {
  if (!appState.graph.frame) {
    window.setTimeout(respondToResize, 1000);
    return;
  }
  if (window.innerWidth < MOBILE_WIDTH_CUTOFF || window.innerHeight < MOBILE_HEIGHT_CUTOFF) {
    appState.preferences.turnOnMinimalMode();
  }
  // appState.graph.setUpFrame();
}

respondToResize();

window.addEventListener('resize', respondToResize);

@keydown
@observer
class App extends React.Component {



  componentWillReceiveProps({ keydown }) {
    if (keydown.event) {
      if (keydown.event.which === DELETE || keydown.event.which === BACKSPACE) {
        if (appState && appState.graph && appState.graph.frame) {
          appState.graph.hideNodes(appState.graph.frame.getSelectedIds());
          this.forceUpdate();
        }
      } else if (keydown.event.which === P) {
        if (appState && appState.graph && appState.graph.frame) {
          appState.graph.frame.pinSelectedNodes();
        }
      } else if (keydown.event.which === U) {
        if (appState && appState.graph && appState.graph.frame) {
          appState.graph.frame.unpinSelectedNodes();
        }
      }
    }
  }
  render() {
    document.addEventListener('DOMContentLoaded', function () {
      // Query the element
      const resizer = document.getElementById('dragMeUp');
      const leftSide = resizer.previousElementSibling;
      const rightSide = resizer.nextElementSibling;

      // The current position of mouse
      let x = 0;
      let y = 0;
      let upHeight = 0;

      // Handle the mousedown event
      // that's triggered when user drags the resizer
      const mouseDownHandler = function (e) {
        // Get the current mouse position
        x = e.clientX;
        y = e.clientY;
        upHeight = leftSide.getBoundingClientRect().height;

        // Attach the listeners to `document`
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
      };

      const mouseMoveHandler = function (e) {
        // How far the mouse has been moved
        const dx = e.clientX - x;
        const dy = e.clientY - y;

        const newLeftHeight = ((upHeight + dy) * 100) / resizer.parentNode.getBoundingClientRect().height;
        leftSide.style.height = `${newLeftHeight}%`;

        resizer.style.cursor = 'col-resize';
        document.body.style.cursor = 'col-resize';

        leftSide.style.userSelect = 'none';
        leftSide.style.pointerEvents = 'none';

        rightSide.style.userSelect = 'none';
        rightSide.style.pointerEvents = 'none';
      };

      const mouseUpHandler = function () {
        resizer.style.removeProperty('cursor');
        document.body.style.removeProperty('cursor');

        leftSide.style.removeProperty('user-select');
        leftSide.style.removeProperty('pointer-events');

        rightSide.style.removeProperty('user-select');
        rightSide.style.removeProperty('pointer-events');

        // Remove the handlers of `mousemove` and `mouseup`
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
      };

      // Attach the handler
      resizer.addEventListener('mousedown', mouseDownHandler);
    });
    document.addEventListener('DOMContentLoaded', function () {
      // Query the element
      const resizer = document.getElementById('dragMe');
      const leftSide = resizer.previousElementSibling;
      const rightSide = resizer.nextElementSibling;

      // The current position of mouse
      let x = 0;
      let y = 0;
      let leftWidth = 0;

      // Handle the mousedown event
      // that's triggered when user drags the resizer
      const mouseDownHandler = function (e) {
        // Get the current mouse position
        x = e.clientX;
        y = e.clientY;
        leftWidth = leftSide.getBoundingClientRect().width;

        // Attach the listeners to `document`
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
      };

      const mouseMoveHandler = function (e) {
        // How far the mouse has been moved
        const dx = e.clientX - x;
        const dy = e.clientY - y;

        const newLeftWidth = ((leftWidth + dx) * 100) / resizer.parentNode.getBoundingClientRect().width;
        leftSide.style.width = `${newLeftWidth}%`;

        resizer.style.cursor = 'col-resize';
        document.body.style.cursor = 'col-resize';

        leftSide.style.userSelect = 'none';
        leftSide.style.pointerEvents = 'none';

        rightSide.style.userSelect = 'none';
        rightSide.style.pointerEvents = 'none';
      };

      const mouseUpHandler = function () {
        resizer.style.removeProperty('cursor');
        document.body.style.removeProperty('cursor');

        leftSide.style.removeProperty('user-select');
        leftSide.style.removeProperty('pointer-events');

        rightSide.style.removeProperty('user-select');
        rightSide.style.removeProperty('pointer-events');

        // Remove the handlers of `mousemove` and `mouseup`
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
      };

      // Attach the handler
      resizer.addEventListener('mousedown', mouseDownHandler);
    });

    return (
      <div className={classnames({
        "app-wrapper": true,
      })} style={{ display: "flex" }}>
        <div>
          <NavbarSelector />
        </div>
        <div class="container" style={{ paddingTop: "5vh", maxWidth: "100vw", height: "100%" }}>
          <div class="container" style={{ height: "100%" }}>
            <Sidebar />
            {/* {appState.graph.hasGraph && <ComDetection />} */}
            <div class="outer-container">
              <div class="container-up container">
                <div class="container__left">
                  {appState.graph.hasGraph && <Tag className="network-tag">Network</Tag>}
                  <main className="main">
                    {(appState.graph.hasGraph && (!appState.import.loading)) ? (
                      <ThreeJSVis />
                    ) : (
                      <WorkspaceView />
                    )}
                  </main>
                  {/* {appState.graph.hasGraph && <FloatingCards />} */}
                  <Dialogs />
                </div>
                <div class="resizer" id="dragMe"></div>
                <div> {appState.graph.selectedNodes.length === 0 && appState.graph.degreeselection.length===0 ? (
                  <div></div>
                ) : (
                  
                  <div>
                    <Switch style={{ position: 'fixed', top: '54vh', left: '97vw', zIndex: '1000' }}
                      defaultChecked={appState.graph.backNodeShow}
                      // checked={!node.isHidden}
                      onChange={(value) => {
                        appState.graph.backNodeShow = value.target.checked

                      }}
                    />
                    <span style={{ fontSize: '12px', position: 'fixed', top: '54vh', right: '4vw', zIndex: '1000' }}> Show Background Nodes</span>
                  </div>
                )}
                </div>
                <div> {appState.graph.selectedNodes.length === 0 ? (
                  <div></div>
                ) : (
                  
                  <div>
                    <Switch style={{ position: 'fixed', top: '54vh', right: '47vw', zIndex: '1000' }}
                      defaultChecked={appState.graph.pickUpAlter}
                      // checked={!node.isHidden}
                      onChange={(value) => {
                        appState.graph.pickUpAlter = value.target.checked
                        if(appState.graph.pickUpAlter){
                          appState.graph.frame.updateSelectionOutOpacity();
                        }else{
                          appState.graph.frame.updateSelectionOpacity();
                        }

                      }}
                    />
                    <span style={{ fontSize: '12px', position: 'fixed', top: '54vh', right: '40vw', zIndex: '1000' }}> Pick Up Alters</span>
                  </div>
                )}
                </div>
                <div class="container__right">
                  {(appState.graph.hasGraph && (!appState.import.loading)) ? (
                    <MapView />
                  ) : (
                    <WorkspaceView />
                  )}
                  {/* <h3>{this.mss}</h3> */}
                </div>
              </div>
              <div class="resizer-up" id="dragMeUp"></div>
              <div class="container-down container" id="scatter">
                <div style={{
                  display: "flex", height: "100%", width: '40vw'
                  // border:'#C0C0C0',
                  // borderStyle:'solid',
                  // flex:"1 1 50%"
                }}>
                  {appState.graph.frame && <SelectionDetail />}
                </div>
                <div style={{
                  display: "flex", height: "100%",
                  // border:'#C0C0C0',
                  // borderStyle:'solid',
                  // flex:"1 1 50%"
                }}>
                  {/* {appState.graph.hasGraph && <GraphView />} */}
                  <div id="scatter-plot">
                    {appState.graph.hasGraph && appState.graph.frame && appState.graph.rawGraph.nodes[0].degree !== undefined && < ScatterPlot />}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    );
  }
}

export default App;