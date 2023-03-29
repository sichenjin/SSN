import React from "react";
import { Button, Classes } from "@blueprintjs/core";
import { Select } from "@blueprintjs/labs";
import CommonItemRenderer from "./CommonItemRenderer";
import { Icon } from "@blueprintjs/core";
export default ({ items, onSelect, value, fill = false }) => (
  <Select
    items={items}
    itemRenderer={CommonItemRenderer}
    filterable={false}
    onItemSelect={onSelect}
  >
        {/* <button style={{height: "100%" ,marginLeft: "2px"}} type="button">
          {value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()}
        </button> */}
        <Button className={fill ? Classes.FILL : null} text={value} />

  </Select>
);
