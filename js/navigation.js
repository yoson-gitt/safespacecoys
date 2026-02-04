(function() {
    'use strict';

    var utils = window.SSC.utils;
    var state = window.SSC.state;

    function setupNavigation() {
        utils.$$('[data-page]').forEach(function(btn) {
            btn.addEventListener('click', function() { showPage(btn.dataset.page); });
        });
    }

    function showPage(pageId) {
        if (pageId === 'community' && !state.isLoggedIn) {
            window.SSC.auth.openAuthModal();
            return;
        }
        utils.$$('.page').forEach(function(p) { p.classList.remove('active'); });
        utils.$$('.nav-item, .mobile-nav-item').forEach(function(n) { n.classList.remove('active'); });
        var page = utils.$('page-' + pageId);
        if (page) page.classList.add('active');
        utils.$$('[data-page="' + pageId + '"]').forEach(function(n) { n.classList.add('active'); });
        if (pageId === 'profile') window.SSC.checkin.renderMoodChart();
    }

    window.SSC.navigation = {
        setupNavigation: setupNavigation,
        showPage: showPage
    };
})();
