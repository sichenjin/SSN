import React from "react";
import appState from "../stores/index";

import SelectionDetail from "./panels/SelectionDetail";
import ScatterPlot from "./panels/ScatterPlot";


class ContainerDown extends React.Component {
    render() {
        return (
            <div class="container-down container" id="scatter">
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
                <div style={{
                    display: "flex", height: "100%",
                    // border:'#C0C0C0',
                    // borderStyle:'solid',
                    // flex:"1 1 50%"
                }}>
                    {<SelectionDetail />}
                </div>
            </div>
        )
    }
}

export default ContainerDown;