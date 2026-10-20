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

The active release is “Planner FM — The Planning Sessions”, a fifteen-record album running 51:34. The running order is 01 The West Don’t Rest; 02 Planner FM: Diary Pressure; 03 Three In The Morning; 04 Boots On The Ground; 05 Hold That Line; 06 Bellend FM: The Daz Transmission; 07 Zoe: Here We Go Again (Unplugged); 08 Planning Team Tunes: Whole Crew Inside; 09 Cutter Is Go: Ctrl+Alt+Legend; 10 Sparkes Fly; 11 Get Your TICs Out; 12 Amanda Holds It Down; 13 Emma: North Side Signal; 14 Practically Perfect (For Michelle); 15 Darren is a Bellend!. Sparkes Fly is main-session track 10, between Cutter Is Go and Get Your TICs Out. Emma: North Side Signal is main-session track 13, immediately after Amanda Holds It Down. Michelle is bonus track 14 and Darren is the closing bonus track 15. The Darren songs remain apart at tracks 06 and 15. Awaab’s Law, Set Phasers to Offensive and Daz FM Live remain omitted from the active catalogue, with their assets preserved. Stable track IDs preserve existing deep links and the Amanda alias `?track=phone-down-bass-up`. The homepage still opens the original Planner FM intro cover with no song selected. Tune In or tapping that cover starts track 01; browsing selects a record without starting it. `?track=sparkes-fly` opens Smara’s new track 10; `?track=emma-north-side-signal` opens Emma’s track 13; `?track=practically-perfect` opens bonus track 14 and `?track=original` opens the closing bonus track 15.

`assets/release-tracks.json` controls order, audio metadata, supplied lyrics, artwork, thumbnails and the sleeve story for every song. `temporary-joke.cjs` regenerates every temporary route. Each lyric-inspired sleeve uses the supplied face references and built-in image generation; the originals and exact prompt set are saved outside the publishing folder in `../research/artwork-source-v2/`. Web images and thumbnails live in `assets/sleeves/`. “Three In The Morning” uses the latest supplied 3AM Frequency / No Sleep FM artwork, with the hooded MC, holographic astronaut and fairy children, moonlit Cornish coast and original desk details. “Planning Team Tunes: Whole Crew Inside” uses the supplied Cornwall crew artwork, with the full hooded team around the repairs desk, local town signs and the original office details. The supplied “The West Don’t Rest” stormy Cornish cover is used for the opening track and its vinyl label. The latest supplied hooded West Don’t Rest cover supplies track 01 and its selected vinyl label. The original Planner FM intro cover supplies the unselected album sleeve, initial vinyl label, background and social preview. “Boots On The Ground” uses the supplied MST Massive artwork, showing the hooded MC, repairs crew, tool-filled vans and Penzance-to-Cheltenham route. Its supplied recording is preserved without audio re-encoding; embedded metadata and the browser download identify “Boots On The Ground” and yoxall.net. “Hold That Line” uses the supplied CSC headset-and-call-queue artwork and all supplied lyrics, immediately after the MST track. Its recording is preserved without audio re-encoding and downloads as “Hold That Line - yoxall.net.mp3”. Original private face-reference photographs are not published. “Bellend FM: The Daz Transmission” uses the latest supplied rooftop cover, with the hooded MC holding a microphone, radio aerials, cassette tapes, blue and amber lighting and white and cyan graffiti lettering.

The site copy uses Planning Team and diary/phone-board language. Planner FM is titled “Diary Pressure”; the supplied lyrics are preserved. The player combines a clickable spinning vinyl label with the selected sleeve, a progress ring, a live spectrum/waveform and three frequency-band meters. The sound-reactive display reads the audio through a Web Audio analyser side branch; it adds no EQ, gain or audio effects. Visuals can be switched off and default off for reduced-motion preferences; animation work stops while paused, muted, off-screen or in a hidden tab. Browsers without Web Audio retain the normal player and vinyl presentation. The black-and-white Parental Advisory sticker identifies explicit lyrics. The original supplied Planner FM intro cover opens the album before a track is selected.

The record crate can be flipped with its buttons, left/right keys or a horizontal touch/pen swipe. Flipping preserves whether playback is paused or playing; choosing a track or tapping the selected sleeve plays/pauses it. The record, player metadata, lyric sheet, download and share link stay synchronized. The player also provides seeking, rewind, next-track, whole-album repeat and mute. Browser autoplay restrictions apply. Without JavaScript, native controls, direct audio links and every lyric sheet remain accessible. Motion follows playback and respects reduced-motion preferences. Downloads use each track’s title followed by ` - yoxall.net.mp3`, with filename-unsafe punctuation normalized. MP3s preserve the original encoded audio. The archived site, earlier covers and older clips remain preserved.

Run `node deck-test.cjs` to check the visualizer’s audio routing, animation lifecycle, reduced-motion default and fallbacks.

The small alien in the bottom-right corner opens the restored original archive at `/the-record/`, including its stories, evidence files, England collection, UFO room and Signal Room. It has its own assets and internal routes; the music generator excludes that directory. The restoration source and scope are recorded in `the-record/README.md`.

Lyric sheets are expanded by default. Before selecting a record, the opening song’s lyrics are shown; choosing a record switches the visible lyric sheet. The Parental Advisory sticker uses bounded SVG lettering so the full word fits at every screen size.

The supplied silent memes take turns while music plays: girl on the left, mirrored vibe cat on the right, then Ankha centred along the bottom. The girl opens with one complete loop; subsequent girl turns randomly use 1–3 loops, while cat and Ankha turns each randomly use 1–2 loops. Ankha’s supplied green-screen background is keyed to black, and its original audio is removed. The girl stays at 140/155 speed; the cat uses 140/123 based on its measured approximate nodding cadence; Ankha uses 140/110 based on the Camel by Camel tempo reference. All three use a fixed 140 BPM visual target. Their presentation is borderless, with no visible title strip or panel shadow, and a small overlay close control. Only the active clip loads and plays. Pausing, buffering, hidden tabs and the visuals/reduced-motion controls pause every clip; Hide/Show preserves the current turn across song changes. Failed clips are skipped without affecting music.

Run `node meme-test.cjs` to verify the memes’ random turn lengths, random centred turn, first handoff, lazy loading, playback/visibility synchronization, motion controls and error handling.
