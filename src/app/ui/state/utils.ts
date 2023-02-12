import {AtomEffect} from "recoil";

interface Storage {
	getStateFieldValue(key: string): any;
	setStateFieldValue(key: string, value: any): void;
	addStateFieldListener(key: string, listener: (value: any) => void): void;
	removeStateFieldListener(key: string, listener: (value: any) => void): void;
}

export const bidirectionalSyncEffect = (key: any, storage: Storage): AtomEffect<any> => (
	{setSelf, trigger, onSet}
) => {
	if (trigger === 'get') {
		setSelf(storage.getStateFieldValue(key));
	}

	onSet((newValue) => {
		storage.setStateFieldValue(key, newValue);
	});

	const listener = (newValue: any): void => {
		setSelf(newValue);
	}

	storage.addStateFieldListener(key, listener);

	return () => {
		storage.removeStateFieldListener(key, listener);
	};
};