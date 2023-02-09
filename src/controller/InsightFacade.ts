import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";

import {
	handleWhere,
	handleOptions, hasWhereAndOptions
} from "../QueryModelHelpers";

import {
	QueryClass,
	QueryModel
} from "../QueryModel";
import PerformQueryHelpers from "../PerformQueryHelpers";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	constructor() {
		console.log("InsightFacadeImpl::init()");
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		return Promise.reject("Not implemented.");
	}

	public removeDataset(id: string): Promise<string> {
		return Promise.reject("Not implemented.");
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {

		// reject query without WHERE and OPTIONS
		if (!hasWhereAndOptions(query)) {
			return Promise.reject(InsightError);
		};
		const performQueryHelpers: PerformQueryHelpers = new PerformQueryHelpers([0]);

		const validQuery = query as QueryModel;
		let queryClass: QueryClass = new QueryClass();
		handleWhere(validQuery.WHERE, queryClass);
		handleOptions(validQuery.OPTIONS, queryClass);
		performQueryHelpers.getWhere(queryClass.where);
		return Promise.resolve([]);
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}

}
