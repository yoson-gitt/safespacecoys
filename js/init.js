(function() {
    'use strict';

    var utils = window.SSC.utils;
    var state = window.SSC.state;
    var config = window.SSC.config;

    function loadState() {
        state.userEmail = utils.loadFromStorage('email', '');
        state.isLoggedIn = !!state.userEmail;
        state.checkinHistory = utils.loadFromStorage('checkins', []);
        state.toolsUsed = utils.loadFromStorage('toolsUsed', 0);
        state.toolFeedback = utils.loadFromStorage('toolFeedback', {});
        state.communityPosts = utils.loadFromStorage('posts', window.SSC.stateHelpers.getDefaultPosts());
        state.syncEnabled = utils.loadFromStorage('syncEnabled', false);
    }

    function updateMatchDisplay() {
        try {
            var match = config.MATCH_DATA.nextMatch;
            utils.$('homeTeamBadge').textContent = match.homeTeamBadge;
            utils.$('homeTeamName').textContent = match.homeTeam;
            utils.$('awayTeamBadge').textContent = match.awayTeamBadge;
            utils.$('awayTeamName').textContent = match.awayTeam;
            utils.$('matchVenue').textContent = match.venue;
            utils.$('matchCompetition').textContent = match.competition;
        } catch (e) {}
    }

    function startCountdown() { updateCountdown(); setInterval(updateCountdown, 1000); }

    function updateCountdown() {
        try {
            var diff = new Date(config.MATCH_DATA.nextMatch.date) - new Date();
            if (diff <= 0) {
                utils.$('countdownDays').textContent = '0';
                utils.$('countdownHours').textContent = '0';
                utils.$('countdownMinutes').textContent = '0';
                utils.$('countdownSeconds').textContent = '0';
                return;
            }
            utils.$('countdownDays').textContent = Math.floor(diff / 86400000);
            utils.$('countdownHours').textContent = Math.floor((diff % 86400000) / 3600000);
            utils.$('countdownMinutes').textContent = Math.floor((diff % 3600000) / 60000);
            utils.$('countdownSeconds').textContent = Math.floor((diff % 60000) / 1000);
        } catch (e) {}
    }

    function updateDroughtCounter() {
        try {
            var days = Math.floor((new Date() - new Date(config.MATCH_DATA.lastTrophyDate)) / 86400000);
            utils.$('droughtDays').textContent = days.toLocaleString();
        } catch (e) {}
    }

    function updateMatchdayMode() {
        try {
            var matchTime = new Date(config.MATCH_DATA.nextMatch.date).getTime();
            var now = Date.now();
            var diffHrs = (matchTime - now) / 3600000;
            var isMatchday = diffHrs <= 24 && diffHrs >= -6;
            document.body.classList.toggle('matchday', isMatchday);
            var banner = utils.$('matchdayBanner');
            if (banner) banner.style.display = isMatchday ? 'flex' : 'none';
        } catch (e) {}
    }

    function setupActionHandlers() {
        document.addEventListener('click', function(e) {
            var actionEl = e.target.closest('[data-action]');
            if (!actionEl) return;

            var action = actionEl.dataset.action;
            switch (action) {
                case 'select-mood':
                    window.SSC.checkin.selectQuickMood(actionEl, actionEl.dataset.emotion, actionEl.dataset.emoji);
                    break;
                case 'open-tool':
                    window.SSC.tools.openToolModal(actionEl.dataset.tool);
                    break;
                case 'select-trigger':
                    window.SSC.checkin.selectTrigger(actionEl);
                    break;
                case 'toggle-new-post':
                    window.SSC.community.toggleNewPostForm();
                    break;
                case 'select-post-type':
                    window.SSC.community.selectPostType(actionEl);
                    break;
                case 'submit-post':
                    window.SSC.community.submitPost();
                    break;
                case 'react-post':
                    window.SSC.community.reactToPost(parseInt(actionEl.dataset.postId, 10));
                    break;
                case 'open-auth':
                    window.SSC.auth.openAuthModal();
                    break;
                case 'close-auth':
                    window.SSC.auth.closeAuthModal();
                    break;
                case 'send-magic-link':
                    window.SSC.auth.sendMagicLink();
                    break;
                case 'resend-magic-link':
                    window.SSC.auth.resendMagicLink();
                    break;
                case 'logout':
                    window.SSC.auth.handleLogout();
                    break;
                case 'open-privacy':
                    window.SSC.privacy.openPrivacyModal();
                    document.body.classList.remove('sidebar-open');
                    break;
                case 'close-privacy':
                    window.SSC.privacy.closePrivacyModal();
                    break;
                case 'toggle-sidebar':
                    document.body.classList.toggle('sidebar-open');
                    break;
                case 'close-sidebar':
                    document.body.classList.remove('sidebar-open');
                    break;
                case 'clear-data':
                    window.SSC.privacy.clearAllData();
                    break;
                case 'close-checkin':
                    window.SSC.checkin.closeCheckinModal();
                    break;
                case 'prev-step':
                    window.SSC.checkin.prevStep();
                    break;
                case 'next-step':
                    window.SSC.checkin.nextStep();
                    break;
                case 'close-tool':
                    window.SSC.tools.closeToolModal();
                    break;
                case 'start-breathing':
                    window.SSC.tools.startBreathing();
                    break;
                case 'stop-breathing':
                    window.SSC.tools.stopBreathing();
                    break;
                case 'grounding-next':
                    window.SSC.tools.nextGroundingStep();
                    break;
                case 'submit-feedback':
                    window.SSC.tools.submitFeedback(actionEl.dataset.tool, actionEl.dataset.helpful === '1', actionEl);
                    break;
                default:
                    break;
            }
        });

        document.addEventListener('keydown', function(e) {
            var isActivation = (e.key === 'Enter' || e.key === ' ');
            if (!isActivation) return;
            var target = e.target;
            if (target && (target.hasAttribute('data-action') || target.hasAttribute('data-page'))) {
                e.preventDefault();
                target.click();
            }
        });

        var intensitySlider = utils.$('intensitySlider');
        if (intensitySlider) {
            intensitySlider.addEventListener('input', function() {
                window.SSC.checkin.updateIntensity(intensitySlider.value);
            });
        }
    }

    function setupModalAndEscapeHandlers() {
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                utils.$$('.modal-overlay.active').forEach(function(m) { m.classList.remove('active'); });
                if (state.breathingInterval) { clearInterval(state.breathingInterval); state.breathingInterval = null; }
            }
        });

        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.classList.remove('active');
                if (state.breathingInterval) { clearInterval(state.breathingInterval); state.breathingInterval = null; }
            }
        });
    }

    document.addEventListener('DOMContentLoaded', async function() {
        try {
            loadState();
            updateMatchDisplay();
            updateDroughtCounter();
            startCountdown();
            updateMatchdayMode();
            window.SSC.navigation.setupNavigation();
            window.SSC.community.renderCommunityFeed();
            window.SSC.auth.updateUIForAuthState();
            window.SSC.checkin.updateStats();
            window.SSC.checkin.renderCheckinHistory();
            window.SSC.checkin.renderMoodChart();
            window.SSC.privacy.setupPrivacyToggle();
            window.SSC.community.setupCommunityFilters();
            setupActionHandlers();
            setupModalAndEscapeHandlers();
        } catch (e) { console.error('Init error:', e); }

        if (state.syncEnabled) {
            await window.SSC.auth.initSupabaseAuth();
        }
    });
})();
