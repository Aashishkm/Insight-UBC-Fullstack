import {Request, Response} from "express";
// import InsightFacade from "./InsightFacade";
// import {IInsightFacade, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import {clearDisk, getContentFromArchives} from "../../test/TestUtil";
import {IInsightFacade, InsightDatasetKind, NotFoundError} from "./IInsightFacade";

export default class ServerMethods {
	public static facade: IInsightFacade;
}
