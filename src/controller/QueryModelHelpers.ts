import {
	Key, Options, QueryModel, Where, LogicComparison, Filter, MComparison,
	MKey, SKey, SComparison, NComparison, MComparator, QueryClass, MField, SField
} from "../Models/QueryModel";
import {InsightError} from "./IInsightFacade";
import {
	isOptions, isWhere, isFilterList,
	validateMComparison, isKey, isNComparison, validateSComparison
} from "./QueryModelHelpersValidation";

export{hasWhereAndOptions, handleOptions, handleWhere, isOptions, isWhere,
	isFilterList, validateSComparison, validateMComparison};
function handleOptions(options: any, queryClass: QueryClass) {
	/** Takes in OPTIONS from a query and modifies given queryClass with respective columns and order
	 * @param options an object to verify as options
	 * @param queryClass the queryClass is modified, adding columns and optionally order
	 *
	 * should throw an InsightError if OPTIONS is improperly formatted
	 */
	if (isOptions(options)) {
		queryClass.columns = getColumnKeys(options.COLUMNS);
		let checkKey: string = checkKeyConsistency(queryClass.columns);
		if (options.ORDER) {
			queryClass.order = createOrderKey(options.ORDER, queryClass.columns);
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
		return getMComparisonModel("EQ", filter.EQ);
	} else if (filter.GT !== undefined) {
		return getMComparisonModel("GT", filter.GT);
	} else if (filter.LT !== undefined) {
		return getMComparisonModel("LT", filter.LT);
	} else if (filter.IS !== undefined) {
		return createSComparison(filter.IS);
	} else if (filter.NOT !== undefined) {
		if (isNComparison(filter.NOT)) {
			return getNComparisonModel(filter.NOT);
		}
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

function createOrderKey(orderKey: Key, columns: Key[]): Key {
	/** Creates a model order key from given object
	 * @param key non-validated order key
	 * @param columns COLUMNS keys
	 * @returns Key
	 *
	 * throws InsightError if it does not mention a COLUMN key
	 */
	// TODO perhaps need to validate key string before
	if (!isKey(JSON.parse(JSON.stringify(orderKey)))) {
		throw new InsightError("Order key invalid");
	}
	const ret = new Key(JSON.parse(JSON.stringify(orderKey)));
	if (!isKeyInList(ret, columns)) {
		throw new InsightError("ORDER key must be in COLUMNS");
	}
	return ret;
}

function getMComparisonModel(mComparator: MComparator, mComparison: any): MComparison {
	validateMComparison(mComparison);
	let mKey: MKey = new MKey(getFirstKeyOfObject(mComparison));
	let comparisonNum: number = getFirstValueOfObject(mComparison) as number;
	return new MComparison(mComparator, mKey, comparisonNum);
}

function createSComparison(sComparison: any): SComparison {
	validateSComparison(sComparison);
	const sKey = new SKey(getFirstKeyOfObject(sComparison));
	const inputString = getFirstValueOfObject(sComparison) as string;
	return new SComparison(sKey, inputString);
}

function getFirstKeyOfObject(obj: any) {
	return Object.keys(obj)[0];
}

function getFirstValueOfObject(obj: any) {
	return Object.values(obj)[0];
}

function checkKeyConsistency(keys: Key[]): string {
	const firstKeyID: string = keys[0].idString;
	for (const key of keys) {
		if (key.idString !== firstKeyID) {
			throw new InsightError("All datasets mentioned must be the same");
		}
	}
	return firstKeyID;
}

function compareKeys(key1: Key, key2: Key): boolean {
	return (key1.idString === key2.idString && key1.field === key2.field);
}

function isKeyInList(key: Key, keyList: Key[]): boolean {
	for (const k of keyList) {
		if (compareKeys(key, k)) {
			return true;
		}
	}
	return false;
}
function getNComparisonModel(filter: Filter): NComparison {
	return new NComparison(makeFilterObjects(filter));
}
function hasWhereAndOptions(arg: any): arg is QueryModel {
	return arg.WHERE !== undefined && arg.OPTIONS !== undefined;
}
export function hasComparator(arg: any): boolean {
	return arg.AND !== undefined || arg.OR !== undefined || arg.LT !== undefined || arg.GT !== undefined ||
		arg.EQ !== undefined || arg.IS !== undefined || arg.NOT !== undefined;
}
export function hasRequiredLength(arg: any, reqLength: number): boolean {
	return Object.keys(arg).length === reqLength;
}
