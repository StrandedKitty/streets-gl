import React, {useContext, useMemo} from "react";
import ModalPanel from "~/app/ui/components/ModalPanel";
import styles from './SettingsModalPanel.scss';
import {useRecoilValue} from "recoil";
import {ActionsContext, AtomsContext} from "~/app/ui/UI";
import ModalCategory from "~/app/ui/components/ModalPanel/ModalCategory";
import ModalCategoryContainer from "~/app/ui/components/ModalPanel/ModalCategoryContainer";
import Endpoints from "~/app/ui/components/ModalPanel/Endpoints";
import SettingGroup, {SettingsGroupStructure} from "~/app/ui/components/SettingsModalPanel/SettingGroup";
import ModalButtonRow from "~/app/ui/components/ModalPanel/ModalButtonRow";

const SettingsModalPanel: React.FC<{
	onClose: () => void;
}> = ({onClose}) => {
	const atoms = useContext(AtomsContext);
	const actions = useContext(ActionsContext);
	const schema = useRecoilValue(atoms.settingsSchema);
	const endpoints = useRecoilValue(atoms.overpassEndpoints);
	const setEndpoints = actions.setOverpassEndpoints;

	const categorizedGroups = useMemo(() => {
		const categories: Record<string, SettingsGroupStructure[]> = {};

		for (const [key, schemaEntry] of Object.entries(schema)) {
			if (schemaEntry.parent) {
				continue;
			}

			const category = schemaEntry.category;
			const children = Array.from(Object.entries(schema))
				.filter(([_, e]) => e.parent === key)
				.map(el => el[0]);

			const group: SettingsGroupStructure = {
				parent: key,
				children
			};

			if (!categories[category]) {
				categories[category] = [];
			}

			categories[category].push(group);
		}

		return categories;
	}, [schema]);

	return <ModalPanel title={'Settings'} onClose={onClose}>
		<div className={styles.panelBodyContainer}>
			<ModalCategoryContainer>
				<ModalCategory label={'General'}>
					{
						categorizedGroups.general.map(group => {
							return <SettingGroup key={group.parent} group={group}/>
						})
					}
				</ModalCategory>
				<ModalCategory label={'Graphics'}>
					{
						categorizedGroups.graphics.map(group => {
							return <SettingGroup key={group.parent} group={group}/>
						})
					}
				</ModalCategory>
				<ModalButtonRow
					labels={['Reset to defaults']}
					onClicks={[
						(): void => actions.resetSettings()
					]}
				/>
			</ModalCategoryContainer>
			<ModalCategoryContainer>
				<ModalCategory label={'Overpass endpoints'}>
					<Endpoints
						endpoints={endpoints}
						setEndpoints={setEndpoints}
					/>
				</ModalCategory>
				<ModalButtonRow
					labels={['Add endpoint', 'Reset to defaults']}
					onClicks={[
						(): void => { },
						(): void => actions.resetOverpassEndpoints()
					]}
				/>
			</ModalCategoryContainer>
		</div>
	</ModalPanel>;
}

export default React.memo(SettingsModalPanel);