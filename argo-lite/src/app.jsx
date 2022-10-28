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
import Navbar from "./components/Navbar";
import ComDetection from './components/ComDetection'
import WorkspaceView from "./components/WorkspaceView";
import appState from "./stores/index";
import ThreeJSVis from "./visualizers/ThreeJSVis";
import MapView from "./visualizers/MapView";
import FloatingCards from "./components/FloatingCards";
import ScatterPlot from "./components/panels/ScatterPlot"
import SelectionDetail from "./components/panels/SelectionDetail";
import registerIPC from "./ipc/client";
import { fetchWorkspaceProjects } from "./ipc/client";
import { MOBILE_WIDTH_CUTOFF, MOBILE_HEIGHT_CUTOFF } from "./constants";

import keydown, { Keys } from "react-keydown";
import 'leaflet/dist/leaflet.css';

import { useEffect } from "react";
import axios from 'axios'

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


    return (
      <div className={classnames({
        "app-wrapper": true,
        [Classes.DARK]: appState.preferences.darkMode
      })}>
         <Navbar />
         {appState.graph.hasGraph && <ComDetection />}
        

        <div className="graph">
         
          <main className="main">
            {appState.graph.hasGraph ? (
              <ThreeJSVis />
            ) : (
                <WorkspaceView />
              )}
            
          </main>
          {appState.graph.hasGraph && <FloatingCards />}
          <Dialogs />
        </div>

        {appState.graph.hasGraph ? (
            <MapView />
          ) : (
              <WorkspaceView />
        )}
        <div  className= "scatter-overlay-card"
        style = {{ border:'#C0C0C0',
        borderStyle:'solid',}}>
        {appState.graph.hasGraph && appState.graph.frame && appState.graph.rawGraph.nodes[0].degree !== undefined && < ScatterPlot />}
          
        

        </div>

        {
           <SelectionDetail />
        }
       
      </div>
      
      
    );
  }
}

export default App;