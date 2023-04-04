import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import {expect} from "chai";
import request, {Response} from "supertest";
import ServerMethods from "../../src/controller/ServerMethods";
import {clearDisk, getContentFromArchives} from "../TestUtil";
import {InsightDatasetKind} from "../../src/controller/IInsightFacade";

describe("Server", () => {

	let facade: InsightFacade;
	let server: Server;

	before(async () => {
		clearDisk();
		facade = new InsightFacade();
		ServerMethods.facade = facade;
		const sections = getContentFromArchives("pair.zip");
		await ServerMethods.facade.addDataset("sections", sections, InsightDatasetKind.Sections);
		server = new Server(4321);
		server.start().then().catch((err) => {
			console.error(err.message);
		});
		// TODO: start server here once and handle errors properly
	});

	after(async () => {
		// TODO: stop server here once!
		server.stop().then().catch((err) => {
			console.error(err.message);
		});
	});

	beforeEach(() => {
		// might want to add some process logging here to keep track of what's going on
	});

	afterEach(() => {
		clearDisk();
		// might want to add some process logging here to keep track of what's going on
	});

	// Sample on how to format PUT requests


	it("POST test for courses dataset", async () => {
		const query = {
			WHERE: {
				OR: [
					{
						AND: [
							{
								GT: {
									sections_avg: 90
								}
							},
							{
								IS: {
									sections_dept: "adhe"
								}
							}
						]
					},
					{
						EQ: {
							sections_avg: 95
						}
					}
				]
			},
			OPTIONS: {
				COLUMNS: [
					"sections_dept",
					"sections_id",
					"sections_avg"
				],
				ORDER: "sections_avg"
			}
		};
		try {
			return request("http://localhost:4321")
				.post("/query")
				.send(query)
				.then((res) => {
					expect(res.status).to.be.equal(200);
					expect(res.body.result.length).to.be.equal(56);
				});
		} catch (e) {
			console.error(e);
			expect.fail();
		}
	});

	it("400 POST test for courses dataset", async () => {
		const query = {
			WHERE: {
				OR: [
					{
						AND: [
							{
								GT: {
									sections_avg: 90
								}
							},
							{
								IS: {
									sections_dept: 50
								}
							}
						]
					},
					{
						EQ: {
							sections_avg: 95
						}
					}
				]
			},
			OPTIONS: {
				COLUMNS: [
					"sections_dept",
					"sections_id",
					"sections_avg"
				],
				ORDER: "sections_avg"
			}
		};
		try {
			return request("http://localhost:4321")
				.post("/query")
				.send(query)
				.then((res) => {
					expect(res.status).to.be.equal(400);
				});
		} catch (e) {
			console.error(e);
			expect.fail();
		}
	});

	it("400 POST test with no query", async () => {
		try {
			return request("http://localhost:4321")
				.post("/query")
				.then((res) => {
					expect(res.status).to.be.equal(400);
				});
		} catch (e) {
			console.error(e);
			expect.fail();
		}
	});

	it("400 POST test with undefined query", async () => {
		try {
			return request("http://localhost:4321")
				.post("/query")
				.send(undefined)
				.then((res) => {
					expect(res.status).to.be.equal(400);
				});
		} catch (e) {
			console.error(e);
			expect.fail();
		}
	});

	it("GET test for courses dataset", async () => {
		try {
			return request("http://localhost:4321")
				.get("/datasets")
				.then((res) => {
					expect(res.status).to.be.equal(200);
					expect(res.body.result).to.be.deep.equal([{id: "sections", kind: "sections", numRows: 64612}]);
				});
		} catch (e) {
			console.error(e);
			expect.fail();
		}
	});

	it("DELETE test for courses dataset", async () => {
		try {
			return request("http://localhost:4321")
				.delete("/dataset/sections")
				.then((res) => {
					expect(res.status).to.be.equal(200);
					expect(res.body.result).to.be.equal("sections");
				});
		} catch (e) {
			console.error(e);
			expect.fail();
		}
	});


	it("404 DELETE test for courses dataset", async () => {
		try {
			return request("http://localhost:4321")
				.delete("/dataset/notasection")
				.then((res) => {
					expect(res.status).to.be.equal(404);
					expect(res.body).to.have.property("error");
					expect(res.body.error).to.be.a("string");
				});
		} catch (e) {
			console.error(e);
			expect.fail();
		}
	});

	it("400 DELETE test for courses dataset", async () => {
		try {
			return request("http://localhost:4321")
				.delete("/dataset/invalid_dataset")
				.then((res) => {
					expect(res.status).to.be.equal(400);
					expect(res.body).to.have.property("error");
					expect(res.body.error).to.be.a("string");
				});
		} catch (e) {
			console.error(e);
			expect.fail();
		}
	});

	it("200 PUT dataset", async () => {
		const datasetBuffer = getContentFromArchives("minipair.zip");
		try {
			return request("http://localhost:4321")
				.put("/dataset/minipair/sections")
				.send(datasetBuffer)
				.then((res) => {
					expect(res.status).to.be.equal(200);
					expect(res.body).to.have.property("result");
					expect(res.body.result).to.be.equal(["minipair"]);
				});
		} catch (e) {
			console.error(e);
			expect.fail();
		}
	});


	// The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
