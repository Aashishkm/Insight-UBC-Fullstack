import {InsightDataset, InsightDatasetKind} from "../controller/IInsightFacade";
import {CourseModel} from "./CourseModel";
import {SectionModel} from "./SectionModel";
export class DatasetModel {
	public courses: CourseModel[];
	public sections: SectionModel[];
	public insightDataset: InsightDataset ;

	constructor(insightDataset: InsightDataset) {
		this.insightDataset = insightDataset;
	}
}
