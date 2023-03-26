import React from "react";
import Endpoint from "./Endpoint";

interface EndpointConfig {
	url: string;
	isEnabled: boolean;
	isUserDefined: boolean;
}

const Endpoints: React.FC<{
	endpoints: EndpointConfig[];
	setEndpoints: (endpoints: EndpointConfig[]) => void;
}> = ({endpoints, setEndpoints}) => {

	const selectEndpoint = (url: string): void => {
		const newEndpoints = endpoints.map((e) => {
			return {
				...e,
				isEnabled: e.url === url
			}
		});

		setEndpoints(newEndpoints);
	}

	return <>
		{
			endpoints.map((endpoint) => {
				if (!endpoint.isUserDefined) {
					return (
						<Endpoint
							key={endpoint.url}
							url={endpoint.url}
							deletable={false}
							editable={false}
							isSelected={endpoint.isEnabled}
							onSelect={(): void => selectEndpoint(endpoint.url)}
						/>
					);
				}

				return (
					<Endpoint
						key={endpoint.url}
						url={endpoint.url}
						deletable={true}
						editable={false}
						isSelected={endpoint.isEnabled}
						onSelect={(): void => selectEndpoint(endpoint.url)}
					/>
				);
			})
		}
	</>
};

export default React.memo(Endpoints);