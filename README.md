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

The active release is “Planner FM — Estate Sessions”, a thirteen-record album running 40:21. The order is The West Don’t Rest; Planner FM; Three In The Morning; Bellend FM; Zoe: Here We Go Again (Unplugged); Set Phasers to Offensive; Planning Team Tunes: Whole Crew Inside; Darren is a Bellend!; Cutter Is Go: Ctrl+Alt+Legend; Get Your TICs Out; Awaab’s Law; Phone Down, Bass Up; Practically Perfect (For Michelle). The new Cornish grime/phonk opener is track 01; Planner FM is track 02. The Darren songs sit at tracks 04 and 08, separated by three songs. Track 09 is Phillip’s heroic pop-punk systems-rescue song, updated to the revised supplied recording and lyrics; his small public Instagram profile photo informs the naturally shaded hooded portrait. Track 10 is the banjo/country-grime crossover; track 05 is Zoe’s acoustic tribute and track 11 is Awaab’s Law. Phone Down, Bass Up closes the main session at track 12 with Amanda DJing alongside the hooded MC. Track 13 is Michelle’s acoustic bonus dedication, with a warm romantic couple portrait. Stable song IDs preserve existing direct links after reordering. The homepage opens the original supplied album cover with no song selected and waits for a choice. Tune In or tapping that cover starts track 01; browsing selects a record without starting it. `?track=the-west-dont-rest` opens the new track 01, `?track=planner-fm` opens track 02, `?track=cutter-is-go` opens track 09, `?track=phone-down-bass-up` opens track 12, and `?track=practically-perfect` opens the bonus track.

`assets/release-tracks.json` controls order, audio metadata, supplied lyrics, artwork, thumbnails and the sleeve story for every song. `temporary-joke.cjs` regenerates every temporary route. Each lyric-inspired sleeve uses the supplied face references and built-in image generation; the originals and exact prompt set are saved outside the publishing folder in `../research/artwork-source-v2/`. Web images and thumbnails live in `assets/sleeves/`. The original user-supplied Estate Sessions sleeve remains the social preview. Original private face-reference photographs are not published.

The record crate can be flipped with its buttons, left/right keys or a horizontal touch/pen swipe. Flipping preserves whether playback is paused or playing; choosing a track or tapping the selected sleeve plays/pauses it. The record, player metadata, lyric sheet, download and share link stay synchronized. The player also provides seeking, rewind, next-track, whole-album repeat and mute. Browser autoplay restrictions apply. Without JavaScript, native controls, direct audio links and every lyric sheet remain accessible. Motion follows playback and respects reduced-motion preferences. Downloads use each track’s title followed by ` - yoxall.net.mp3`, with filename-unsafe punctuation normalized. MP3s preserve the original encoded audio. The archived site, earlier covers and older clips remain preserved.
