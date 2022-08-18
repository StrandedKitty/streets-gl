import React from "react";

export default class DebugInfo extends React.Component<{fps: number; frameTime: number; onRenderGraphOpen: () => void}> {
	public render(): JSX.Element {
		return (
			<div className='debug-info'>
				<div className='debug-info-item'>{Math.round(this.props.fps)} FPS</div>
				<div className='debug-info-item'>{this.props.frameTime.toFixed(1)} ms</div>
				<div
					className='debug-info-item debug-info-item-small'
					onClick={this.props.onRenderGraphOpen}
					style={{cursor: 'pointer'}}
				>RG</div>
			</div>
		);
	}
}