import {InsightDataset, InsightDatasetKind} from "../controller/IInsightFacade";

export class DatasetModel {
	public insightDataset: InsightDataset;

	constructor(insightDataset: InsightDataset) {
		this.insightDataset = insightDataset;
	}
}
