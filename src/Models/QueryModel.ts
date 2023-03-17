export {
	QueryModel,
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
	QueryClass,
	Transformations,
	ApplyRule,
	ApplyToken,
	AnyKey,
	ApplyKey,
	Order,
	Direction};

type MComparator = "LT" | "GT" | "EQ";
type Logic = "AND" | "OR";

enum Direction {
	up = "UP",
	down = "DOWN"
}
enum ApplyToken {
	max = "MAX",
	min = "MIN",
	avg = "AVG",
	count = "COUNT",
	sum = "SUM"
}
enum MField {
	avg = "avg",
	pass = "pass",
	fail = "fail",
	audit = "audit",
	year = "year",
	lat = "lat",
	lon = "lon",
	seats = "seats"
}

enum SField {
	dept = "dept",
	id = "id",
	instructor = "instructor",
	title = "title",
	uuid = "uuid",
	fullname = "fullname",
	shortname = "shortname",
	number = "number",
	name = "name",
	address = "address",
	type = "type",
	furniture = "furniture",
	href = "href"
}
interface QueryModel {
	 WHERE: Where;
	 OPTIONS: Options;
	 TRANSFORMATIONS?: Transformations;
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
	public columns: AnyKey[] = [];
	public queryId: string = "";
	public order?: Order;
	public group?: Key[];
	public apply?: ApplyRule[];
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
	COLUMNS: AnyKey[];
	ORDER: Order;
}

class Order {
	public dir?: Direction;
	public keys?: AnyKey[];
	public key?: AnyKey;
}

interface AnyKey {
	idString: string;
}

class ApplyKey implements AnyKey {
	public idString: string;

	constructor(idString: string) {
		this.idString = idString;
	}
}
class Key implements AnyKey {
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
	}
}
class SKey implements Key {
	public idString: string;
	public field: SField;
	constructor(keyString: string) {
		let key: any[] = keyString.split("_");
		this.idString = key[0];
		this.field = key[1];
	}
}

interface Transformations {
	GROUP: Key[],
	APPLY: ApplyRule[]
}

class ApplyRule {
	public applyKey: ApplyKey;
	public applyToken: ApplyToken;
	public key: Key;

	constructor(applyKey: string, applyToken: ApplyToken, key: Key) {
		this.applyKey = new ApplyKey(applyKey);
		this.applyToken = applyToken;
		this.key = key;
	}
}
