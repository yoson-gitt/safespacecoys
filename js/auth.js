(function() {
    'use strict';

    var utils = window.SSC.utils;
    var state = window.SSC.state;
    var config = window.SSC.config;

    async function initSupabaseAuth() {
        if (state.supabaseClient) return;
        try {
            state.supabaseClient = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_KEY);
            var sessionResponse = await state.supabaseClient.auth.getSession();
            var session = sessionResponse && sessionResponse.data ? sessionResponse.data.session : null;
            if (session) {
                state.supabaseUser = session.user;
                state.isLoggedIn = true;
                state.userEmail = session.user.email;
                utils.saveToStorage('email', state.userEmail);
                updateUIForAuthState();
                window.SSC.sync.flushQueue();
            }

            state.supabaseClient.auth.onAuthStateChange(function(event, sessionData) {
                if (event === 'SIGNED_IN' && sessionData) {
                    state.supabaseUser = sessionData.user;
                    state.isLoggedIn = true;
                    state.userEmail = sessionData.user.email;
                    utils.saveToStorage('email', state.userEmail);
                    updateUIForAuthState();
                    window.SSC.sync.flushQueue();
                    closeAuthModal();
                }
            });
        } catch (authError) {
            console.warn('Supabase auth error:', authError);
        }
    }

    function updateUIForAuthState() {
        utils.$$('.nav-item.locked').forEach(function(el) { el.classList.toggle('locked', !state.isLoggedIn); });
        utils.$('profileLoggedOut').style.display = state.isLoggedIn ? 'none' : 'block';
        utils.$('profileLoggedIn').style.display = state.isLoggedIn ? 'block' : 'none';
        if (state.isLoggedIn) {
            utils.$('profileAvatar').textContent = state.userEmail.substring(0, 2).toUpperCase();
            utils.$('profileName').textContent = state.userEmail.split('@')[0];
            utils.$('profileEmail').textContent = state.userEmail;
        }
    }

    function openAuthModal() {
        utils.$('authModal').classList.add('active');
        utils.$('authForm').style.display = state.syncEnabled ? 'block' : 'none';
        utils.$('emailSent').style.display = 'none';
        utils.$('syncRequired').style.display = state.syncEnabled ? 'none' : 'block';
        var emailInput = utils.$('authEmail');
        if (emailInput) { emailInput.value = ''; emailInput.classList.remove('error'); }
        var errorEl = utils.$('emailError');
        if (errorEl) errorEl.classList.remove('show');
    }

    function closeAuthModal() { utils.$('authModal').classList.remove('active'); }

    async function sendMagicLink() {
        var email = utils.$('authEmail').value.trim();
        var errorEl = utils.$('emailError');
        var inputEl = utils.$('authEmail');

        if (!utils.validateEmail(email)) {
            if (inputEl) inputEl.classList.add('error');
            if (errorEl) errorEl.classList.add('show');
            return;
        }

        if (inputEl) inputEl.classList.remove('error');
        if (errorEl) errorEl.classList.remove('show');

        try {
            if (!state.supabaseClient) await initSupabaseAuth();
            var response = await state.supabaseClient.auth.signInWithOtp({
                email: email,
                options: { emailRedirectTo: window.location.origin }
            });

            if (response && response.error) {
                alert('Error: ' + response.error.message);
                return;
            }

            utils.$('authForm').style.display = 'none';
            utils.$('emailSent').style.display = 'block';
            utils.$('sentEmailAddress').textContent = email;
        } catch (e) {
            alert('Error sending magic link');
        }
    }

    async function resendMagicLink() {
        var email = utils.$('sentEmailAddress').textContent;
        var response = await state.supabaseClient.auth.signInWithOtp({
            email: email,
            options: { emailRedirectTo: window.location.origin }
        });
        alert(response && response.error ? 'Error: ' + response.error.message : 'Magic link resent!');
    }

    async function handleLogout() {
        if (state.supabaseClient) {
            await state.supabaseClient.auth.signOut();
        }
        state.supabaseUser = null;
        state.isLoggedIn = false;
        state.userEmail = '';
        localStorage.removeItem('ssc_email');
        window.SSC.sync.clearQueue();
        updateUIForAuthState();
        window.SSC.navigation.showPage('home');
    }

    window.SSC.auth = {
        initSupabaseAuth: initSupabaseAuth,
        updateUIForAuthState: updateUIForAuthState,
        openAuthModal: openAuthModal,
        closeAuthModal: closeAuthModal,
        sendMagicLink: sendMagicLink,
        resendMagicLink: resendMagicLink,
        handleLogout: handleLogout
    };
})();
