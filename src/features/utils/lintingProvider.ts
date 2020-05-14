'use strict';
import { languages, workspace, Diagnostic, DiagnosticCollection, Disposable, TextDocument } from 'vscode';
import { ThrottledDelayer } from './async';

export enum RunTrigger {
	onSave = 'onSave',
	onType = 'onType',
	off = 'off'
}

export interface LinterConfiguration {
	runTrigger: string;
}

export interface Linter {
	languageId: string;
	loadConfiguration: () => LinterConfiguration;
	process: (document: TextDocument) => Diagnostic[];
}

export class LintingProvider {

	public linterConfiguration: LinterConfiguration;

	private documentListener: Disposable;
	private diagnosticCollection: DiagnosticCollection;
	private delayers: { [key: string]: ThrottledDelayer<void> };
	private linter: Linter;

	constructor(linter: Linter) {
		this.linter = linter;
		this.linterConfiguration = <any>null;
		this.documentListener = <any>null;
		this.diagnosticCollection = <any>null;
		this.delayers = <any>null;
	}

	public activate(subscriptions: Disposable[]) {
		this.diagnosticCollection = languages.createDiagnosticCollection();
		subscriptions.push(this);
		workspace.onDidChangeConfiguration(this.loadConfiguration, this, subscriptions);
		this.loadConfiguration();

		workspace.onDidOpenTextDocument(this.triggerLint, this, subscriptions);
		workspace.onDidCloseTextDocument(textDocument => {
			this.diagnosticCollection.delete(textDocument.uri);
			delete this.delayers[textDocument.uri.toString()];
		}, null, subscriptions);

		workspace.textDocuments.forEach(this.triggerLint, this);
	}

	public dispose(): void {
		this.diagnosticCollection.clear();
		this.diagnosticCollection.dispose();
	}

	private loadConfiguration(): void {
		this.linterConfiguration = this.linter.loadConfiguration();

		this.delayers = Object.create(null);
		if (this.documentListener) {
			this.documentListener.dispose();
		}
		if (this.linterConfiguration.runTrigger === RunTrigger.onType) {
			this.documentListener = workspace.onDidChangeTextDocument(event => {
				this.triggerLint(event.document);
			});
		} else {
			this.documentListener = workspace.onDidSaveTextDocument(this.triggerLint, this);
		}
		this.documentListener = workspace.onDidSaveTextDocument(this.triggerLint, this);

		workspace.textDocuments.forEach(this.triggerLint, this);
	}

	private triggerLint(textDocument: TextDocument): void {
		if (textDocument.languageId !== this.linter.languageId || this.linterConfiguration.runTrigger === RunTrigger.off) {
			return;
		}
		let key = textDocument.uri.toString();
		let delayer = this.delayers[key];
		if (!delayer) {
			delayer = new ThrottledDelayer<void>(this.linterConfiguration.runTrigger === RunTrigger.onType ? 250 : 0);
			this.delayers[key] = delayer;
		}
		delayer.trigger(() => this.doLint(textDocument));
	}

	private doLint(textDocument: TextDocument): Promise<void> {
		return new Promise<void>(resolve => {
			let diagnostics = this.linter.process(textDocument);
			this.diagnosticCollection.set(textDocument.uri, diagnostics);
			resolve();
		});
	}
}