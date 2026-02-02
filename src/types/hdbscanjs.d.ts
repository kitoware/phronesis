declare module "hdbscanjs" {
  interface HDBSCANOptions {
    minClusterSize?: number;
    minSamples?: number;
    metric?: "euclidean" | "cosine" | "manhattan";
  }

  class HDBSCAN {
    constructor(options?: HDBSCANOptions);
    fit(data: number[][]): number[];
  }

  export default HDBSCAN;
}
