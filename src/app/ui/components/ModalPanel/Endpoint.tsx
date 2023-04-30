import React, {useEffect, useState} from "react";
import styles from "./Endpoint.scss";
import {AiFillDelete, AiFillSave, AiFillEdit} from "react-icons/ai";

const Endpoint: React.FC<{
	url: string;
	editable: boolean;
	deletable: boolean;
	onDelete?: () => void;
	onSave?: (url: string) => void;
	onSwitch?: () => void;
	isEnabled?: boolean;
	forceEditing?: boolean;
}> = ({url, deletable, editable, onDelete, onSave, onSwitch, isEnabled, forceEditing}) => {
	const [isEditing, setIsEditing] = useState<boolean>(false);
	const inputRef = React.useRef<HTMLInputElement>(null);

	let statusClassNames = styles.status;

	if (isEnabled) {
		statusClassNames += ' ' + styles['status--enabled'];
	} else {
		statusClassNames += ' ' + styles['status--disabled'];
	}

	useEffect(() => {
		if (forceEditing) {
			setIsEditing(true);
		}
	}, [forceEditing]);

	useEffect(() => {
		if (isEditing) {
			inputRef.current?.focus();
		}
	}, [isEditing]);

	return (
		<div className={styles.endpoint}>
			<div className={styles.endpoint__info}>
				<div className={styles.endpoint__info__status}>
					<div className={statusClassNames}/>
				</div>
				<div className={styles.endpoint__info__url}>
					{
						isEditing ? (
							<input
								className={styles.input}
								ref={inputRef}
								defaultValue={url}
								placeholder={'Enter URL starting with https://'}
							/>
						) : (
							<div className={styles.title}>{url}</div>
						)
					}
				</div>
			</div>
			<div className={styles.endpoint__controls}>
				{!isEditing && (
					<button
						className={styles.endpoint__controls__button + ' ' + styles['endpoint__controls__button--big']}
						onClick={(): void => {
							if (onSwitch) {
								onSwitch();
							}
						}}
					>
						{isEnabled ? 'Turn off' : 'Turn on'}
					</button>
				)}
				{editable && (
					<button
						className={styles.endpoint__controls__button}
						onClick={(): void => {
							if (isEditing) {
								if (inputRef.current && inputRef.current.value.length > 0 && isEditing) {
									onSave(inputRef.current.value);
									setIsEditing(!isEditing);
								}
							} else {
								setIsEditing(!isEditing);
							}
						}}
					>
						{isEditing ? <AiFillSave size={16}/> : <AiFillEdit size={16}/>}
					</button>
				)}
				{deletable && (
					<button
						className={styles.endpoint__controls__button}
						onClick={onDelete}
					>
						<AiFillDelete size={16}/>
					</button>
				)}
			</div>
		</div>
	);
};

export default React.memo(Endpoint);