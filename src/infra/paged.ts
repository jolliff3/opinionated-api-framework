type PagedResult<T> = {
  data: T[];
  limit: number;
  offset: number;
};

export { type PagedResult };
