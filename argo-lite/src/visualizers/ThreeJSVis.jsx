import React from "react";
import appState from "../stores";

export default class ThreeJSVis extends React.Component {
  componentDidMount() {
    appState.graph.setUpFrame();
  }

  render() {
    return (
      <div
        id="graph-container"
        style={{
          width: "50vw",
          height: "100vh"
          // flex: "1",
          // position: "absolute"
        }}
      />
    );
  }
}
