import {DataProcessorModel} from "./DataProcessorModel";
import {InsightError} from "./IInsightFacade";
import {parse} from "parse5";
import {RoomDatasetModel} from "../Models/RoomDatasetModel";

export class RoomsProcessorHelper {
	public parseRooms(indexData: string, processor: DataProcessorModel): Promise<any> {
		let parsedIndex = parse(indexData);

		return Promise.reject(new InsightError("bad"));
	}

}
