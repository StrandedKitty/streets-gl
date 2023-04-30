import React, {forwardRef, useImperativeHandle, useState} from "react";
import Endpoint from "./Endpoint";

interface EndpointConfig {
	url: string;
	isEnabled: boolean;
	isUserDefined: boolean;
}

interface RefType {
	createNewEndpoint: () => void;
	stopEditing: () => void;
}

interface PropsType {
	endpoints: EndpointConfig[];
	setEndpoints: (endpoints: EndpointConfig[]) => void;
}

const Endpoints = forwardRef<RefType, PropsType>(({endpoints, setEndpoints}, ref) => {
	const [editableEndpoint, setEditableEndpoint] = useState<EndpointConfig>(null);

	const switchEndpoint = (url: string): void => {
		const newEndpoints = [...endpoints];

		for (let i = 0; i < newEndpoints.length; i++) {
			const endpoint = newEndpoints[i];

			if (endpoint.url === url) {
				newEndpoints[i] = {
					...endpoint,
					isEnabled: !endpoint.isEnabled
				};
			}
		}

		setEndpoints(newEndpoints);
	}

	const updateEndpointURL = (url: string, newURL: string): void => {
		const newEndpoints = [...endpoints];

		for (let i = 0; i < newEndpoints.length; i++) {
			const endpoint = newEndpoints[i];

			if (endpoint.url === url) {
				newEndpoints[i] = {
					...endpoint,
					url: newURL
				};
			}
		}

		setEndpoints(newEndpoints);
	}

	useImperativeHandle(ref, () => ({
		createNewEndpoint(): void {
			if (editableEndpoint) {
				return;
			}

			setEditableEndpoint({
				url: '',
				isEnabled: false,
				isUserDefined: true
			});
		},
		stopEditing(): void {
			setEditableEndpoint(null);
		}
	}), [editableEndpoint]);

	const endpointsToRender = [...endpoints];

	if (editableEndpoint) {
		endpointsToRender.push(editableEndpoint);
	}

	return <>
		{endpointsToRender.map((endpoint) => {
			if (!endpoint.isUserDefined) {
				return (
					<Endpoint
						key={endpoint.url}
						url={endpoint.url}
						deletable={false}
						editable={false}
						isEnabled={endpoint.isEnabled}
						onSwitch={(): void => switchEndpoint(endpoint.url)}
					/>
				);
			}

			return (
				<Endpoint
					key={endpoint.url}
					url={endpoint.url}
					deletable={true}
					editable={true}
					isEnabled={endpoint.isEnabled}
					forceEditing={endpoint === editableEndpoint}
					onSwitch={(): void => switchEndpoint(endpoint.url)}
					onDelete={(): void => {
						if (endpoint === editableEndpoint) {
							setEditableEndpoint(null);
						} else {
							setEndpoints(endpoints.filter((e) => e !== endpoint));
						}
					}}
					onSave={(url): void => {
						if (endpoint === editableEndpoint) {
							editableEndpoint.url = url;
							setEndpoints([...endpoints, editableEndpoint]);
							setEditableEndpoint(null);
						} else {
							updateEndpointURL(endpoint.url, url);
						}
					}}
				/>
			);
		})}
	</>
});

export default Endpoints;