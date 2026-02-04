export type Neighbor = { id: string; label: string; sim: number };

export type PredictResponse = {
    label: string;
    score: number;
    pDog: number;
    neighbors: Neighbor[];
    sampleCount: number;
    embedderVersion: string;
    params?: Record<string, unknown>;
};