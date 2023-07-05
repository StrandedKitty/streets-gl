import React, {useContext, useEffect} from "react";
import {ActionsContext} from "~/app/ui/UI";
import Countries from "./countries.json";
import styles from "./SavedPlace.scss";
import {MdContentCopy} from "react-icons/md";
import {AiFillDelete} from "react-icons/ai";
import {AiFillEdit, AiTwotoneSave} from "react-icons/ai";

const URLBase = 'https://streets.gl/#'

export interface SavedPlaceParams {
	id: string;
	name: string;
	lat: number;
	lon: number;
	pitch: number;
	yaw: number;
	distance: number;
	link: string;
	countryCode: string;
	address: string;
}

function getCountryFlag(code: string): string {
	const entry = Countries[code as keyof typeof Countries];

	if (!entry) {
		return '🌍';
	}

	return entry.flag;
}

const SavedPlace: React.FC<{
	params: SavedPlaceParams;
	onDelete: () => void;
	onParamsChange: (params: SavedPlaceParams) => void;
}> = ({params, onDelete, onParamsChange}) => {
	const actions = useContext(ActionsContext);
	const [isEditing, setIsEditing] = React.useState<boolean>(false);
	const inputRef = React.useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isEditing) {
			inputRef.current?.focus();
		}
	}, [isEditing]);

	const saveNewName = (): void => {
		setIsEditing(false);
		inputRef.current?.scroll({
			top: 0,
			left: 0,
			behavior: 'auto'
		});

		onParamsChange({
			...params,
			name: inputRef.current?.innerText ?? ''
		});
	};

	let titleClassNames = styles.title__text;
	if (isEditing) {
		titleClassNames += ' ' + styles['title__text--editing'];
	}

	return <div className={styles.container}>
		<div className={styles.container__info}>
			<div className={styles.container__info__title}>
				<div className={styles.title}>
					<div
						className={titleClassNames}
						contentEditable={isEditing}
						suppressContentEditableWarning={true}
						ref={inputRef}
						onKeyDown={(e): void => {
							if (e.code === 'Enter') {
								e.preventDefault();
								saveNewName();
							}
						}}
					>
						{params.name}
					</div>
					<div
						className={styles.title__icon}
					>
						{isEditing ? (
							<AiTwotoneSave size={14} onClick={(): void => {
								saveNewName();
							}} />
						) : (
							<AiFillEdit size={14} onClick={(): void => {
								setIsEditing(true);
							}} />
						)}
					</div>
				</div>
			</div>
			<div className={styles.container__info__address}>
				<div className={styles.address}>
					<div className={styles.address__name}>{getCountryFlag(params.countryCode)} {params.address}</div>
					<div className={styles.address__position}>{params.lat},{params.lon}</div>
				</div>
			</div>
		</div>
		<div className={styles.container__controls}>
			<button
				className={styles.container__controls__button}
				onClick={(): void => {
					actions.goToState(params.lat, params.lon, params.pitch, params.yaw, params.distance);
				}}
			>
				Go
			</button>
			<button
				className={styles.container__controls__button}
				onClick={(): void => {
					navigator.clipboard.writeText(`${URLBase}${params.link}`);
				}}
			>
				<MdContentCopy size={16} />
			</button>
			<button
				className={styles.container__controls__button}
				onClick={onDelete}
			>
				<AiFillDelete size={16} />
			</button>
		</div>
	</div>;
};

export default React.memo(SavedPlace);