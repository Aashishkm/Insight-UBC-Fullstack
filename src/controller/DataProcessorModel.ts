import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import InsightFacade from "./InsightFacade";
// import * as JSZip from "jszip";
import JSZip, {JSZipObject} from "jszip";
import * as fs from "fs";
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
		let promiseArray = Array<Promise<string>>();
		let dataset: DatasetModel;

		let returnPromise = new Promise<string[]>((resolve, reject) => {
			zip.loadAsync(content, {base64: true})
				.then((newZip: JSZip) => {
					if (newZip.length === 0) {
						return Promise.reject(new InsightError("Zip file doesn't have courses directory"));
					}
					if (!(newZip.folder ?? "courses".length > 0)) {
						return Promise.reject(new InsightError("Zip file doesn't have courses directory"));
					}
					// if (zipFile.fo)

					newZip.forEach(function (relativePath, file) {
						promiseArray.push(file.async("string"));
					});
					// json.parse takes a base 64 string and converts in into an javascript object
					// wait for all the "courses" to finish being converted
					Promise.all(promiseArray)
						.then((stringData: string[]) => {
							// parse the data (store it into memory, and check if the data is even valid (at least 1 section)
							this.parseStuff(stringData, id)
								.then((result) => {
									dataset = result;
									insight.datasets.set(id, dataset);
									// push the newly (approved) data to our memory
									return Promise.resolve(insight.addedDatasetIds.push(id));
								})
								.catch((error) => {
									return Promise.reject(error);
								});
						})
						.catch((error) => {
							return Promise.reject(error);
						});
				})
				.catch((error) => {
					return Promise.reject(error);
				});
		});
		return returnPromise;
	}

	public parseStuff(string: string[], id: string): Promise<DatasetModel> {
		let kind = InsightDatasetKind.Sections;
		let numRows = 0;
		let dataset = new DatasetModel({id, kind, numRows});

		let courseData: any;
		// goes through each course
		for (let c of string) {
			let courses = new CourseModel();
			try {
				courseData = JSON.parse(c);
			} catch (e) {
				throw new InsightError("Problem parsing - JSON invalid?");
			}
			// goes through each section (hopefully)
			for (let sectionData in courseData) {
				if (!this.checkValidSection(courseData, sectionData)) {
					continue;
				}
				let validSection = new SectionModel(
					courseData[sectionData].Uuid,
					courseData[sectionData].id,
					courseData[sectionData].Title,
					courseData[sectionData].Instructor,
					courseData[sectionData].Dept,
					courseData[sectionData].Year,
					courseData[sectionData].Avg,
					courseData[sectionData].Pass,
					courseData[sectionData].Fail,
					courseData[sectionData].Audit
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
			courseData[sectionData].Uuid === undefined ||
			courseData[sectionData].id === undefined ||
			courseData[sectionData].Title === undefined ||
			courseData[sectionData].Instructor === undefined ||
			courseData[sectionData].Dept === undefined ||
			courseData[sectionData].Year === undefined ||
			courseData[sectionData].Avg === undefined ||
			courseData[sectionData].Pass === undefined ||
			courseData[sectionData].Fail === undefined ||
			courseData[sectionData].Audit === undefined
		) {
			return false;
		}
		return true;
	}
}
