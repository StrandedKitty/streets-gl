import React from "react";
import styles from './InfoModalPanel.scss';
import ModalPanel, {ParStyles, TableStyles} from "~/app/ui/components/ModalPanel";
import {IoLogoGithub} from "react-icons/io5";
import ModalCategoryContainer from "~/app/ui/components/ModalPanel/ModalCategoryContainer";
import ModalCategory from "~/app/ui/components/ModalPanel/ModalCategory";
import ModalPar from "~/app/ui/components/ModalPanel/ModalPar";

const RepositoryURL = 'https://github.com/StrandedKitty/streets-gl';

const Key: React.FC<{text: string}> = ({text}) => {
	return <kbd className={styles.keyboardKey}>{text}</kbd>;
};

const InfoModalPanel: React.FC<{
	onClose: () => void;
}> = (
	{
		onClose
	}
) => {
	return <ModalPanel title={'Information'} onClose={onClose}>
		<ModalCategoryContainer>
			<ModalCategory>
				<ModalPar>
					<a
						href={RepositoryURL}
						target={'_blank'}
						className={ParStyles.modalPar__anchor}
					>
						<IoLogoGithub size={16} className={ParStyles.modalPar__anchor__icon}/>
						GitHub repository
					</a>
				</ModalPar>
				<ModalPar isSmall={true}>
					Streets GL v{VERSION}
					{' '}
					<a
						href={`https://github.com/StrandedKitty/streets-gl/commit/${COMMIT_SHA}`}
						target={'_blank'}
						className={ParStyles.modalPar__anchor}
					>
						{COMMIT_SHA.slice(0, 7)}
					</a>
					{' '}
					{COMMIT_BRANCH}
				</ModalPar>
			</ModalCategory>
		</ModalCategoryContainer>
		<ModalCategoryContainer>
			<ModalCategory label={'Keyboard and mouse controls'}>
				<table className={TableStyles.modalTable}>
					<tbody>
						<tr>
							<td><Key text='Ctrl'/> + <Key text='U'/></td>
							<td>Toggle UI visibility</td>
						</tr>
						<tr>
							<td><Key text='Tab'/></td>
							<td>Toggle between ground camera mode (default) and free camera mode</td>
						</tr>
						<tr>
							<td><Key text='W'/> <Key text='A'/> <Key text='S'/> <Key text='D'/> (+ <Key text='Shift'/> ) or left mouse button</td>
							<td>Camera movement</td>
						</tr>
						<tr>
							<td><Key text='Q'/> <Key text='E'/> <Key text='R'/> <Key text='F'/> or right mouse button</td>
							<td>Camera pitch and yaw</td>
						</tr>
						<tr>
							<td>Middle mouse button</td>
							<td>2x camera zoom</td>
						</tr>
					</tbody>
				</table>
			</ModalCategory>
		</ModalCategoryContainer>
	</ModalPanel>;
}

export default React.memo(InfoModalPanel);