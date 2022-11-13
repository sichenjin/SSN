import React from "react";
import classnames from "classnames";
import uniq from "lodash/uniq";
import { Classes } from "@blueprintjs/core";
import appState from "../../stores";
import { observer } from "mobx-react/index";
import { observable, computed, action, runInAction } from "mobx";
import { Histogram, DensitySeries, BarSeries, withParentSize, XAxis, YAxis } from '@data-ui/histogram';

@observer
class SelectionDetail extends React.Component {

   SelectionDistanceFromLatLonIn = () => {
    const selectNodes = appState.graph.selectedNodes;
    const average = (array) => array.reduce((a, b) => a + b) / array.length;

    if (selectNodes.length > 1) {
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
      return [average(edgeDistance).toFixed(3),edgeDistance];

    } else {
      return null
    }

  }

   SelectionDensity = () => {

    const edgeSelection = appState.graph.frame.getEdgeWithinSelection(appState.graph.selectedNodes)
    if (edgeSelection.length == 0) return 0;
    const nodelength = appState.graph.selectedNodes.length;
    const selectionDen =  edgeSelection.length / (nodelength * (nodelength - 1))
    return selectionDen.toFixed(3)


  }



  render() {

    

    

    if (appState.graph.selectedNodes.length > 0 && this.SelectionDistanceFromLatLonIn()) {
      
      // Array(100).fill().map(Math.random);
     
      



      return (
        <div
          className={classnames(
            // 'overlay-card',
            // "right-overlay-card",
            // "transparent-frame"
          )}
          style={{
            width: '45vw',
            height: '40vh',
            // border:'#C0C0C0',
            // borderStyle:'solid',
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
                  <td style={{ padding: '5px 10px' }}> {'The average distance is ' + this.SelectionDistanceFromLatLonIn()[0] + ' km'}</td>
                  {/* <td style={{ padding: '5px 10px', whiteSpace: 'normal' }}>{formatLongFloat(this.props.node[it])}</td> */}
                </tr>
                <tr>
                  <td style={{ padding: '5px 10px' }}> {'The network density (undirected network) is ' + this.SelectionDensity()}</td>
                  {/* <td style={{ padding: '5px 10px', whiteSpace: 'normal' }}>{formatLongFloat(this.props.node[it])}</td> */}
                </tr>
                {/* {appState.graph.allPropertiesKeyList.map((it, i) => (
                  
                ))} */}
              </tbody>
            </table>
          </div>

          <div style={{ height: '20vw' }}>
          <text className = "distribution-title" >The Distance Distribution</text>
            <Histogram
              ariaLabel="distance_dis"
              orientation="vertical"
              height = "200"
              width = "200"
              cumulative={false}
              normalized={true}
              binCount={25}
              valueAccessor={(datum) => datum}
              binType="numeric"
            >
              <BarSeries
          animated
          rawData={this.SelectionDistanceFromLatLonIn()[1] }
          fill = "#429bf5"
        />
              <XAxis  numTicks = {5} label = "Edge Distance (km)"/>
              <YAxis />
            </Histogram>
            <text className = "distribution-title">The Degree Distribution</text>

            <Histogram
              ariaLabel="degree_dis"
              orientation="vertical"
              height = "200"
              width = "200"
              cumulative={false}
              normalized={true}
              binCount={25}
              valueAccessor={(datum) => datum}
              binType="numeric"
            >
              <BarSeries
              fill = "#429bf5"
          animated
          rawData={appState.graph.selectedNodes.map((node)=>{
            return node.data.ref.degree
          }) }
        />
              <XAxis numTicks = {5} label = "Degree"/>
              <YAxis />
            </Histogram>

          </div>


        </div>
      );
    } else {
      return <div
        className={classnames(
          // 'overlay-card',
          // "right-overlay-card",
          // "transparent-frame"
        )}
        style={{
          width: '45vw',
          height: '40vh',
          // border:'#C0C0C0',
          // borderStyle:'solid',
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
                <td style={{ padding: '5px 10px' }}> {`The average density is ${appState.graph.hasGraph ? (appState.graph.density/2).toFixed(3) : 'NULL'}`}</td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>
    }

  }
}

export default SelectionDetail;