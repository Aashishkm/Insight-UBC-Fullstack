import {DataProcessorModel} from "./DataProcessorModel";
import {InsightError} from "./IInsightFacade";
import {parse} from "parse5";
import {RoomDatasetModel} from "../Models/RoomDatasetModel";
import {BuildingModel} from "../Models/BuildingModel";
import JSZip from "jszip";
import * as http from "http";
import InsightFacade from "./InsightFacade";

export class RoomsProcessorHelper {
	public parseRooms(indexData: string, processor: DataProcessorModel, insight: InsightFacade): Promise<any> {
		let buildingList: BuildingModel[];
		let parsedIndex = parse(indexData);
		let promiseArray = Array<Promise<any>>();
		let roomsPromiseArray = Array<Promise<any>>();
		let buildingTableNode = this.getBuildingTableNode(parsedIndex);
		let newZip = new JSZip();
		// console.log(tableNode);
		buildingList = this.saveBuildingList(buildingTableNode);
		for (let b of buildingList) {
			promiseArray.push(this.getGeoLocation(b));
		}
		Promise.all(promiseArray).then((result) => {
			console.log("hi");
			/*
			buildingList.forEach((b: BuildingModel) => {
				getRoomFile();
				newZip.file(b.roomsPath)!.async("text")
					.then((file) => {
						return Promise.reject(new InsightError("bad"));
					});
			}); */
		});
		// console.log(buildingList);
		return Promise.reject(new InsightError("bad"));
	}

	public getBuildingTableNode(file: any): any {
		if (file.nodeName === "tbody") {
			if (this.checkPotentialTable(file) === true) {
				return file;
			}
		}

		if (file.childNodes !== undefined && file.childNodes !== null) {
			for (let nodes of file.childNodes) {
				let result = this.getBuildingTableNode(nodes);
				if (result !== false) {
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
		let shortname: string = "bad";
		let fullname: string = "bad";
		let address: string = "bad";
		let href: string = "bad";
		let roomsPath: string = "bad";
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
							// we want to slice out the dot/slash when we are trying to access the rooms data later on
							roomsPath = href.slice(2);
						}
						if (babyNodes.attrs[0].value === "views-field views-field-field-building-address") {
							address = babyNodes.childNodes[0].value;
							address = address.trim();
						}
					}
				}
				if (
					fullname === "bad" ||
					shortname === "bad" ||
					href === "bad" ||
					address === "bad" ||
					roomsPath === "bad"
				) {
					continue;
				}
				let building = new BuildingModel(fullname, shortname, address, href, roomsPath);
				returnArray.push(building);
			}
		}
		return returnArray;
	}

	public getGeoLocation(b: BuildingModel): Promise<any> {
		let data = "";
		let link = encodeURI(b.address);
		let resultData: any;
		let linkForReturn = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team129/" + link;
		let returnPromise = new Promise<any>((resolve, reject) => {
			// used similar idea to this: https://www.memberstack.com/blog/node-http-request
			try {
				http.get(linkForReturn, (result: any) => {
					result.on("data", (chunk: any) => {
						data += chunk;
					});

					result.on("end", () => {
						resultData = JSON.parse(data);
						if (resultData.lat && resultData.lon) {
							b.lat = resultData.lat;
							b.lon = resultData.lon;
							return resolve(b);
						} else {
							// handle if lat/lon is invalid in the rooms part
							return reject(b);
						}
					});
				});
			} catch(error) {
				return reject(new InsightError("link doesn't work"));
			}
		});
		return returnPromise;
	}
}
