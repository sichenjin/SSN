import React from "react";
import { Classes, MenuItem } from "@blueprintjs/core";

export default ({ handleClick, item, isActive }) => (
  

  <MenuItem
  iconName={item.charAt(0).toUpperCase() + item.slice(1).toLowerCase() == "Distance to center" 
            ||item.charAt(0).toUpperCase() + item.slice(1).toLowerCase() == "Shortest path" 
            ||item.charAt(0).toUpperCase() + item.slice(1).toLowerCase() == "Pair distance"
            ? "globe" : "graph"}
    className={isActive ? Classes.ACTIVE : ""}
    key={item}
    onClick={handleClick}
    text={item.replace(/\w+/g, function(word) {
      return ['to'].includes(word.toLowerCase()) ? word : word.charAt(0).toUpperCase() + word.slice(1);
    })}
  />
);
