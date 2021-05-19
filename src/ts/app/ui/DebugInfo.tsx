import React from "react";

export default class DebugInfo extends React.Component<{fps: number, frameTime: number}> {
	public render() {
		return (
			<div className='debug-info'>
				<div className='debug-info-item'>{Math.round(this.props.fps)} FPS</div>
				<div className='debug-info-item'>Frame time: {this.props.frameTime.toFixed(1)} ms</div>
			</div>
		);
	}
}