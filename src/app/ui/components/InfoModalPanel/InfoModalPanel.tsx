import React from "react";
import styles from './InfoModalPanel.scss';
import ModalPanel from "~/app/ui/components/ModalPanel";
import {IoLogoDiscord, IoLogoGithub} from "react-icons/io5";
import ModalCategoryContainer from "~/app/ui/components/ModalPanel/ModalCategoryContainer";
import ModalCategory from "~/app/ui/components/ModalPanel/ModalCategory";
import ModalPar from "~/app/ui/components/ModalPanel/ModalPar";
import ModalParAnchor from "~/app/ui/components/ModalPanel/ModalParAnchor";

const RepositoryURL = 'https://github.com/StrandedKitty/streets-gl';

const Key: React.FC<{text: string}> = ({text}) => {
	return <kbd className={styles.keyboardKey}>{text}</kbd>;
};

const KeysConfig: {keys: JSX.Element; desc: string}[] = [
	{
		keys: <><Key text='W'/> <Key text='A'/> <Key text='S'/> <Key text='D'/> (+ <Key text='Shift'/> ) or left mouse
			button</>,
		desc: 'Camera movement'
	}, {
		keys: <><Key text='Q'/> <Key text='E'/> <Key text='R'/> <Key text='F'/> or right mouse button</>,
		desc: 'Camera pitch and yaw'
	}, {
		keys: <>Middle mouse button</>,
		desc: '2x camera zoom'
	}, {
		keys: <Key text='Tab'/>,
		desc: 'Toggle between ground camera mode (default) and free camera mode'
	}, {
		keys: <><Key text='Ctrl'/> + <Key text='U'/></>,
		desc: 'Toggle UI visibility'
	}
];

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
				<ModalPar isSmall={true}>
					Streets GL v{VERSION}
					{' '}
					<ModalParAnchor
						href={`https://github.com/StrandedKitty/streets-gl/commit/${COMMIT_SHA}`}
					>
						{COMMIT_SHA.slice(0, 7)}
					</ModalParAnchor>
					{' '}
					{COMMIT_BRANCH}
				</ModalPar>
				<ModalPar>
					<div className={styles.links}>
						<a
							className={styles.anchor}
							href={RepositoryURL}
							target={'_blank'}
						>
							<button className={styles.button}>
								<IoLogoGithub size={16} className={styles.button__icon}/>
								GitHub repository
							</button>
						</a>
						{/*<button className={styles.button}>
							<IoLogoDiscord size={16} className={styles.anchorIcon}/>
							Discord server
						</button>*/}
					</div>
				</ModalPar>
			</ModalCategory>
		</ModalCategoryContainer>
		<ModalCategoryContainer>
			<ModalCategory label={'Keyboard and mouse controls'}>
				<div className={styles.controls}>
					{
						KeysConfig.map(({keys, desc}, i) => (
							<div className={styles.controlsRow} key={i}>
								<div className={styles.controlsRow__desc}>{desc}</div>
								<div className={styles.controlsRow__keys}>{keys}</div>
							</div>
						))
					}
				</div>
			</ModalCategory>
		</ModalCategoryContainer>
	</ModalPanel>;
}

export default React.memo(InfoModalPanel);