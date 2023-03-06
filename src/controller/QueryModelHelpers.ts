import {
	Filter,
	Key,
	LogicComparison,
	MComparator,
	MComparison,
	MKey, NComparison,
	QueryClass, QueryModel,
	SComparison, SKey,
	Where
} from "../Models/QueryModel";
import {InsightError} from "./IInsightFacade";
import {
	isFilterList,
	isKey,
	isNComparison,
	isOptions, isWhere,
	validateMComparison,
	validateSComparison
} from "./QueryModelHelpersValidation";

export default class QueryModelHelpers {
	private datasetID: string = "";
	public handleOptions(options: any, queryClass: QueryClass) {
		/** Takes in OPTIONS from a query and modifies given queryClass with respective columns and order
		 * @param options an object to verify as options
		 * @param queryClass the queryClass is modified, adding columns and optionally order
		 *
		 * should throw an InsightError if OPTIONS is improperly formatted
		 */
		if (isOptions(options)) {
			queryClass.columns = this.getColumnKeys(options.COLUMNS);
			this.checkKeyConsistency(queryClass.columns);
			if (options.ORDER) {
				queryClass.order = this.createOrderKey(options.ORDER, queryClass.columns);
			}
		} else {
			throw new InsightError("Options not formatted correctly");
		}
	}

	public handleWhere(where: any, queryClass: QueryClass) {
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
			queryClass.where = this.makeFilterObjects(where as Where);
		} else {
			throw new InsightError("Where is not formatted correctly");
		}
	}

	public makeFilterObjects(filter: Where): Filter {
		/** Takes in an unchecked filter and creates a filter object
		 * @param filter a Where object to be made into a Filter object
		 * @returns Filter
		 *
		 * should throw an InsightError if there is no matching property, but this
		 * should not happen because isWhere checks for this already
		 */
		if (filter.AND !== undefined) {
			if (isFilterList(filter.AND)) {
				return new LogicComparison("AND", this.makeFilterObjectsList(filter.AND));
			}
		} else if (filter.OR !== undefined) {
			if (isFilterList(filter.OR)) {
				return new LogicComparison("OR", this.makeFilterObjectsList(filter.OR));
			}
		} else if (filter.EQ !== undefined) {
			return this.getMComparisonModel("EQ", filter.EQ);
		} else if (filter.GT !== undefined) {
			return this.getMComparisonModel("GT", filter.GT);
		} else if (filter.LT !== undefined) {
			return this.getMComparisonModel("LT", filter.LT);
		} else if (filter.IS !== undefined) {
			return this.createSComparison(filter.IS);
		} else if (filter.NOT !== undefined) {
			if (isNComparison(filter.NOT)) {
				return this.getNComparisonModel(filter.NOT);
			}
		}
		// This should be unreachable
		throw new InsightError("Something went wrong in makeFilterObjects");
	}

	private makeFilterObjectsList(filterList: Filter[]): Filter[] {
		/** Takes in a list of unchecked Filter objects and returns checked a list of filter objects
		 * @param filterList a list of unchecked Filter objects
		 * @returns Filter[]
		 *
		 * recursively calls makeFilterObjects
		 */
		let resultFilterList: Filter[] = [];
		filterList.forEach((filter) => {
			resultFilterList.push(this.makeFilterObjects(filter));
		});
		if (resultFilterList.length === 0) {
			throw new InsightError("Logic Comparisons cannot have empty arrays");
		}
		return resultFilterList;
	}

	public getColumnKeys(columns: Key[]): Key[] {
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

	private createOrderKey(orderKey: Key, columns: Key[]): Key {
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
		if (!this.isKeyInList(ret, columns)) {
			throw new InsightError("ORDER key must be in COLUMNS");
		}
		return ret;
	}

	private getMComparisonModel(mComparator: MComparator, mComparison: any): MComparison {
		validateMComparison(mComparison);
		let mKey: MKey = new MKey(this.getFirstKeyOfObject(mComparison));
		this.validateMKey(mKey);
		let comparisonNum: number = this.getFirstValueOfObject(mComparison) as number;
		return new MComparison(mComparator, mKey, comparisonNum);
	}

	private createSComparison(sComparison: any): SComparison {
		validateSComparison(sComparison);
		const sKey = new SKey(this.getFirstKeyOfObject(sComparison));
		this.validateSKey(sKey);
		const inputString = this.getFirstValueOfObject(sComparison) as string;
		return new SComparison(sKey, inputString);
	}

	private validateSKey(sKey: SKey) {
		if (this.datasetID === "") {
			this.datasetID = sKey.idString;
		} else if (this.datasetID !== sKey.idString) {
			throw new InsightError("Must reference same dataset");
		}
	}

	private validateMKey(mKey: MKey) {
		if (this.datasetID === "") {
			this.datasetID = mKey.idString;
		} else if (this.datasetID !== mKey.idString) {
			throw new InsightError("Must reference same dataset");
		}
	}

	private getFirstKeyOfObject(obj: any) {
		return Object.keys(obj)[0];
	}

	private getFirstValueOfObject(obj: any) {
		return Object.values(obj)[0];
	}

	private checkKeyConsistency(keys: Key[]) {
		if (this.datasetID === "") {
			this.datasetID = keys[0].idString;
		}
		for (const key of keys) {
			if (key.idString !== this.datasetID) {
				throw new InsightError("All datasets mentioned must be the same");
			}
		}
	}

	private compareKeys(key1: Key, key2: Key): boolean {
		return (key1.idString === key2.idString && key1.field === key2.field);
	}

	private isKeyInList(key: Key, keyList: Key[]): boolean {
		for (const k of keyList) {
			if (this.compareKeys(key, k)) {
				return true;
			}
		}
		return false;
	}

	private getNComparisonModel(filter: Filter): NComparison {
		return new NComparison(this.makeFilterObjects(filter));
	}

	public hasWhereAndOptions(arg: any): arg is QueryModel {
		return arg.WHERE !== undefined && arg.OPTIONS !== undefined;
	}

}
