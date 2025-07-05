export function fetchData(url) {
  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`[fetchData] response !ok, ${response.status}`);
      }
      return response.json();
    })
    .catch((error) => {
      console.error("[fetchData] special fetch error: ", error);
      throw error;
    });
}
