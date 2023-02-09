export class SectionModel {
	private uuid: string;
	private id: string;
	private title: string;
	private instructor: string;
	private dept: string;
	private year: number;
	private avg: number;
	private pass: number;
	private fail: number;
	private audit: number;
	constructor(
		uuid: string,
		id: string,
		title: string,
		instructor: string,
		dept: string,
		year: number,
		avg: number,
		pass: number,
		fail: number,
		audit: number
	) {
		this.uuid = uuid;
		this.id = id;
		this.title = title;
		this.instructor = instructor;
		this.dept = dept;
		this.year = year;
		this.avg = avg;
		this.pass = pass;
		this.fail = fail;
		this.audit = audit;
	}
	public getUuid(): string {
		return this.uuid;
	}
	public setUuid(value: string) {
		this.uuid = value;
	}

	public getId(): string {
		return this.id;
	}
	public setId(value: string) {
		this.id = value;
	}

	public getTitle(): string {
		return this.title;
	}
	public setTitle(value: string) {
		this.title = value;
	}

	public getInstructor(): string {
		return this.instructor;
	}
	public setInstructor(value: string) {
		this.instructor = value;
	}

	public getDept(): string {
		return this.dept;
	}
	public setDept(value: string) {
		this.dept = value;
	}

	public getYear(): number {
		return this.year;
	}
	public setYear(value: number) {
		this.year = value;
	}

	public getAvg(): number {
		return this.avg;
	}
	public setAvg(value: number) {
		this.avg = value;
	}

	public getPass(): number {
		return this.pass;
	}
	public setPass(value: number) {
		this.pass = value;
	}

	public getFail(): number {
		return this.fail;
	}
	public setFail(value: number) {
		this.fail = value;
	}

	public getAudit(): number {
		return this.audit;
	}
	public setAudit(value: number) {
		this.audit = value;
	}
}
