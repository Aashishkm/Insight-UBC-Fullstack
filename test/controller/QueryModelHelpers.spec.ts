import {expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
import {InsightError} from "../../src/controller/IInsightFacade";
import {
	isFilterList,
	isOptions,
	isWhere,
	validateMComparison,
	validateSComparison,
} from "../../src/controller/QueryModelHelpersValidation";

use(chaiAsPromised);

describe("performQueryHelpers", () => {
	describe("isOptions", () => {
		it("should return true", () => {
			const result = isOptions({COLUMNS: ["ubc_dept", "ubc_id", "ubc_avg"], ORDER: "ubc_avg"});
			expect(result).to.be.true;
		});
		it("should throw InsightError, misnamed COLUMNS with ORDER", () => {
			expect(() => {
				isOptions({NOTCOLUMNS: ["ubc_dept", "ubc_id", "ubc_avg"], ORDER: "ubc_avg"});
			}).to.throw(InsightError);
		});
		it("should return true without order", () => {
			const result = isOptions({COLUMNS: ["ubc_dept", "ubc_id", "ubc_avg"]});
			expect(result).to.be.true;
		});
		it("should throw InsightError misnamed COLUMNS", () => {
			expect(() => {
				isOptions({NOTCOLUMNS: ["ubc_dept", "ubc_id", "ubc_avg"]});
			}).to.throw(InsightError);
		});
		it("should throw InsightError misnamed COLUMNS", () => {
			expect(() => {
				isOptions({NOTCOLUMNS: ["ubc_dept", "ubc_id", "ubc_avg"]});
			}).to.throw(InsightError);
		});
		it("should throw InsightError, COLUMNS with misnamed ORDER", () => {
			expect(() => {
				isOptions({COLUMNS: ["ubc_dept", "ubc_id", "ubc_avg"], NOTORDER: "ubc_avg"});
			}).to.throw(InsightError);
		});
		it("should throw InsightError, COLUMNS and ORDER with extra key", () => {
			expect(() => {
				isOptions({COLUMNS: ["ubc_dept", "ubc_id", "ubc_avg"], ORDER: "ubc_avg", EXTRAKEY: "ubc_avg"});
			}).to.throw(InsightError);
		});
	});
	describe("isWhere", () => {
		it("should return true", () => {
			const result = isWhere({GT: {}});
			expect(result).to.be.true;
		});
		it("should throw InsightError, Invalid key in WHERE", () => {
			expect(() => {
				isWhere({NOTGT: {}});
			}).to.throw(InsightError);
		});
		it("should throw InsightError, multiple keys in WHERE", () => {
			expect(() => {
				isWhere({GT: {}, LT: {}});
			}).to.throw(InsightError);
		});
		it("should return true, more complex", () => {
			const result = isWhere({AND: [{GT: {}}, {LT: {}}]});
			expect(result).to.be.true;
		});
		it("should return true, using not", () => {
			const result = isWhere({NOT: {}});
			expect(result).to.be.true;
		});
	});
	describe("isFilterList", () => {
		it("should return true, simple", () => {
			const result = isFilterList([{GT: {}}, {GT: {}}]);
			expect(result).to.be.true;
		});
		it("should throw InsightError, invalid key names", () => {
			expect(() => {
				isFilterList([{GT: {}, NOTLT: {}}]);
			}).to.throw(InsightError);
		});
		it("should throw InsightError, array in array", () => {
			expect(() => {
				isFilterList([[{GT: {}}], {NOTLT: {}}]);
			}).to.throw(InsightError);
		});
	});
	describe("isSComparison", () => {
		// Implicitly test isSField and isSKey
		it("should return true, simple", () => {
			const result = validateSComparison({ubc_id: "test"});
			expect(result).to.be.true;
		});
		it("should throw InsightError, invalid sfield", () => {
			expect(() => {
				validateSComparison({ubc_notid: "test"});
			}).to.throw(InsightError);
		});
		it("should throw InsightError, multiple keys", () => {
			expect(() => {
				validateSComparison({ubc_id: "test", ubc_instr: "test2"});
			}).to.throw(InsightError);
		});
		it("should throw InsightError, number in string", () => {
			expect(() => {
				validateSComparison({ubc_id: 3});
			}).to.throw(InsightError);
		});
		// TODO add more tests matching wildcards
	});
	describe("isMComparison", () => {
		// implicitly test isMKey and isMField
		it("should return true, simple", () => {
			const result = validateMComparison({ubc_avg: 39});
			expect(result).to.be.true;
		});
		it("should throw InsightError, invalid mField", () => {
			expect(() => {
				validateMComparison({ubc_notAvg: 39});
			}).to.throw(InsightError);
		});
		it("should throw InsightError, multiple keys", () => {
			expect(() => {
				validateMComparison({ubc_pass: 90, ubc_audit: 32});
			}).to.throw(InsightError);
		});
		it("should throw InsightError, string in number", () => {
			expect(() => {
				validateMComparison({ubc_avg: "3"});
			}).to.throw(InsightError);
		});
		it("should throw InsightError, invalid mKey", () => {
			expect(() => {
				validateMComparison({ubcAvg: 3});
			}).to.throw(InsightError);
		});
		it("should throw InsightError, invalid mKey multiple _", () => {
			expect(() => {
				validateMComparison({ubc_avg_audit: 3});
			}).to.throw(InsightError);
		});
	});
});
