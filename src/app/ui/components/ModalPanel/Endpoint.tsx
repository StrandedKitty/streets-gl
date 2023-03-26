import React, {useState} from "react";
import styles from "./Endpoint.scss";
import {AiFillDelete, AiFillSave} from "react-icons/ai";

const Endpoint: React.FC<{
	url: string;
	editable: boolean;
	deletable: boolean;
	onDelete?: () => void;
	onSave?: (url: string) => void;
	onSelect?: () => void;
	isSelected?: boolean;
}> = ({url, deletable, editable, onDelete, onSave, onSelect, isSelected}) => {
	const [inputValue, setInputValue] = useState<string>('');

	return (
		<div className={styles.endpointRow}>
			<div className={styles.endpointRow__radio}>
				{!editable && <input
					className={styles.endpointRow__radio__input}
					type="radio"
					onChange={onSelect}
					checked={isSelected}
				/>}
			</div>
			<div className={styles.endpointRow__content}>
				<div className={styles.endpoint}>
					{
						editable ? (
							<input
								className={styles.endpoint__input}
								value={inputValue}
								onChange={(e): void => setInputValue(e.target.value)}
							/>
						) : (
							<div className={styles.endpoint__title}>{url}</div>
						)
					}
					{editable && (
						<button
							className={styles.endpoint__button}
							onClick={(): void => {
								if (inputValue.length > 0) {
									onSave(inputValue);
								}
							}}
						>
							<AiFillSave size={16}/>
						</button>
					)}
					{deletable && (
						<button
							className={styles.endpoint__button}
							onClick={onDelete}
						>
							<AiFillDelete size={16}/>
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default React.memo(Endpoint);