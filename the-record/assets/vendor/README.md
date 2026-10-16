# Browser cryptography dependency

`nostr-tools-2.25.2.js` is the unmodified browser bundle `package/lib/nostr.bundle.js` from the official npm package `nostr-tools@2.25.2`.

- Package: https://www.npmjs.com/package/nostr-tools/v/2.25.2
- Upstream: https://github.com/nbd-wtf/nostr-tools
- Source archive: https://registry.npmjs.org/nostr-tools/-/nostr-tools-2.25.2.tgz
- License: Unlicense, reproduced in `LICENSE.nostr-tools.txt`.

The Signal Room uses this locally served bundle to sign and verify Nostr events. It does not load executable code from public relays.
