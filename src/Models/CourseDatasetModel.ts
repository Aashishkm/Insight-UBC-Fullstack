import {InsightDataset, InsightDatasetKind} from "../controller/IInsightFacade";
import {CourseModel} from "./CourseModel";
import {SectionModel} from "./SectionModel";
import {DatasetModel} from "./DatasetModel";
export class CourseDatasetModel extends DatasetModel {
	public courses: CourseModel[];
	public sections: SectionModel[];

	constructor(insightDataset: InsightDataset) {
		super(insightDataset);
		this.courses = [];
		this.sections = [];
	}
}
