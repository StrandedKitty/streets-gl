import React, {useCallback, useState} from "react";
import {debounce} from "~/app/ui/utils";
import SearchBar from "~/app/ui/components/SearchPanel/SearchBar";
import SearchResults from "~/app/ui/components/SearchPanel/SearchResults";
import './SearchPanel.scss';
import parseLatLon from "~/app/ui/components/SearchPanel/parseLatLon";

interface SearchResult {
	id: string;
	lat: number;
	lon: number;
	name: string;
	type: string;
}

async function searchByText(text: string): Promise<SearchResult[]> {
	text = text.trim();

	const results: SearchResult[] = [];

	if (text.length === 0) {
		return results;
	}

	const nominatimURL = `https://nominatim.openstreetmap.org/search.php?q=${text}&format=jsonv2`;
	const response = await fetch(nominatimURL, {
		method: 'POST'
	});
	const jsonResponse = await response.json();
	const latLonMatch = parseLatLon(text);

	if (latLonMatch) {
		const [lat, lon] = latLonMatch;
		const name = `${lat}, ${lon}`;

		results.push({
			id: name,
			lat,
			lon,
			name,
			type: 'coordinates'
		});
	}

	for (let i = 0; i < Math.min(6, jsonResponse.length); i++) {
		const entry = jsonResponse[i];

		results.push({
			id: entry.place_id.toString(),
			lat: parseFloat(entry.lat),
			lon: parseFloat(entry.lon),
			name: entry.display_name,
			type: `${entry.type}, ${entry.category}`,
		});
	}

	return results;
}

const SearchPanel: React.FC = () => {
	const [currentResults, setCurrentResults] = useState<SearchResult[]>([]);
	const searchCallback = useCallback(debounce((value: string): void => {
		searchByText(value).then(r => {
			setCurrentResults(r);
		});
	}, 1000), []);
	const resetCallback = useCallback(() => {
		setCurrentResults([]);
	}, []);

	return (
		<div className='search'>
			<SearchBar search={searchCallback} reset={resetCallback}/>
			{currentResults.length > 0 && (
				<SearchResults list={currentResults}/>
			)}
		</div>
	);
}

export default React.memo(SearchPanel);