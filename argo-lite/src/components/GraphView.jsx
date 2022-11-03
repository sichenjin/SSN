import ScatterPlot from "./panels/ScatterPlot"

import SidebarMenu from 'react-bootstrap-sidebar-menu';
import React from "react";

import { Tab2, Tabs2, Tag } from "@blueprintjs/core";
import NodesPanel from "./panels/NodesPanel";
import EdgesPanel from "./panels/EdgesPanel";
import LabelsPanel from "./panels/LabelsPanel";
import NodesFilterPanel from "./panels/NodesFilterPanel";

class GraphView extends React.Component {
  openGraphTab(tabName) {
    var i;
    var x = document.getElementsByClassName("graphtab");
    for (i = 0; i < x.length; i++) {
      x[i].style.display = "none";
    }
    document.getElementById(tabName).style.display = "block";
  }

  render() {
    return appState.graph.frame && (
      <div>
        <div >
          <div class="w3-bar w3-black">
            <button class="w3-bar-item w3-button" onClick={this.openGraphTab.bind(this, "scatterplottab")}>ScatterPlot</button>
            <button class="w3-bar-item w3-button" onClick={this.openGraphTab.bind(this, "histogramtab")}>Histogram</button>
          </div>
          <div id="scatterplottab" class="graphtab">

            <div id="scatter-plot">
              {appState.graph.hasGraph && appState.graph.frame && appState.graph.rawGraph.nodes[0].degree !== undefined && < ScatterPlot />}


            </div>

          </div>
          <div id="histogramtab" class="graphtab" style={{ display: "None" }}>

          </div>
        </div>
      </div>
    );
  }
}

export default GraphView;