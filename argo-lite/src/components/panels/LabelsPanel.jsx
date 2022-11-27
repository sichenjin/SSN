import React from "react";
import { Button, Classes, Slider } from "@blueprintjs/core";
import { Select } from "@blueprintjs/labs";
import { observer } from "mobx-react";
import appState from "../../stores";
import CommonItemRenderer from "../utils/CommonItemRenderer";

@observer
class LabelsPanel extends React.Component {
  render() {
    return (
      <div>
        <span style={{display: "inline-block"}}>
        <Button
          style={{}}
          id="hideAll"
          iconName="eye-off"
          className={Classes.FILL}
          onClick={() => appState.graph.frame.hideAllLabels()}
        >
          Hide All
        </Button>
        <Button
          style={{
            // width:"100px",
            display:"none"}}
          id="showAll"
          iconName="eye-on"
          className={Classes.FILL}
          onClick={() => appState.graph.frame.showAllLabels()}
        >
          Show All
        </Button>
        <Button
          style={{
            // width:"140px"
            // marginLeft:"10px"
          }}
          id="hideSelected"
          iconName="eye-off"
          className={Classes.FILL}
          onClick={() => appState.graph.frame.hideSelectedLabels()}
        >
          Hide Selected
        </Button>
        <Button
          style={{width:"140px",marginLeft:"10px",display:"none"}}
          id="showSelected"
          iconName="eye-on"
          className={Classes.FILL}
          onClick={() => appState.graph.frame.showSelectedLabels()}
        >
          Show Selected
        </Button>
        </span>
        <div style={{height: '20px'}} />
        <text className="option-font">Label Size</text>
        <Slider
        style ={{left:"10%", width:"80%"}}
          min={0.1}
          max={1}
          stepSize={0.1}
          labelStepSize={0.5}
          onChange={value => {
            appState.graph.nodes.labelSize = value;
          }}
          value={appState.graph.nodes.labelSize}
        />
        <div style={{height: '20px'}} />
        <text className="option-font">Label Length</text>
        <Slider
        style ={{left:"10%", width:"80%"}}
          min={1}
          max={32}
          
          stepSize={0.1}
          labelStepSize={10}
          onChange={value => {
            appState.graph.nodes.labelLength = value;
          }}
          value={appState.graph.nodes.labelLength}
        />
        <div style={{height: '20px'}} />
        <text className="option-font">Label By</text>
        <Select
          items={appState.graph.filterKeyList}
          itemRenderer={CommonItemRenderer}
          filterable={false}
          onItemSelect={it => (appState.graph.nodes.labelBy = it)}
        >
          <Button text={appState.graph.nodes.labelBy} />
        </Select>
      </div>
    );
  }
}

export default LabelsPanel;