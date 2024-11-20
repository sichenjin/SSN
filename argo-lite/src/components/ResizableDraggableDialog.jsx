import {Rnd} from "react-rnd";
import React from "react";
// import "./style.css";
import { Dialog } from "@blueprintjs/core";
import appState from "../stores/index";
import { observer } from "mobx-react";

@observer
class ResizableDraggableDialog extends React.Component {
    constructor(props) {
      super(props);
      
    }
  
    render() {
      const w = window,
      d = document,
      e = d.documentElement,
      g = d.getElementsByTagName("body")[0],
      windowWidth = w.innerWidth || e.clientWidth || g.clientWidth,
      windowHeight = w.innerHeight || e.clientHeight || g.clientHeight;
      return (
        
<div
      className={"tg-pt-dialog-resizable-draggable"}
      style={{ top: 0, left: 0, position: "fixed" }}
    >
         <Rnd
        style={{backgroundColor:'red'}}
        bounds={"body"}
        default={{
          x: window.innerWidth/3,
          y: window.innerHeight/3,
          width: 320,
          height: 200,
        }}
      > 
        
        
      </Rnd>
    </div>
     
  //       <div
  //       className={"tg-pt-dialog-resizable-draggable"}
  //       style={{ top: 300, left: 300, position: "fixed" }}
  //     >
  //       <Rnd
  //         enableResizing={{
  //           bottomLeft: true,
  //           bottomRight: true,
  //           topLeft: true,
  //           topRight: true
  //         }}
  //         bounds={"body"}
  //         default={{
  //           x: Math.max((windowWidth - 400) / 2, 0),
  //           y: Math.max((windowHeight - 450) / 2, 0),
  //           width: Math.min(400, windowWidth),
  //           height: Math.min(450, windowHeight)
  //         }}
  //         dragHandleClassName={".pt-dialog-header"}
  //         // {...RndProps}
  //       >
  
  // <Dialog
  //           iconName="projects"
  //           isOpen={appState.preferences.isScatterPlotDialogOpen}
  //           onClose={() => {
  //             appState.preferences.isScatterPlotDialogOpen = false;
  //           }}
  //           title={`Scatterplot`}
  //           hasBackdrop={false} usePortal={false}
            
  //         >
  //         </Dialog>
          
  //       </Rnd>
  //     </div>
      )
    }}
    
export default ResizableDraggableDialog;


