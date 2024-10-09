# Subway Bot

Hi, this is a fun lil bot that scrapes NYC MTA subway information for delays, and then posts the update to Threads.

I made this in a couple days leveraging my shoddy knowledge of javascript and Cursor.sh / Claude Sonnet to work around what I don’t know. There was a lot of script monkey-ing here.

## How does it work?

The bot has a few different components:
- `index.js` coordinates the whole thing
- `subway.js` grabs realtime data from MTA's json and filters to just delays from the last 5 minutes
- `threads.js` handles creating and posting to threads.

And then the bot itself is run via cron job on Render.com that's triggered every 5 minutes. Environment variables (including Threads API keys) are handled there. I tried to do it via GitHub Actions but it turns out cron job scheduling is quite unreliable. Ultimately each run takes about 20 seconds, so hosting this should cost under $3 a month or so.

## What's the data source?

The data is based on JSON from MTA (because the real-time standard GTFS seems deeply complicated). The source for that is [here](https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts.json).

## I want to make my own

Cool! I don’t know why you’d want to fork this, but please feel free and use this however you’d like.

Things to know:
* Threads API requires a Meta developer account. [Their documentation is decent](https://developers.facebook.com/docs/threads/get-started).
* The Threads token expires every 60 days. I need to add a cron job that exchanges it on Day 59 or something.
* The hardest part of Threads for me is that there’s no web-based account switching. So because I didn’t want to test on my own @ezra account, I had to create a new Threads account, log out, and then _also_ provision it as a test user and accept the invitation within the developer hub. This was all a bit heavy for my taste, but it’s a new API and Meta is a big company, so /shrug.
