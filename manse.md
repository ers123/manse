Product Requirements Document (PRD)

1. Goal and Overview

The objective of this project is to build a manseyeok (萬歲曆) calculation module that can be integrated into a web‑app for Korean saju (사주) and fortune‑telling services.  Unlike “simplified” horoscope generators, manseyeok is based on the traditional lunisolar calendar and requires precise astronomical conversions to determine the four pillars (year, month, day and hour) and their associated heavenly stems and earthly branches.  The module must accept a user’s birth date and time (with timezone/location), call reliable data sources to convert Gregorian ↔ lunar dates, derive the stems/branches for year/month/day, compute the hour pillar and generate derived information (e.g. five‑element balance, ten gods, twelve life stages, great fortune cycles).  The result will be summarised and passed to a GPT model for narrative fortune generation.

2. Background and Rationale
	1.	Lunisolar conversion requirements –  Korean saju uses the lunar calendar and the 60‑term sexagenary cycle.  Precise conversion from the user’s Gregorian birth date to a Korean lunar date (including leap months) is critical.  The Korea Astronomy and Space Science Institute (KASI) provides a public API (LrsrCldInfoService) that returns lunar calendar data for a given solar date.  The API’s response includes lunar month/day, whether the month is leap, and—crucially—the sexagenary stems and branches for the year (lunSecha), month (lunWolgeon) and day (lunIljin) ￼.  This eliminates the need to implement complex astronomical algorithms manually.
	2.	Field availability –  The API returns a complete set of data: lunar year (lunYear), lunar month/day (lunMonth/lunDay), leap‑month flag (lunLeapmonth), lunar stems/branches (lunSecha, lunWolgeon, lunIljin), weekday and Julian day ￼.  Example responses from the API show that the field lunSecha returns values like “임인(壬寅)” (year pillar), lunWolgeon returns the month pillar such as “계축(癸丑)” and lunIljin returns the day pillar (e.g. “무인(戊寅)” or “기해(己亥)” ￼.  The API therefore provides the necessary three pillars directly.
	3.	Open access and reliability –  The service is a REST API with no usage fees.  The data portal notes that the API is free, automatically approved for development accounts and allows ~10 000 requests per day ￼.  The request URL for obtaining lunar information from a solar date is getLunCalInfo; the documentation explains that this endpoint provides lunar date, leap‑month status, weekday and lunar sexagenary information ￼.  A complementary getSolCalInfo endpoint converts lunar dates to solar ones.
	4.	Need for hour pillar –  The KASI API does not supply the hour pillar.  The hour pillar can be computed from the day’s heavenly stem (obtained from lunIljin) and the user‑supplied birth time.  For each two‑hour block (e.g. 23:00–00:59 corresponds to 子), the earthly branch is determined.  The heavenly stem of the hour is calculated as (dayStemIndex × 2 + hourBranchIndex) mod 10 using the Ten Heavenly Stems cycle.  Implementing this logic in code fills the gap.
	5.	Fallback library –  If network access to KASI is unavailable or the date falls outside the API’s coverage, an offline library will be used.  The korean-lunar-calendar library (available for JavaScript and Python) converts between Korean lunar and Gregorian dates without network connectivity and follows KARI data for years 1000–2050.  The library provides functions like setSolarDate and getGapja() to retrieve the year/month/day stems ￼.

3. User Stories
	1.	Birth‑data input –  As a user, I want to enter my birth date, time and location (timezone) so that the system can calculate my exact lunar birth data and four pillars.
	2.	Saju display –  As a user, I want to see my year, month, day and hour pillars represented in both Hangul/Korean script and Chinese characters, as well as derived five‑element distributions and ten‑god relationships.
	3.	Fortune analysis –  As a user, I want the system to generate an interpretation of my saju and an “today’s fortune” summary, using GPT models, based on the computed pillars.
	4.	Reliability –  As a user, I want confidence that the calculations match official Korean calendars and do not change unpredictably due to wrong algorithms or missing leap month handling.

4. Functional Requirements

4.1 Input & Validation
	1.	Birth details form –  The front‑end collects:
	•	Birth date (Gregorian or lunar flag)
	•	Birth time (24‑hour format)
	•	Timezone/Location (default Asia/Seoul)
	•	Gender (used later for fortune‑cycle direction)
	•	Calendar type (solar vs. lunar).  If lunar is selected, an additional toggle for leap‑month status is displayed.
	2.	Validation –  Ensure the date is within the API/library supported range (e.g. 1391–2050 for KASI API, 1000–2050 for offline library).  Time must be between 00:00 and 23:59.  Timezone defaults to the user’s timezone (Asia/Seoul).

4.2 Lunar‑Solar Conversion
	1.	Primary API call –  For solar input, call the KASI getLunCalInfo endpoint with parameters solYear, solMonth, solDay and the API key.  Parse the XML/JSON response.  Extract lunYear, lunMonth, lunDay, lunLeapmonth, lunSecha, lunWolgeon, lunIljin and solWeek ￼.  The values lunSecha, lunWolgeon and lunIljin contain the sexagenary year, month and day pillars ￼.
	2.	Reverse conversion –  If the user provides a lunar date, call the getSolCalInfo endpoint with lunYear, lunMonth, lunDay and lunLeapmonth to obtain the corresponding solar date.  Use the returned lunSecha, lunWolgeon and lunIljin for consistency ￼.
	3.	Fallback mode –  If the API returns an error or the system is offline, invoke the korean-lunar-calendar library (JavaScript or Python) to perform the conversion and compute the year/month/day stems using getGapja() ￼.  Document that this library only supports dates from year 1000 to 2050.

4.3 Hour Pillar Calculation
	1.	Determine day stem index –  The first character of lunIljin (e.g. “무” in “무인(戊寅)”) maps to the Ten Heavenly Stems array (갑, 을, 병, 정, 무, 기, 경, 신, 임, 계).  Determine the index (0–9) of this stem.
	2.	Determine hour branch –  Divide the 24‑hour clock into 12 two‑hour segments starting at 23:00–00:59 (子), 01:00–02:59 (丑), …, 21:00–22:59 (亥).  Identify the earthly branch index (0–11).
	3.	Compute hour stem –  Use the formula (dayStemIndex × 2 + hourBranchIndex) mod 10 to find the hour stem index; then map it back to the Ten Heavenly Stems array.  Combine with the branch to form the hour pillar (e.g. 丁酉).
	4.	Location/timezone adjustment –  Convert user‑entered local time to Korea Standard Time if different; if birth location has a different longitude offset (e.g. outside Korea), adjust the time accordingly before computing the hour branch.

4.4 Derived Calculations
	1.	Five‑element distribution –  For each of the four pillars, map the stem/branch to one of the five elements (Wood, Fire, Earth, Metal, Water) and tally the counts.  Display the distribution visually.
	2.	Ten Gods (십신) –  Based on the relationship between the day stem and other stems, classify each pillar as friend, wealth, authority, resource or output.  Use standard saju rules.
	3.	Twelve Life Stages (십이운성) –  Assign life‑stage labels (장생, 목욕, 관대 …) to each pillar using pre‑computed lookup tables keyed by the day stem and branch.
	4.	Great fortune cycles (대운) and annual fortune (세운) –  Use the user’s gender and year branch to decide the cycle direction (forward or reverse).  Each cycle spans ten lunar years.  Generate a list of upcoming ten‑year cycles with their corresponding stems/branches and approximate age ranges.  For annual fortune, compute the stem/branch for each year after birth.
	5.	Optional 24 solar terms –  For more precise month‑pillar determination (especially near month transitions), optionally call the KASI SpcdeInfoService endpoint for 24 solar term data.  However, because lunWolgeon already returns the month pillar ￼, implementing the solar‑term check is deferred to a later enhancement.

4.5 Output & Integration
	1.	Structured JSON –  After all calculations, construct a structured JSON object containing:
	•	Solar date, lunar date and leap‑month indicator.
	•	Year/month/day/hour pillars in Korean and Chinese characters.
	•	Five‑element counts and Ten‑God classifications.
	•	Life‑stage assignments.
	•	Great fortune cycle list.
	2.	GPT prompt creation –  Format the structured data into a natural‑language summary and append an instruction for GPT to generate a short fortune analysis or daily fortune.  Example:
“연주: 임인(壬寅), 월주: 계축(癸丑), 일주: 무인(戊寅), 시주: …; 오행 분포: 목 1, 화 2, …; 십신: 정재 1, 편인 2 ….  위 내용을 바탕으로 성격적 특성과 오늘의 운세를 명리학적으로 설명해 주세요.”
	3.	User interface –  Modify the web‑app (HTML/JS) to display the computed data and the GPT‑generated narrative.  Provide collapsible sections for advanced details (e.g. life‑stages, big fortune cycles) to avoid overwhelming casual users.

4.6 Error Handling & Logging
	1.	API error handling –  If the KASI API returns an error (non‑00 result code) or is unavailable, display an appropriate message and fall back to the offline library.  Log the error for monitoring.
	2.	Input out of range –  If the date is outside the supported range (e.g. before AD 1391 for KASI API or before AD 1000 for offline), inform the user that the calculation cannot be performed.
	3.	Rate limit –  Monitor daily request counts (via caching or metrics).  If approaching the 10 000‑request limit ￼, queue or throttle requests or use cached results.

5. Non‑Functional Requirements
	1.	Accuracy –  Calculations must match official KASI data for year, month and day pillars.  Hour pillar calculation should follow standard saju rules.
	2.	Performance –  API calls should be asynchronous to prevent blocking the UI.  Typical response times should be under 3 seconds.
	3.	Security –  API keys must be stored in environment variables or secure secrets.  Do not expose keys in front‑end code.
	4.	Internationalisation –  Provide fields in both Korean and Chinese characters.  Support alternate timezones.
	5.	Scalability –  Design the backend to allow future micro‑services (e.g. Python service for advanced astronomical calculations).

6. Technical Architecture
	1.	Front‑end –  The existing HTML/JavaScript front‑end collects user input and displays results.  It sends a POST request to the backend with birth details.
	2.	Backend (Node.js) –  Implement an Express server (index.js) with the following components:
	•	/api/saju route: accepts JSON body with birth details, calls LrsrCldInfoService (and SpcdeInfoService if needed), falls back to korean-lunar-calendar library, computes the hour pillar and derived metrics, and returns JSON.
	•	GPT integration: uses OpenAI’s API to generate fortune summaries from the structured data (requires separate API key).  Rate‑limit and retry logic included.
	•	Caching layer: in‑memory or Redis cache to store previously computed results keyed by birth timestamp, to reduce API calls.
	3.	Optional Python micro‑service –  For advanced features (e.g. 24 solar term calculation using ephem), a small Flask service can run inside the Codex environment.  Node can call this service over HTTP.
	4.	Security –  Use HTTPS in production.  Store API keys in environment variables.  Validate and sanitise all user inputs.

7. Acceptance Criteria
	1.	Correct pillar computation –  Given known test cases (e.g. 2023‑01‑20), the module returns year/month/day pillars matching KASI API results (year: 임인, month: 계축, day: 무인) ￼.
	2.	Hour pillar accuracy –  For a birth time of 07:30 on the same date (branch 진), the hour pillar matches manual calculation.
	3.	Leap‑month handling –  For dates in leap months (e.g. 2025‑06‑18 lunar leap), the module correctly indicates lunLeapmonth and uses the proper stems/branches.
	4.	Fallback functionality –  When the network call to KASI is disabled, the system uses the offline library and still produces year/month/day stems.
	5.	API integration –  The system includes environment variables for the KASI API key and provides clear documentation on how to obtain and configure the key.
	6.	Frontend integration –  The UI shows the four pillars, derived five‑element distribution, and the GPT‑generated fortune.  Any errors (invalid date, API failure) are displayed to the user.

8. Project Plan