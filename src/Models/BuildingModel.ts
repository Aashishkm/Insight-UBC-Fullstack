import {InsightDataset, InsightDatasetKind} from "../controller/IInsightFacade";
import {SectionModel} from "./SectionModel";
import {RoomModel} from "./RoomModel";
export class BuildingModel {
	public rooms: RoomModel[];


	constructor() {
		this.rooms = [];
	}
}
