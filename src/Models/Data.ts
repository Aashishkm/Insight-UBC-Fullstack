import {InsightDataset, InsightDatasetKind} from "../controller/IInsightFacade";

export class Data {
	public insightDataset: InsightDataset;

	constructor(insightDataset: InsightDataset) {
		this.insightDataset = insightDataset;
	}
}
