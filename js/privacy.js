(function() {
    'use strict';

    var utils = window.SSC.utils;
    var state = window.SSC.state;

    function openPrivacyModal() { utils.$('privacyModal').classList.add('active'); }
    function closePrivacyModal() { utils.$('privacyModal').classList.remove('active'); }

    function clearAllData() {
        if (confirm('This will delete all your check-ins, posts, and settings. Continue?')) {
            Object.keys(localStorage).forEach(function(key) {
                if (key.startsWith('ssc_')) localStorage.removeItem(key);
            });
            state.checkinHistory = [];
            state.communityPosts = window.SSC.stateHelpers.getDefaultPosts();
            state.toolsUsed = 0;
            state.toolFeedback = {};
            state.isLoggedIn = false;
            state.userEmail = '';
            state.syncEnabled = false;
            window.SSC.sync.clearQueue();
            window.SSC.auth.updateUIForAuthState();
            window.SSC.checkin.updateStats();
            window.SSC.checkin.renderCheckinHistory();
            window.SSC.checkin.renderMoodChart();
            window.SSC.community.renderCommunityFeed();
            closePrivacyModal();
            alert('All data cleared.');
        }
    }

    function setupPrivacyToggle() {
        var toggle = utils.$('syncToggle');
        if (!toggle) return;
        toggle.checked = !!state.syncEnabled;
        toggle.addEventListener('change', async function() {
            state.syncEnabled = !!toggle.checked;
            utils.saveToStorage('syncEnabled', state.syncEnabled);
            if (state.syncEnabled) {
                await window.SSC.auth.initSupabaseAuth();
            } else {
                state.supabaseUser = null;
                state.isLoggedIn = false;
                state.userEmail = '';
                localStorage.removeItem('ssc_email');
                window.SSC.sync.clearQueue();
                window.SSC.auth.updateUIForAuthState();
                window.SSC.navigation.showPage('home');
            }
        });
    }

    window.SSC.privacy = {
        openPrivacyModal: openPrivacyModal,
        closePrivacyModal: closePrivacyModal,
        clearAllData: clearAllData,
        setupPrivacyToggle: setupPrivacyToggle
    };
})();
