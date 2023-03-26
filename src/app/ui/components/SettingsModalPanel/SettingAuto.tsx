import React, {useContext} from "react";
import {SettingsObjectEntry} from "~/app/settings/SettingsObject";
import {AtomsContext} from "~/app/ui/UI";
import {useRecoilValue} from "recoil";
import SettingRange from "~/app/ui/components/SettingsModalPanel/SettingRange";
import SettingSelect from "~/app/ui/components/SettingsModalPanel/SettingSelect";

const SettingAuto: React.FC<{
	id: string;
	parent?: SettingsObjectEntry;
}> = ({id, parent}) => {
	const atoms = useContext(AtomsContext);
	const schema = useRecoilValue(atoms.settingsSchema)[id];

	if (schema.parent && schema.parentStatusCondition && parent) {
		if (!schema.parentStatusCondition.includes(parent.statusValue)) {
			return null;
		}
	}

	if (schema.status) {
		return <SettingSelect id={id}/>;
	}

	if (schema.selectRange) {
		return <SettingRange id={id}/>;
	}

	return null;
}

export default React.memo(SettingAuto);