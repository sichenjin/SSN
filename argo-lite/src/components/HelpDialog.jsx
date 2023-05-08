import React from "react";
import {
  Button,
  Classes,
  Dialog,
  Intent,
} from "@blueprintjs/core";
import { observer } from "mobx-react";
import classnames from "classnames";
import appState from "../stores/index";

@observer
class HelpDialog extends React.Component {

  render() {
    return (
        <Dialog
          iconName="help"
          isOpen={appState.preferences.helpDialogOpen}
          onClose={() => {
            appState.preferences.helpDialogOpen = false;
          }}
          title={`Help`}
        >
          <div className={classnames(Classes.DIALOG_BODY)}>
            Argo supports both mouse/trackpad and touchscreen.
            <div className="argo-table-container">
              <table className="argo-table-container__table pt-table pt-bordered pt-striped">
                <thead>
                  <tr>
                    <th>Basic Operation</th>
                    <th>Mouse</th>
                    <th>Touchscreen</th>
                  </tr>
                </thead>
                <tbody>
                <tr>
                    <td>Clear Selection</td>
                    <td>Click blank area in the Network or Map View</td>
                    <td>Tap blank area in the Network or Map View</td>
                  </tr>
                  <tr>
                    <td>Zoom</td>
                    <td>Mouse wheel</td>
                    <td>2 finger zoom gesture</td>
                  </tr>
                  <tr>
                    <td>Pan</td>
                    <td>In the Network: drag with right mouse button down OR Move mouse with space key pressed; in the Map: drag the map</td>
                    <td>Drag with 3 finger</td>
                  </tr>
                  <tr>
                    <td>Adjust view size</td>
                    <td>Drag the view borders between the left and right view and between the top and bottom view. </td>
                    <td>Not supported</td>
                  </tr>
                  <tr>
                    <td>Select single node to view details and highlight its eco-centric network</td>
                    <td>Single click or drag to select one node in the Network or Map view</td>
                    <td>Tap or drag with 1 finger to select one node</td>
                  </tr>
                  <tr>
                    <td>Select multiple nodes to view details</td>
                    <td>In the Network: Drag left mouse button from empty area; in the map: move mouse with CTRL key pressed;</td>
                    <td>Drag 1 finger from empty area; </td>
                  </tr>
                  <tr>
                    <td>Move and pin a node</td>
                    <td>Click one node and drag with left mouse button down in the Network view</td>
                    <td>Drag with 1 finger</td>
                  </tr>
                  <tr>
                    <td>Move and pin a set of nodes</td>
                    <td>Drag left mouse button from empty area to select, then click one of the hilighted nodes and drag to move in the Network view</td>
                    <td>Drag with 1 finger</td>
                  </tr>
                  
                </tbody>
              </table>
            </div>
            
          </div>

          <div className={Classes.DIALOG_FOOTER}>
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              <Button
                intent={Intent.PRIMARY}
                onClick={() => {
                  appState.preferences.helpDialogOpen = false;
                }}
                text="Done"
              />
            </div>
          </div>
        </Dialog>
    );
  }
}

export default HelpDialog;