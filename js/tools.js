(function() {
    'use strict';

    var utils = window.SSC.utils;
    var state = window.SSC.state;

    function openToolModal(tool) {
        utils.$('toolModal').classList.add('active');
        state.toolsUsed++;
        utils.saveToStorage('toolsUsed', state.toolsUsed);
        window.SSC.checkin.updateStats();

        var title = utils.$('toolModalTitle');
        var body = utils.$('toolModalBody');

        var feedbackHTML = '<div class="feedback-section"><div class="feedback-title">Was this helpful?</div><div class="feedback-buttons"><button class="feedback-btn" data-action="submit-feedback" data-tool="' + tool + '" data-helpful="1">👍 Yes</button><button class="feedback-btn" data-action="submit-feedback" data-tool="' + tool + '" data-helpful="0">👎 No</button></div><div class="feedback-thanks" id="feedbackThanks">Thanks for your feedback!</div></div>';

        if (tool === 'breathing') {
            title.textContent = 'Box Breathing';
            body.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-bottom: 12px;">Breathe in 4s, hold 4s, out 4s, hold 4s.</p><div class="tool-content"><div class="tool-visual breathing paused" id="breathCircle"><span style="font-family: Archivo Black; font-size: 28px; color: var(--gold-text);" id="breathCount">4</span></div><div class="tool-instruction" id="breathInstruction">Tap Start</div><div class="tool-timer" id="breathCycle"></div></div><button class="btn btn-primary" style="width: 100%;" id="breathBtn" data-action="start-breathing">Start</button>' + feedbackHTML;
        } else if (tool === 'grounding') {
            state.groundingStep = 5;
            title.textContent = '5-4-3-2-1 Grounding';
            body.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-bottom: 12px;">Use your senses to ground yourself.</p><div class="tool-content"><div class="tool-visual grounding"><span style="font-family: Archivo Black; font-size: 56px; color: var(--accent-blue);" id="groundingCount">5</span></div><div class="tool-instruction" id="groundingPrompt">Name 5 things you SEE</div><div class="tool-detail" id="groundingSense">Look around you</div></div><button class="btn btn-primary" style="width: 100%;" data-action="grounding-next">Next →</button>' + feedbackHTML;
        } else if (tool === 'reframe') {
            title.textContent = 'Thought Reframing';
            body.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-bottom: 16px;">Challenge unhelpful thoughts with CBT.</p><div class="thought-input"><label style="display: block; margin-bottom: 6px; font-weight: 600;">The thought bothering you:</label><textarea placeholder="We always bottle it..."></textarea></div><div class="reframe-questions"><div class="reframe-question"><p><strong>Is this 100% true?</strong></p><p>What evidence supports or contradicts it?</p></div><div class="reframe-question"><p><strong>Is this helpful?</strong></p><p>Does thinking this way help you?</p></div><div class="reframe-question"><p><strong>What would you tell a friend?</strong></p><p>If they had this thought, what would you say?</p></div></div>' + feedbackHTML;
        } else if (tool === 'affirmation') {
            var affirmations = [
                "I can enjoy the match regardless of the result.",
                "My worth isn't tied to my team's performance.",
                "Supporting Spurs has given me community and joy.",
                "Audere est Facere — I choose courage over spiral.",
                "I choose to focus on what I can control.",
                "It's okay to feel disappointed. It shows I care.",
                "I am resilient. I've survived tough seasons before.",
                "Win or lose, I'm part of something bigger.",
                "This is a game, and my wellbeing comes first."
            ];
            title.textContent = 'Affirmations';
            body.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-bottom: 20px;">Read slowly. Let it sink in.</p><div class="affirmation-card"><div class="affirmation-text">"' + affirmations[Math.floor(Math.random() * affirmations.length)] + '"</div></div><button class="btn btn-secondary" style="width: 100%;" data-action="open-tool" data-tool="affirmation">Another →</button>' + feedbackHTML;
        }
    }

    function closeToolModal() {
        utils.$('toolModal').classList.remove('active');
        if (state.breathingInterval) { clearInterval(state.breathingInterval); state.breathingInterval = null; }
    }

    function startBreathing() {
        var phases = ['Breathe In', 'Hold', 'Breathe Out', 'Hold'];
        var phase = 0, count = 4, cycles = 0;
        utils.$('breathCircle').classList.remove('paused');
        utils.$('breathBtn').textContent = 'Stop';
        utils.$('breathBtn').setAttribute('data-action', 'stop-breathing');

        function tick() {
            utils.$('breathCount').textContent = count;
            utils.$('breathInstruction').textContent = phases[phase];
            utils.$('breathCycle').textContent = 'Cycle ' + (cycles + 1) + '/4';
            count--;
            if (count < 0) { count = 4; phase = (phase + 1) % 4; if (phase === 0) cycles++; }
            if (cycles >= 4) {
                clearInterval(state.breathingInterval);
                state.breathingInterval = null;
                utils.$('breathCount').textContent = '✓';
                utils.$('breathInstruction').textContent = 'Great job!';
                utils.$('breathCycle').textContent = '';
                utils.$('breathBtn').textContent = 'Done';
                utils.$('breathBtn').setAttribute('data-action', 'close-tool');
                utils.$('breathCircle').classList.add('paused');
            }
        }
        tick();
        state.breathingInterval = setInterval(tick, 1000);
    }

    function stopBreathing() {
        if (state.breathingInterval) { clearInterval(state.breathingInterval); state.breathingInterval = null; }
        utils.$('breathCircle').classList.add('paused');
        utils.$('breathCount').textContent = '4';
        utils.$('breathInstruction').textContent = 'Tap Start';
        utils.$('breathCycle').textContent = '';
        utils.$('breathBtn').textContent = 'Start';
        utils.$('breathBtn').setAttribute('data-action', 'start-breathing');
    }

    function nextGroundingStep() {
        state.groundingStep--;
        var prompts = {
            4: { text: 'Name 4 things you TOUCH', sense: 'Feel textures around you' },
            3: { text: 'Name 3 things you HEAR', sense: 'Listen to your environment' },
            2: { text: 'Name 2 things you SMELL', sense: 'Notice any scents' },
            1: { text: 'Name 1 thing you TASTE', sense: 'Notice the taste in your mouth' },
            0: { text: 'You are grounded', sense: 'Well done! You are present.' }
        };
        utils.$('groundingCount').textContent = state.groundingStep > 0 ? state.groundingStep : '✓';
        utils.$('groundingPrompt').textContent = prompts[state.groundingStep].text;
        utils.$('groundingSense').textContent = prompts[state.groundingStep].sense;
        if (state.groundingStep === 0) {
            var btn = document.querySelector('#toolModalBody .btn-primary');
            if (btn) { btn.textContent = 'Done'; btn.setAttribute('data-action', 'close-tool'); }
        }
    }

    function submitFeedback(tool, helpful, targetEl) {
        state.toolFeedback[tool] = state.toolFeedback[tool] || { helpful: 0, notHelpful: 0 };
        if (helpful) state.toolFeedback[tool].helpful++;
        else state.toolFeedback[tool].notHelpful++;
        utils.saveToStorage('toolFeedback', state.toolFeedback);

        utils.$$('.feedback-btn').forEach(function(btn) { btn.classList.remove('selected'); });
        if (targetEl) targetEl.classList.add('selected');
        var thanks = utils.$('feedbackThanks');
        if (thanks) thanks.classList.add('show');
    }

    window.SSC.tools = {
        openToolModal: openToolModal,
        closeToolModal: closeToolModal,
        startBreathing: startBreathing,
        stopBreathing: stopBreathing,
        nextGroundingStep: nextGroundingStep,
        submitFeedback: submitFeedback
    };
})();
