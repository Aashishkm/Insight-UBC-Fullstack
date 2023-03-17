import {
	AnyKey, Filter, Key,
	LogicComparison, MComparison, MFieldRoom, MFieldSection,
	NComparison, SComparison, SField, SFieldRoom, SFieldSection
} from "../Models/QueryModel";
import {CourseDatasetModel} from "../Models/CourseDatasetModel";
import {SectionModel} from "../Models/SectionModel";
import {InsightDatasetKind, InsightError, InsightResult} from "./IInsightFacade";
import {DatasetModel} from "../Models/DatasetModel";
import {Cipher} from "crypto";
import {RoomDatasetModel} from "../Models/RoomDatasetModel";
import {RoomModel} from "../Models/RoomModel";
import {SectionRoomModel} from "../Models/SectionRoomModel";

export default class PerformQueryHelpers {
	// TODO implement ordering
	constructor(idList: SectionModel[], datasets: Map<string, DatasetModel>) {
		this.globalSectionList = idList;
		this.datasets = datasets;
		this.currentQueryingDatasetID = "";
	}

	public globalSectionList: SectionRoomModel[];
	private datasets: Map<string, DatasetModel>;
	private currentQueryingDatasetID: string;
	public applyWhere(filter: Filter, queryingDatasetID: string) {
		this.currentQueryingDatasetID = queryingDatasetID;
		let idList: SectionRoomModel[] = [];
		// if filter is empty e.g. the where clause is empty and should match everywhere
		if (Object.keys(filter).length === 0) {
			const dataset = this.datasets.get(this.currentQueryingDatasetID);
			if (dataset !== undefined) {
				if (dataset instanceof CourseDatasetModel) {
					idList = (dataset as CourseDatasetModel).sections;
				} else if (dataset instanceof RoomDatasetModel) {
					idList = (dataset as RoomDatasetModel).rooms;
				}
			}
		} else {
			idList = this.applyComparison(filter);
		}
		this.globalSectionList = idList;
	}

	public applyColumns(columns: AnyKey[]): InsightResult[] {
		const dataset = this.datasets.get(this.currentQueryingDatasetID);

		if (!this.datasets.has(columns[0].idString)) {
			throw new InsightError("Dataset not added");
		}
		let resultArr: any = [];
		if (dataset instanceof CourseDatasetModel) {
			(this.globalSectionList as SectionModel[]).forEach((section) => {
				let obj: {[key: string]: any} = {};
				(columns as Key[]).forEach((key) => {
					let objProperty = key.idString + "_" + key.field;
					obj[objProperty] = section[(key.field as unknown as SFieldSection | MFieldSection)];
				});
				resultArr.push(obj);
			});
		} else if (dataset instanceof RoomDatasetModel) {
			(this.globalSectionList as RoomModel[]).forEach((room) => {
				let obj: {[key: string]: any} = {};
				(columns as Key[]).forEach((key) => {
					let objProperty = key.idString + "_" + key.field;
					obj[objProperty] = room[(key.field as unknown as SFieldRoom | MFieldRoom)];
				});
				resultArr.push(obj);
			});
		}

		return resultArr;
	}

	public applyComparison(filter: Filter): SectionRoomModel[] {
		if (filter.constructor.name === "LogicComparison") {
			return this.handleLogicComparison(filter as LogicComparison);
		} else if (filter.constructor.name === "SComparison") {
			return this.handleSComparison(filter as SComparison);
		} else if (filter.constructor.name === "MComparison") {
			return this.handleMComparison(filter as MComparison);
		} else if (filter.constructor.name === "NComparison") {
			return this.handleNComparison(filter as NComparison);
		}
		return [];
	}

	public handleLogicComparison(logicComparison: LogicComparison): SectionRoomModel[] {
		const comparator = logicComparison.comparator;
		const filters = logicComparison.filterList;
		if (comparator === "OR") {
			let list: SectionRoomModel[][] = [];
			filters.forEach((filter) => {
				list.push(this.applyComparison(filter));
			});
			return union(list);
		} else {
			let list: SectionRoomModel[][] = [];
			filters.forEach((filter) => {
				list.push(this.applyComparison(filter));
			});
			return intersection(list);
		}
	}

	private handleSComparison(sComparison: SComparison): SectionRoomModel[] {
		let resultSections: SectionRoomModel[] = [];
		const id = sComparison.sKey.idString;
		const sField: SField = sComparison.sKey.field;
		const inputString = sComparison.inputString;
		const dataset = this.datasets.get(id);
		if (dataset !== undefined) {
			if (dataset instanceof CourseDatasetModel) {
				(dataset as CourseDatasetModel).sections.forEach((section) => {
					if (matches(section[sField as unknown as SFieldSection], inputString)) {
						resultSections.push(section);
					}
				});
			} else if (dataset instanceof RoomDatasetModel) {
				(dataset as RoomDatasetModel).rooms.forEach((room) => {
					if (matches(room[sField as unknown as SFieldRoom], inputString)) {
						resultSections.push(room);
					}
				});
			} else {
				throw new InsightError("something went wrong in handleSComparison");
			}
		} else {
			throw new InsightError("dataset not added");
		}
		return resultSections;
	}

