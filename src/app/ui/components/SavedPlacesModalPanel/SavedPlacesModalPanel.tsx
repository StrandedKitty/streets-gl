import React, {useContext, useEffect, useLayoutEffect, useRef, useState} from "react";
import ModalPanel from "~/app/ui/components/ModalPanel";
import ModalCategoryContainer from "~/app/ui/components/ModalPanel/ModalCategoryContainer";
import ModalCategory from "~/app/ui/components/ModalPanel/ModalCategory";
import {AiOutlinePlus} from "react-icons/ai";
import ModalButtonRow from "~/app/ui/components/ModalPanel/ModalButtonRow";
import SavedPlace, {SavedPlaceParams} from "~/app/ui/components/SavedPlacesModalPanel/SavedPlace";
import {ActionsContext} from "~/app/ui/UI";
import styles from './SavedPlacesModalPanel.scss';

const SavedPlacesModalPanel: React.FC<{
	onClose: () => void;
}> = ({onClose}) => {
	const actions = useContext(ActionsContext);
	const [savedPlaces, setSavedPlaces] = useState<SavedPlaceParams[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const scrollableListRef = useRef<HTMLDivElement>(null);
	const [scrollToBottom, setScrollToBottom] = useState<boolean>(false);

	const updateLocalStorage = (data: SavedPlaceParams[]): void => {
		localStorage.setItem('savedPlaces', JSON.stringify(data));
	}

	useLayoutEffect(() => {
		const data: SavedPlaceParams[] = [];

		try {
			const userData = localStorage.getItem('savedPlaces');

			if (userData) {
				const parsedData = JSON.parse(userData);

				if (Array.isArray(parsedData)) {
					for (const item of parsedData) {
						const components = item.link.split(',');
						const lat = +components[0];
						const lon = +components[1];
						const pitch = +components[2];
						const yaw = +components[3];
						const distance = +components[4];
						data.push({
							id: item.id,
							name: item.name,
							lat: lat,
							lon: lon,
							pitch: pitch,
							yaw: yaw,
							distance: distance,
							link: item.link,
							countryCode: item.countryCode,
							address: item.address
						});
					}
				}
			}
		} catch (e) {
			console.error(e);
		}

		setSavedPlaces(data);
	}, []);

	useEffect(() => {
		if (scrollToBottom && scrollableListRef.current) {
			scrollableListRef.current.scrollTop = scrollableListRef.current.scrollHeight;
			setScrollToBottom(false);
		}
	}, [scrollToBottom]);

	const addNewPlace = (): void => {
		setIsLoading(true);

		const hash = actions.getControlsStateHash();
		const components = hash.split(',');
		const lat = +components[0];
		const lon = +components[1];

		const urlParams = new URLSearchParams({
			format: 'json',
			addressdetails: '1',
			lat: lat.toString(),
			lon: lon.toString()
		});

		fetch('https://nominatim.openstreetmap.org/reverse?' + urlParams.toString(), {
			method: 'GET'
		}).then(async response => {
			const data = await response.json();

			if (data.error) {
				data.display_name = 'Unknown location';
				data.address = {
					country: 'Earth'
				}
			}

			let address: string;

			if (data.address.state) {
				address = `${data.address.state}, ${data.address.country}`;
			} else {
				address = data.address.country;
			}

			const newPlaces = [...savedPlaces, {
				id: Date.now().toString() + Math.random().toString().slice(2, 10),
				name: data.display_name,
				lat: +components[0],
				lon: +components[1],
				pitch: +components[2],
				yaw: +components[3],
				distance: +components[4],
				link: hash,
				countryCode: data.address.country_code,
				address: address
			}]

			setSavedPlaces(newPlaces);
			updateLocalStorage(newPlaces);

			setIsLoading(false);
			setScrollToBottom(true);
		})
	}

	const deletePlaceByIndex = (index: number): void => {
		const newPlaces = [...savedPlaces];
		newPlaces.splice(index, 1);

		setSavedPlaces(newPlaces);
		updateLocalStorage(newPlaces);
	}

	const updatePlaceByIndex = (index: number, value: SavedPlaceParams): void => {
		const newPlaces = [...savedPlaces];
		newPlaces[index] = value;

		setSavedPlaces(newPlaces);
		updateLocalStorage(newPlaces);
	}

	return <ModalPanel title={'Saved places'} onClose={onClose}>
		<ModalCategoryContainer>
			<ModalCategory>
				{
					savedPlaces.length > 0 ? (
						<div className={styles.savedPlacesList} ref={scrollableListRef}>
							{
								savedPlaces.map((place, i) => {
									return <SavedPlace
										key={place.id}
										params={place}
										onDelete={(): void => {
											deletePlaceByIndex(i);
										}}
										onParamsChange={(place: SavedPlaceParams): void => {
											updatePlaceByIndex(i, place);
										}}
									/>;
								})
							}
						</div>
					) : (
						<div className={styles.savedPlacesPlaceholder}>
							Nothing here yet
						</div>
					)
				}
				<ModalButtonRow
					labels={['Save current position']}
					icons={[
						<AiOutlinePlus size={16}/>,
					]}
					onClicks={[(): void => {
						if (!isLoading) {
							addNewPlace();
						}
					}]}
					loadingFlags={[isLoading]}
				/>
			</ModalCategory>
		</ModalCategoryContainer>
	</ModalPanel>;
}

export default React.memo(SavedPlacesModalPanel);
