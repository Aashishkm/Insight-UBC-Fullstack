import {
	Key, Options, QueryModel, Where, LogicComparison, Filter, MComparison,
	MKey, SKey, SComparison, NComparison, MComparator, MField, QueryClass
} from "./queryModel";
import {InsightError} from "./controller/IInsightFacade";

export{hasWhereAndOptions, handleOptions, handleWhere, isOptions, isWhere,
	isFilterList, isSComparison, isMComparison};
function handleOptions(options: any, queryClass: QueryClass) {
	/** Takes in OPTIONS from a query and modifies given queryClass with respective columns and order
	 * @param options an object to verify as options
	 * @param queryClass the queryClass is modified, adding columns and optionally order
	 *
	 * should throw an InsightError if OPTIONS is improperly formatted
	 */
	if (isOptions(options)) {
		queryClass.columns = getColumnKeys(options.COLUMNS);
		if (options.ORDER) {
			queryClass.order = getOrderKey(options.ORDER);
		}
	} else {
		throw new InsightError("Options not formatted correctly");
	}
}

function handleWhere(where: any, queryClass: QueryClass) {
	/** Takes in WHERE from a query and modifies given queryClass's filter
	 * @param where an object to verify as a WHERE
	 * @param queryClass the queryClass is modified, adding a filter object
	 *
	 * should throw an InsightError if WHERE is improperly formatted
	 */
	if (isWhere(where)) {
		queryClass.where = makeFilterObjects(where as Where);
	} else {
		throw new InsightError("Where is not formatted correctly");
	}
}

function makeFilterObjects(filter: Where): Filter {
	/** Takes in an unchecked filter and creates a filter object
	 * @param filter a Where object to be made into a Filter object
	 * @returns Filter
	 *
	 * should throw an InsightError if there is no matching property, but this
	 * should not happen because isWhere checks for this already
	 */
	if (filter.AND !== undefined) {
		if (isFilterList(filter.AND)) {
			return new LogicComparison("AND", makeFilterObjectsList(filter.AND));
		}
	} else if (filter.OR !== undefined) {
		if (isFilterList(filter.OR)) {
			return new LogicComparison("OR", makeFilterObjectsList(filter.OR));
		}
	} else if (filter.EQ !== undefined) {
		if (isMComparison(filter.EQ)) {
			return getMComparisonModel("EQ", filter.EQ);
		}
	} else if (filter.GT !== undefined) {
		if (isMComparison(filter.GT)) {
			return getMComparisonModel("GT", filter.GT);
		}
	} else if (filter.LT !== undefined) {
		if (isMComparison(filter.LT)) {
			return getMComparisonModel("LT", filter.GT);
		}
	} else if (filter.IS !== undefined) {
		if (isSComparison(filter.IS)) {
			return getSComparisonModel(filter.IS);
		}
	} else if (filter.NOT !== undefined) {
		// TODO might need well formed check
		return getNComparisonModel(makeFilterObjects(filter.NOT));
	}
	// This should be unreachable
	throw new InsightError("Something went wrong in makeFilterObjects");
}

function makeFilterObjectsList(filterList: Filter[]): Filter[] {
	/** Takes in a list of unchecked Filter objects and returns checked a list of filter objects
	 * @param filterList a list of unchecked Filter objects
	 * @returns Filter[]
	 *
	 * recursively calls makeFilterObjects
	 */
	let resultFilterList: Filter[] = [];
	filterList.forEach((filter) => {
		resultFilterList.push(makeFilterObjects(filter));
	});
	return resultFilterList;
}

function getColumnKeys(columns: Key[]): Key[] {
	/** Takes in a list of unchecked Filter objects and returns checked a list of filter objects
	 * @param filterList a list of unchecked Filter objects
	 * @returns Filter[]
	 *
	 * recursively calls makeFilterObjects
	 */
	let keyList: Key[] = [];
	// push each string into a key array
	JSON.parse(JSON.stringify(columns)).forEach((value: string) => {
		keyList.push(new Key(value));
	});
	return keyList;
}

function getOrderKey(key: Key): Key {
	// perhaps need to validate key string before
	return new Key(JSON.parse(JSON.stringify(key)));
}

function getMComparisonModel(mComparator: MComparator, key: any): MComparison {
	// comparator is MComparator
	// key is of format {"ubc_avg": 90}
	let mKey: MKey = new MKey("error_error");
	let comparisonNum: number = 0;
	// this should only run once, only 1 property
	for (const property in key) {
		// property is "ubc_avg"
		mKey = new MKey(JSON.parse(JSON.stringify(property)));
		comparisonNum = key[property];
		// key[property] is 90
	}
	return new MComparison(mComparator, mKey, comparisonNum);
}

function getSComparisonModel(key: any): SComparison {
	let sKey: SKey = new SKey("error_error");
	let inputString: string = "";
	for (const property in key) {
		// create SKey from e.g. "sections_instructor"
		sKey = new SKey(JSON.parse(JSON.stringify(property)));
		// create SComparison from e.g. SKey and "smith"
		inputString = key[property];
	}
	return new SComparison(sKey, inputString);
}

function getNComparisonModel(filter: Filter): NComparison {
	return new NComparison(filter);
}

// returns true if arg has properties WHERE and OPTIONS defined
function hasWhereAndOptions(arg: any): arg is QueryModel {
	return arg.WHERE !== undefined && arg.OPTIONS !== undefined;
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

function isFilter(arg: any): arg is Filter {
	if (!hasComparator(arg)) {
		throw new InsightError("filter does not have a comparator");
	} else if (!hasRequiredLength(arg, 1)) {
		throw new InsightError("filter should only have 1 key");
	} else {
		return true;
	}
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

// returns true if MComparison is formatted correctly
function isMComparison(arg: any): boolean {
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
	return true;
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
		console.log(inputArr[1]);
		throw new InsightError("MField is invalid");
	}
	return true;
}

function isMField(arg: string): boolean {
	return (arg === "avg" ||
		arg === "pass" ||
		arg === "fail" ||
		arg === "audit" ||
		arg === "year");
}

function isSComparison(arg: any): boolean {
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
	return true;
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

function isSField(arg: string): boolean {
	return (arg === "dept" ||
		arg === "id" ||
		arg === "instructor" ||
		arg === "title" ||
		arg === "uuid");
}

function isSection(arg: string): boolean {
	// TODO implement isSection and keep track of primary section (can only refer to 1 section at a time)
	return true;
}
// returns true if object has one of the comparators
function hasComparator(arg: any): boolean {
	return arg.AND !== undefined ||
		arg.OR !== undefined ||
		arg.LT !== undefined ||
		arg.GT !== undefined ||
		arg.EQ !== undefined ||
		arg.IS !== undefined ||
		arg.NOT !== undefined;
}
// returns true if object has reqLength properties
function hasRequiredLength(arg: any, reqLength: number): boolean {
	return Object.keys(arg).length === reqLength;
}
