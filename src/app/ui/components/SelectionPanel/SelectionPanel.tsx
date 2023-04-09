import React, {useCallback, useContext, useEffect, useState} from "react";
import {useRecoilState} from "recoil";
import styles from "./SelectionPanel.scss";
import Panel from "~/app/ui/components/Panel";
import {AtomsContext} from "~/app/ui/UI";
import Skeleton, {SkeletonTheme} from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';
import buildingTypes from "~/app/ui/components/SelectionPanel/buildingTypes";
import ModalButton from "~/app/ui/components/ModalButton";

enum FeatureType {
	Way,
	Relation
}

interface FeatureDescription {
	name: string;
	typeAndID: string;
	tags: Record<string, string>;
	osmURL: string;
	idURL: string;
}

const getOSMURL = (type: FeatureType, id: number): string => {
	const typeStr = type === FeatureType.Way ? 'way' : 'relation';

	return `https://www.openstreetmap.org/api/0.6/${typeStr}/${id}.json`;
}

const getType = (tags: Record<string, string>): string => {
	return buildingTypes[tags.building] ?? buildingTypes.yes;
}

const getTags = (tags: Record<string, string>): JSX.Element => {
	const rows = Object.entries(tags).map(([key, value], i) => {
		return (
			<tr key={i}>
				<td>{key}</td>
				<td>{value}</td>
			</tr>
		)
	});

	return (
		<table className={styles.tags__table}>
			<tbody>
				{rows}
			</tbody>
		</table>
	);
}

const SelectionPanel: React.FC = () => {
	const atoms = useContext(AtomsContext);
	const [activeFeature, setActiveFeature] = useRecoilState(atoms.activeFeature);
	const [description, setDescription] = useState<FeatureDescription>(null);

	const closeCallback = useCallback(() => {
		if (activeFeature === null) {
			setDescription(null);
		}
	}, [activeFeature]);

	useEffect(() => {
		if (!activeFeature) {
			return;
		}

		let loaded = false;
		setTimeout(() => {
			if (!loaded) {
				setDescription(null);
			}
		}, 500);

		const type = activeFeature.type === 0 ? FeatureType.Way : FeatureType.Relation;
		const id = activeFeature.id;

		const osmRequest = fetch(getOSMURL(type, id), {
			method: 'GET'
		});

		osmRequest.then(async osmResponse => {
			const osm = await osmResponse.json();

			if (!osm.elements || osm.elements.length === 0) {
				return;
			}

			loaded = true;

			const tags = osm.elements[0].tags ?? {};
			const name = tags.name ?? 'Unnamed building';
			const featureType = activeFeature.type === 0 ? 'Way' : 'Relation';
			const type = getType(tags);
			const osmURL = `https://www.openstreetmap.org/${activeFeature.type === 0 ? 'way' : 'relation'}/${id}`;
			const idURL = `https://www.openstreetmap.org/edit?${activeFeature.type === 0 ? 'way' : 'relation'}=${id}`;

			setDescription({
				name,
				typeAndID: `${type} · ${featureType} №${id}`,
				osmURL,
				idURL,
				tags
			});
		});
	}, [activeFeature]);

	let innerClassNames = styles.selectionInfo;
	if (activeFeature === null) {
		innerClassNames += ' ' + styles['selectionInfo--hidden'];
	}

	const tags = description ? getTags(description.tags) : null;

	return (
		<Panel className={styles.selectionInfoPanel}>
			<div className={innerClassNames} onTransitionEnd={closeCallback}>
				<button
					className={styles.selectionInfo__close}
					onClick={(): void => {
						setActiveFeature(null);
					}}
				>×
				</button>
				<SkeletonTheme
					baseColor="#fff"
					highlightColor="#ddd"
					duration={2}
				>
					<div className={styles.selectionInfo__header}>
						{
							description ?
								description.name :
								<Skeleton className={styles.skeleton} width={'50%'}/>
						}
					</div>
					<div className={styles.selectionInfo__description}>
						{
							description ?
								description.typeAndID :
								<Skeleton className={styles.skeleton} width={'55%'}/>
						}
					</div>
					<div className={styles.links}>
						{
							description ? (
								<a className={styles.links__anchor} href={description.osmURL} target='_blank'>
									<ModalButton
										icon={<div className={styles.imageIcon + ' ' + styles['imageIcon--osm']} />}
										text={'Open on openstreetmap.org'}
									/>
								</a>
							) : (
								<Skeleton
									className={styles.skeleton + ' ' + styles['skeleton--button']}
									width={'205px'}
									height={'30px'}
									borderRadius={'100px'}
								/>
							)
						}
						{
							description ? (
								<a className={styles.links__anchor} href={description.idURL} target='_blank'>
									<ModalButton
										icon={<div className={styles.imageIcon + ' ' + styles['imageIcon--id']} />}
										text={'Edit in iD'}
									/>
								</a>
							) : (
								<Skeleton
									className={styles.skeleton + ' ' + styles['skeleton--button']}
									width={'93px'}
									height={'30px'}
									borderRadius={'100px'}
								/>
							)
						}
					</div>
					{
						tags ? (
							<div className={styles.tags}>{tags}</div>
						) : (
							<Skeleton className={styles.skeleton} height={'135px'} borderRadius={'12px'}/>
						)
					}
				</SkeletonTheme>
			</div>
		</Panel>
	);
}

export default React.memo(SelectionPanel);