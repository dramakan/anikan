async function getMassiveTrendingIDs() {
    const tmdbKey = "014fbdbe962cb38379e09e31d0652459"; 
    const pagesToFetch = 10; // 10 pages = 200 items
    let uniqueIMDbIDs = new Set(); // Using a Set to force uniqueness

    console.log("%c Anykan OS: Starting Deep Scan...", "color: #9D4EDD; font-weight: bold;");

    for (let i = 1; i <= pagesToFetch; i++) {
        console.log(`Scanning Page ${i}...`);
        try {
            const trendRes = await fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${tmdbKey}&page=${i}`);
            const trendData = await trendRes.json();

            for (let item of trendData.results) {
                const type = item.media_type === 'tv' ? 'tv' : 'movie';
                const extRes = await fetch(`https://api.themoviedb.org/3/${type}/${item.id}/external_ids?api_key=${tmdbKey}`);
                const extData = await extRes.json();
                
                if (extData.imdb_id) {
                    uniqueIMDbIDs.add(extData.imdb_id);
                }
            }
        } catch (e) { console.error("Error on page " + i); }
    }

    const finalList = Array.from(uniqueIMDbIDs);
    console.log("%c --- COPY UNIQUE IDs BELOW ---", "color: #10B981; font-weight: bold;");
    console.log(finalList.join('\n'));
    console.log(`%c Found ${finalList.length} Unique IDs!`, "color: #3B82F6; font-weight: bold;");
    alert("Scan Complete: " + finalList.length + " unique items ready for Anykan.");
}

getMassiveTrendingIDs();