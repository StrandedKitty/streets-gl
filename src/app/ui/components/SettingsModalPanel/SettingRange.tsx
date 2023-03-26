import React, {useContext} from "react";
import styles from "./Setting.scss";
import {AtomsContext} from "~/app/ui/UI";
import {useRecoilState, useRecoilValue} from "recoil";
import {SettingsSchemaRangeScale} from "~/app/settings/SettingsSchema";
import Setting from "./Setting";

const logToLinear = (min: number, max: number, value: number): number => {
	const norm = (value - min) / (max - min);
	return min + Math.pow(norm, 1 / 5) * (max - min);
};

const linearToLog = (min: number, max: number, value: number): number => {
	const norm = (value - min) / (max - min);
	return min + Math.pow(norm, 5) * (max - min);
};

const toFixedWithoutZeros = (num: number, precision: number): string => {
	return num.toFixed(precision).replace(/(\.0+|0+)$/, '');
};

const SettingRange: React.FC<{
	id: string;
}> = ({id}) => {
	const atoms = useContext(AtomsContext);
	const [settingValue, setSettingValue] = useRecoilState(atoms.settingsObject(id));
	const schema = useRecoilValue(atoms.settingsSchema)[id];

	return <Setting name={schema.label} isSub={!!schema.parent}>
		<div className={styles.range}>
			<div className={styles.range__value}>{toFixedWithoutZeros(settingValue.numberValue, 4)}</div>
			<input
				className={styles.range__input}
				type='range'
				min={schema.selectRange[0]}
				max={schema.selectRange[1]}
				step={schema.selectRange[2]}
				value={schema.selectRangeScale === SettingsSchemaRangeScale.Logarithmic ?
					logToLinear(schema.selectRange[0], schema.selectRange[1], settingValue.numberValue) :
					settingValue.numberValue
				}
				onChange={(e): void => {
					const numberValue = schema.selectRangeScale === SettingsSchemaRangeScale.Logarithmic ?
						linearToLog(schema.selectRange[0], schema.selectRange[1], +e.target.value) :
						+e.target.value;

					setSettingValue({
						...settingValue,
						numberValue
					});
				}}
			/>
			<div
				className={styles.range__footer}>
				<span
					className={styles.range__footer__minMax + ' ' + styles['range__footer__minMax--left']}>
					{schema.selectRange[0]}
				</span>
				<span
					className={styles.range__footer__minMax + ' ' + styles['range__footer__minMax--right']}>
					{schema.selectRange[1]}
				</span>
			</div>
		</div>
	</Setting>
}

export default React.memo(SettingRange);