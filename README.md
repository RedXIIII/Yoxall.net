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
