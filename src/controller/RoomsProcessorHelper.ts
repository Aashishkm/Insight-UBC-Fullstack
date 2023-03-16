import {DataProcessorModel} from "./DataProcessorModel";
import {InsightError} from "./IInsightFacade";
import {parse} from "parse5";
import {RoomDatasetModel} from "../Models/RoomDatasetModel";
import {BuildingModel} from "../Models/BuildingModel";

export class RoomsProcessorHelper {
	public parseRooms(indexData: string, processor: DataProcessorModel): Promise<any> {
		let buildingList: BuildingModel[];
		let parsedIndex = parse(indexData);
		let tableNode = this.getBuildingTableNode(parsedIndex);
		// console.log(tableNode);
		buildingList = this.saveBuildingList(tableNode);
		// console.log(buildingList);
		return Promise.reject(new InsightError("bad"));
	}

	public getBuildingTableNode(file: any): any {
		if (file.nodeName === "tbody") {
			if (this.checkPotentialTable(file) === true) {
				return file;
			}
		}

		if (file.childNodes !== undefined &&  file.childNodes !== null) {
			for (let nodes of file.childNodes) {
				let result = this.getBuildingTableNode(nodes);
				if ( result !== false) {
					return result;
				}
			}
		}
		return false;
	}

	public checkPotentialTable(file: any): boolean {
		 let flag1 = false;
		 let flag2 = false;
		 let flag3 = false;
		 let flag4 = false;
		 let flag5 = false;
		 if (file.childNodes === undefined || file.childNodes === null) {
			return false;
		 }
		 for (let nodes of file.childNodes) {
			 if (nodes.nodeName === "tr") {
				 for (let babyNodes of nodes.childNodes) {
					 if (babyNodes.nodeName === "td") {
						 if (babyNodes.attrs[0].value === "views-field views-field-nothing") {
							 flag1 = true;
						 }
						 if (babyNodes.attrs[0].value === "views-field views-field-field-building-code") {
							 flag2 = true;
						 }
						 if (babyNodes.attrs[0].value === "views-field views-field-title") {
							 flag3 = true;
						 }
						 if (babyNodes.attrs[0].value === "views-field views-field-field-building-address") {
							 flag4 = true;
						 }
						 if (babyNodes.attrs[0].value === "views-field views-field-field-building-image") {
							 flag5 = true;
						 }
						 if (flag1 && flag2 && flag3 && flag4 && flag5) {
							 return true;
						 }
					 }
				 }
			 }
		 }
		return false;
	}

	public saveBuildingList(file: any): BuildingModel[] {
		let shortname: string = "";
		let fullname: string = "";
		let address: string = "";
		let href: string = "";
		let returnArray: BuildingModel[] = [];
		for (let nodes of file.childNodes) {
			if (nodes.nodeName === "tr") {
				for (let babyNodes of nodes.childNodes) {
					if (babyNodes.nodeName === "td") {
						if (babyNodes.attrs[0].value === "views-field views-field-field-building-code") {
							shortname = babyNodes.childNodes[0].value;
							shortname = shortname.trim();
						}
						if (babyNodes.attrs[0].value === "views-field views-field-title") {
							fullname = babyNodes.childNodes[1].childNodes[0].value;
							href = babyNodes.childNodes[1].attrs[0].value;
						}
						if (babyNodes.attrs[0].value === "views-field views-field-field-building-address") {
							address = babyNodes.childNodes[0].value;
							address = address.trim();
						}
					}
				}
				let building = new BuildingModel(fullname, shortname, address, href);
				returnArray.push(building);
			}
		}
		return returnArray;
	}

}
