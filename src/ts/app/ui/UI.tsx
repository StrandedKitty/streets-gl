import UIRoot from "./UIRoot";
import {UIGlobalState} from "../systems/UISystem";
import React from "react";
import ReactDOM from "react-dom";

export default new class UI {
	public update(
		state: UIGlobalState,
		setGlobalState: (k: keyof UIGlobalState, v: any) => void,
		updateRenderGraph: () => void
	): void {
		ReactDOM.render(<UIRoot {...state} setGlobalState={setGlobalState} updateRenderGraph={updateRenderGraph}/>, document.getElementById('ui'));
	}
}