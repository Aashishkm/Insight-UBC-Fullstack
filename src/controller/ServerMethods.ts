import {Request, Response} from "express";
import InsightFacade from "./InsightFacade";
import {IInsightFacade, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import {clearDisk, getContentFromArchives} from "../../test/TestUtil";

export default class ServerMethods {

	public static facade: IInsightFacade;

	public static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = ServerMethods.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}

	public static async query(req: Request, res: Response) {
		try {
			console.log(`Server::query(..) - body: ${JSON.stringify(req.body)}`);

			const queryResult = await ServerMethods.facade.performQuery(req.body);
			res.status(200).json({result: queryResult});
		} catch (err) {
			if (err instanceof InsightError) {
				res.status(400).json({error: err.message});
			} else {
				res.status(400);
				console.log("unhandled error in ServerMethods::query");
			}
		}
	}

	public static async remove(req: Request, res: Response) {
		try {
			console.log(`Server::remove(..) - path: ${JSON.stringify(req.path)}`);
			const datasetId = ServerMethods.getId(req.path);
			const str = await ServerMethods.facade.removeDataset(datasetId);
			console.log("removed " + datasetId);
			res.status(200).json({result: str});
		} catch (e) {
			if (e instanceof NotFoundError) {
				res.status(404).json({error: e.message});
			} else if (e instanceof InsightError) {
				res.status(400).json({error: e.message});
			} else {
				res.status(400);
				// res.status(400).json({error: e.message});
			}
		}

	}

	public static async add(req: Request, res: Response) {
		try {
			console.log(`Server::add(..) - path: ${JSON.stringify(req.body)}`);
			let datasetKind: InsightDatasetKind;
			const datasetId = ServerMethods.getPutId(req.path);
			datasetKind = ServerMethods.getKind(req.path);
			let dataset = (req.body as Buffer).toString("base64");
			const stuff = await ServerMethods.facade.addDataset(datasetId, dataset, datasetKind);
			res.status(200).json({result: stuff});
		} catch (err) {
			if (err instanceof InsightError) {
				res.status(400).json({error: err.message});
			} else {
				res.status(400);
				console.log("unhandled error in ServerMethods::add");
			}
		}
	}

	public static async list(req: Request, res: Response) {
		try {
			console.log(`Server::list(..) - path: ${JSON.stringify(req.body)}`);
			const datasets = await ServerMethods.facade.listDatasets();
			res.status(200).json({result: datasets});
		} catch (err) {
			res.status(400);
			console.log("unhandled error in ServerMethods::list");
		}
	}


	private static getId(path: string) {
		const arr = path.split("/");
		return arr[arr.length - 1];
	}

	private static getPutId(path: string) {
		const arr = path.split("/");
		return arr[arr.length - 2];
	}

	private static getKind(path: string): any {
		const arr = path.split("/");
		return arr[arr.length - 1];
	}
	/*
	private static getDataset(path: string) {
		const arr = path.split("/");
		return arr[arr.length - 3];
	}

	 */
}
