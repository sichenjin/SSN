import React from "react";
import { Button, Classes ,Intent, TagProps} from "@blueprintjs/core";
import { MultiSelect } from "@blueprintjs/labs";
import CommonItemRenderer from "./CommonItemRenderer";

export default ({ items, onSelect, value, fill = false , tag}) => {

const clearButton = <Button icon="cross"  /> ;

return (

  <MultiSelect
  popoverProps={{
    popoverClassName: "filter-scroll",
  }}
    items={items}
    itemRenderer={CommonItemRenderer}
    filterable={false}
    onItemSelect={onSelect}
    tagRenderer = {tag}
    // tagInputProps={{ tagProps: {intent: Intent.PRIMARY, interactive: true,values: value}}}
    // tagInputProps={{
    //   onRemove: {appState.graph.nodes.filter = {}},
    //   rightElement: {appState.graph.nodes.filter ? <Button icon="cross" minimal={true} onClick={this.handleClear} /> : undefined;},
    //     values: value,
    //     // rightElement: clearButton,
    //     tagProps: (_value: React.ReactNode, index: number): TagProps => ({
    //       intent: this.state.intent ? INTENTS[index % INTENTS.length] : Intent.NONE,
    //       minimal: false,
    //   }),
    // }}
  >
    {/* <Button className={fill ? Classes.FILL : null} text={value} /> */}
  </MultiSelect>

)
  
  };
