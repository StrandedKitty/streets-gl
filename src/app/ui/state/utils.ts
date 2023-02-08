import {UISystemState} from "~/app/systems/UISystem";
import {AtomEffect} from "recoil";
import UI from "~/app/ui/UI";

export const bidirectionalSyncEffect = <T extends keyof UISystemState>(key: T): AtomEffect<UISystemState[T]> => ({setSelf, trigger, onSet}) => {
	if (trigger === 'get') {
		setSelf(UI.getStateFieldValue(key));
	}

	onSet((newValue) => {
		UI.setStateFieldValue(key, newValue);
	});

	const listener = (newValue: any): void => {
		setSelf(newValue);
	}

	UI.addListener(key, listener);

	return () => {
		UI.removeListener(key, listener);
	};
};