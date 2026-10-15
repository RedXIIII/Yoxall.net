# The Record

An independent, source-led archive at https://yoxall.net, hosted by GitHub Pages from the root of `main`.

## Edit and build

The original records are in `assets/modern-records.js` and `assets/ancient-records.js`. New records and long-form additions are in `assets/extension-records.json`. Homepage markup is in `index.html`; the message-board template is in `templates/board.html`.

Run `node build.cjs` after changing records or page templates. It writes the collection pages, individual `/files/` pages, source directory, catalogue, sitemap and board page. Commit the generated pages alongside their sources; Pages does not need a runtime build step.

Run `python validate.py` to check every local page, resource and fragment link. For a local preview, serve the root with `python -m http.server 4174 --bind 127.0.0.1`.

## Editorial standards

Every dossier names its sources and the limit of its evidence. Programme existence, proposals, inquiry findings, civil settlements, archaeological finds and unresolved hypotheses are kept distinct. Current files are a dated editorial snapshot, reviewed 8 October 2026; there is no automatic news monitoring.

The `region` field distinguishes England from other British locations and overseas actions. Keep those distinctions when adding records. Add a specific assessment and proposed tests for every current file.

## Signal Room

The board is shared through public Nostr relays (`relay.damus.io`, `nos.lol`, `relay.nostr.net`), using signed kind-1 events with the topic `the-record-yoxall-net-v1`. Visitors choose an unverified display name. A browser-generated signing identity, draft, muted-author list and recent verified messages stay in local storage. Clearing browser data loses that identity.

Public posts are transmitted to independent relays and can be read, copied and retained by others. Relay availability, retention and acceptance policies are outside this repository's control. Posting is successful only after at least one relay acknowledges acceptance. The browser verifies signatures and displays message text without executing HTML. The local posting cooldown and hide-author controls are convenience measures; they are not server-side moderation or comprehensive spam protection.

The local `nostr-tools` bundle and its license are documented in `assets/vendor/README.md`. No API keys, Cloudinary credentials or service accounts are needed. For a larger community, replace or supplement public relays with an operated relay and a documented moderation process.

## Privacy and media

No analytics or signup system is installed. Fonts come from Google Fonts. The Signal Room connects to the relays above. Search, bookmarks and motion preferences are local to the visitor's browser. Media credits and license links are in `assets/ATTRIBUTION.md` and the reading room.

Keep `CNAME` as `yoxall.net`. Publishing this repository updates that domain; `RedXIIIuk/yoxall-site` is a different project.

## UFO observation room

The curated observation catalogue is `assets/uap-records.json`. `uap-build.cjs` generates `/ufo.html` and the observation files when the normal build runs. Every item preserves its release/source context, assessment and location precision. Regional pins are deliberately approximate; no flight tracks or exact military sensor positions are inferred. The British archive includes reports and photographic material with different levels of corroboration.

`assets/uap-globe.js` draws an interactive sphere using locally served Natural Earth land geometry. The accessible observation index also works without the globe. Official media loads only after a visitor requests the player; its independent host may change or become unavailable, so every clip retains a source-player link. No videos start automatically. Review assessments and verify media endpoints when updating the catalogue. The curation snapshot is 9 October 2026.

## Interesting stories

`assets/story-records.json` contains original story-led investigations. `story-build.cjs` generates the index and individual narrative pages through the normal build. Each story separates the attributed account from a claim-by-claim assessment with linked sources, an explicit conclusion and remaining questions. Evidence is always reachable directly and native details elements work without JavaScript. Do not present legends, reconstructions or inference as witnessed fact. Do not copy channel scripts, branding or graphics. Existing archive dossiers and UFO files remain separate formats for concise research.
# Temporary joke takeover — 15 October 2026

The published HTML currently displays one temporary joke page on every existing route. `temporary-joke.cjs` reapplies it; do not run the archive build while the joke is active.

The complete pre-joke site is preserved on GitHub branch `backup/before-darren-prank-2026-10-15` at commit `97b587ee2e568d40236ab4fa5524d811b85d53ce`. Restore the complete tree from that backup, or revert all joke updates in reverse order, to restore the pages, normal robots and sitemap files. A ZIP backup is stored outside this publishing folder at `../research/site-before-darren-prank-2026-10-15.zip`.

The active release is “Planner FM — Estate Sessions”, a seven-track EP with the supplied estate-crew artwork. The page uses `assets/planner-fm-estate-sessions.webp`; social previews use the JPEG copy. Both preserve the complete supplied image. `assets/release-tracks.json` controls track order, metadata and supplied lyrics. The order is Planner FM; Daz FM Live; Awaab’s Law; Three In The Morning; Bellend FM; Set Phasers to Offensive; Darren is a Bellend!. IDs are stable, so older song links still work after reordering. `?track=three-in-the-morning` and `?track=set-phasers-to-offensive` open the newest tracks, while the homepage starts with Planner FM.

`assets/single-player.js` attempts playback on load and provides play/pause, seeking, rewind, next-track, whole-EP repeat, mute, selected-track downloads and sharing. Lyrics follow the selected track. Native audio controls, direct audio links and every lyric sheet remain available without JavaScript. Browser autoplay restrictions still apply. The decorative record and meters follow playback and respect reduced motion. MP3s preserve the original encoded audio. Run `temporary-joke.cjs` to regenerate every temporary route; the archived site and inactive older cover/audio files remain preserved.
