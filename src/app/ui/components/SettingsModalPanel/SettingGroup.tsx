import React, {useContext} from "react";
import {AtomsContext} from "~/app/ui/UI";
import {useRecoilValue} from "recoil";
import SettingAuto from "~/app/ui/components/SettingsModalPanel/SettingAuto";

export interface SettingsGroupStructure {
	parent: string;
	children: string[];
}

const SettingGroup: React.FC<{
	group: SettingsGroupStructure;
}> = ({group}) => {
	const atoms = useContext(AtomsContext);
	const parentSettings = useRecoilValue(atoms.settingsObject(group.parent));

	return <div>
		<SettingAuto key={group.parent} id={group.parent}/>
		{
			group.children.map(child => <SettingAuto key={child} id={child} parent={parentSettings}/>)
		}
	</div>;
}

export default React.memo(SettingGroup);