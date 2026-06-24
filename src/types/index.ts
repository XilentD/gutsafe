export * from "./toilet";
export * from "./gut-log";
export * from "./route";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface NearbyQuery extends PaginationParams {
  lat: number;
  lng: number;
  radius?: number;
  hasSquat?: boolean;
  hasToiletPaper?: boolean;
  hasHandicap?: boolean;
  isFree?: boolean;
  openNow?: boolean;
  minCleanliness?: number;
  sortBy?: "distance" | "cleanliness" | "reviewCount";
}
