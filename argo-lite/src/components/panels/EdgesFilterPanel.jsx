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
class EdgesFilterPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    appState.graph.EdgePropertiesKeyList.forEach((it) => {
      this.state[it + "isOpen"] = false;
      this.state[it + "_filterlist"] = [];
    });
  }

  render() {
    return (
      <div>
        {appState.graph.EdgePropertiesKeyList.map((it, i) => (
          <Collapsable
            name={it}
            isOpen={this.state[it + "isOpen"]}
            onToggle={() =>
              this.setState({
                [it + "isOpen"]: !this.state[it + "isOpen"],
              })
            }
          >
            <div className={classnames(Classes.CARD, "sub-option")}>
              {console.log(
                `Filter key: ${it}, Should use RangeSlider: ${!(
                  it === "community" ||
                  isNaN(appState.graph.rawGraph.edges[0][it])
                )}`
              )}
              {it === "community" ||
              isNaN(appState.graph.rawGraph.edges[0][it]) ? (
                <MultiSelects
                  items={[
                    ...new Set(appState.graph.rawGraph.edges.map((n) => n[it])),
                  ]}
                  onSelect={(selectit) => {
                    appState.graph.edges_filter[it]
                      ? appState.graph.edges_filter[it].push(selectit)
                      : (appState.graph.edges_filter[it] = [selectit]);
                    appState.graph.filterEdges();

                    this.setState({
                      [it + "_filterlist"]: appState.graph.edge_filter[it],
                    });

                    // console.log(this.state[it + '_filterlist'])
                    // return selectit
                    // console.log(appState.graph.filter[it][0])
                  }}
                  tag={(selectit) => {
                    return selectit;
                  }}
                  value={
                    Object.keys(appState.graph.edge_filter).length === 0
                      ? []
                      : appState.graph.edge_filter[it]
                  }
                  tagprops={{
                    fill: true,
                    placeholder: "  ",
                    onRemove: (selectit) => {
                      var self = this;
                      // var deselectIndex0 = this.state[it + '_filterlist'].indexOf(selectit)
                      var deselectIndex1 =
                        appState.graph.edge_filter[it].indexOf(selectit);
                      if (deselectIndex1 > -1) {
                        appState.graph.edge_filter[it] =
                          appState.graph.edge_filter[it].filter(
                            (item) => item !== selectit
                          );

                        // appState.graph.filter[it].splice(deselectIndex1, 1)
                        appState.graph.filterEdges();
                      }
                      if (deselectIndex1 > -1) {
                        this.setState({
                          [it + "_filterlist"]: appState.graph.edge_filter[it],
                          //  this.state[it + '_filterlist'].splice(deselectIndex0, 1)
                        });
                      }

                      console.log(this.state[it + "_filterlist"]);
                      // return selectit
                      // console.log(appState.graph.filter[it][0])
                    },
                    // tagProps: getTagProps,
                  }}
                />
              ) : (
                <RangeSlider
                  min={Math.min(
                    ...appState.graph.rawGraph.edges.map((n) => n[it])
                  )} //uniqueValue[it][0] is computed min
                  max={Math.max(
                    ...appState.graph.rawGraph.edges.map((n) => n[it])
                  )} //uniqueValue[it][1] is computed max
                  stepSize={1}
                  labelStepSize={10000}
                  className="range-slider-container"
                  onChange={([a, b]) => {
                    runInAction("update scale", () => {
                      this.setState({
                        [it + "_filterlist"]: {
                          min: a,
                          max: b,
                        },
                      });
                      appState.graph.edge_filter[it] = {
                        min: a,
                        max: b,
                      };
                    });
                  }}
                  onRelease={([a, b]) => {
                    // console.log(Math.max(... appState.graph.rawGraph.nodes.map(n => n[it])));
                    this.setState({
                      [it + "_filterlist"]: {
                        min: a,
                        max: b,
                      },
                    });
                    appState.graph.edge_filter[it] = {
                      min: a,
                      max: b,
                    };
                    appState.graph.filterEdges();
                  }}
                  value={
                    // set up the value of the slider
                    appState.graph.edge_filter[it]
                      ? [
                          appState.graph.edge_filter[it]["min"],
                          appState.graph.edge_filter[it]["max"],
                        ]
                      : [
                          Math.min(
                            ...appState.graph.rawGraph.edges.map((n) => n[it])
                          ),
                          Math.max(
                            ...appState.graph.rawGraph.edges.map((n) => n[it])
                          ),
                        ]
                  }
                />
              )}
            </div>
          </Collapsable>
        ))}
      </div>
    );
  }
}

export default EdgesFilterPanel;
