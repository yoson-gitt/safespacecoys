(function() {
    'use strict';

    var utils = window.SSC.utils;
    var state = window.SSC.state;

    var QUEUE_KEY = 'sync_queue';

    function loadQueue() {
        return utils.loadFromStorage(QUEUE_KEY, []);
    }

    function saveQueue(queue) {
        utils.saveToStorage(QUEUE_KEY, queue);
    }

    function enqueue(type, payload) {
        var queue = loadQueue();
        queue.push({ type: type, payload: payload, ts: Date.now() });
        saveQueue(queue);
        flushQueue();
    }

    async function validateIfAvailable(fnName, payload) {
        try {
            if (!state.supabaseClient || !state.supabaseClient.functions) return { ok: true, skipped: true };
            var res = await state.supabaseClient.functions.invoke(fnName, { body: payload });
            if (res && res.data && res.data.ok === false) return { ok: false };
            if (res && res.error) return { ok: true, skipped: true };
            return { ok: true };
        } catch (_e) {
            return { ok: true, skipped: true };
        }
    }

    async function flushQueue() {
        if (!state.syncEnabled || !state.supabaseClient || !state.supabaseUser) return;
        if (!navigator.onLine) return;

        var queue = loadQueue();
        if (!queue.length) return;

        var remaining = [];
        for (var i = 0; i < queue.length; i++) {
            var item = queue[i];
            try {
                if (item.type === 'mood_entry') {
                    var moodCheck = await validateIfAvailable('validate_mood', item.payload);
                    if (moodCheck.ok === false) continue;
                    var res1 = await state.supabaseClient.from('mood_entries').insert(item.payload);
                    if (res1 && res1.error) throw res1.error;
                } else if (item.type === 'post') {
                    var postCheck = await validateIfAvailable('validate_post', item.payload);
                    if (postCheck.ok === false) continue;
                    var res2 = await state.supabaseClient.from('posts').insert(item.payload);
                    if (res2 && res2.error) throw res2.error;
                }
            } catch (e) {
                remaining.push(item);
            }
        }

        saveQueue(remaining);
    }

    function clearQueue() {
        saveQueue([]);
    }

    window.addEventListener('online', function() {
        flushQueue();
    });

    window.SSC.sync = {
        enqueue: enqueue,
        flushQueue: flushQueue,
        clearQueue: clearQueue
    };
})();
