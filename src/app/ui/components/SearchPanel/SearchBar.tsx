import {IoCloseOutline, IoSearch} from "react-icons/io5";
import React, {useRef} from "react";

const SearchBar: React.FC<{
	search: (query: string) => void;
	reset: () => void;
}> = ({search, reset}) => {
	const inputRef = useRef<HTMLInputElement>(null);

	return <div className='search-bar'>
		<div className='svg-icon-wrapper'><IoSearch size={20}/></div>
		<input
			type={'text'}
			className={'search-input'}
			placeholder={'Search any place'}
			ref={inputRef}
			onKeyPress={(e): void => {
				if (e.code === 'Enter') {
					const value = (e.target as HTMLInputElement).value;
					search(value);
				}
			}}
			onChange={(e): void => {
				const value = (e.target as HTMLInputElement).value;
				search(value);
			}}
		/>
		{inputRef.current && inputRef.current.value.length > 0 && (
			<div
				className='svg-icon-wrapper'
				style={{cursor: 'pointer'}}
				onClick={(): void => {
					inputRef.current.value = '';
					reset();
				}}
			><IoCloseOutline size={28}/></div>
		)}
	</div>;
}

export default SearchBar;