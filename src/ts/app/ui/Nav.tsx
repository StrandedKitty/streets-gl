import React from "react";
import {IoInformationOutline, IoSettingsOutline} from 'react-icons/io5';

const Nav: React.FC<{
	setActiveModalWindow: (name: string) => void;
}> = (
	{
		setActiveModalWindow
	}
) => {
	return (
		<div className='nav'>
			<button
				className='nav-icon'
				onClick={(): void => setActiveModalWindow('settings')}
			>
				<IoSettingsOutline size={24}/>
			</button>
			<button
				className='nav-icon'
				onClick={(): void => setActiveModalWindow('info')}
			>
				<IoInformationOutline size={24}/>
			</button>
		</div>
	);
}

export default Nav;