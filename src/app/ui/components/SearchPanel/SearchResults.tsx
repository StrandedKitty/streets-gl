import React, {useContext} from "react";
import {ActionsContext} from "~/app/ui/UI";
import styles from './SearchResults.scss';

interface Entry {
	lat: number;
	lon: number;
	name: string;
	type: string;
}

const SearchResults: React.FC<{
	list: Entry[];
}> = ({list}) => {
	const actions = useContext(ActionsContext);

	return <div className={styles.searchList}>
		{list.map((result, i) => {
			let nameClassNames = styles.searchList__item__name;

			if (result.name.length > 40) {
				nameClassNames += ' ' + styles['searchList__item__name--small'];
			}

			return (
				<div
					className={styles.searchList__item}
					onClick={(): void => {
						actions.goToLatLon(result.lat, result.lon);
					}}
					key={i}
				>
					<div className={nameClassNames}>{result.name}</div>
					<div className={styles.searchList__item__type}>{result.type}</div>
				</div>
			);
		})}
	</div>;
}

export default React.memo(SearchResults);