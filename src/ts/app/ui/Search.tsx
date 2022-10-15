import React, {useCallback, useRef, useState} from "react";
import {IoSearch, IoCloseOutline} from 'react-icons/io5';

interface SearchResult {
	lat: number;
	lon: number;
	name: string;
	type: string;
}

interface SearchResults {
	list: SearchResult[];
}

const latLonRegex = /^((\-?|\+?)?\d+(\.\d+)?)(,| )\s*((\-?|\+?)?\d+(\.\d+)?)$/;

function matchLatLonString(text: string): [number, number] | null {
	const latLonMatch = text.match(latLonRegex);

	if (!latLonMatch) {
		return null;
	}

	const lat = parseFloat(latLonMatch[1]);
	const lon = parseFloat(latLonMatch[5]);

	if (lat < -85.051129 || lat > 85.051129 || lon < -180 || lon > 180) {
		return null;
	}

	return [lat, lon];
}

async function searchByText(text: string): Promise<SearchResults> {
	text = text.trim();

	const results: SearchResults = {
		list: []
	};

	if (text.length === 0) {
		return results;
	}

	const nominatimURL = `https://nominatim.openstreetmap.org/search.php?q=${text}&format=jsonv2`;
	const response = await fetch(nominatimURL, {
		method: 'POST'
	});
	const jsonResponse = await response.json();

	const latLonMatch = matchLatLonString(text);

	if (latLonMatch) {
		const [lat, lon] = latLonMatch;

		results.list.push({
			lat,
			lon,
			name: `${lat}, ${lon}`,
			type: 'coordinates'
		});
	}

	for (let i = 0; i < Math.min(6, jsonResponse.length); i++) {
		const entry = jsonResponse[i];

		results.list.push({
			lat: parseFloat(entry.lat),
			lon: parseFloat(entry.lon),
			name: entry.display_name,
			type: `${entry.type}, ${entry.category}`,
		});
	}

	return results;
}

function debounce<T extends (...args: any) => void>(cb: T, wait = 1000): T {
	let h: NodeJS.Timeout;
	const callable = (...args: any): void => {
		clearTimeout(h);
		h = setTimeout(() => cb(...args), wait) as any as NodeJS.Timeout;
	};
	return callable as any as T;
}

const Search: React.FC<{
	goToLatLon: (lat: number, lon: number) => void;
}> = ({goToLatLon}) => {
	const [currentResults, setCurrentResults] = useState<SearchResults>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const memoizedCallback = useCallback(debounce((value: string): void => {
		searchByText(value).then(r => {
			setCurrentResults(r);
		});
	}, 1000), []);

	return (
		<div className='search'>
			<div className='search-title'>
				<div className='svg-icon-wrapper'><IoSearch size={20}/></div>
				<input
					type={'text'}
					className={'search-input'}
					placeholder={'Search any place'}
					ref={inputRef}
					onKeyPress={(e): void => {
						if (e.code === 'Enter') {
							const value = (e.target as HTMLInputElement).value;
							searchByText(value).then(r => {
								setCurrentResults(r);
							});
						}
					}}
					onChange={(e): void => {
						const value = (e.target as HTMLInputElement).value;
						memoizedCallback(value);
					}}
				/>
				{inputRef.current && inputRef.current.value.length > 0 && (
					<div
						className='svg-icon-wrapper'
						style={{cursor: 'pointer'}}
						onClick={(): void => {
							inputRef.current.value = '';
							memoizedCallback('');
						}}
					><IoCloseOutline size={28}/></div>
				)}
			</div>
			{currentResults && currentResults.list.length > 0 && (
				<div className='search-list'>
					{currentResults.list.map((result, i) => {
						let nameClassNames = 'search-list-item-name';

						if (result.name.length > 40) {
							nameClassNames += ' search-list-item-name-small'
						}

						return (
							<div
								className='search-list-item'
								onClick={(): void => {
									goToLatLon(result.lat, result.lon);
									setCurrentResults(null);
								}}
								key={i}
							>
								<div className={nameClassNames}>{result.name}</div>
								<div className='search-list-item-type'>{result.type}</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

export default Search;