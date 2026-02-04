(function() {
    'use strict';

    var utils = window.SSC.utils;
    var state = window.SSC.state;
    var config = window.SSC.config;

    function renderCommunityFeed() {
        var container = utils.$('communityFeed');
        if (!container) return;

        var sorted = state.communityPosts.slice().sort(function(a, b) {
            if (a.type !== b.type) return a.type === 'support' ? -1 : 1;
            return new Date(b.date) - new Date(a.date);
        });

        container.innerHTML = sorted.map(function(post) {
            return '<div class="feed-post" data-id="' + post.id + '" data-type="' + post.type + '"><div class="post-header"><div class="post-avatar">' + (post.type === 'vent' ? '😤' : '🤝') + '</div><div class="post-meta"><div class="post-author">' + utils.escapeHtml(post.author) + '</div><div class="post-time">' + utils.formatDate(post.date) + '</div></div><span class="post-tag ' + post.type + '">' + (post.type === 'vent' ? '😤 Vent' : '🤝 Support') + '</span></div><div class="post-content">' + utils.escapeHtml(post.content) + '</div><div class="post-actions"><button class="post-action-btn" data-action="react-post" data-post-id="' + post.id + '">🤝 ' + post.reactions + '</button><button class="post-action-btn">💬 Reply</button></div></div>';
        }).join('');
    }

    function toggleNewPostForm() {
        var form = utils.$('newPostForm');
        if (form) {
            form.classList.toggle('active');
            if (form.classList.contains('active')) {
                var textarea = utils.$('newPostContent');
                if (textarea) textarea.focus();
            }
        }
    }

    function selectPostType(btn) {
        utils.$$('.post-type-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.currentPostType = btn.dataset.type;
    }

    function submitPost() {
        var content = utils.$('newPostContent').value.trim();
        if (!content) return;
        if (content.length > config.MAX_POST_LENGTH) {
            alert('Post is too long. Please keep it under ' + config.MAX_POST_LENGTH + ' characters.');
            return;
        }

        var newPost = {
            id: Date.now(),
            author: state.userEmail ? state.userEmail.split('@')[0] : 'Anonymous',
            content: content,
            type: state.currentPostType,
            date: new Date().toISOString(),
            reactions: 0
        };

        state.communityPosts.unshift(newPost);
        if (state.supabaseUser && state.supabaseClient && state.syncEnabled) {
            window.SSC.sync.enqueue('post', {
                user_id: state.supabaseUser.id,
                content: content,
                post_type: state.currentPostType,
                category: 'general'
            });
        }
        utils.saveToStorage('posts', state.communityPosts);

        utils.$('newPostContent').value = '';
        utils.$('newPostForm').classList.remove('active');
        renderCommunityFeed();
    }

    function reactToPost(postId) {
        var post = state.communityPosts.find(function(p) { return p.id === postId; });
        if (post) {
            post.reactions++;
            utils.saveToStorage('posts', state.communityPosts);
            renderCommunityFeed();
        }
    }

    function setupCommunityFilters() {
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('filter-btn')) {
                utils.$$('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
                e.target.classList.add('active');
                var filter = e.target.dataset.filter;

                utils.$$('.feed-post').forEach(function(post) {
                    if (filter === 'all') post.style.display = 'block';
                    else post.style.display = post.dataset.type === filter ? 'block' : 'none';
                });
            }
        });
    }

    window.SSC.community = {
        renderCommunityFeed: renderCommunityFeed,
        toggleNewPostForm: toggleNewPostForm,
        selectPostType: selectPostType,
        submitPost: submitPost,
        reactToPost: reactToPost,
        setupCommunityFilters: setupCommunityFilters
    };
})();
