import express, {Application, Request, Response} from "express";
import * as http from "http";
import cors from "cors";
import ServerMethods from "../controller/ServerMethods";
import {IInsightFacade, InsightDatasetKind, NotFoundError} from "../controller/IInsightFacade";
import InsightFacade from "../controller/InsightFacade";

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;

	public static facade: InsightFacade = new InsightFacade();

	constructor(port: number) {
		console.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();

		this.registerMiddleware();
		this.registerRoutes();

		/** NOTE: you can serve static frontend files in from your express server
		 * by uncommenting the line below. This makes files in ./frontend/public
		 * accessible at http://localhost:<port>/
		 */
		// this.express.use(express.static("./frontend/public"))
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public start(): Promise<void> {
		return new Promise((resolve, reject) => {
			console.info("Server::start() - start");
			if (this.server !== undefined) {
				console.error("Server::start() - server already listening");
				reject();
			} else {
				this.server = this.express
					.listen(this.port, () => {
						console.info(`Server::start() - server listening on port: ${this.port}`);
						resolve();
					})
					.on("error", (err: Error) => {
						// catches errors in server start
						console.error(`Server::start() - server ERROR: ${err.message}`);
						reject(err);
					});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public stop(): Promise<void> {
		console.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				console.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					console.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware() {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({type: "application/*", limit: "10mb"}));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// Registers all request handlers to routes
	private registerRoutes() {
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		this.express.get("/echo/:msg", Server.echo);

		// TODO: your other endpoints should go here
		this.express.post("/query", Server.query);

		this.express.delete("/dataset/:id", Server.remove);

		this.express.put("/dataset/:id/:kind", Server.add);

		this.express.get("/datasets", Server.list);
	}

	/**
	 * The next two methods handle the echo service.
	 * These are almost certainly not the best place to put these, but are here for your reference.
	 * By updating the Server.echo function pointer above, these methods can be easily moved.
	 */
	public static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: "error"});
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
			const queryResult = await Server.facade.performQuery(req.body);
			res.status(200).json({result: queryResult});
		} catch (err) {
			res.status(400).json({error: "error"});
			/* if (err instanceof InsightError) {
			} else {
				console.log("unhandled error in ServerMethods::query");
			} */
		}
	}

	public static async remove(req: Request, res: Response) {
		try {
			const datasetId = Server.getId(req.path);
			const str = await Server.facade.removeDataset(datasetId);
			console.log("removed " + datasetId);
			res.status(200).json({result: str});
		} catch (e) {
			if (e instanceof NotFoundError) {
				res.status(404).json({error: "Removal unsuccessful, dataset not found"});
			} else {
				res.status(400).json({error: "error"});
			}
		}
	}

	public static async add(req: Request, res: Response) {
		try {
			let datasetKind: InsightDatasetKind;
			const datasetId = Server.getPutId(req.path);
			datasetKind = Server.getKind(req.path);
			let dataset = req.body;
			dataset = dataset.toString("base64");
			const stuff = await Server.facade.addDataset(datasetId, dataset, datasetKind);
			res.status(200).json({result: stuff});
		} catch (err) {
			res.status(400).json({error: "error"});
			/*
			if (err instanceof InsightError) {
				res.status(400).json({error: err.message});
			} else {
				console.log("unhandled error in ServerMethods::add");
			} */
		}
	}

	public static async list(req: Request, res: Response) {
		try {
			// console.log(`Server::list(..) - path: ${JSON.stringify(req.body)}`);
			const datasets = await Server.facade.listDatasets();
			res.status(200).json({result: datasets});
		} catch (err) {
			res.status(400).json({result: "error"});
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
}
