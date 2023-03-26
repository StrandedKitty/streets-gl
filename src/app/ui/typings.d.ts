declare module "*.scss" {
	const styles: { [className: string]: string };
	export default styles;
}

declare const COMMIT_SHA: string;
declare const COMMIT_BRANCH: string;
declare const VERSION: string;