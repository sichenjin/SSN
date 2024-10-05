import React from "react";
import { observer } from "mobx-react";
import pluralize from "pluralize";
import appState from "../../stores";
import GlobalPanel from "./GlobalPanel";
import SelectionPanel from "./SelectionPanel";

@observer
class NodesPanel extends React.Component {
  getRenderedNodes = () => {
    // selectedNodes is the nodes selected by mouse click, instead of nodes that are not hidden
    if (appState.graph.selectedNodes.length === 0) {
      return (
        <div>
          <text style={{ fontSize: "12px" }}>Modifying All Nodes</text>
        </div>
      );
    }
    return (
      <p>{`Modifying ${pluralize(
        "Node",
        appState.graph.selectedNodes.length,
        true
      )}`}</p>
    );
  };

  render() {
    return (
      <div>
        {this.getRenderedNodes()}
        {appState.graph.selectedNodes.length === 0 ? (
          <GlobalPanel />
        ) : (
          <SelectionPanel />
        )}
      </div>
    );
  }
}

export default NodesPanel;
