export function fetchData(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`[FETCH] response not ok, found ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('[FETCH] special fetch error: ', error);
            throw error;
        });
}
