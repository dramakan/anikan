async function getUniqueDeepScanIDs() {
    const tmdbKey = "014fbdbe962cb38379e09e31d0652459"; 
    let uniqueIMDbIDs = new Set();
    
    // Pick a random year between 2010 and 2026 to ensure fresh variety
    const randomYear = Math.floor(Math.random() * (2026 - 2010 + 1)) + 2010;
    // Pick a random page to start
    const randomPage = Math.floor(Math.random() * 10) + 1;
    
    console.log(`%c Anykan OS: Deep Scanning Year ${randomYear} starting at Page ${randomPage}...`, "color: #9D4EDD; font-weight: bold;");

    async function fetchDeep(mediaType) {
        // We'll scan 3 pages with these random parameters
        for (let i = randomPage; i < randomPage + 3; i++) {
            try {
                // Filter by a specific year to force unique results compared to the general "Trending" list
                const yearParam = mediaType === 'movie' ? 'primary_release_year' : 'first_air_date_year';
                const url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${tmdbKey}&sort_by=popularity.desc&${yearParam}=${randomYear}&page=${i}`;
                
                const res = await fetch(url);
                const data = await res.json();
                
                for (let item of data.results) {
                    const extRes = await fetch(`https://api.themoviedb.org/3/${mediaType}/${item.id}/external_ids?api_key=${tmdbKey}`);
                    const extData = await extRes.json();
                    
                    if (extData.imdb_id) {
                        uniqueIMDbIDs.add(extData.imdb_id);
                    }
                    if (uniqueIMDbIDs.size >= 120) break;
                }
            } catch (e) { console.error("Scan Error", e); }
            if (uniqueIMDbIDs.size >= 120) break;
        }
    }

    await fetchDeep('movie');
    await fetchDeep('tv');

    const finalList = Array.from(uniqueIMDbIDs);
    console.log("%c --- COPY YOUR UNIQUE MASS IMPORT LIST ---", "color: #10B981; font-weight: bold;");
    console.log(finalList.join('\n'));
    console.log(`%c Total Unique IDs Found: ${finalList.length}`, "color: #3B82F6; font-weight: bold;");
    alert(`Anykan OS: Found ${finalList.length} unique items from the year ${randomYear}.`);
}

getUniqueDeepScanIDs();