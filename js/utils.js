(function() {
    'use strict';

    window.SSC = window.SSC || {};
    window.SSC.utils = {
        $: function(id) { return document.getElementById(id); },
        $$: function(sel) { return document.querySelectorAll(sel); },
        safeJSONParse: function(str, fallback) {
            try { return JSON.parse(str) || fallback; }
            catch (e) { return fallback; }
        },
        saveToStorage: function(key, data) {
            try { localStorage.setItem('ssc_' + key, JSON.stringify(data)); }
            catch (e) { console.warn('Storage error:', e); }
        },
        loadFromStorage: function(key, fallback) {
            try { return window.SSC.utils.safeJSONParse(localStorage.getItem('ssc_' + key), fallback); }
            catch (e) { return fallback; }
        },
        validateEmail: function(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        formatDate: function(dateStr) {
            try {
                var date = new Date(dateStr);
                var now = new Date();
                var diffHrs = Math.floor((now - date) / (1000 * 60 * 60));
                if (diffHrs < 1) return 'Just now';
                if (diffHrs < 24) return diffHrs + 'h ago';
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } catch (e) { return 'Recently'; }
        },
        escapeHtml: function(text) {
            var div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };
})();
