import React from "react";
import './Panel.scss';

const Panel: React.FC<{
	className: string;
}> = ({className, children}) => {
	return <div className={className + ' ' + 'panel'}>{children}</div>;
}

export default Panel;