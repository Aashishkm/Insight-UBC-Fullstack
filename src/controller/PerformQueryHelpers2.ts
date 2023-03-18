// fn from https://stackoverflow.com/questions/37320296/how-to-calculate-intersection-of-multiple-arrays-in-javascript-and-what-does-e
import {SectionRoomModel} from "../Models/SectionRoomModel";
import {InsightError} from "./IInsightFacade";
import {ApplyRule, Group} from "../Models/QueryModel";
import Decimal from "decimal.js";

export {intersection, union, matches, validateSFieldInput, findAvg, findMax, findSum, findMin, findCount};

function intersection(sectionLists: SectionRoomModel[][]) {
	let result: SectionRoomModel[] = [];
	let lists: SectionRoomModel[][];

	if (sectionLists.length === 1) {
		lists = [sectionLists[0]];
	} else {
		lists = sectionLists;
	}
	for (let currentList of lists) {
		for (let currentValue of currentList) {
			if (result.indexOf(currentValue) === -1) {
				if (
					lists.filter(function (obj) {
						return obj.indexOf(currentValue) === -1;
					}).length === 0
				) {
					result.push(currentValue);
				}
			}
		}
	}
	return result;
}

function union(sectionLists: SectionRoomModel[][]) {
	let result: SectionRoomModel[] = [];
	let lists: SectionRoomModel[][] = [];
	if (sectionLists.length === 1) {
		lists = [sectionLists[0]];
	} else {
		lists = sectionLists;
	}
	lists.forEach((list) => {
		result = result.concat(list);
	});
	result = [...new Set(result)];
	return result;
}
function matches(input: string, regex: string): boolean {
	if (regex === "*") {
		return true;
	} else if (!regex.includes("*")) {
		return input === regex;
	} else if (regex[0] === "*" && regex[regex.length - 1] === "*") {
		const match = regex.substring(1, regex.length - 1);
		validateSFieldInput(match);
		return input.includes(match);
	} else if (regex[0] === "*") {
		const match = regex.substring(1);
		validateSFieldInput(match);
		return input.endsWith(match);
	} else if (regex[regex.length - 1] === "*") {
		const match = regex.substring(0, regex.length - 1);
		validateSFieldInput(match);
		return input.startsWith(match);
	} else if (regex.includes("*")) {
		throw new InsightError("Must only contain wildcards at start or/and end");
	}
	return false;
}
function validateSFieldInput(inp: string): boolean {
	if (inp.includes("*")) {
		throw new InsightError("Must only contain wildcards at start or/and end");
	} else {
		return false;
	}
}

function findMax(group: Group, rule: ApplyRule) {
	let max: number = Number.MIN_VALUE;
	group.members.forEach((member) => {
		if (member[rule.key.field]) {
			if (member[rule.key.field] > max) {
				max = member[rule.key.field] as number;
			}
		}
	});
	return max;
}

function findMin(group: Group, rule: ApplyRule) {
	let min: number = Number.MAX_VALUE;
	group.members.forEach((member) => {
		if (member[rule.key.field]) {
			if (member[rule.key.field] < min) {
				min = member[rule.key.field] as number;
			}
		}
	});
	return min;
}

function findAvg(group: Group, rule: ApplyRule) {
	let sum: Decimal = new Decimal(0);
	group.members.forEach((member) => {
		if (member[group.groupedBy]) {
			sum = Decimal.add(new Decimal(member[rule.key.field] as number), sum);
		}
	});
	let avg = sum.toNumber() / group.members.length;
	return Number(avg.toFixed(2));
}

function findCount(group: Group) {
	return group.members.length;
}

function findSum(group: Group, rule: ApplyRule) {
	let sum = 0;
	group.members.forEach((member) => {
		if (member[rule.key.field]) {
			sum += member[rule.key.field] as number;
		}
	});
	return Number.parseInt(sum.toFixed(2), 10);
}
