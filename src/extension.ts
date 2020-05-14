import { ExtensionContext } from 'vscode';
import FioriXMLLintingProvider from './features/fioriXMLLintingProvider';

export const activate = (context: ExtensionContext) => {
	let linter = new FioriXMLLintingProvider();
	linter.activate(context.subscriptions);
};