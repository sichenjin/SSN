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

@observer
class NodesFilterPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    }
    appState.graph.allPropertiesKeyList.forEach(it => {
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
        {appState.graph.allPropertiesKeyList.map((it, i) => (
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
              {appState.graph.metadata.nodePropertyTypes[it] == 'string' ?
                <MultiSelects
                  items={appState.graph.metadata.uniqueValue[it]}
                  onSelect={selectit => {

                    this.setState({
                      [it + '_filterlist']: this.state[it + '_filterlist'] ? [...this.state[it + '_filterlist'], selectit] : [selectit]
                    })
                    appState.graph.nodes.filter[it] ? appState.graph.nodes.filter[it].push(selectit) : appState.graph.nodes.filter[it] = [selectit]
                    appState.graph.filterNodes()

                    console.log(this.state[it + '_filterlist'])
                    // return selectit
                    // console.log(appState.graph.nodes.filter[it][0])
                  }}
                  tag={selectit => { return selectit }}
                  value={this.state[it + '_filterlist']}
                  tagprops={{
                    fill:true ,
                    onRemove: selectit => {
                      var self = this
                      var deselectIndex0 = this.state[it + '_filterlist'].indexOf(selectit)
                      if (deselectIndex0 > -1) {
                        this.setState({
                          [it + '_filterlist']:this.state[it + '_filterlist'].filter(item => item !== selectit)
                          //  this.state[it + '_filterlist'].splice(deselectIndex0, 1)
                        })
                       
                      }
                      
                      var deselectIndex1 = appState.graph.nodes.filter[it].indexOf(selectit)
                      if (deselectIndex1 > -1) {
                        appState.graph.nodes.filter[it] = appState.graph.nodes.filter[it].filter(item => item !== selectit)

                        // appState.graph.nodes.filter[it].splice(deselectIndex1, 1)
                        appState.graph.filterNodes()
                      }


                      console.log(this.state[it + '_filterlist'])
                      // return selectit
                      // console.log(appState.graph.nodes.filter[it][0])
                    },
                    // tagProps: getTagProps,
                  }}
                />
                :
                <RangeSlider
                  min={1}
                  max={20}
                  stepSize={0.1}
                  labelStepSize={5}
                // onChange={([a, b]) => {
                //   runInAction("update scale", () => {
                //     appState.graph.nodes.size.min = a;
                //     appState.graph.nodes.size.max = b;
                //   });
                // }}
                // value={[
                //   appState.graph.nodes.size.min,
                //   appState.graph.nodes.size.max
                // ]}
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