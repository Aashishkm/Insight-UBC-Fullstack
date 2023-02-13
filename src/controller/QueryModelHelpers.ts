import {
	Key, Options, QueryModel, Where, LogicComparison, Filter, MComparison,
	MKey, SKey, SComparison, NComparison, MComparator, QueryClass, MField, SField
} from "../Models/QueryModel";
import {InsightError} from "./IInsightFacade";
import {isOptions, isWhere, isFilterList, isSComparison,
	isMComparison, isKey} from "./QueryModelHelpersValidation";

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
			queryClass.order = getOrderKey(options.ORDER, queryClass.columns);
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
	if (Object.keys(where).length === 0) {
		// empty body matches all entries
		queryClass.where = {};
	} else if (isWhere(where)) {
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
	if (resultFilterList.length === 0) {
		throw new InsightError("Logic Comparisons cannot have empty arrays");
	}
	return resultFilterList;
}


function getColumnKeys(columns: Key[]): Key[] {
	let keyList: Key[] = [];
	// push each string into a key array
	JSON.parse(JSON.stringify(columns)).forEach((value: string) => {
		if (isKey(value)) {
			keyList.push(new Key(value));
		}
	});
	if (keyList.length === 0) {
		throw new InsightError("COLUMNS must be an non-empty array");
	}
	return keyList;
}

function getOrderKey(key: Key, columnKeys: Key[]): Key {
	// perhaps need to validate key string before
	if (!isKey(JSON.parse(JSON.stringify(key)))) {
		throw new InsightError("Order key invalid");
	}
	const ret = new Key(JSON.parse(JSON.stringify(key)));
	// if (!columnKeys.includes(ret)) {
	// 	// TODO create fn to compare keys
	// 	throw new InsightError("ORDER key must be in COLUMNS");
	// }
	return ret;
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
// returns true if object has one of the comparators
export function hasComparator(arg: any): boolean {
	return arg.AND !== undefined || arg.OR !== undefined || arg.LT !== undefined || arg.GT !== undefined ||
		arg.EQ !== undefined || arg.IS !== undefined || arg.NOT !== undefined;
}
// returns true if object has reqLength properties
export function hasRequiredLength(arg: any, reqLength: number): boolean {
	return Object.keys(arg).length === reqLength;
}
