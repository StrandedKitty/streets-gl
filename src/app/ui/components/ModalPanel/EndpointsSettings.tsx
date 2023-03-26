import React from "react";
import Endpoints from "~/app/ui/components/ModalPanel/Endpoints";

interface EndpointConfig {
	url: string;
	isEnabled: boolean;
	isUserDefined: boolean;
}

const EndpointsSetting: React.FC<{
	endpoints: EndpointConfig[];
	setEndpoints: (endpoints: EndpointConfig[]) => void;
	resetEndpoints: () => void;
}> = ({endpoints, setEndpoints}) => {
	return <Endpoints endpoints={endpoints} setEndpoints={setEndpoints}/>;
};

export default React.memo(EndpointsSetting);