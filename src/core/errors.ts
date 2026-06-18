export class GeminiAPIError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'GeminiAPIError';
    }
}

export class Tripo3DError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Tripo3DError';
    }
}
