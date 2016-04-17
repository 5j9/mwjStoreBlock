# mwjStoreBlock

A JavaScript workaround for [T5233](https://phabricator.wikimedia.org/T5233).

Using JavaScript and [Abuse-Filter](https://www.mediawiki.org/wiki/Extension:AbuseFilter) some block evasions can be detected and automatically re-blocked.

## How it works

When a user enters the edit mode, the script looks for MediaWiki's block message. If a block message is found, the script rechecks the block status for current user and if they are actually blocked, their user-name will be stored in browser's local storage. This stored-value will be checked on each visit and if it's found, after rechecking the block status, the script will attempt to make an edit that is designed to trigger AF.

Note that the script only blocks auto-blocked users. Other kind of blocks may safely create another account and edit using the new account.

## Instructions

1. Put [MediaWiki:Blockedtext](https://www.mediawiki.org/wiki/Manual:Interface/Blockedtext)'s content inside `<div id='blocktext'>...</div>`. This is how the script detects blocks without sending API requests for every visit.
2. Add a new edit-filter with the following content:

    ````
"?Blocked? User?: " in summary &
! user_blocked
/* note that there are some invisible characters in the first string.
Make sure that they remain there. */
````
3. Set the filter's action to 'Block' (or 'Disallow' if you just want to test).
4. Add the script to `MediaWiki:Common.js`.

## Known caveats

* Currently MW does not offer any kind of auto-block feature for IP addresses.
* If a blocked user does not enter the edit mode while being blocked, the script won't work.
* If the AF fails to catch the edit, for example because the condition limit is reached, an unwanted edit will be saved.
* JS must be allowed in user's browser.
* There are several ways to clear local-storage of the browser.
* Revealing relation between an IP and the an actual blocked user may be a violation of Wikipedia's privacy policy therefore the script is currently configured to not report/block IP addresses. Note however that this feature can easily be reactivated.
