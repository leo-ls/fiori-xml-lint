'use strict';
import { workspace, Disposable, Diagnostic, DiagnosticSeverity, Range, TextDocument, Uri } from 'vscode';
import { LintingProvider, LinterConfiguration, Linter } from './utils/lintingProvider';
import { validateFiles, Issue } from '@sap/di.code-validation.xml';
import { validationMetadata, fileResource } from '@sap/di.code-validation.core';

enum IssueSeverity {
    error,
    warning,
    info
}

type IssueSeverityKey = keyof typeof IssueSeverity;

export default class FioriXMLLintingProvider implements Linter {

    public languageId = 'xml';

    public activate(subscriptions: Disposable[]) {
        let provider = new LintingProvider(this);
        provider.activate(subscriptions);
    }

    public loadConfiguration(): LinterConfiguration {
        let section = workspace.getConfiguration(this.languageId);
        if (!section) {
            return <any>null;
        }
        return {
            runTrigger: section.get<string>('fiori.linter.run', 'onType')
        };
    }

    public process(document: TextDocument): Diagnostic[] {
        let
            diagnostics: Diagnostic[] = [],
            projPath = workspace.workspaceFolders && workspace.workspaceFolders[0].uri.fsPath;

        if (projPath) {
            const
                metadata = new validationMetadata(projPath),
                resource = new fileResource(projPath, document.fileName),
                { issues } = validateFiles(metadata, [resource]);
            diagnostics = issues.map(this.mapIssueToDiagnostic, this);
        }

        return diagnostics;
    }

    private mapIssueToDiagnostic(issue: Issue): Diagnostic {
        const severity = IssueSeverity[<IssueSeverityKey>issue.severity];
        let diagnostic = new Diagnostic(
            new Range(
                issue.line,
                issue.column,
                issue.line,
                Number.MAX_VALUE
            ),
            issue.message,
            <DiagnosticSeverity><number>severity
        );

        diagnostic.source = issue.checker;
        diagnostic.code = {
            target: Uri.parse(issue.helpUrl),
            value: issue.id
        };

        return diagnostic;
    }

}