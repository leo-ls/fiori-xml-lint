declare module '@sap/di.code-validation.core' {

    enum ValidationLevel {
        error,
        warning,
        info
    }

    type ValidationLevels = Array<string> | ValidationLevel[];

    interface Filters {
        levels: ValidationLevels
    }    
    
    // eslint-disable-next-line @typescript-eslint/class-name-casing
    export class validationMetadata {

        private projPath: string;
        private levels: ValidationLevels;

        constructor(projPath: string, levels?: ValidationLevels)

        public getRootPath(): string
        public getName(): string
        public getFilters(): Filters
        public getLevels(): ValidationLevels

    }

    // eslint-disable-next-line @typescript-eslint/class-name-casing
    export class fileResource {

        constructor(projPath: string, filePath: string)

        public getPath(): string
        public getText(): string
        public getSize(): number | bigint

    }
    
}