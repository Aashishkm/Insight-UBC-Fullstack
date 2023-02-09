import {Filter, MComparison} from "./QueryModel";


export default class PerformQueryHelpers {
	constructor(idList: number[]) {
		this.idList = idList;
	}
	public idList: number[];
	public getWhere(filter: Filter) {
		this.handleComparison(filter);
	}

	public handleComparison(filter: Filter) {
		if (filter.constructor.name === "LogicComparison") {
			this.handleLogicComparison(filter);
		} else if (filter.constructor.name === "SComparison") {
			console.log("todo SComparison");
		} else if (filter.constructor.name === "MComparison") {
			this.handleMComparison(filter as MComparison);
		}
	}

	public handleLogicComparison(filter: Filter) {
		console.log(filter);
	}
	public handleMComparison(mComparison: MComparison) {
		let id = mComparison.mKey.idString;
	}
}

