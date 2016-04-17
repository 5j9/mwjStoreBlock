/*jslint browser: true */
/*global $, jQuery, mw, window */
/*
 mwjStoreBlock (https://github.com/5j9/mwjStoreBlock)
 A JavaScript workaround for https://phabricator.wikimedia.org/T5233
 Licensed under CC-BY-SA-3.0.
*/
(function () {
    "use strict";
    var api = new mw.Api();
    var currentUser = mw.getConfig('wgUserName');
    function storageAvailable(type) {
        try {
            var storage = window[type],
                x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        } catch (ignore) {
            return false;
        }
    }
    function getBlockedUser(username, callback) {
        // Run the callback with username if the user is still auto-blocked, false otherwise.
        api.get({
            action: 'query',
            list: 'blocks',
            bkusers: username
        }).done(function (blockinfo) {
            blockinfo = blockinfo.query.blocks[0];
            // If the auto-block flag is not activated, it means that the user is allowed to edit using another account.
            if (!blockinfo || !blockinfo.hasOwnProperty('autoblock')) {
                localStorage.removeItem('blockeduser');
            } else {
                callback(blockinfo.user);
            }
        });
    }
    function recheckAndPrepare(blockeduser) {
        getBlockedUser(blockeduser, function (blockeduser) {
            var editform = $('#editform');
            editform.submit(function (e) {
                e.preventDefault();
                // Send another request that will be caught by AF.
                // The username of the actual blocked user will be saved in the summary.
                var trigger = "\u200CBlocked\u200C User\u200C: " + blockeduser;
                var params = {
                    action: 'edit',
                    title: mw.config.get('wgPageName'),
                    text: trigger,
                    summary: trigger
                };
                api.postWithToken('edit', params).done(function () {
                    // Continue with submitting the form.
                    localStorage.setItem('reportedBlock', currentUser);
                    editform.off().submit();
                });
            });
        });
    }
    if (storageAvailable('localStorage')) {
        var blockeduser = localStorage.getItem('blockeduser');
        // currentUser is null for non-logged-in users. If MW adds an auto-block option for IP addresses this condition can be removed.
        if (!blockeduser && currentUser && mw.config.get('wgAction') === 'edit' && $('#blocktext').length > 0) {
            getBlockedUser(currentUser, function (blockeduser) {
                localStorage.setItem('blockeduser', blockeduser);
            });
        }
        // Don't log IP addresses as it may violate privacy policy.
        if (blockeduser && currentUser && blockeduser !== currentUser && localStorage.getItem('reportedBlock') !== currentUser) {
            // Recheck to make sure the block is not lifted.
            recheckAndPrepare(blockeduser);
        }
    }
}());