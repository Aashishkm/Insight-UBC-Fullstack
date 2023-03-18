import {
	Filter, Key, LogicComparison, MComparator, MComparison, MKey, NComparison, QueryClass,
	QueryModel, SComparison, SKey, Where, ApplyRule, ApplyToken, AnyKey, ApplyKey, Order
} from "../Models/QueryModel";
import {InsightError} from "./IInsightFacade";
import {
	isFilterList, validateKey, isNComparison, isOptions, isWhere, validateMComparison,
	validateSComparison, validateTransformations, isApplyRuleList, isApplyKey, isKey, isAnyKey,
	isDirectedOrder, validateDirectedOrder
} from "./QueryModelHelpersValidation";

export default class QueryModelHelpers {
	private datasetID: string = "";
	public handleOptions(options: any, queryClass: QueryClass) {
		if (isOptions(options)) {
			queryClass.columns = this.getColumnKeys(options.COLUMNS);
			this.checkKeyConsistency(queryClass.columns);
			if (options.ORDER) {
				queryClass.order = this.createOrder(options.ORDER, queryClass.columns);
			}
		} else {
			throw new InsightError("Options not formatted correctly");
		}
	}

	public handleWhere(where: any, queryClass: QueryClass) {
		if (Object.keys(where).length === 0) {
			// empty body matches all entries
			queryClass.where = {};
		} else if (isWhere(where)) {
			queryClass.where = this.makeFilterObjects(where as Where);
		} else {
			throw new InsightError("Where is not formatted correctly");
		}
	}

	public handleTransformations(transformations: any, queryClass: QueryClass) {
		if (validateTransformations(transformations)) {
			queryClass.apply = this.createApplyRuleList(transformations.APPLY);
			queryClass.group = this.createKeyList(transformations.GROUP);
		}
	}

	private createKeyList(keyList: any): Key[] {
		let resultKeyList: Key[] = [];
		if (this.isKeyList(keyList)) {
			keyList.forEach((key: Key) => {
				resultKeyList.push(this.createKey(key));
			});
		} else {
			throw new InsightError("Bad Key list");
		}
		if (resultKeyList.length === 0) {
			throw new InsightError("Empty key list");
		}
		return resultKeyList;
	}

	private isKeyList(arg: any): boolean {
		if (arg.constructor.name !== "Array") {
			throw new InsightError("key list is not array");
		}
		arg.forEach((key: any) => {
			if (!isKey(key)) {
				return false;
			}
		});
		return true;
	}

	private createApplyRuleList(applyRuleList: any): ApplyRule[] {
		let resultApplyRuleList: ApplyRule[] = [];
		if (isApplyRuleList(applyRuleList)) {
			applyRuleList.forEach((applyRule: ApplyRule) => {
				resultApplyRuleList.push(this.createApplyRule(applyRule));
			});
		} else {
			throw new InsightError("Bad apply rule list");
		}
		if (resultApplyRuleList.length === 0) {
			throw new InsightError("Empty key list");
		}
		return resultApplyRuleList;
	}

	private createApplyRule(applyRule: any): ApplyRule {
		const applyRuleName = this.getFirstKeyOfObject(applyRule);
		const applyTokenAndKey = this.getFirstValueOfObject(applyRule);
		const applyToken = this.getFirstKeyOfObject(applyTokenAndKey) as ApplyToken;
		const key = this.createKey(this.getFirstValueOfObject(applyTokenAndKey));
		return new ApplyRule(applyRuleName, applyToken, key);
	}

	private createKey(keyString: any): Key {
		return new Key(keyString);
	}

	private makeFilterObjects(filter: Where): Filter {
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
		let resultFilterList: Filter[] = [];
		filterList.forEach((filter) => {
			resultFilterList.push(this.makeFilterObjects(filter));
		});
		if (resultFilterList.length === 0) {
			throw new InsightError("Logic Comparisons cannot have empty arrays");
		}
		return resultFilterList;
	}

