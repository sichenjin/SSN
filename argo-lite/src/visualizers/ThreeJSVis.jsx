import React from "react";
import appState from "../stores";
import {Tag } from "@blueprintjs/core";


export default class ThreeJSVis extends React.Component {
  componentDidMount() {
    appState.graph.setUpFrame();
  }

  render() {
    return (
      <div
        id="graph-container"
        style={{
          width: "100%",
          height: "100%",
          // flex: "1",
          // border:'#C0C0C0',
          // borderStyle:'solid',
          // position: "absolute"
        }}
      >
       
      </div>
    );
  }
}
