import {query} from "express";
export {QueryModel, Options, Body, Columns, Key};

type MField = "avg" | "pass" | "fail" | "audit" | "year";
type SField = "dept" | "id" | "instructor" | "title" | "uuid";
type MComparator = "LT" | "GT" | "EQ";
type Logic = "AND" | "OR";
type Negation = "NOT";
interface QueryModel {
	 WHERE: Body;
	 OPTIONS: Options;
}

interface Body {
	 filter: Filter;
}

interface FilterList {
	filterList: Filter | Filter[];
}
class Filter {
}

interface Options {
	COLUMNS: Key[];
	ORDER: Key;
}

class Columns {
	public keyList: Key[];
	constructor(keyList: Key[]) {
		this.keyList = keyList;
	}
}
class Key {
	public idString: string;
	public field: MField | SField;
	constructor(keyString: string) {
		let key: any[] = keyString.split("_");
		this.idString = key[0];
		this.field = key[1];
	}
}
