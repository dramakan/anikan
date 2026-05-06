async function getUniqueBulkIDs() {
    const tmdbKey = "014fbdbe962cb38379e09e31d0652459"; 
    let uniqueIMDbIDs = new Set();
    
    // Generates a random page number between 1 and 20 to ensure fresh content every run
    const randomPage = Math.floor(Math.random() * 20) + 1;
    
    console.log(`%c Anykan OS: Pulling fresh batch from Page ${randomPage}...`, "color: #9D4EDD; font-weight: bold;");

    async function fetchFromType(mediaType) {
        for (let i = randomPage; i < randomPage + 5; i++) {
            try {
                const res = await fetch(`https://api.themoviedb.org/3/discover/${mediaType}?api_key=${tmdbKey}&sort_by=popularity.desc&page=${i}`);
                const data = await res.json();
                for (let item of data.results) {
                    const extRes = await fetch(`https://api.themoviedb.org/3/${mediaType}/${item.id}/external_ids?api_key=${tmdbKey}`);
                    const extData = await extRes.json();
                    if (extData.imdb_id) uniqueIMDbIDs.add(extData.imdb_id);
                    if (uniqueIMDbIDs.size >= 150) break;
                }
            } catch (e) { console.error(e); }
            if (uniqueIMDbIDs.size >= 150) break;
        }
    }

    await fetchFromType('movie');
    await fetchFromType('tv');

    const finalList = Array.from(uniqueIMDbIDs);
    console.log("%c --- COPY THESE NEW UNIQUE IDs ---", "color: #10B981; font-weight: bold;");
    console.log(finalList.join('\n'));
    console.log(`%c Found ${finalList.length} Unique IDs!`, "color: #3B82F6; font-weight: bold;");
    alert("Batch Ready: " + finalList.length + " unique items found.");
}

getUniqueBulkIDs();