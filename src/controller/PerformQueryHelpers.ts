import {Filter, Key, LogicComparison, MComparison, SComparison} from "../Models/QueryModel";
import {DatasetModel} from "../Models/DatasetModel";
import {SectionModel} from "../Models/SectionModel";

export default class PerformQueryHelpers {
	constructor(idList: SectionModel[], datasets: Map<string, DatasetModel>) {
		this.globalSectionList = idList;
		this.datasets = datasets;
	}
	public globalSectionList: SectionModel[];
	private datasets: Map<string, DatasetModel>;
	public getWhere(filter: Filter, columns: Key[]) {
		let idList: SectionModel[] = [];
		if (Object.keys(filter).length === 0) {
			const dataset = this.datasets.get(columns[0].idString);
			if (dataset !== undefined) {
				idList = dataset.sections;
			}
		} else {
			idList = this.applyComparison(filter);
		}
		this.globalSectionList = idList;
	}

	public applyColumns(columns: Key[]) {
		let arr: any = [];
		this.globalSectionList.forEach((section) => {
			let obj: {[key: string]: any} = {};
			columns.forEach((key) => {
				let objProperty = key.idString + "_" + key.field;
				obj[objProperty] = section[key.field];
			});
			arr.push(obj);
		});
		return arr;
	}

	public applyComparison(filter: Filter): SectionModel[] {
		if (filter.constructor.name === "LogicComparison") {
			const obj = this.handleLogicComparison(filter as LogicComparison);
			return obj;
		} else if (filter.constructor.name === "SComparison") {
			return this.handleSComparison(filter as SComparison);
		} else if (filter.constructor.name === "MComparison") {
			return this.handleMComparison(filter as MComparison);
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
		}
		return resultSections;
	}

	private isIDinDatasets(id: string): boolean {
		return (this.datasets.has(id));
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

	// eslint-disable-next-line @typescript-eslint/prefer-for-of
	for (let i = 0; i < lists.length; i++) {
		let currentList = lists[i];
		// eslint-disable-next-line @typescript-eslint/prefer-for-of
		for (let y = 0; y < currentList.length; y++) {
			let currentValue = currentList[y];
			if(result.indexOf(currentValue) === -1) {
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

	return result;
}
function matches(input: string, match: string): boolean {
	if (!input.includes("*")) {
		return input === match;
	} else if (input[0] === "*" && input[input.length] === "*") {
		return input.includes(match);
	} else if (input[0] === "*") {
		return input.endsWith(match);
	} else if (input[input.length] === "*") {
		return input.startsWith(match);
	}
	// should not reach
	return false;
}
