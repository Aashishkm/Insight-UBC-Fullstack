import {
	Filter,
	MField,
	Options,
	SField,
	Where,
	Transformations,
	ApplyRule,
	ApplyToken,
	Direction
} from "../Models/QueryModel";
import {InsightError} from "./IInsightFacade";

export {isSField, isSKey, isMKey, isMField, isSection, isWhere, isFilterList,
	validateSComparison, validateMComparison, isOptions, validateKey, isField, isFilter, isNComparison,
	validateTransformations, isApplyRuleList, isKey, isApplyKey, isAnyKey, isDirectedOrder, validateDirectedOrder};

function isSField(arg: string): boolean {
	return Object.values(SField).includes(arg as unknown as SField);
}

function isSKey(input: any): boolean {
	if(!input.includes("_")) {
		throw new InsightError("SKey does not have '_'");
	}
	let inputArr: string[] = input.split("_");
	if (inputArr.length > 2) {
		throw new InsightError("SKey has more than 1 '_'");
	}
	if (!isSField(inputArr[1])) {
		throw new InsightError("SField is invalid");
	}
	if (!isSection(inputArr[0])) {
		throw new InsightError("Invalid section");
	}
	return true;
}

function isSection(arg: string): boolean {
	// TODO implement isSection and keep track of primary section (can only refer to 1 section at a time)
	return true;
}

function validateSComparison(arg: any) {
	// TODO implement wildcard checks
	if (!hasRequiredLength(arg, 1)) {
		throw new InsightError("SComparison has too many keys");
	} else {
		for (const property in arg) {
			isSKey(JSON.parse(JSON.stringify(property)));
			if (!(typeof arg[property] === "string")) {
				throw new InsightError("Comparison must have string");
			}
		}
	}
}

function isMField(arg: string): boolean {
	return Object.values(MField).includes(arg as unknown as MField);
}
function isMKey(input: any): boolean {
	if(!input.includes("_")) {
		throw new InsightError("MKey does not have '_'");
	}
	let inputArr: string[] = input.split("_");
	if (inputArr.length > 2) {
		throw new InsightError("MKey has more than 1 '_'");
	}
	if (!isMField(inputArr[1])) {
		throw new InsightError("MField is invalid");
	}
	if (!isSection(inputArr[0])) {
		throw new InsightError("Section is invalid");
	}
	return true;
}

// returns true if MComparison is formatted correctly
function validateMComparison(arg: any) {
	if (!hasRequiredLength(arg, 1)) {
		throw new InsightError("MComparison has too many keys");
	} else {
		for (const property in arg) {
			isMKey(JSON.parse(JSON.stringify(property)));
			if (!(typeof arg[property] === "number")) {
				throw new InsightError("Comparison must have number");
			}
		}
	}
}

// returns true if arg is a list and every element in list is a filter
function isFilterList(arg: any): arg is Filter[] {
	if (arg.constructor.name !== "Array") {
		throw new InsightError("Logic comparison does not have filter list");
	}
	arg.forEach((filter: any) => {
		isFilter(filter);
	});
	return true;
}

// returns true if WHERE is properly formatted with one comparator throws InsightError if no comparator or only 1 key
function isWhere(arg: any): arg is Where {
	if (!hasComparator(arg)) {
		throw new InsightError("WHERE does not have a comparator");
	} else if (!hasRequiredLength(arg, 1)) {
		throw new InsightError("WHERE should only have 1 key");
	} else {
		return true;
	}
}

function isFilter(arg: any): arg is Filter {
	if (!hasComparator(arg)) {
		throw new InsightError("filter does not have a comparator");
	} else if (!hasRequiredLength(arg, 1)) {
		throw new InsightError("filter should only have 1 key");
	} else {
		return true;
	}
}

// returns true if arg has property COLUMNS defined
// TODO needs more testing
function isOptions(arg: any): arg is Options {
	if (arg.COLUMNS === undefined) {
		throw new InsightError("OPTIONS missing COLUMNS");
	} else if (arg.ORDER === undefined && hasRequiredLength(arg, 2)) {
		// throw error if it does not have order and columns
		throw new InsightError("invalid keys in OPTIONS 1");
	} else if (!(hasRequiredLength(arg, 1) || hasRequiredLength(arg, 2))) {
		throw new InsightError("invalid keys in OPTIONS");
	} else {
		return true;
	}
}

