import React from "react";
import { Classes, MenuItem } from "@blueprintjs/core";

export default ({ handleClick, item, isActive }) => {
  if (item == null || typeof item !== "string") return null;
  const normalized = item.charAt(0).toUpperCase() + item.slice(1).toLowerCase();
  const isGlobeIcon =
    normalized === "Distance to center" ||
    normalized === "Shortest path" ||
    normalized === "Pair distance" ||
    normalized === "Average distance";

  return (
    <MenuItem
      iconName={isGlobeIcon ? "globe" : "graph"}
      className={isActive ? Classes.ACTIVE : ""}
      key={item}
      onClick={handleClick}
      text={item.replace(/\w+/g, function (word) {
        return ["to"].includes(word.toLowerCase())
          ? word
          : word.charAt(0).toUpperCase() + word.slice(1);
      })}
    />
  );
};
