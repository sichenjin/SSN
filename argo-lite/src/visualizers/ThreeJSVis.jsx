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
          height: "60vh",
          // flex: "1",
          // border:'#C0C0C0',
          // borderStyle:'solid',
          // position: "absolute"
        }}
      />
    );
  }
}
