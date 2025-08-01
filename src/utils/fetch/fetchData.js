/**
 * Fetches data from a given URL and returns the response as JSON.
 *
 * @param {String} url
 * @returns {String} JSON response from the fetch request if successful
 */
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
