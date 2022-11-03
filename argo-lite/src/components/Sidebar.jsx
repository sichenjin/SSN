import SidebarMenu from 'react-bootstrap-sidebar-menu';
import React from "react";

import { Tab2, Tabs2, Tag } from "@blueprintjs/core";
import NodesPanel from "./panels/NodesPanel";
import EdgesPanel from "./panels/EdgesPanel";
import LabelsPanel from "./panels/LabelsPanel";
import NodesFilterPanel from "./panels/NodesFilterPanel";
import StatGroupPanel from "./panels/StatGroupPanel"

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
                    <button class=" w3-bar-item-button w3-bar-item w3-button " onClick={this.openCity.bind(this, "Appearance")}>Appearance</button>
                    <button class="w3-bar-item-button w3-bar-item w3-button " onClick={this.openCity.bind(this, "Filter")}>Filter</button>
                    <button class="w3-bar-item-button w3-bar-item w3-button " onClick={this.openCity.bind(this, "Statistics")}>Statistics</button>
                </div> 
                <div id="Appearance" class="city">
                    <text style={{fontSize: "10px"}}>Appearance </text>
                    <Tabs2 animate id="graph-options">
                    <Tab2 id="a_nodes" title="Nodes" panel={<NodesPanel />} />
                    <Tab2 id="a_edges" title="Edges" panel={<EdgesPanel />} />
                    <Tab2 id="a_labels" title="Labels" panel={<LabelsPanel />} />
                    {/* <Tab2 id="layout" title="Layout" panel={<LayoutPanel />} /> */}
                    <Tabs2.Expander />
                    </Tabs2>
                </div>
                <div id="Filter" class="city" style={{display:"None"}}>
                <text style={{fontSize: "10px"}}>Filter Options</text>
                    <Tabs2 animate id="filter-options">
                    <Tab2 id="f_nodes" title="Nodes" panel={<NodesFilterPanel />} />
                    <Tab2 id="f_edges" title="Edges" panel={<EdgesPanel />} />
                    <Tab2 id="f_layout" title="Layout" panel={<EdgesPanel />} />
                    <Tabs2.Expander />
                    </Tabs2>
                </div>
                <div id="Statistics" class="city" style={{display:"None"}}>
                <text style={{fontSize: "10px"}}>Statistics</text>
                    <Tabs2 animate id="filter-options">
                    <Tab2 id="s_nodes" title="Nodes"  />
                    <Tab2 id="s_edges" title="Edges"  />
                    <Tab2 id="s_layout" title="Groups" panel={<StatGroupPanel />} />
                    <Tabs2.Expander />
                    </Tabs2>
                </div>
            </div>
        </SidebarMenu>
      );
    }
  }

  export default Sidebar;