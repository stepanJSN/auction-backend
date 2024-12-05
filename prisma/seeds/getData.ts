type ApiResponse<T> = {
  info: {
    count: number;
    pages: number;
    next: string | null;
    prev: string | null;
  };
  results: T[];
};

export async function getData<T>(url: string): Promise<T[]> {
  const response = await fetch(url);
  const data = (await response.json()) as ApiResponse<T>;

  if (data.info.next) {
    const nextPageData = await getData<T>(data.info.next);
    return [...data.results, ...nextPageData];
  }

  return data.results;
}
