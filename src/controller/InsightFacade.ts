import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, InsightResult,} from "./IInsightFacade";

import {handleOptions, handleWhere, validateQuery} from "../performQueryHelpers";

import {QueryModel} from "../queryModel";

import {DatasetModel} from "../Models/DatasetModel";
import {DataProcessorModel} from "./DataProcessorModel";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	public addedDatasetIds: string[];
	public datasets: Map<string, DatasetModel>;
	// map.keys -->
	constructor() {
		console.log("InsightFacadeImpl::init()");
	}


	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		let dataProcessor = new DataProcessorModel();
		if (id === null) {
			return Promise.reject(new InsightError("Invalid dataset id 0"));
		}
		if (id.includes("_")) {
			return Promise.reject(new InsightError("Invalid dataset id 1"));
		}
		// should represent empty string?
		if (!id) {
			return Promise.reject(new InsightError("Invalid dataset id 2"));
		}
		// if the id is only spaces
		if (id.trim().length === 0) {
			return Promise.reject(new InsightError("Invalid dataset id 3"));
		}
		if (!(kind === InsightDatasetKind.Sections)) {
			return Promise.reject(new InsightError("Invalid insightDatasetKind"));
		}
		if (content === null) {
			return Promise.reject(new InsightError("Invalid content"));
		}
		try {
			dataProcessor.addDataset(id, content, this).then(()=> {
				return Promise.resolve(this.addedDatasetIds);
			}).catch((error) => {
				return Promise.reject(error);
			});
		} catch (e) {
			return Promise.reject("Not implemented.");
		}
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
