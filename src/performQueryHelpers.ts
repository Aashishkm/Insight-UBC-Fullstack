import {Options, Body, Columns, Key} from "./queryModel";

export{validateQuery, handleOptions, handleWhere};

function validateQuery(query: unknown): boolean {
	// TODO
	return true;
}

function handleOptions(options: Options) {
	let columnList: Key[] = getColumns(options.COLUMNS);
	let orderKey;
	if (options.ORDER) {
		orderKey = getOrderKey(options.ORDER);
	}
	console.log("handled options " + JSON.stringify(options));
	console.log("columns: ");
	console.log(columnList);
	console.log("order: ");
	console.log(orderKey);
}

function handleWhere(where: Body) {
	// TODO
	console.log("handled where " + JSON.stringify(where));
}

function getColumns(columns: Key[]): Key[] {
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
