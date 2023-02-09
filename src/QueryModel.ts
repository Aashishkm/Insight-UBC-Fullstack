
export {QueryModel,
	Options,
	Key,
	Logic,
	MKey,
	SKey,
	Where,
	LogicComparison,
	Filter,
	MComparison,
	SComparison,
	NComparison,
	MComparator,
	MField,
	SField,
	QueryClass};

type MField = "avg" | "pass" | "fail" | "audit" | "year";
type SField = "dept" | "id" | "instructor" | "title" | "uuid";
type MComparator = "LT" | "GT" | "EQ";
type Logic = "AND" | "OR";

interface QueryModel {
	 WHERE: Where;
	 OPTIONS: Options;
}

interface Where {
	AND?: Filter[];
	OR?: Filter[];
	LT?: Filter;
	GT?: Filter;
	EQ?: Filter;
	IS?: Filter;
	NOT?: Filter;
}

class QueryClass {
	public where: Filter = {};
	public columns: Key[] = [];
	public order?: Key;
}
class Filter {
	// superclass for Filter objects
}
class LogicComparison implements Filter {
	public comparator: Logic;
	public filterList: Filter[];
	constructor(comparator: Logic, filterList: Filter[]) {
		this.comparator = comparator;
		this.filterList = filterList;
	}
}
//
class MComparison implements Filter {
	public comparator: MComparator;
	public mKey: MKey;
	public num: number;

	constructor(comparator: MComparator, mKey: MKey, num: number) {
		this.comparator = comparator;
		this.mKey = mKey;
		this.num = num;
	}
}
//
class SComparison implements Filter {
	public sKey: SKey;
	public inputString: string;

	constructor(sKey: SKey, inputString: string) {
		this.sKey = sKey;
		this.inputString = inputString;
	}
}

class NComparison implements Filter {
	public filter: Filter;

	constructor(filter: Filter) {
		this.filter = filter;
	}
}
interface Options {
	COLUMNS: Key[];
	ORDER: Key;
}
class Key {
	public idString: string;
	public field: MField | SField;
	// splits string into id and field
	constructor(keyString: string) {
		let key: any[] = keyString.split("_");
		this.idString = key[0];
		this.field = key[1];
	}
}

class MKey implements Key {
	public idString: string;
	public field: MField;
	constructor(keyString: string) {
		let key: any[] = keyString.split("_");
		this.idString = key[0];
		this.field = key[1];
	};
}
class SKey implements Key {
	public idString: string;
	public field: SField;
	constructor(keyString: string) {
		let key: any[] = keyString.split("_");
		this.idString = key[0];
		this.field = key[1];
	};
}
