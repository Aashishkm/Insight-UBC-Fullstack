import Server from "./rest/Server";
import InsightFacade from "./controller/InsightFacade";
import ServerMethods from "./controller/ServerMethods";
import {InsightDatasetKind} from "./controller/IInsightFacade";
import {clearDisk, getContentFromArchives} from "../test/TestUtil";

/**
 * Main app class that is run with the node command. Starts the server.
 */
export class App {

	public initServer(port: number) {
		console.info(`App::initServer( ${port} ) - start`);

		const server = new Server(port);
		return server.start().then(() => {
			console.info("App::initServer() - started");
		}).catch((err: Error) => {
			console.error(`App::initServer() - ERROR: ${err.message}`);
		});
	}

	public async initFacade() {
		clearDisk();
		console.info("App::initFacade - starting");
		ServerMethods.facade = new InsightFacade();
		// UNCOMMENT FOR DEMO!!!
		// const sections = getContentFromArchives("pair.zip");
		// await ServerMethods.facade.addDataset("sections", sections, InsightDatasetKind.Sections);
	}
}

// This ends up starting the whole system and listens on a hardcoded port (4321)
console.info("App - starting");
const app = new App();
(async () => {
	await app.initServer(4321);
	await app.initFacade();
})();
