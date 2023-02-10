import React, {useCallback, useContext, useEffect, useState} from "react";
import {useRecoilState} from "recoil";
import "./SelectionPanel.scss";
import Panel from "~/app/ui/components/Panel";
import {AtomsContext} from "~/app/ui/UI";
import Skeleton, {SkeletonTheme} from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';
import buildingTypes from "~/app/ui/components/SelectionPanel/buildingTypes";

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

const Tags = (tags: Record<string, string>): JSX.Element => {
	const rows = Object.entries(tags).map(([key, value], i) => {
		return (
			<tr key={i}>
				<td>{key}</td>
				<td>{value}</td>
			</tr>
		)
	});

	return (
		<table className="tags-table">
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

	let innerClassNames = 'selection-info';
	if (activeFeature === null) {
		innerClassNames += ' selection-info-hidden';
	}

	const tags = description ? Tags(description.tags) : null;

	return (
		<Panel className='selection-info-panel'>
			<div className={innerClassNames} onTransitionEnd={closeCallback}>
				<button
					className='selection-info-close'
					onClick={(): void => {
						setActiveFeature(null);
					}}
				>×</button>
				<SkeletonTheme
					baseColor="#fff"
					highlightColor="#ddd"
					duration={2}
				>
					<div className='header'>
						{
							description ?
								description.name :
								<Skeleton className={'selection-skeleton'} width={'50%'}/>
						}
					</div>
					<div className='osm-info'>
						{
							description ?
								description.typeAndID :
								<Skeleton className={'selection-skeleton'} width={'55%'}/>
						}
					</div>
					<div className='links'>
						{
							description ? (
								<a href={description.osmURL} target='_blank'>
									<div className='link link-type-a'>Open on openstreetmap.org</div>
								</a>
							) : (
								<Skeleton className={'selection-skeleton'} width={'210px'} height={'29px'}
								          borderRadius={'100px'}/>
							)
						}
						{
							description ? (
								<a href={description.idURL} target='_blank'>
									<div className='link link-type-b'>Edit in iD</div>
								</a>
							) : (
								<Skeleton className={'selection-skeleton'} width={'80px'} height={'29px'}
								          borderRadius={'100px'}/>
							)
						}
					</div>
					{
						tags ? <div className='tags'>{tags}</div> : (
							<Skeleton className={'selection-skeleton'} height={'135px'} borderRadius={'12px'}/>
						)
					}
				</SkeletonTheme>
			</div>
		</Panel>
	);
}

export default React.memo(SelectionPanel);