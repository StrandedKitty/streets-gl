import React, {useContext} from "react";
import {ActionsContext} from "~/app/ui/UI";

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

	return <div className='search-list'>
		{list.map((result, i) => {
			let nameClassNames = 'search-list-item-name';

			if (result.name.length > 40) {
				nameClassNames += ' search-list-item-name-small'
			}

			return (
				<div
					className='search-list-item'
					onClick={(): void => {
						actions.goToLatLon(result.lat, result.lon);
						//setCurrentResults(null);
					}}
					key={i}
				>
					<div className={nameClassNames}>{result.name}</div>
					<div className='search-list-item-type'>{result.type}</div>
				</div>
			);
		})}
	</div>
}

export default React.memo(SearchResults);