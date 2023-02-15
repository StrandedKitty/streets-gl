import React, {useEffect, useReducer, useState} from "react";
import ModalPanel, {TableStyles} from "~/app/ui/components/ModalPanel";
import SettingsManager, {SettingsConfigType, SettingsSelectRangeScale, SettingsValues} from "~/app/ui/SettingsManager";
import styles from './SettingsModalPanel.scss';

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

const getSettingsFields = (
	settingsConfig: SettingsConfigType,
	settingsValues: SettingsValues,
	parent?: string,
	accum?: JSX.Element[],
	level: number = 0
): JSX.Element[] => {
	if (!accum) {
		accum = [];
	}

	return Object.entries(settingsConfig).map(([key, config]) => {
		if (config.parent !== parent) {
			return null;
		}

		if (config.parent && config.parentStatusCondition) {
			if (!config.parentStatusCondition.includes(settingsValues[parent].statusValue)) {
				return null;
			}
		}

		const value = settingsValues[key];
		const options = config.status || [];
		const children = getSettingsFields(settingsConfig, settingsValues, key, accum, level + 1);

		return (
			<React.Fragment key={key}>
				<tr>
					<td style={{paddingLeft: `${level * 20}px`}}>{config.label}</td>
					<td>
						{
							options.length !== 0 && (
								<select
									className={styles.select}
									value={value.statusValue}
									onChange={(e): void => {
										SettingsManager.updateSetting(key, {
											...value,
											statusValue: e.target.value
										});
									}}
								>
									{
										options.map((option, i) => {
											return <option
												key={option}
												value={option}
											>{config.statusLabels[i]}</option>;
										})
									}
								</select>
							)
						}
						{
							config.selectRange && (
								<div className={styles.range}>
									<div className={styles.range__value}>{toFixedWithoutZeros(value.numberValue, 4)}</div>
									<input
										className={styles.range__input}
										type='range'
										min={config.selectRange[0]}
										max={config.selectRange[1]}
										step={config.selectRange[2]}
										value={config.selectRangeScale === SettingsSelectRangeScale.Logarithmic ?
											logToLinear(config.selectRange[0], config.selectRange[1], value.numberValue) :
											value.numberValue
										}
										onChange={(e): void => {
											const numberValue = config.selectRangeScale === SettingsSelectRangeScale.Logarithmic ?
												linearToLog(config.selectRange[0], config.selectRange[1], +e.target.value) :
												+e.target.value;

											SettingsManager.updateSetting(key, {
												...value,
												numberValue
											});
										}}
									/>
									<div className={styles.range__footer}>
										<span className={styles.range__footer__minMax + ' ' + styles['range__footer__minMax--left']}>
											{config.selectRange[0]}
										</span>
										<span className={styles.range__footer__minMax + ' ' + styles['range__footer__minMax--right']}>
											{config.selectRange[1]}
										</span>
									</div>
								</div>
							)
						}
					</td>
				</tr>
				<>{children}</>
			</React.Fragment>
		);
	});
}

const SettingsModalPanel: React.FC<{
	onClose: () => void;
}> = (
	{
		onClose
	}
) => {
	const [, forceUpdate] = useReducer(x => x + 1, 0);
	const settingsConfig = SettingsManager.config;
	const values = SettingsManager.getAllSettings();

	useEffect(() => {
		SettingsManager.onAnySettingChange(v => {
			forceUpdate();
		});
	}, []);

	return <ModalPanel title={'Settings'} onClose={onClose}>
		<table className={TableStyles.modalTable}>
			<tbody>
				{values && getSettingsFields(settingsConfig, values)}
			</tbody>
		</table>
		<button
			className={styles.resetButton}
			onClick={(): void => {
				SettingsManager.resetAllSettings();
			}}
		>Reset to default values</button>
	</ModalPanel>;
}

export default React.memo(SettingsModalPanel);