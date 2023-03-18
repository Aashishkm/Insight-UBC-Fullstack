import {
	AnyKey, ApplyRule, Filter, Group, Key, LogicComparison, MComparison, MFieldRoom,
	MFieldSection, NComparison, Order, QueryClass, SComparison, SField, SFieldRoom, SFieldSection
} from "../Models/QueryModel";
import {CourseDatasetModel} from "../Models/CourseDatasetModel";
import {SectionModel} from "../Models/SectionModel";
import {InsightDatasetKind, InsightError, InsightResult} from "./IInsightFacade";
import {DatasetModel} from "../Models/DatasetModel";
import {RoomDatasetModel} from "../Models/RoomDatasetModel";
import {RoomModel} from "../Models/RoomModel";
import {SectionRoomModel} from "../Models/SectionRoomModel";
import Decimal from "decimal.js";
import {findAvg, findCount, findMax, findMin, findSum, intersection, matches, union} from "./PerformQueryHelpers2";

export default class PerformQueryHelpers {
	// TODO implement ordering
	constructor(idList: SectionModel[], datasets: Map<string, DatasetModel>) {
		this.globalSectionList = idList;
		this.datasets = datasets;
		this.currentQueryingDatasetID = "";
	}

	private groups: Group[] = [];

	public globalSectionList: SectionRoomModel[];
	private datasets: Map<string, DatasetModel>;
	private currentQueryingDatasetID: string;
	private currentQueryingDatasetKind: InsightDatasetKind = InsightDatasetKind.Sections;
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

	// TODO optimize!
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

	public applyOrder(order: Order, insightResultList: InsightResult[]): InsightResult[] {
		let res = insightResultList;
		if (order.key !== undefined) {
			if (order.key instanceof Key) {
				const orderProperty = order.key.idString + "_" + order.key.field;
				res = res.sort((a, b) => {
					if (a[orderProperty] < b[orderProperty]) {
						return -1;
					}
					if (a[orderProperty] > b[orderProperty]) {
						return 1;
					}
					return 0;
				});
			}
		} else if (order.dir !== undefined) {
			console.log("Finish me!");
		}
		return res;
	}

	public applyTransformations(queryClass: QueryClass) {
		if (queryClass.group) {
			this.applyGroup(queryClass.group);
		}
		if (queryClass.apply) {
			this.applyApply(queryClass.apply);
		}
	}

	private applyGroup(groupKeys: Key[]) {
		// TODO finish me
		let groupBy = function(xs: any[], key: any) {
			return xs.reduce(function(rv, x) {
				(rv[x[key]] = rv[x[key]] || []).push(x);
				return rv;
			}, {});
		};
		let groupList: Group[] = [];
		let preGroups = groupBy(this.globalSectionList, groupKeys[0].field);
		Object.keys(preGroups).forEach((key) => {
			let groupTemp = new Group();
			groupTemp.members = preGroups[key];
			groupTemp.groupedBy = key;
			groupList.push(groupTemp);
		});
		this.groups = groupList;
	}

	private applyApply(applyRules: ApplyRule[]) {
		const rule = applyRules[0];
		this.groups.forEach((group) => {
			if (rule.applyToken === "MAX") {
				group.res = (findMax(group, rule));
			} else if (rule.applyToken === "MIN") {
				group.res = (findMin(group, rule));
			} else if (rule.applyToken === "AVG") {
				group.res = (findAvg(group, rule));
			} else if (rule.applyToken === "COUNT") {
				group.res = (findCount(group));
			} else if (rule.applyToken === "SUM") {
				group.res = (findSum(group, rule));
			}
		});
	}

	public applyColumnsGrouped(queryClass: QueryClass) {
		const dataset = this.datasets.get(this.currentQueryingDatasetID);
		let resultArr: any = [];
		// if (dataset instanceof CourseDatasetModel) {
		// 	this.groups.forEach((group) => {
		// 		let obj
		// 	})
		// } else if (dataset instanceof RoomDatasetModel) {
		// 	(this.globalSectionList as RoomModel[]).forEach((room) => {
		// 		let obj: {[key: string]: any} = {};
		// 		(columns as Key[]).forEach((key) => {
		// 			let objProperty = key.idString + "_" + key.field;
		// 			obj[objProperty] = room[(key.field as unknown as SFieldRoom | MFieldRoom)];
		// 		});
		// 		resultArr.push(obj);
		// 	});
		// }

		return resultArr;
	}

}