	public getColumnKeys(columns: AnyKey[]): AnyKey[] {
		let keyList: AnyKey[] = [];
		// push each string into a key array
		JSON.parse(JSON.stringify(columns)).forEach((value: string) => {
			if (isApplyKey(value)) {
				keyList.push(new ApplyKey(value));
			} else if (isKey(value)) {
				keyList.push(new Key(value));
			} else {
				throw new InsightError("Bad key in COLUMNS");
			}
		});
		if (keyList.length === 0) {
			throw new InsightError("COLUMNS must be an non-empty array");
		}
		return keyList;
	}

	private createOrder(order: Order, columns: AnyKey[]): Order {
		if (isAnyKey(order)) {
			return this.createOrderAnyKey(order, columns);
		} else if (isDirectedOrder(order)) {
			return this.createDirectedOrder(order);
		} else {
			throw new InsightError("Order is incorrectly formatted");
		}
	}

	private createDirectedOrder(order: any): Order {
		let ret = new Order();
		validateDirectedOrder(order);
		ret.dir = order.dir;
		ret.keys = this.createAnyKeyList(order.keys);
		return ret;
	}

	private createAnyKeyList(anyKeyList: any): AnyKey[] {
		let anyKeyResult: AnyKey[] = [];
		anyKeyList.forEach((anyKey: AnyKey) => {
			anyKeyResult.push(this.createAnyKey(anyKey));
		});
		return anyKeyResult;
	}

	private createAnyKey(anyKey: any): AnyKey {
		let resultKey: AnyKey;
		if (isKey(anyKey)) {
			resultKey = new Key(anyKey);
		} else if (isApplyKey(anyKey)) {
			resultKey = new ApplyKey(anyKey);
		} else {
			throw new InsightError("Order key invalid");
		}
		return resultKey;
	}

	private createOrderAnyKey(order: any, columns: AnyKey[]): Order {
		let ret = new Order();
		ret.key = this.createAnyKey(order);
		if (!this.isKeyInList(ret.key, columns)) {
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

	private checkKeyConsistency(keys: AnyKey[]) {
		const filteredKeys = keys.filter((value) => {
			return (value instanceof Key);
		});
		if (this.datasetID === "") {
			this.datasetID = filteredKeys[0].idString;
		}
		for (const key of filteredKeys) {
			if (key.idString !== this.datasetID) {
				throw new InsightError("All datasets mentioned must be the same");
			}
		}
	}

	private compareKeys(key1: Key, key2: Key): boolean {
		return key1.idString === key2.idString && key1.field === key2.field;
	}

	private compareApplyKeys(key1: ApplyKey, key2: ApplyKey): boolean {
		return key1.idString === key2.idString;
	}

	private isKeyInList(key: AnyKey, keyList: AnyKey[]): boolean {
		for (const k of keyList) {
			if (k instanceof Key) {
				if (this.compareKeys(key as Key, k)) {
					return true;
				}
			}
			if (k instanceof ApplyKey) {
				if (this.compareApplyKeys(key , k)) {
					return true;
				}
			}
		}
		return false;
	}

	private getNComparisonModel(filter: Filter): NComparison {
		return new NComparison(this.makeFilterObjects(filter));
	}

	public validQueryStructure(arg: any): arg is QueryModel {
		return this.hasWhereAndOptions(arg) || this.hasWhereOptionsTransformations(arg);
	}

	private hasWhereAndOptions(arg: any): arg is QueryModel {
		return arg.WHERE !== undefined && arg.OPTIONS !== undefined && this.hasRequiredLength(arg, 2);
	}

	private hasWhereOptionsTransformations(arg: any): arg is QueryModel {
		return arg.WHERE !== undefined && arg.OPTIONS !== undefined && arg.TRANSFORMATIONS !== undefined
		&& this.hasRequiredLength(arg, 3);
	}

	private hasRequiredLength(arg: any, reqLength: number): boolean {
		return Object.keys(arg).length === reqLength;
	}
}
