import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import InsightFacade from "./InsightFacade";
// import * as JSZip from "jszip";
import JSZip from "jszip";
import {DatasetModel} from "../Models/DatasetModel";
import {CourseModel} from "../Models/CourseModel";
import {SectionModel} from "../Models/SectionModel";

export class DataProcessorModel {
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
		let promiseArray = Array<Promise<any>>();
		let dataset: DatasetModel;

		let returnPromise = new Promise<string[]>((resolve, reject) => {
			zip.loadAsync(content, {base64: true})
				.then((newZip: JSZip) => {
					/* if (newZip.folder.length === 0) {
						return Promise.reject(new InsightError("Zip file doesn't have courses directory"));
					} */
					if (!(newZip.folder(/courses/).length > 0)) {
						return reject(new InsightError("Zip file doesn't have courses directory"));
					}

					newZip.folder("courses")?.forEach(function (relativePath, file) {
						promiseArray.push(file.async("text"));
					});
					// json.parse takes a base 64 string and converts in into an javascript object
					// wait for all the "courses" to finish being converted
					Promise.all(promiseArray)
						.then((stringData: any) => {
							// parse the data (store it into memory, and check if the data is even valid (at least 1 section)
							this.parseStuff(stringData, id)
								.then((result) => {
									insight.datasets.set(id, result);
									// push the newly (approved) data to our memory
									insight.addedDatasetIds.push(id);
									return resolve(insight.addedDatasetIds);
								})
								.catch((error) => {
									return reject(new InsightError("bad"));
								});
						})
						.catch((error) => {
							return reject(new InsightError("bad"));
						});
				})
				.catch((error) => {
					return reject(new InsightError("bad"));
				});
		});
		return returnPromise;
	}

	public parseStuff(string: string[], id: string): Promise<DatasetModel> {
		let kind = InsightDatasetKind.Sections;
		let numRows = 0;
		let dataset = new DatasetModel({id, kind, numRows});
		// let courseData: JSON;
		let anyData: any;
		// if (JS)
		// goes through each course
		for (let c of string) {
			let courses = new CourseModel();
			try {
				anyData = JSON.parse(c);
			} catch (e) {
				return Promise.reject(new InsightError("Problem parsing - JSON invalid?"));
			}
			// goes through each section (hopefully)
			for (let sectionData in anyData.result) {
				if (!this.checkValidSection(anyData, sectionData)) {
					continue;
				}
				let validSection = new SectionModel(
					anyData.result[sectionData].id,
					anyData.result[sectionData].Course,
					anyData.result[sectionData].Title,
				    anyData.result[sectionData].Professor,
					anyData.result[sectionData].Subject,
					anyData.result[sectionData].Year,
					anyData.result[sectionData].Avg,
					anyData.result[sectionData].Pass,
					anyData.result[sectionData].Fail,
					anyData.result[sectionData].Audit
				);
				courses.sections.push(validSection);
				dataset.sections.push(validSection);
				dataset.insightDataset.numRows++;
			}
			if (courses.sections.length > 0) {
				dataset.courses.push(courses);
			}
		}
		if (dataset.insightDataset.numRows === 0) {
			return Promise.reject(new InsightError("Dataset has no valid sections and is invalid "));
		}

		return Promise.resolve(dataset);
	}

	public checkValidSection(courseData: any, sectionData: string): boolean {
		if (
			courseData.result[sectionData].id === undefined ||
			courseData.result[sectionData].Course === undefined ||
			courseData.result[sectionData].Title === undefined ||
			courseData.result[sectionData].Professor === undefined ||
			courseData.result[sectionData].Subject === undefined ||
			courseData.result[sectionData].Year === undefined ||
			courseData.result[sectionData].Avg === undefined ||
			courseData.result[sectionData].Pass === undefined ||
			courseData.result[sectionData].Fail === undefined ||
			courseData.result[sectionData].Audit === undefined
		) {
			return false;
		}
		return true;
	}
}
