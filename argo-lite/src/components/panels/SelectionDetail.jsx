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
    if(appState.graph.selectedNodes.length>0){
      const SelectionDistanceFromLatLonIn = () => {
        const selectNodes = appState.graph.selectedNodes;
        const average = (array) => array.reduce((a, b) => a + b) / array.length;
  
        if ( selectNodes.length> 1) {
          //// calculate only the connected distance 
          // const edgeSelection = appState.graph.frame.getEdgeWithinSelection(appState.graph.selectedNodes)
          // if (edgeSelection.length == 0) return null;
          // const edgeDistance = edgeSelection.map(e => e.edgeDist)
          // return average(edgeDistance).toFixed(3);
  
          //// calculate average distance between all selected nodes 
          const edgeDistance = []
          
          for (let i = 0; i < selectNodes.length; i++) {
            for (let j = i + 1; j < selectNodes.length; j++) {
              const lon1 = selectNodes[i].data.ref.LonX
              const lat1 = selectNodes[i].data.ref.LatY
              const lon2 = selectNodes[j].data.ref.LonX
              const lat2 = selectNodes[j].data.ref.LatY
              const edgeDist = appState.graph.frame.getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2)
              edgeDistance.push(edgeDist)
            }
          }
          return average(edgeDistance).toFixed(3);
  
        } else {
          return null
        }
  
      }
  
      const SelectionDensity = () => {
  
        const edgeSelection = appState.graph.frame.getEdgeWithinSelection(appState.graph.selectedNodes)
        if (edgeSelection.length == 0) return 0;
        const nodelength = appState.graph.selectedNodes.length;
        const selectionDen = 2 * edgeSelection.length / (nodelength * (nodelength - 1))
        return selectionDen.toFixed(3)
  
  
      }
  
  
  
      return (
        <div
          className={classnames(
            // 'overlay-card',
            // "right-overlay-card",
            // "transparent-frame"
          )}
          style = {{
            width: '50vw',
            height: '40vh',
            border:'#C0C0C0',
            borderStyle:'solid',
          }}
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
                  <td style={{ padding: '5px 10px' }}> {'The network density (undirected network) is ' + SelectionDensity()}</td>
                  {/* <td style={{ padding: '5px 10px', whiteSpace: 'normal' }}>{formatLongFloat(this.props.node[it])}</td> */}
                </tr>
                {/* {appState.graph.allPropertiesKeyList.map((it, i) => (
                  
                ))} */}
              </tbody>
            </table>
          </div>
        </div>
      );
    }else{
      return <div
      className={classnames(
        // 'overlay-card',
        // "right-overlay-card",
        // "transparent-frame"
      )}
      style = {{
        width: '50vw',
        height: '40vh',
        border:'#C0C0C0',
        borderStyle:'solid',
      }}
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
           
          </thead>
          <tbody>

               
            <tr>
              <td style={{ padding: '5px 10px' }}> {'No node is selected'}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 10px' }}> {`The average degree is ${appState.graph.hasGraph ? appState.graph.degree.toFixed(3) : 'NULL'}`}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 10px' }}> {`The average density is ${appState.graph.hasGraph ? appState.graph.density.toFixed(3) : 'NULL'}`}</td>
            </tr>
           
          </tbody>
        </table>
      </div>
    </div>
    }
    
  }
}

export default SelectionDetail;