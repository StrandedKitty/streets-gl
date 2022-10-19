import React, {useCallback, useRef, useState} from "react";
import {IoSettingsOutline, IoInformationOutline} from 'react-icons/io5';

const Nav: React.FC = () => {
	return (
		<div className='nav'>
			<button className='nav-icon'><IoSettingsOutline size={24} /></button>
			<button className='nav-icon'><IoInformationOutline size={24} /></button>
		</div>
	);
}

export default Nav;