import SidebarMenu from 'react-bootstrap-sidebar-menu';
import React from "react";

import { Tab2, Tabs2, Tag } from "@blueprintjs/core";
import NodesPanel from "./panels/NodesPanel";
import EdgesPanel from "./panels/EdgesPanel";
import LabelsPanel from "./panels/LabelsPanel";
import NodesFilterPanel from "./panels/NodesFilterPanel";

class Sidebar extends React.Component {
    openCity(cityName) {
        var i;
        var x = document.getElementsByClassName("city");
        for (i = 0; i < x.length; i++) {
          x[i].style.display = "none";
        }
        document.getElementById(cityName).style.display = "block";
    }

    render() {
      return appState.graph.frame && (
        <SidebarMenu>
            <div class="sidebar-container">
                <div class="w3-bar w3-black">
                    <button class="w3-bar-item w3-button" onClick={this.openCity.bind(this, "Appearance")}>Appearance</button>
                    <button class="w3-bar-item w3-button" onClick={this.openCity.bind(this, "Filter")}>Filter</button>
                </div> 
                <div id="Appearance" class="city">
                    <h4>Appearance </h4>
                    <Tabs2 animate id="graph-options">
                    <Tab2 id="nodes" title="Nodes" panel={<NodesPanel />} />
                    <Tab2 id="edges" title="Edges" panel={<EdgesPanel />} />
                    <Tab2 id="labels" title="Labels" panel={<LabelsPanel />} />
                    {/* <Tab2 id="layout" title="Layout" panel={<LayoutPanel />} /> */}
                    <Tabs2.Expander />
                    </Tabs2>
                </div>
                <div id="Filter" class="city" style={{display:"None"}}>
                <h4>Filter Options</h4>
                    <Tabs2 animate id="filter-options">
                    <Tab2 id="nodes" title="Nodes" panel={<NodesFilterPanel />} />
                    <Tab2 id="edges" title="Edges" panel={<EdgesPanel />} />
                    {/* <Tab2 id="layout" title="Layout" panel={<LayoutPanel />} /> */}
                    <Tabs2.Expander />
                    </Tabs2>
                </div>
            </div>
        </SidebarMenu>
      );
    }
  }

  export default Sidebar;