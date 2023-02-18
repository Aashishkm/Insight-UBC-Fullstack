import {Filter, Key, LogicComparison, MComparison, NComparison, SComparison} from "../Models/QueryModel";
import {DatasetModel} from "../Models/DatasetModel";
import {SectionModel} from "../Models/SectionModel";
import {InsightDatasetKind, InsightError, InsightResult} from "./IInsightFacade";

export default class PerformQueryHelpers {
	// TODO implement ordering
	constructor(idList: SectionModel[], datasets: Map<string, DatasetModel>) {
		this.globalSectionList = idList;
		this.datasets = datasets;
		this.currentQueryingDatasetID = "";
	}
	public globalSectionList: SectionModel[];
	private datasets: Map<string, DatasetModel>;
	private currentQueryingDatasetID: string;
	public applyWhere(filter: Filter, queryingDatasetID: string) {
		this.currentQueryingDatasetID = queryingDatasetID;
		let idList: SectionModel[] = [];
		// if filter is empty e.g. the where clause is empty and should match everywhere
		if (Object.keys(filter).length === 0) {
			const dataset = this.datasets.get(this.currentQueryingDatasetID);
			if (dataset !== undefined) {
				idList = dataset.sections;
			}
		} else {
			idList = this.applyComparison(filter);
		}
		this.globalSectionList = idList;
	}

	public applyColumns(columns: Key[]): InsightResult[] {
		if (!this.datasets.has(columns[0].idString)) {
			throw new InsightError("Dataset not added");
		}
		let resultArr: any = [];
		this.globalSectionList.forEach((section) => {
			let obj: {[key: string]: any} = {};
			columns.forEach((key) => {
				let objProperty = key.idString + "_" + key.field;
				obj[objProperty] = section[key.field];
			});
			resultArr.push(obj);
		});
		return resultArr;
	}

	public applyComparison(filter: Filter): SectionModel[] {
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
	public handleLogicComparison(logicComparison: LogicComparison): SectionModel[] {
		const comparator = logicComparison.comparator;
		const filters = logicComparison.filterList;
		if (comparator === "OR") {
			let list: SectionModel[][] = [];
			filters.forEach((filter) => {
				list.push(this.applyComparison(filter));
			});
			return union(list);

		} else {
			let list: SectionModel[][] = [];
			filters.forEach((filter) => {
				list.push(this.applyComparison(filter));
			});
			return intersection(list);
		}
	}
	private handleSComparison(sComparison: SComparison): SectionModel[] {
		let resultSections: SectionModel[] = [];
		const id = sComparison.sKey.idString;
		const sField = sComparison.sKey.field;
		const inputString = sComparison.inputString;
		const dataset = this.datasets.get(id);
		if (dataset !== undefined) {
			dataset.sections.forEach((section) => {
				if (matches(section[sField], inputString)) {
					resultSections.push(section);
				}
			});
		} else {
			throw new InsightError("dataset not added");
		}
		return resultSections;
	}
	private handleMComparison(mComparison: MComparison): SectionModel[] {
		let resultSections: SectionModel[] = [];
		const id = mComparison.mKey.idString;
		const comparator = mComparison.comparator;
		const mField = mComparison.mKey.field;
		const numComparison = mComparison.num;
		const dataset = this.datasets.get(id);
		if (dataset !== undefined) {
			dataset.sections.forEach((section) => {
				if (comparator === "LT") {
					if (section[mField] < numComparison) {
						resultSections.push(section);
					}
				} else if (comparator === "GT") {
					if (section[mField] > numComparison) {
						resultSections.push(section);
					}
				} else if (comparator === "EQ") {
					if (section[mField] === numComparison) {
						resultSections.push(section);
					}
				}
			});
		} else {
			throw new InsightError("Dataset not added");
		}
		return resultSections;
	}
	// TODO fix this later optimize!
	private handleNComparison(nComparison: NComparison): SectionModel[] {
		const datasetAll = this.datasets.get(this.currentQueryingDatasetID);
		const datasetFiltered = this.applyComparison(nComparison.filter);
		const datasetFilteredSet = new Set(datasetFiltered);
		if (datasetAll === undefined) {
			throw new Error("Something went wrong in handleNComparison");
		}
		const datasetAllSet = new Set(datasetAll.sections);
		let res: SectionModel[] = [];
		if (datasetAll) {
			res = datasetAll.sections.filter((section) => {
				return (datasetFiltered.indexOf(section) === -1);
			});
		}
		return res;
	}

	private isIDinDatasets(id: string): boolean {
		return (this.datasets.has(id));
	}

	public applyOrder(order: Key, insightResultList: InsightResult[]): InsightResult[] {
		// TODO finish me!
		let res = insightResultList;
		const orderProperty = order.idString + "_" + order.field;
		res = res.sort((a, b) => {
			if (a[orderProperty] < b[orderProperty]) {
				return -1;
			} if (a[orderProperty] > b[orderProperty]) {
				return 1;
			}
			return 0;
		});
		return res;
	}
}

// fn from https://stackoverflow.com/questions/37320296/how-to-calculate-intersection-of-multiple-arrays-in-javascript-and-what-does-e
function intersection(sectionLists: SectionModel[][]) {
	let result: SectionModel[] = [];
	let lists: SectionModel[][];

	if(sectionLists.length === 1) {
		lists = [sectionLists[0]];
	} else {
		lists = sectionLists;
	}
	for (let currentList of lists) {
		for (let currentValue of currentList) {
			if (result.indexOf(currentValue) === -1) {
				if(lists.filter(function(obj) {
					return obj.indexOf(currentValue) === -1;
				}).length === 0) {
					result.push(currentValue);
				}
			}
		}
	}
	return result;
}

function union(sectionLists: SectionModel[][]) {
	let result: SectionModel[] = [];
	let lists: SectionModel[][] = [];
	if(sectionLists.length === 1) {
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
