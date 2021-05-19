import React from "react";
import {UIGlobalState} from "../systems/UISystem";
import DebugInfo from "./DebugInfo";
import SelectionInfo from "./SelectionInfo";

export default class UIRoot extends React.Component<UIGlobalState> {
	constructor(props: any) {
		super(props);
	}

	public render() {
		return (
			<>
				<DebugInfo fps={this.props.fps} frameTime={this.props.frameTime}/>
				{this.props.activeFeatureId !== null &&
				<SelectionInfo activeFeatureId={this.props.activeFeatureId} activeFeatureType={this.props.activeFeatureType}/>
				}
			</>
		);
	}
}