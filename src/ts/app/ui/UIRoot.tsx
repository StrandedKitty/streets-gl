import React from "react";
import {UIGlobalState} from "../systems/UISystem";
import DebugInfo from "./DebugInfo";
import SelectionInfo from "./SelectionInfo";
import TimeInfo from "~/app/ui/TimeInfo";
import Search from "~/app/ui/Search";
import RenderGraphViewer from "~/app/ui/RenderGraphViewer";

export default class UIRoot extends React.Component<UIGlobalState & {
	setGlobalState: (k: keyof UIGlobalState, v: any) => void;
	updateRenderGraph: () => void;
}, {
	showRenderGraph: boolean;
}> {
	public constructor(props: any) {
		super(props);

		this.state = {
			showRenderGraph: false
		};
	}

	public render(): JSX.Element {
		return (
			<>
				<DebugInfo
					fps={this.props.fpsSmooth}
					frameTime={this.props.frameTime}
					onRenderGraphOpen={(): void => this.setState({showRenderGraph: true})}
				/>
				<TimeInfo
					time={this.props.mapTime}
					timeMultiplier={this.props.mapTimeMultiplier}
					updateTime={(value: number): void => {
						this.props.setGlobalState('mapTime', value);
					}}
					updateTimeMultiplier={(value: number): void => {
						this.props.setGlobalState('mapTimeMultiplier', value);
					}}
					resetTime={(): void => {
						this.props.setGlobalState('mapTime', Date.now());
					}}
				/>
				{/*<Search />*/}
				{
					this.props.activeFeatureId !== null && (
						<SelectionInfo
							activeFeatureId={this.props.activeFeatureId}
							activeFeatureType={this.props.activeFeatureType}
						/>
					)
				}
				{
					this.state.showRenderGraph && (
						<RenderGraphViewer
							data={this.props.renderGraph}
							update={this.props.updateRenderGraph}
							close={(): void => this.setState({showRenderGraph: false})}
						/>
					)
				}
			</>
		);
	}
}