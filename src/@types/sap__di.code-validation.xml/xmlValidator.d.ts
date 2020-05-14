declare module '@sap/di.code-validation.xml' {

    import { validationMetadata, fileResource } from '@sap/di.code-validation.core';

    export interface Issue {
        id: string,
        category: string,
        checker: string,
        helpUrl: string,
        line: number,
        column: number,
        message: string,
        path: string,
        severity: string,
        source: string
    }

    interface ValidationResult {
        issues: Issue[]
    }

    export function validateFiles(
        validationMetadata?: validationMetadata,
        fileResources?: Array<fileResource>
    ): ValidationResult;

}