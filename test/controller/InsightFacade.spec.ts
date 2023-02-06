import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import {folderTest} from "@ubccpsc310/folder-test";
import {expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
import {clearDisk, getContentFromArchives} from "../TestUtil";

use(chaiAsPromised);

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;

	before(function () {
		// This block runs once and loads the datasets.
		sections = getContentFromArchives("pair.zip");

		// Just in case there is anything hanging around from a previous run of the test suite
	});

	describe("addDataset", function() {
		beforeEach(function() {
			clearDisk();
			facade = new InsightFacade();
		});

		it ("should reject with  an empty dataset id", function() {
			const result = facade.addDataset("", sections, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject same name", function(){
			const result = facade.addDataset("aaa", sections, InsightDatasetKind.Sections)
				.then(() => {
					return facade.addDataset("aaa", sections, InsightDatasetKind.Sections);
				});
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});


		it("should reject name with underscore", function() {
			const result = facade.addDataset("a_b", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject name with only whitespace", function() {
			const result = facade.addDataset("  ", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject content that is not a zip file without courses folder", function() {
			const result = facade.addDataset("nonzip", "Randomstringggg", InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject an empty zip file", function() {
			let empty: string;
			empty = getContentFromArchives("empty.zip");
			const result = facade.addDataset("empty-zip", empty, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject an empty zip file with a courses folder", function() {
			let empty2: string;
			empty2 = getContentFromArchives("emptywithcourses.zip");
			const result = facade.addDataset("empty-zip", empty2, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject the wrong InsightDatasetKind ", function() {

			const result = facade.addDataset("wrongdatasetkind", sections, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject a dataset with invalidJSON", function() {
			let bad: string;
			bad = getContentFromArchives("badjson.zip");

			const result = facade.addDataset("badjson", bad, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should accept a dataset with no courses direcotry and emppty datain sections", function() {
			let ultra: string;
			ultra = getContentFromArchives("ultramini.zip");

			const result = facade.addDataset("nodata", ultra, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should accept a dataset with no courses direcotry and emppty datain sections", function() {
			let ultra: string;
			ultra = getContentFromArchives("ultramini.zip");

			const result = facade.addDataset("nodata", ultra, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should accept a dataset with emppty datain sections", function() {
			let emptysection: string;
			emptysection = getContentFromArchives("emptystringsection.zip");

			const result = facade.addDataset("nodata", emptysection, InsightDatasetKind.Sections);
			return expect(result).to.eventually.deep.equal(["nodata"]);
		});

		it("should reject a dataset with no sections", function() {
			let nosections: string;
			nosections = getContentFromArchives("Nosections.zip");
			const result = facade.addDataset("nosections", nosections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});


		it("Should resolve with a correct dataset", function() {
			return facade.addDataset("testing", sections, InsightDatasetKind.Sections)
				.then((result) => {
					//	result should be the name of the id
					expect(result).to.deep.equal(["testing"]);
				})
				.catch((error) => {
					expect.fail("shouldn't end up here");

				});
		});

	});

	describe("removeDataset", function() {
		beforeEach(function() {
			clearDisk();
			facade = new InsightFacade();
		});

		it ("should reject a dataset id that is empty", function() {
			const result = facade.removeDataset("");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject a dataset with an underscore", function() {
			const result = facade.removeDataset("a_b");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject a dataset with only whitespace", function() {
			const result = facade.removeDataset(" ");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject a dataset that doesn't exist", function() {
			const result = facade.removeDataset("random");
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});


		it ("should successfully remove a dataset that is already added", function() {
			return facade.addDataset("ab", sections, InsightDatasetKind.Sections)
				.then((result) => {
					expect(result).to.deep.equal(["ab"]);
					return facade.removeDataset("ab");
				})
				.then((res) => {
						//	check assertion for string
					expect(res).to.equal("ab");
				})
				.catch((error) => {
					expect.fail("should have accepted!");
				});
		});

	});

	describe("listDataset", function() {

		beforeEach(function() {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should list an empty dataset", async function() {
			const dataset = await facade.listDatasets();
			expect(dataset).to.deep.equal([]);


		});

		it("should list a dataset with stuff in it", async function() {
			await facade.addDataset("ab", sections, InsightDatasetKind.Sections);

			const dataset = await facade.listDatasets();

			expect(dataset).to.deep.equal([{id: "ab", kind: InsightDatasetKind.Sections, numRows: 64612}]);
		});
	});

	/*
	 * This test suite dynamically generates tests from the JSON files in test/resources/queries.
	 * You should not need to modify it; instead, add additional files to the queries directory.
	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
	 */
	describe("PerformQuery", () => {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);

			facade = new InsightFacade();

			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [facade.addDataset("sections", sections, InsightDatasetKind.Sections)];

			return Promise.all(loadDatasetPromises);
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			clearDisk();
		});

		type PQErrorKind = "ResultTooLargeError" | "InsightError" | "NotFoundError";

		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
			"Dynamic InsightFacade PerformQuery tests",
			(input) => facade.performQuery(input),
			"./test/resources/queries",
			{
				assertOnResult: (actual, expected) => {
					// requires same order
					// eventually need another folderTest with
					// expect(actual).to.deep.members(expected);
					expect(actual).to.deep.equal(expected);
				},
				errorValidator: (error): error is PQErrorKind =>
					error === "ResultTooLargeError" || error === "InsightError" || error === "NotFoundError",
				assertOnError: (actual, expected) => {
					if (expected === "NotFoundError") {
						expect(actual).to.be.instanceof(NotFoundError);
					} else if (expected === "InsightError") {
						expect(actual).to.be.instanceof(InsightError);
					} else if (expected === "ResultTooLargeError") {
						expect(actual).to.be.instanceof(ResultTooLargeError);
					} else {
						expect.fail("UNEXPECTED ERROR");
					}
				},
			}
		);
	});
	describe("PerformQuery2", () => {
		before( () => {
			facade = new InsightFacade();
		});
		const simpleQueryString = "{\n" +
			"\n" +
			"    \"WHERE\":{\n" +
			"\n" +
			"       \"GT\":{\n" +
			"\n" +
			"          \"sections_avg\":97\n" +
			"\n" +
			"       }\n" +
			"\n" +
			"    },\n" +
			"\n" +
			"    \"OPTIONS\":{\n" +
			"\n" +
			"       \"COLUMNS\":[\n" +
			"\n" +
			"          \"sections_dept\",\n" +
			"\n" +
			"          \"sections_avg\"\n" +
			"\n" +
			"       ],\n" +
			"\n" +
			"       \"ORDER\":\"sections_avg\"\n" +
			"\n" +
			"    }\n" +
			"\n" +
			"}";
		const simpleQueryObj = JSON.parse(simpleQueryString);
		it("should test structure of query", async () => {
			const result = await facade.performQuery(simpleQueryObj);
		});
	});
});
