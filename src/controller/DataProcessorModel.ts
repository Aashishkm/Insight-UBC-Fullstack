import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import InsightFacade from "./InsightFacade";
// import * as JSZip from "jszip";
import JSZip from "jszip";
import {DatasetModel} from "../Models/DatasetModel";
import {CourseModel} from "../Models/CourseModel";
import {SectionModel} from "../Models/SectionModel";
import * as fs from "fs-extra";

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

		let returnPromise = new Promise<string[]>((resolve, reject) => {
			zip.loadAsync(content, {base64: true})
				.then((newZip: JSZip) => {
					/* if (newZip.folder.length === 0) {
						return Promise.reject(new InsightError("Zip file doesn't have courses directory"));
					} */
					if (!(newZip.folder(/courses/).length > 0)) {
						return reject(new InsightError("Zip file doesn't have courses directory"));
					}
					let coursesDirectory = Object.keys(newZip.files);
					if (coursesDirectory[0] !== "courses/") {
						return reject(new InsightError("Zip file doesn't have courses directory as root folder"));
					}
					// delete weird formatting thing on mac zip files
					if (coursesDirectory.includes("__MACOSX/._courses")) {
						newZip.remove("courses/.DS_Store");
					}
					// reads each file in courses directory (multiple courses) and puts them into an array
					newZip.folder("courses")?.forEach(function (relativePath, file) {
						promiseArray.push(file.async("text"));
					});

					// check if the same id is saved to disk --> repeated ids so we should return error
					if (fs.existsSync("./data/" + id + ".json")) {
						return reject(new InsightError("dataset id already exists"));
					}
					// json.parse takes a base 64 string and converts in into an javascript object
					// wait for all the "courses" to finish being converted
					this.resolvePromises(promiseArray, id, insight, resolve, reject);
				})
				.catch((error) => {
					return reject(new InsightError("bad"));
				});
		});
		return returnPromise;
	}

	public addRooms(id: string, content: string, insight: InsightFacade): Promise<string[]> {
		let zip = new JSZip();
		let promiseArray = Array<Promise<any>>();

		let returnPromise = new Promise<string[]>((resolve, reject) => {
			zip.loadAsync(content, {base64: true})
				.then((newZip: JSZip) => {
					newZip.folder("courses")?.forEach(function (relativePath, file) {
						promiseArray.push(file.async("text"));
					});
				})
				.catch((error) => {
					return reject(new InsightError("bad"));
				});
		});
		return returnPromise;
	}

	private resolvePromises(
		promiseArray: Array<Promise<any>>,
		id: string,
		insight: InsightFacade,
		resolve: (value: PromiseLike<string[]> | string[]) => void,
		reject: (reason?: any) => void
	) {
		Promise.all(promiseArray)
			.then((stringData: any) => {
				// parse the data (store it into memory, and check if the data is even valid (at least 1 section)
				this.parseStuff(stringData, id)
					.then((result) => {
						insight.datasets.set(id, result);
						// push the newly (approved) data to our memory
						insight.addedDatasetIds.push(id);
						this.saveToDisk(result);
						return resolve(insight.addedDatasetIds);
					})
					.catch((error) => {
						return reject(new InsightError("bad"));
					});
			})
			.catch((error) => {
				return reject(new InsightError("bad"));
			});
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
					anyData.result[sectionData].id.toString(),
					anyData.result[sectionData].Course,
					anyData.result[sectionData].Title,
					anyData.result[sectionData].Professor,
					anyData.result[sectionData].Subject,
					anyData.result[sectionData]["Section"] === "overall"
						? 1900
						: Number.parseInt(anyData.result[sectionData].Year, 10),
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

	public saveToDisk(dataset: DatasetModel) {
		let id = dataset.insightDataset.id;
		// let jsonData = JSON.stringify(dataset);
		try {
			fs.mkdirpSync("./data/");
			fs.writeJSONSync("./data/" + id + ".json", dataset);
		} catch (e) {
			throw new InsightError("unable to write file to disk");
		}
	}
	// should be sync according to scott ta

	public loadDatasetFromDisk(insight: InsightFacade) {
		// let dataset: DatasetModel;
		try {
			let directory = fs.readdirSync("./data/");
			directory.forEach((file) => {
				let dataset: DatasetModel;
				dataset = fs.readJSONSync("./data/" + file);
				insight.datasets.set(dataset.insightDataset.id, dataset);
				insight.addedDatasetIds.push(dataset.insightDataset.id);
			});
		} catch (e) {
			return new InsightError("dataset doesn't exist");
		}
	}
}
