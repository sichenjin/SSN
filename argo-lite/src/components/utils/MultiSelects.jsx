import React from "react";
import { Button, Classes ,Intent, TagProps} from "@blueprintjs/core";
import { MultiSelect } from "@blueprintjs/labs";
import CommonItemRenderer from "./CommonItemRenderer";

export default ({ items, onSelect, value, fill = false , tag}) => (
  <MultiSelect
    items={items}
    itemRenderer={CommonItemRenderer}
    filterable={false}
    onItemSelect={onSelect}
    tagRenderer = {tag}
    tagInputProps={{ tagProps: {intent: Intent.PRIMARY, interactive: true,values: value}}}
    // tagInputProps={{
    //     values: value,
    //     // rightElement: clearButton,
    //     // tagProps: getTagProps,
    // }}
  >
    {/* <Button className={fill ? Classes.FILL : null} text={value} /> */}
  </MultiSelect>
);
