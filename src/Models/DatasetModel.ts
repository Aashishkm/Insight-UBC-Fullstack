import {InsightDataset, InsightDatasetKind} from "../controller/IInsightFacade";
import {CourseModel} from "./CourseModel";
import {SectionModel} from "./SectionModel";
import {Data} from "./Data";
export class DatasetModel extends Data {
	public courses: CourseModel[];
	public sections: SectionModel[];

	constructor(insightDataset: InsightDataset) {
		super(insightDataset);
		this.courses = [];
		this.sections = [];
	}
}
