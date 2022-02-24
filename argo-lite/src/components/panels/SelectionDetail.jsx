import React from "react";
import classnames from "classnames";
import uniq from "lodash/uniq";
import { Classes } from "@blueprintjs/core";
import appState from "../../stores";
import { observer } from "mobx-react/index";
import { observable, computed, action, runInAction } from "mobx";

@observer
class SelectionDetail extends React.Component {


  render() {
    // If input is number,
    // currently format number between 0-1 (eg. pagerank)
    // to show no more than 3 significant digits.
    const SelectionDistanceFromLatLonIn = () => {

      if (appState.graph.selectedNodes.length > 1) {
        const edgeSelection = appState.graph.frame.getEdgeWithinSelection(appState.graph.selectedNodes)
        if (edgeSelection.length == 0) return null;
        const edgeDistance = edgeSelection.map(e => e.edgeDist)


        const average = (array) => array.reduce((a, b) => a + b) / array.length;

        return average(edgeDistance).toFixed(3);
      } else {
        return null
      }

    }

    const SelectionDensity = () => {
      
        const edgeSelection = appState.graph.frame.getEdgeWithinSelection(appState.graph.selectedNodes)
        if (edgeSelection.length == 0) return 0;
        const nodelength = appState.graph.selectedNodes.length;
        const selectionDen = 2*edgeSelection.length /(nodelength*(nodelength-1))
        return selectionDen.toFixed(3)
      

    }



    return (
      <div
        className={classnames(
          // 'overlay-card',
          "right-overlay-card",
          "transparent-frame"
        )}
      >
        <div className={classnames(Classes.CARD, "node-details-table")}>
          <table
            className={classnames(Classes.TABLE, Classes.TABLE_STRIPED, "node-details-table-content")}
            style={{
              width: "100%",
              padding: '0',
            }}
          >

            <thead>
              {/* <tr>
                <th></th>
                <th></th>
               
              </tr> */}
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '5px 10px' }}> {appState.graph.selectedNodes.length + ' nodes are selected'}</td>
                {/* <td style={{ padding: '5px 10px', whiteSpace: 'normal' }}>{formatLongFloat(this.props.node[it])}</td> */}
              </tr>
              <tr>
                <td style={{ padding: '5px 10px' }}> {'The average distance is ' + SelectionDistanceFromLatLonIn() + ' km'}</td>
                {/* <td style={{ padding: '5px 10px', whiteSpace: 'normal' }}>{formatLongFloat(this.props.node[it])}</td> */}
              </tr>
              <tr>
                <td style={{ padding: '5px 10px' }}> {'The network density(undirected network) is ' + SelectionDensity()}</td>
                {/* <td style={{ padding: '5px 10px', whiteSpace: 'normal' }}>{formatLongFloat(this.props.node[it])}</td> */}
              </tr>
              {/* {appState.graph.allPropertiesKeyList.map((it, i) => (
                
              ))} */}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default SelectionDetail;