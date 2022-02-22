import React from "react";
import classnames from "classnames";
import uniq from "lodash/uniq";
import { Classes } from "@blueprintjs/core";
import appState from "../../stores";
import { observer } from "mobx-react/index";
import { observable, computed, action, runInAction } from "mobx";

@observer
class SelectionDetail extends React.Component {

  // constructor(props) {
  //   super(props);
  //   this.getDistanceFromLatLonInKm = this.getDistanceFromLatLonInKm.bind(this);
  //   this.SelectionDistanceFromLatLonIn = this.SelectionDistanceFromLatLonIn.bind(this);
  // }

  

 
  




  render() {
    // If input is number,
    // currently format number between 0-1 (eg. pagerank)
    // to show no more than 3 significant digits.
    const SelectionDistanceFromLatLonIn =() =>{
      const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
        var p = 0.017453292519943295;    // Math.PI / 180
        var c = Math.cos;
        var a = 0.5 - c((lat2 - lat1) * p)/2 + 
                c(lat1 * p) * c(lat2 * p) * 
                (1 - c((lon2 - lon1) * p))/2;
      
        return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
      }
  
      const selectionDist = []
      if (appState.graph.selectedNodes.length > 1) {
        const theSelection = appState.graph.selectedNodes
        
  
        theSelection.forEach(function (node, i) {
          const lat1 = node.data.ref.LatY
          const lon1 = node.data.ref.LonX
          for (var j = 0; j < i; j++){
            const lat2 = theSelection[j].data.ref.LatY
            const lon2 = theSelection[j].data.ref.LonX
            selectionDist.push(getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2))
          }
      });
      console.log(selectionDist)
      const average = (array) => array.reduce((a, b) => a + b) 
      // console.log(averageDist)
      return average(selectionDist).toFixed(3);
      }else{
        return null
      }
      
    }

    // const formatLongFloat = (nodeAttributeValue) => {
    //   const num = Number(nodeAttributeValue);
    //   if (Number.isNaN(num) || num > 1 || num < 0) {
    //     // Do not format just return original
    //     return nodeAttributeValue;
    //   }
    //   // Format to no more than 3 significant digit.
    //   return Number.parseFloat(num).toPrecision(3);
    // };

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