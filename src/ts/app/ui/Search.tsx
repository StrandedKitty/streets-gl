import React from "react";
import { IoSearch } from 'react-icons/io5';

export default class Search extends React.Component {
	public render(): JSX.Element {
		return (
			<div className='search'>
				<div className='search-title'>
					<div className='svg-icon-wrapper'><IoSearch size={16} /></div>
					<div>Search</div>
				</div>
			</div>
		);
	}
}