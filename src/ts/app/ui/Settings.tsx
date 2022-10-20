import React from "react";
import {IoCloseOutline} from 'react-icons/io5';

const Settings: React.FC<{onClose: () => void}> = (
	{
		onClose
	}
) => {
	return (
		<div className='modal'>
			<div
				className='modal-close'
				onClick={onClose}
			>
				<IoCloseOutline size={36} />
			</div>
			<div className='modal-header'>Settings</div>
		</div>
	);
}

export default Settings;