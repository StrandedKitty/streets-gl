import React from "react";
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
			<button
				className='modal-close'
				onClick={onClose}
			>×</button>
			<div className='modal-header'>{title}</div>
			<div className='modal-body'>{children}</div>
		</div>
	);
}

export default React.memo(ModalPanel);