(function() {
    'use strict';

    var utils = window.SSC.utils;
    var state = window.SSC.state;
    var config = window.SSC.config;

    function selectQuickMood(el, emotion, emoji) {
        utils.$$('.mood-option').forEach(function(o) { o.classList.remove('selected'); });
        el.classList.add('selected');
        state.selectedEmotion = { name: emotion, emoji: emoji };
        setTimeout(openCheckinModal, 250);
    }

    function openCheckinModal() {
        utils.$('checkinModal').classList.add('active');
        utils.$('selectedEmotionLabel').textContent = state.selectedEmotion.name.charAt(0).toUpperCase() + state.selectedEmotion.name.slice(1);
        utils.$('selectedEmotionEmoji').textContent = state.selectedEmotion.emoji;
        state.currentStep = 1;
        state.intensity = 5;
        state.selectedTrigger = '';
        utils.$('intensityValue').textContent = '5';
        utils.$$('.trigger-tag').forEach(function(t) { t.classList.remove('selected'); });
        updateStepVisibility();
    }

    function closeCheckinModal() { utils.$('checkinModal').classList.remove('active'); }

    function updateStepVisibility() {
        utils.$$('.checkin-step').forEach(function(s, i) { s.classList.toggle('active', i + 1 === state.currentStep); });
        var footer = utils.$('modalFooter');
        footer.querySelector('.btn-secondary').style.display = state.currentStep === 1 ? 'none' : 'block';
        footer.style.display = state.currentStep === 4 ? 'none' : 'flex';
        footer.querySelector('.btn-primary').textContent = state.currentStep === 3 ? 'Save' : 'Continue';
    }

    function nextStep() {
        if (state.currentStep === 3) saveCheckin();
        if (state.currentStep < 4) { state.currentStep++; updateStepVisibility(); }
    }

    function prevStep() {
        if (state.currentStep > 1) { state.currentStep--; updateStepVisibility(); }
    }

    function updateIntensity(val) {
        state.intensity = parseInt(val, 10);
        utils.$('intensityValue').textContent = val;
    }

    function selectTrigger(el) {
        utils.$$('#step3 .trigger-tag').forEach(function(t) { t.classList.remove('selected'); });
        el.classList.add('selected');
        state.selectedTrigger = el.textContent;
    }

    function saveCheckin() {
        var checkin = {
            emotion: state.selectedEmotion.name,
            emoji: state.selectedEmotion.emoji,
            intensity: state.intensity,
            trigger: state.selectedTrigger,
            date: new Date().toISOString()
        };
        state.checkinHistory.unshift(checkin);
        utils.saveToStorage('checkins', state.checkinHistory);
        updateStats();
        renderCheckinHistory();
        renderMoodChart();
        if (state.supabaseUser && state.supabaseClient && state.syncEnabled) {
            window.SSC.sync.enqueue('mood_entry', {
                user_id: state.supabaseUser.id,
                emotion: state.selectedEmotion.name,
                intensity: state.intensity,
                trigger: state.selectedTrigger || null
            });
        }
    }

    function renderCheckinHistory() {
        var container = utils.$('checkinHistory');
        if (!container) return;
        if (state.checkinHistory.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 30px;">No check-ins yet</p>';
            return;
        }
        container.innerHTML = state.checkinHistory.slice(0, 8).map(function(c) {
            return '<div class="history-item"><div class="history-emoji">' + c.emoji + '</div><div class="history-details"><div class="history-emotion">' + (c.emotion.charAt(0).toUpperCase() + c.emotion.slice(1)) + '</div><div class="history-meta">' + utils.formatDate(c.date) + (c.trigger ? ' • ' + c.trigger : '') + '</div></div><div class="history-intensity">' + c.intensity + '/10</div></div>';
        }).join('');
    }

    function updateStats() {
        utils.$('statCheckins').textContent = state.checkinHistory.length;
        utils.$('statStreak').textContent = calculateStreak();
        utils.$('statTools').textContent = state.toolsUsed;
        if (state.checkinHistory.length > 0) {
            var avg = state.checkinHistory.reduce(function(sum, c) { return sum + c.intensity; }, 0) / state.checkinHistory.length;
            utils.$('statAvgMood').textContent = avg.toFixed(1);
        }
    }

    function calculateStreak() {
        if (state.checkinHistory.length === 0) return 0;
        var today = new Date().toDateString();
        if (new Date(state.checkinHistory[0].date).toDateString() !== today) return 0;
        var streak = 1;
        for (var i = 1; i < state.checkinHistory.length; i++) {
            var curr = new Date(state.checkinHistory[i-1].date);
            var prev = new Date(state.checkinHistory[i].date);
            if (Math.floor((curr - prev) / 86400000) === 1) streak++;
            else break;
        }
        return streak;
    }

    function renderMoodChart() {
        var canvas = utils.$('moodChart');
        var emptyMsg = utils.$('chartEmpty');
        var summary = utils.$('chartSummary');
        if (!canvas) return;

        var last7Days = getLast7DaysData();
        if (last7Days.every(function(d) { return d === null; })) {
            canvas.style.display = 'none';
            if (emptyMsg) emptyMsg.style.display = 'block';
            if (summary) summary.textContent = 'Your trend will appear after your first check‑in.';
            return;
        }

        canvas.style.display = 'block';
        if (emptyMsg) emptyMsg.style.display = 'none';
        if (summary) summary.textContent = buildTrendSummary(last7Days);

        var ctx = canvas.getContext('2d');
        var rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = 150 * 2;
        ctx.scale(2, 2);

        var w = rect.width, h = 150;
        var padding = { top: 20, right: 20, bottom: 30, left: 30 };
        var chartW = w - padding.left - padding.right;
        var chartH = h - padding.top - padding.bottom;

        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        for (var i = 0; i <= 10; i += 2) {
            var y = padding.top + chartH - (i / 10) * chartH;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(w - padding.right, y);
            ctx.stroke();
        }

        var points = [];
        last7Days.forEach(function(val, i) {
            if (val !== null) {
                var x = padding.left + (i / 6) * chartW;
                var y = padding.top + chartH - (val / 10) * chartH;
                points.push({ x: x, y: y, val: val });
            }
        });

        if (points.length > 1) {
            ctx.strokeStyle = '#f0d78c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach(function(p) { ctx.lineTo(p.x, p.y); });
            ctx.stroke();
        }

        points.forEach(function(p) {
            ctx.fillStyle = '#f0d78c';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px DM Sans';
        ctx.textAlign = 'center';
        var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (var i = 0; i < 7; i++) {
            var date = new Date();
            date.setDate(date.getDate() - 6 + i);
            var x = padding.left + (i / 6) * chartW;
            ctx.fillText(days[date.getDay()], x, h - 8);
        }
    }

    function getLast7DaysData() {
        var data = [null, null, null, null, null, null, null];
        var now = new Date();
        state.checkinHistory.forEach(function(c) {
            var cDate = new Date(c.date);
            var diffDays = Math.floor((now - cDate) / 86400000);
            if (diffDays >= 0 && diffDays < 7) {
                var idx = 6 - diffDays;
                if (data[idx] === null) data[idx] = c.intensity;
            }
        });
        return data;
    }

    function buildTrendSummary(data) {
        var points = data.filter(function(v) { return v !== null; });
        if (points.length < 2) return 'One check‑in isn’t a trend yet. Keep going.';
        var first = points[0];
        var last = points[points.length - 1];
        var diff = last - first;
        if (Math.abs(diff) < 0.5) return 'Your mood has been steady this week.';
        if (diff > 0) return 'Your mood is trending more intense recently. Be kind to yourself.';
        return 'Your mood intensity has eased a bit since the start of the week.';
    }

    window.SSC.checkin = {
        selectQuickMood: selectQuickMood,
        openCheckinModal: openCheckinModal,
        closeCheckinModal: closeCheckinModal,
        updateStepVisibility: updateStepVisibility,
        nextStep: nextStep,
        prevStep: prevStep,
        updateIntensity: updateIntensity,
        selectTrigger: selectTrigger,
        saveCheckin: saveCheckin,
        renderCheckinHistory: renderCheckinHistory,
        updateStats: updateStats,
        renderMoodChart: renderMoodChart
    };
})();
