import {InsightDataset, InsightDatasetKind} from "../controller/IInsightFacade";
import {CourseModel} from "./CourseModel";
import {SectionModel} from "./SectionModel";
import {DatasetModel} from "./DatasetModel";
import {RoomModel} from "./RoomModel";
import {BuildingModel} from "./BuildingModel";
export class RoomDatasetModel extends DatasetModel {
	public rooms: RoomModel[];
	public buildings: BuildingModel[];
	constructor(insightDataset: InsightDataset) {
		super(insightDataset);
		this.rooms = [];
		this.buildings = [];
	}
}
