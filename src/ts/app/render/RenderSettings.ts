export enum RenderFeatureStatus {
	Enabled,
	Disabled
}

export enum RenderFeatureQuality {
	Low,
	Medium,
	High
}

export interface RenderFeature {
	status?: RenderFeatureStatus;
	quality?: RenderFeatureQuality;
}

export default new class RenderSettings {
	private static readonly defaultFeature: RenderFeature = {
		status: RenderFeatureStatus.Disabled
	};
	private readonly renderFeatures: Record<string, RenderFeature> = {};

	public getFeatureInfo(featureName: string): RenderFeature {
		return this.renderFeatures[featureName] || RenderSettings.defaultFeature;
	}

	public setFeatureInfo(featureName: string, featureInfo: RenderFeature): void {
		this.renderFeatures[featureName] = featureInfo;
	}
}