function validateTransformations(arg: any): arg is Transformations {
	if (arg.GROUP === undefined) {
		throw new InsightError("TRANSFORMATIONS missing GROUP");
	} else if (arg.APPLY === undefined) {
		throw new InsightError("TRANSFORMATIONS missing APPLY");
	} else if (!hasRequiredLength(arg, 2)) {
		throw new InsightError("invalid keys in TRANSFORMATIONS");
	} else {
		return true;
	}
}

function isField(field: string) {
	return isMField(field) || isSField(field);
}

function validateKey(input: string) {
	if(!input.includes("_")) {
		throw new InsightError("Key does not have '_'");
	}
	let inputArr: string[] = input.split("_");
	if (inputArr.length > 2) {
		throw new InsightError("Key has more than 1 '_'");
	}
	if (!isField(inputArr[1])) {
		throw new InsightError("Field is invalid");
	}
	if (!isSection(inputArr[0])) {
		throw new InsightError("Section is invalid");
	}
	return true;
}

function isKey(arg: string) {
	try {
		validateKey(arg);
		return true;
	} catch (e) {
		return false;
	}
}
function isNComparison(arg: any): arg is Filter {
	if (!isFilter(arg)) {
		throw new InsightError("Negation malformed");
	} else {
		return true;
	}
}
function hasComparator(arg: any): boolean {
	return arg.AND !== undefined || arg.OR !== undefined || arg.LT !== undefined || arg.GT !== undefined ||
		arg.EQ !== undefined || arg.IS !== undefined || arg.NOT !== undefined;
}
function hasRequiredLength(arg: any, reqLength: number): boolean {
	return Object.keys(arg).length === reqLength;
}

function isApplyRuleList(arg: any): arg is ApplyRule[] {
	if (arg.constructor.name !== "Array") {
		throw new InsightError("APPLY does not contain an array");
	}
	arg.forEach((applyRule: any) => {
		isApplyRule(applyRule);
	});
	return true;
}

function isApplyRule(arg: any): arg is ApplyRule {
	if (!hasRequiredLength(arg, 1)) {
		throw new InsightError("Apply rule has more than 1 key");
	}
	const applyKeyName = getFirstKeyOfObject(arg);
	validateApplyKeyName(applyKeyName);
	const applyTokenAndKey = getFirstValueOfObject(arg);
	validateApplyTokenAndKey(applyTokenAndKey);
	return true;

}

function validateApplyTokenAndKey(arg: any) {
	if (!hasRequiredLength(arg, 1)) {
		throw new InsightError("applykey has more than 1 key");
	}
	const token = getFirstKeyOfObject(arg);
	if (!isToken(token)) {
		throw new InsightError("Apply token invalid");
	}
	const key = getFirstValueOfObject(arg) as string;
	if (!validateKey(key)) {
		throw new InsightError("Apply key invalid");
	}
}

function isToken(arg: string): boolean {
	return Object.values(ApplyToken).includes(arg as unknown as ApplyToken);
}

function validateApplyKeyName(applyKeyName: string) {
	if (applyKeyName.includes("_")) {
		throw new InsightError("Apply key cannot contain underscores");
	}
}

function getFirstKeyOfObject(obj: any) {
	return Object.keys(obj)[0];
}

function getFirstValueOfObject(obj: any) {
	return Object.values(obj)[0];
}

function isApplyKey(arg: string): boolean {
	try {
		validateApplyKeyName(arg);
		return true;
	} catch (e) {
		return false;
	}
}

function isAnyKey(arg: any): boolean {
	return isApplyKey(arg) || isKey(arg);
}

function isDirectedOrder(arg: any): boolean {
	return (arg.dir !== undefined && arg.keys !== undefined && hasRequiredLength(arg, 2));
}

function validateDirectedOrder(arg: any) {
	if (!isDirection(arg.dir)) {
		throw new InsightError("Invalid direction");
	} else if (!isAnyKeyList(arg.keys)) {
		throw new InsightError("AnyKeyList in Order is invalid");
	}
}

function isDirection(arg: any): boolean {
	return Object.values(Direction).includes(arg as unknown as Direction);
}

function isAnyKeyList(arg: any): boolean {
	if (arg.constructor.name !== "Array") {
		throw new InsightError("Not array in AnyKeyList");
	}
	arg.forEach((anyKey: any) => {
		if (!isAnyKey(anyKey)) {
			return false;
		}
	});
	return true;
}
