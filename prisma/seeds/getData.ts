type ApiResponse<T> = {
  info: {
    count: number;
    pages: number;
    next: string | null;
    prev: string | null;
  };
  results: T[];
};

export async function getData<T>(
  url: string,
  handleChunk: (dataChunk: T[]) => Promise<void>,
) {
  let currentPage = 1;

  while (true) {
    const response = await fetch(`${url}${currentPage}`);
    const { results: dataChunk, info } =
      (await response.json()) as ApiResponse<T>;

    await handleChunk(dataChunk);

    currentPage++;
    if (!info.next) break;
  }
}
