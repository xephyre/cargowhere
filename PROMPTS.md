# Project Prompts Log

This document records the prompts and engineering directives used to build and configure the **SG ParkSpot** application.

---

### Prompt 1: Initial App Build
```text
Build a Singapore based carpark application that tracks real time carpark lots availability. build just the front end for now, I will integrate the backend later.
```

**Implementation Summary:**
- Engineered an interactive Singapore-wide carpark availability web application.
- Integrated Leaflet map centered on Singapore (`1.3521, 103.8198`) with custom occupancy badges (Plenty, Moderate, Filling Fast, Full).
- Created a curated dataset of over 25 authentic Singapore carparks covering HDB estates, URA areas, and major shopping malls.
- Added live lot simulation (15s auto-refresh) and direct public Data.gov.sg API sync.
- Added vehicle type filters (Cars, Motorcycles, Heavy vehicles), town quick-jump chips, search, GPS geolocation distance calculation, and a Singapore parking fee estimator with grace period & night cap logic.

---

### Prompt 2: Git Repository Push
```text
git push https://<GITHUB_PERSONAL_ACCESS_TOKEN>@github.com/xephyre/cargowhere.git
```

**Implementation Summary:**
- Initialized local git repository with `main` branch.
- Committed all frontend code, assets, and project configurations.
- Pushed codebase to `https://github.com/xephyre/cargowhere.git`.

---

### Prompt 3: LTA DataMall Serverless Connection
```text
1. Add a serverless connection that pulls live data from lta's datamall using the following endpoint: 

# Live carpark lots (HDB, LTA and URA):
https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2

# Every request needs the header:  AccountKey: <LTA_ACCOUNT_KEY>

2. Store this in /api folder at project root level (not the src file)

3. Include /health.ts and /carparkavailability.ts within the same sub folder

4. Do not hard code any key, I will input them later
```

**Implementation Summary:**
- Created `/api/health.ts` for gateway status and upstream LTA availability health checks.
- Created `/api/carparkavailability.ts` to proxy requests to `https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2` with `AccountKey` header forwarding, pagination support, and CORS handling.
- Documented `LTA_ACCOUNT_KEY` in `.env.example` without hardcoding any keys.
- Added local development middleware in `vite.config.ts` and UI sync controls in the header.
- Committed and pushed to GitHub `main` branch.

---

### Prompt 4: Collating Prompts
```text
collate all of the prompts and store them as a PROMPTS.md file
```

**Implementation Summary:**
- Collated all conversational prompts, technical requirements, and corresponding implementation logs into `/PROMPTS.md`.
