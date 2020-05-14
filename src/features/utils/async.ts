export interface ITask<T> {
	(): T;
}

export class Throttler<T> {

	private activePromise: Promise<T>;
	private queuedPromise: Promise<T>;
	private queuedPromiseFactory: ITask<Promise<T>>;

	constructor() {
		this.activePromise = <any>null;
		this.queuedPromise = <any>null;
		this.queuedPromiseFactory = <any>null;
	}

	public queue(promiseFactory: ITask<Promise<T>>): Promise<T> {
		if (this.activePromise) {
			this.queuedPromiseFactory = promiseFactory;

			if (!this.queuedPromise) {
				var onComplete = () => {
					this.queuedPromise = <any>null;

					var result = this.queue(this.queuedPromiseFactory);
					this.queuedPromiseFactory = <any>null;

					return result;
				};

				this.queuedPromise = new Promise<T>(resolve => {
					this.activePromise.then(onComplete, onComplete).then(resolve);
				});
			}

			return new Promise<T>((resolve, reject) => {
				this.queuedPromise.then(resolve, reject);
			});
		}

		this.activePromise = promiseFactory();

		return new Promise<T>((resolve, reject) => {
			this.activePromise.then((result: T) => {
				this.activePromise = <any>null;
				resolve(result);
			}, (err: any) => {
				this.activePromise = <any>null;
				reject(err);
			});
		});
	}
}

export class Delayer<T> {

	public defaultDelay: number;
	
	private timeout: NodeJS.Timeout;
	private completionPromise: Promise<T>;
	private onResolve: (value: T | Thenable<T>) => void;
	private task: ITask<T>;

	constructor(defaultDelay: number) {
		this.defaultDelay = defaultDelay;
		this.timeout = <any>null;
		this.completionPromise = <any>null;
		this.onResolve = <any>null;
		this.task = <any>null;
	}

	public trigger(task: ITask<T>, delay: number = this.defaultDelay): Promise<T> {
		this.task = task;
		this.cancelTimeout();

		if (!this.completionPromise) {
			this.completionPromise = new Promise<T>(resolve => {
				this.onResolve = resolve;
			}).then(() => {
				this.completionPromise = <any>null;
				this.onResolve = <any>null;

				var result = this.task();
				this.task = <any>null;

				return result;
			});
		}

		this.timeout = setTimeout(() => {
			this.timeout = <any>null;
			this.onResolve(<any>null);
		}, delay);

		return this.completionPromise;
	}

	public isTriggered(): boolean {
		return this.timeout !== null;
	}

	public cancel(): void {
		this.cancelTimeout();
		if (this.completionPromise) {
			this.completionPromise = <any>null;
		}
	}

	private cancelTimeout(): void {
		if (this.timeout !== null) {
			clearTimeout(this.timeout);
			this.timeout = <any>null;
		}
	}

}

export class ThrottledDelayer<T> extends Delayer<Promise<T>> {

	private throttler: Throttler<T>;

	constructor(defaultDelay: number) {
		super(defaultDelay);
		this.throttler = new Throttler();
	}

	public trigger(promiseFactory: ITask<Promise<T>>, delay?: number): Promise<Promise<T>> {
		return super.trigger(() => this.throttler.queue(promiseFactory), delay);
	}

}