
import {DatasetModel} from "../Models/DatasetModel";
import {DataProcessorModel} from "./DataProcessorModel";
import * as fs from "fs-extra";

import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError, ResultTooLargeError,
} from "./IInsightFacade";

import {
	handleWhere,
	handleOptions, hasWhereAndOptions
} from "./QueryModelHelpers";

import {
	QueryClass,
	QueryModel
} from "../Models/QueryModel";
import PerformQueryHelpers from "./PerformQueryHelpers";


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
		this.addedDatasetIds = [];
		this.datasets = new Map<string, DatasetModel>();
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
		if(this.datasets.has(id)) {
			return Promise.reject(new InsightError("Duplicate ids"));
		}

		try {
			return dataProcessor.addDataset(id, content, this);
		} catch (e) {
			return Promise.reject("Not implemented.");
		}
	}

	public removeDataset(id: string): Promise<string> {
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

		if (!(this.datasets.has(id))) {
			return Promise.reject(new NotFoundError("Dataset Not added"));
		}
		this.datasets.delete(id);
		let index = this.addedDatasetIds.indexOf(id);
		delete this.addedDatasetIds[index];
		let returnPromise = new Promise<string>((resolve, reject) => {
			fs.remove("./data/" + id + ".json")
				.then(() => {
					return resolve(id);
				}).catch((error) => {
					return Promise.reject(new InsightError("Remove failed"));
				});
		});

		return returnPromise;
		// notes --> should I be removing stuff in disk that are i disk but aren't in memory?
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {

		// reject query without WHERE and OPTIONS
		if (!hasWhereAndOptions(query)) {
			return Promise.reject(new InsightError("No WHERE or OPTIONS"));
		};
		const performQueryHelpers: PerformQueryHelpers = new PerformQueryHelpers([], this.datasets);


		const validQuery = query as QueryModel;
		let queryClass: QueryClass = new QueryClass();
		handleOptions(validQuery.OPTIONS, queryClass);
		handleWhere(validQuery.WHERE, queryClass);
		performQueryHelpers.applyWhere(queryClass.where, queryClass.columns);
		const res = performQueryHelpers.applyColumns(queryClass.columns);
		if (res.length > 5000) {
			throw new ResultTooLargeError("Over 5k entries grrrrrrrrrrrrrrr");
		}
		return Promise.resolve(res);
	}

	public listDatasets(): Promise<InsightDataset[]> {
		let insightDatasets: InsightDataset[];
		insightDatasets = [];
		for (let a of this.datasets.values()) {
			insightDatasets.push(a.insightDataset);
		}
		return Promise.resolve(insightDatasets);
	}

}
