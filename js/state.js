(function() {
    'use strict';

    window.SSC = window.SSC || {};

    window.SSC.config = {
        MATCH_DATA: {
            nextMatch: {
                date: '2026-02-07T12:30:00',
                homeTeam: 'Man United',
                homeTeamBadge: '🔴',
                awayTeam: 'Spurs',
                awayTeamBadge: '🤍',
                venue: 'Old Trafford',
                competition: 'Premier League',
                isHome: false
            },
            lastTrophyDate: '2025-05-21'
        },
        SUPABASE_URL: 'https://bjodaghpowjqnlhclbdg.supabase.co',
        SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqb2RhZ2hwb3dqcW5saGNsYmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDU3MzgsImV4cCI6MjA4NTUyMTczOH0.c1GpOXl-2kwEIv23EYyD2PhR52x9q1QA3F4HHZK4zd4',
        MAX_POST_LENGTH: 500
    };

    window.SSC.state = {
        isLoggedIn: false,
        userEmail: '',
        currentStep: 1,
        selectedEmotion: { name: '', emoji: '' },
        intensity: 5,
        selectedTrigger: '',
        checkinHistory: [],
        toolsUsed: 0,
        toolFeedback: {},
        communityPosts: [],
        currentPostType: 'vent',
        breathingInterval: null,
        groundingStep: 5,
        supabaseUser: null,
        syncEnabled: false,
        supabaseClient: null
    };

    window.SSC.stateHelpers = {
        getDefaultPosts: function() {
            return [
                { id: 1, author: 'Anonymous Spur', content: "26 years supporting this club. My therapist says 'it's just football' but it's NOT. Anyway, COYS forever.", type: 'vent', date: new Date(Date.now() - 2*60*60*1000).toISOString(), reactions: 47 },
                { id: 2, author: 'NLD_Survivor', content: 'Derby coming up. Already anxious. Anyone else using breathing exercises? They actually help.', type: 'support', date: new Date(Date.now() - 5*60*60*1000).toISOString(), reactions: 89 }
            ];
        }
    };
})();
