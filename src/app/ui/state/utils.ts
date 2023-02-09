import {AtomEffect} from "recoil";

interface Storage {
	getStateFieldValue(key: string): any;
	setStateFieldValue(key: string, value: any): void;
	addListener(key: string, listener: (value: any) => void): void;
	removeListener(key: string, listener: (value: any) => void): void;
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

	storage.addListener(key, listener);

	return () => {
		storage.removeListener(key, listener);
	};
};