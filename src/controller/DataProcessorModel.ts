import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import InsightFacade from "./InsightFacade";

import JSZip, {JSZipObject} from "jszip";
import * as fs from "fs";
import {DatasetModel} from "../Models/DatasetModel";

export class DataProcessorModel {

	// constructor(){}

	// check zip file
	// parse through the zip file
	// convert the data to string
	// check if the data is valid
	// represent data with an object
	// convert to json
	// parse json
	// store json file?
	// use the data and represent it as an object

	public addDataset(id: string, content: string, insight: InsightFacade): Promise<string[]> {
		let zip = new JSZip();
		let promiseArray = Array<Promise<string>>();
		let dataset: DatasetModel;

		zip.loadAsync(content, {base64: true})
			.then((newZip: JSZip) => {
				/* if(newZip.length === 0) {
					return Promise.reject(new InsightError("Zip file doesn't have courses directory"));
				} */
				if (!(newZip.folder("courses").length > 0)) {
					return Promise.reject(new InsightError("Zip file doesn't have courses directory"));
				}
				// if (zipFile.fo)

				newZip.folder("courses").forEach(function (relativePath, file) {
					promiseArray.push(file.async("string"));
				});
				// json.parse takes a base 64 string and converts in into an object
				Promise.all(promiseArray).then((stringData: string[]) => {
					return this.parseStuff(stringData);
				});

			}).catch((error) => {
				return Promise.reject(error);
			});

		insight.addedDatasetIds.push(id);
		insight.datasets.set(id, new DatasetModel());
		return Promise.reject(new InsightError("error"));
	}

	public parseStuff(string: string[]) {
		let dataset = new DatasetModel();
		let javaObject: any;
		for (let s of string) {
			try {
				javaObject = JSON.parse(s);
			} catch (e) {
				throw new InsightError("Problem parsing - JSON invalid?");
			}

			for (let element in javaObject["result"]) {
				throw new InsightError("Problem parsing - JSON invalid?");
			}
		}

		if (dataset.insightDataset.numRows === 0) {
			return Promise.reject(new InsightError("Dataset has no sections and is invalid "));
		}


	}


}
