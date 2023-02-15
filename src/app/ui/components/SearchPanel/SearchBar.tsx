import {IoCloseOutline, IoSearch} from "react-icons/io5";
import React, {useRef} from "react";
import styles from './SearchBar.scss';

const SearchBar: React.FC<{
	search: (query: string) => void;
	reset: () => void;
}> = ({search, reset}) => {
	const inputRef = useRef<HTMLInputElement>(null);

	return <div className={styles.searchBar}>
		<div className={styles.searchBar__leftIcon + ' ' + styles.icon}><IoSearch size={20}/></div>
		<input
			type={'text'}
			className={styles.searchBar__input}
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
				className={styles.icon}
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