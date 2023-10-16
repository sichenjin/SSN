import React from "react";
import { observer } from "mobx-react";
import pluralize from "pluralize";
import appState from "../../stores";
import GlobalPanel from "./GlobalPanel";
import SelectionPanel from "./SelectionPanel";
import Collapsable from "../utils/Collapsable";
import { Button, Classes, RangeSlider } from "@blueprintjs/core";
import SimpleSelect from "../utils/SimpleSelect";
import MultiSelects from "../utils/MultiSelects";
import classnames from "classnames";
import uniq from "lodash/uniq";
import { runInAction } from "mobx";

@observer
class NodesFilterPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    }
    appState.graph.filterKeyList.forEach(it => {
      this.state[it + 'isOpen'] = false;
      this.state[it + '_filterlist'] = []
    });
    // console.log(this.state)
    // this.state = 
    // {
    //   timeOutRef: null,
    //   sizeOptionOpen: false,
    //   colorOptionOpen: false,
    //   shapeOptionOpen: false
    // };
  }

  // getRenderedNodes = () => {
  //   if (appState.graph.selectedNodes.length === 0) {
  //     return (
  //       <div>
  //         <p>Modifying All Nodes</p>
  //       </div>
  //     );
  //   }
  //   return (
  //     <p>{`Modifying ${pluralize(
  //       "Node",
  //       appState.graph.selectedNodes.length,
  //       true
  //     )}`}</p>
  //   );
  // };

  render() {
    return (
      <div>
        {appState.graph.filterKeyList.map((it, i) => (
          <Collapsable
            name={it}
            isOpen={this.state[it + 'isOpen']}
            onToggle={() =>
              this.setState({
                [it + 'isOpen']: !this.state[it + 'isOpen']
              })
            }
          >
            <div className={classnames(Classes.CARD, "sub-option")}>
              { (it === 'community' || isNaN(appState.graph.rawGraph.nodes[0][it]) ) ?
                <MultiSelects
                  items={[...new Set(appState.graph.rawGraph.nodes.map(n => n[it]))]}
                  onSelect={selectit => {
                    appState.graph.filter[it] ? appState.graph.filter[it].push(selectit) : appState.graph.filter[it] = [selectit]
                    appState.graph.filterNodes()

                    this.setState({
                      [it + '_filterlist']: appState.graph.filter[it]
                    })
                    

                    // console.log(this.state[it + '_filterlist'])
                    // return selectit
                    // console.log(appState.graph.filter[it][0])
                  }}
                  tag={selectit => { return selectit }}
                  value={(Object.keys(appState.graph.filter).length === 0) ? []:appState.graph.filter[it]}

                  tagprops={{
                    fill:true ,
                    placeholder: '  ',
                    onRemove: selectit => {
                      var self = this
                      // var deselectIndex0 = this.state[it + '_filterlist'].indexOf(selectit)
                      var deselectIndex1 = appState.graph.filter[it].indexOf(selectit)
                      if (deselectIndex1 > -1) {
                        appState.graph.filter[it] = appState.graph.filter[it].filter(item => item !== selectit)

                        // appState.graph.filter[it].splice(deselectIndex1, 1)
                        appState.graph.filterNodes()
                      }
                      if (deselectIndex1 > -1) {
                        this.setState({
                          [it + '_filterlist']:appState.graph.filter[it]
                          //  this.state[it + '_filterlist'].splice(deselectIndex0, 1)
                        })
                       
                      }
                      
                      // var deselectIndex1 = appState.graph.filter[it].indexOf(selectit)
                      // if (deselectIndex1 > -1) {
                      //   appState.graph.filter[it] = appState.graph.filter[it].filter(item => item !== selectit)

                      //   // appState.graph.filter[it].splice(deselectIndex1, 1)
                      //   appState.graph.filterNodes()
                      // }


                      console.log(this.state[it + '_filterlist'])
                      // return selectit
                      // console.log(appState.graph.filter[it][0])
                    },
                    // tagProps: getTagProps,
                  }}
                />
                :
                <RangeSlider
                  min={Math.min(... appState.graph.rawGraph.nodes.map(n => n[it]))}   //uniqueValue[it][0] is computed min 
                  max={Math.max(... appState.graph.rawGraph.nodes.map(n => n[it]))} //uniqueValue[it][1] is computed max
                  stepSize={1}
                  labelStepSize={10000}
                  className="range-slider-container"
                  onChange={([a, b]) => {
                    runInAction("update scale", () => {
                      this.setState({
                        [it + '_filterlist']: {
                          "min":a,
                          "max":b
                        }
                      })
                      appState.graph.filter[it] ={
                        "min":a,
                        "max":b
                      }
                    })
                    
                  }}
                  onRelease={([a, b]) => {
                  // console.log(Math.max(... appState.graph.rawGraph.nodes.map(n => n[it])));
                  this.setState({
                    [it + '_filterlist']: {
                      "min":a,
                      "max":b
                    }
                  })
                  appState.graph.filter[it] ={
                    "min":a,
                    "max":b
                  }
                  appState.graph.filterNodes()
                  
                
                 
                }}
                value={(appState.graph.filter[it])?
                [
                  appState.graph.filter[it]["min"],
                  appState.graph.filter[it]["max"]
                ]:
              [
                Math.min(... appState.graph.rawGraph.nodes.map(n => n[it])),
                Math.max(... appState.graph.rawGraph.nodes.map(n => n[it]))

              ]}
                />

              }
            </div>

          </Collapsable>


        ))}



        {/* <Collapsable
          name="Color"
          isOpen={this.state.colorOptionOpen}
          onToggle={() =>
            this.setState({
              colorOptionOpen: !this.state.colorOptionOpen
            })
          }
        >
          <div className={classnames(Classes.CARD, "sub-option")}>
            <div>
              <p style={{ display: "inline" }}>Color By: </p>
              <span style={{ float: "right" }}>
                <SimpleSelect
                  items={appState.graph.allPropertiesKeyList}
                  onSelect={it => (appState.graph.nodes.colorBy = it)}
                  value={appState.graph.nodes.colorBy}
                />
              </span>
            </div>

            <div style={{ marginTop: "10px" }}>
              <p style={{ display: "inline" }}>Scale Type: </p>
              <span style={{ float: "right" }}>
                <SimpleSelect
                  items={Object.keys(scales)}
                  onSelect={it => (appState.graph.nodes.color.scale = it)}
                  value={appState.graph.nodes.color.scale}
                />
              </span>
            </div>

            <div>
              <div style={{ marginTop: "10px" }}>
                <p style={{ display: "inline" }}>Gradient: &nbsp;</p>
                <span style={{ float: "right" }}>
                  <Popover2
                    placement="bottom"
                    modifiers={{
                      preventOverflow: {
                        enabled: false,
                      },
                    }}
                  >
                    <Button
                      text="  "
                      style={{
                        backgroundImage: "inherit",
                        backgroundColor: appState.graph.nodes.color.from
                      }}
                    />
                    <SketchPicker
                      color={appState.graph.nodes.color.from}
                      onChange={it => (appState.graph.nodes.color.from = it.hex)}
                    />
                  </Popover2>
                  &nbsp; &#8594; &nbsp;
                  <Popover2
                    placement="bottom"
                    modifiers={{
                      preventOverflow: {
                        enabled: false,
                      },
                    }}
                  >
                    <Button
                      text="  "
                      style={{
                        backgroundImage: "inherit",
                        backgroundColor: appState.graph.nodes.color.to
                      }}
                    />
                    <SketchPicker
                      color={appState.graph.nodes.color.to}
                      onChange={it => (appState.graph.nodes.color.to = it.hex)}
                    />
                  </Popover2>
                </span>
              </div>
            </div>
            <div style={{ marginTop: "-1em" }}>
              <svg width="100%" height="10" className="gradient-preview">
                <defs>
                  <linearGradient
                    x1="0%"
                    y1="50%"
                    x2="100%"
                    y2="50%"
                    id="theGradient"
                  >
                    <stop
                      stopColor={appState.graph.nodes.color.from}
                      stopOpacity="1"
                      offset="0%"
                    />
                    <stop
                      stopColor={appState.graph.nodes.color.to}
                      stopOpacity="1"
                      offset="100%"
                    />
                  </linearGradient>
                </defs>
                <rect
                  x="0"
                  y="0"
                  width="100%"
                  height="50"
                  fill="url(#theGradient)"
                />
              </svg>
            </div>
          </div>
        </Collapsable> */}

      </div>
    );
  }
}

export default NodesFilterPanel;