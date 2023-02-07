import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import InsightFacade from "./InsightFacade";

import JSZip from "jszip";
import * as fs from "fs";

export class DataProcessorModel {
	// private insight: InsightFacade;
	// private id: string;
	// private content: string;

	// private kind: InsightDatasetKind;

	constructor(/* id: string, content: string,   kind: InsightDatasetKind  insight: InsightFacade */) {
		// this.insight = insight;
		// this.id = id;
		// this.content = content;
		// this.kind = kind;
	}

	// check zip file
	// parse through the zip file
	// convert the data to string
	// check if the data is valid
	// represent data with an object
	// convert to json
	// parse json
	// store json file?
	// use the data and represent it as an object

	public static addDataset(id: string, content: string, insight: InsightFacade): Promise<string[]> {
		let zipFile = new JSZip();

		zipFile.loadAsync(content, {base64: true})
			.then(() => {
				if (!(zipFile.folder(/courses/).length > 0)) {
					return Promise.reject(new InsightError("Zip file doesn't have courses directory"));
				}

			}).catch((error) => {
				return Promise.reject(error);
			});

		return Promise.reject(new InsightError("error"));
	}

}
