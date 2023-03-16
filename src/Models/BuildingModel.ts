import {InsightDataset, InsightDatasetKind} from "../controller/IInsightFacade";
import {SectionModel} from "./SectionModel";
import {RoomModel} from "./RoomModel";
export class BuildingModel {
	public fullname: string;
	public shortname: string;
	public address: string;

	public lat: number;
	public lon: number;

	public href: string;

	public rooms: RoomModel[];

	constructor(fullname: string, shortname: string, address: string, href: string) {
		this.fullname = fullname;
		this.shortname = shortname;
		this.address = address;
		this.href = href;
		this.lat = 0;
		this.lon = 0;
		this.rooms = [];
	}
}
