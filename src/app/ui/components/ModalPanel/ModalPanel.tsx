import React from "react";
import {IoCloseOutline} from "react-icons/io5";
import './ModalPanel.scss';

const ModalPanel: React.FC<{
	title: string;
	onClose: () => void;
	children: React.ReactNode;
}> = (
	{
		title,
		onClose,
		children
	}
) => {
	return (
		<div className='modal'>
			<div
				className='modal-close'
				onClick={onClose}
			>
				<IoCloseOutline size={36}/>
			</div>
			<div className='modal-header'>{title}</div>
			<div className='modal-body'>{children}</div>
		</div>
	);
}

export default React.memo(ModalPanel);