	private handleMComparison(mComparison: MComparison): SectionRoomModel[] {
		let resultSections: SectionRoomModel[] = [];
		const id = mComparison.mKey.idString;
		const comparator = mComparison.comparator;
		const mField = mComparison.mKey.field;
		const numComparison = mComparison.num;
		const dataset = this.datasets.get(id);
		if (dataset !== undefined) {
			if (dataset instanceof CourseDatasetModel) {
				dataset.sections.forEach((section) => {
					if (comparator === "LT") {
						if (section[mField as unknown as MFieldSection] < numComparison) {
							resultSections.push(section);
						}
					} else if (comparator === "GT") {
						if (section[mField as unknown as MFieldSection] > numComparison) {
							resultSections.push(section);
						}
					} else if (comparator === "EQ") {
						if (section[mField as unknown as MFieldSection] === numComparison) {
							resultSections.push(section);
						}
					}
				});
			} else if (dataset instanceof RoomDatasetModel) {
				dataset.rooms.forEach((room) => {
					if (comparator === "LT") {
						if (room[mField as unknown as MFieldRoom] < numComparison) {
							resultSections.push(room);
						}
					} else if (comparator === "GT") {
						if (room[mField as unknown as MFieldRoom] > numComparison) {
							resultSections.push(room);
						}
					} else if (comparator === "EQ") {
						if (room[mField as unknown as MFieldRoom] === numComparison) {
							resultSections.push(room);
						}
					}
				});
			}
		} else {
			throw new InsightError("Dataset not added");
		}
		return resultSections;
	}

	// TODO fix this later optimize!
	private handleNComparison(nComparison: NComparison): SectionRoomModel[] {
		const datasetAll = this.datasets.get(this.currentQueryingDatasetID);
		const datasetFiltered = this.applyComparison(nComparison.filter);
		if (datasetAll === undefined) {
			throw new Error("Something went wrong in handleNComparison");
		}
		let res: SectionRoomModel[] = [];
		if (datasetAll instanceof CourseDatasetModel) {
			if (datasetAll) {
				res = datasetAll.sections.filter((section) => {
					return datasetFiltered.indexOf(section) === -1;
				});
			}
		} else if (datasetAll instanceof RoomDatasetModel) {
			if (datasetAll) {
				res = datasetAll.rooms.filter((room) => {
					return datasetFiltered.indexOf(room) === -1;
				});
			}
		}
		return res;
	}

	private isIDinDatasets(id: string): boolean {
		return this.datasets.has(id);
	}

	public applyOrder(order: Key, insightResultList: InsightResult[]): InsightResult[] {
		// TODO finish me!
		let res = insightResultList;
		const orderProperty = order.idString + "_" + order.field;
		res = res.sort((a, b) => {
			if (a[orderProperty] < b[orderProperty]) {
				return -1;
			}
			if (a[orderProperty] > b[orderProperty]) {
				return 1;
			}
			return 0;
		});
		return res;
	}


}

// fn from https://stackoverflow.com/questions/37320296/how-to-calculate-intersection-of-multiple-arrays-in-javascript-and-what-does-e
function intersection(sectionLists: SectionRoomModel[][]) {
	let result: SectionRoomModel[] = [];
	let lists: SectionRoomModel[][];

	if (sectionLists.length === 1) {
		lists = [sectionLists[0]];
	} else {
		lists = sectionLists;
	}
	for (let currentList of lists) {
		for (let currentValue of currentList) {
			if (result.indexOf(currentValue) === -1) {
				if (
					lists.filter(function (obj) {
						return obj.indexOf(currentValue) === -1;
					}).length === 0
				) {
					result.push(currentValue);
				}
			}
		}
	}
	return result;
}

function union(sectionLists: SectionRoomModel[][]) {
	let result: SectionRoomModel[] = [];
	let lists: SectionRoomModel[][] = [];
	if (sectionLists.length === 1) {
		lists = [sectionLists[0]];
	} else {
		lists = sectionLists;
	}
	lists.forEach((list) => {
		result = result.concat(list);
	});
	result = [...new Set(result)];
	return result;
}
function matches(input: string, regex: string): boolean {
	if (regex === "*") {
		return true;
	} else if (!regex.includes("*")) {
		return input === regex;
	} else if (regex[0] === "*" && regex[regex.length - 1] === "*") {
		const match = regex.substring(1, regex.length - 1);
		validateSFieldInput(match);
		return input.includes(match);
	} else if (regex[0] === "*") {
		const match = regex.substring(1);
		validateSFieldInput(match);
		return input.endsWith(match);
	} else if (regex[regex.length - 1] === "*") {
		const match = regex.substring(0, regex.length - 1);
		validateSFieldInput(match);
		return input.startsWith(match);
	} else if (regex.includes("*")) {
		throw new InsightError("Must only contain wildcards at start or/and end");
	}
	return false;
}
function validateSFieldInput(inp: string): boolean {
	if (inp.includes("*")) {
		throw new InsightError("Must only contain wildcards at start or/and end");
	} else {
		return false;
	}
}

