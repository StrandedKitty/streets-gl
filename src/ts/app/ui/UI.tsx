import UIRoot from "./UIRoot";
import {UIGlobalState} from "../systems/UISystem";
import React from "react";
import ReactDOM from "react-dom";

export default new class UI {
	public update(state: UIGlobalState): void {
		ReactDOM.render(<UIRoot {...state}/>, document.getElementById('ui'));
	}
}