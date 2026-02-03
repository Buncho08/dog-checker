export type Neighbor = { id: string; label: "DOG" | "NOT_DOG"; sim: number };

export type PredictResponse = {
    label: "DOG" | "NOT_DOG" | "UNKNOWN";
    score: number;
    pDog: number;
    neighbors: Neighbor[];
    sampleCount: number;
    embedderVersion: string;
    params?: Record<string, unknown>;
};