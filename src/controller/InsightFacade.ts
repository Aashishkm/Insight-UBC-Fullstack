import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";

import {
	validateQuery,
	handleWhere,
	handleOptions
} from "../performQueryHelpers";

import {
	QueryModel
} from "../queryModel";

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

		// reject bad query with InsightError
		if (!validateQuery(query)) {
			return Promise.reject(InsightError);
		};

		const validQuery = query as QueryModel;
		handleWhere(validQuery.WHERE);
		handleOptions(validQuery.OPTIONS);

		return Promise.resolve([]);
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}
}
