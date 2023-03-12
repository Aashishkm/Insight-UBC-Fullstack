import {InsightDataset, InsightDatasetKind} from "../controller/IInsightFacade";
import {CourseModel} from "./CourseModel";
import {SectionModel} from "./SectionModel";
import {DatasetModel} from "./DatasetModel";
import {RoomModel} from "./RoomModel";
export class RoomDatasetModel extends DatasetModel {
	public rooms: RoomModel[];
	constructor(insightDataset: InsightDataset) {
		super(insightDataset);
		this.rooms = [];
	}
}
