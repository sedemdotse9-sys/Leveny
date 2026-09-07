/* ============================================================
   COMMENTS.JS — Leveny
   Drives comments.html: real-time announcements + a public
   comment/reply board, backed by Firebase Firestore (free
   Spark plan). Config lives in js/firebase-config.js — this
   file has no secrets and shouldn't need editing.

   Data model (all in Firestore, all real-time via onSnapshot):
     announcements/{id}  { text, authorName, createdAt }
     comments/{id}       { name, text, isOwner, parentId, createdAt }
       - top-level comment: parentId == null
       - reply:             parentId == <parent comment id>

   Only the site owner (signed in via Firebase Auth, see
   firestore.rules) can post announcements or have a reply
   tagged with the owner badge. Everything else is public and
   requires no login — matches the rest of the site's "no
   friction" feel.
============================================================ */

(function () {

    if (!window.firebase || !window.LEVENY_FIREBASE_CONFIG) {
        console.error('Leveny comments: Firebase SDK or config missing.');
        return;
    }

    const cfg = window.LEVENY_FIREBASE_CONFIG;
    if (!cfg.apiKey || cfg.apiKey.indexOf('PASTE_') === 0) {
        // Config hasn't been filled in yet — show a friendly notice
        // instead of a silent broken page.
        document.addEventListener('DOMContentLoaded', () => {
            const notice = document.getElementById('commentsSetupNotice');
            if (notice) notice.hidden = false;
        });
        return;
    }

    firebase.initializeApp(cfg);
    const db = firebase.firestore();
    const auth = firebase.auth();

    const OWNER_NAME = window.LEVENY_OWNER_NAME || 'Owner';
    const GUEST_NAME = 'Guest';
    const COMMENT_LIFETIME_MS = 20 * 24 * 60 * 60 * 1000; // 20 days — comments (not announcements) expire client-side after this

    let isOwnerSignedIn = false;
    let allComments = []; // flat list from Firestore, newest first by createdAt

    /* ---------------- helpers ---------------- */

    function escapeIsHandledByTextContent() {
        // Reminder: we always set .textContent for user-supplied
        // strings below, never innerHTML — that's the actual XSS
        // guard, this function just documents the intent.
    }

    function initials(name) {
        const n = (name || '').trim();
        if (!n) return '?';
        const parts = n.split(/\s+/).slice(0, 2);
        return parts.map(p => p[0].toUpperCase()).join('');
    }

    function timeAgo(date) {
        if (!date) return '';
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 5) return 'just now';
        if (seconds < 60) return `${seconds}s ago`;
        const mins = Math.floor(seconds / 60);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function el(tag, className, text) {
        const e = document.createElement(tag);
        if (className) e.className = className;
        if (text !== undefined) e.textContent = text;
        return e;
    }

    /* ---------------- Owner sign-in modal ---------------- */

    function initOwnerGate() {
        const gateBtn = document.getElementById('ownerGateBtn');
        const backdrop = document.getElementById('ownerModalBackdrop');
        const cancelBtn = document.getElementById('ownerSignInCancel');
        const submitBtn = document.getElementById('ownerSignInSubmit');
        const emailInput = document.getElementById('ownerEmail');
        const passInput = document.getElementById('ownerPassword');
        const errorEl = document.getElementById('ownerModalError');
        if (!gateBtn || !backdrop) return;

        function openModal() {
            errorEl.textContent = '';
            backdrop.hidden = false;
            emailInput.focus();
        }
        function closeModal() {
            backdrop.hidden = true;
            passInput.value = '';
        }

        gateBtn.addEventListener('click', () => {
            if (isOwnerSignedIn) {
                auth.signOut();
            } else {
                openModal();
            }
        });

        cancelBtn.addEventListener('click', closeModal);
        backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });

        submitBtn.addEventListener('click', async () => {
            const email = emailInput.value.trim();
            const password = passInput.value;
            if (!email || !password) {
                errorEl.textContent = 'Enter both email and password.';
                return;
            }
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in…';
            try {
                await auth.signInWithEmailAndPassword(email, password);
                closeModal();
            } catch (err) {
                errorEl.textContent = 'Sign-in failed — check your email/password.';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
        });

        auth.onAuthStateChanged((user) => {
            isOwnerSignedIn = !!user;
            gateBtn.classList.toggle('is-owner', isOwnerSignedIn);
            gateBtn.innerHTML = '';
            const icon = el('i', isOwnerSignedIn ? 'fa-solid fa-lock-open' : 'fa-solid fa-lock');
            const label = el('span', null, isOwnerSignedIn ? ' Signed in' : ' Owner Sign In');
            gateBtn.appendChild(icon);
            gateBtn.appendChild(label);

            document.querySelectorAll('.owner-only').forEach(node => {
                node.hidden = !isOwnerSignedIn;
            });

            renderComments(); // re-render so reply buttons appear/disappear
        });
    }

    /* ---------------- Announcements ---------------- */

    function initAnnouncements() {
        const list = document.getElementById('announcementsList');
        const empty = document.getElementById('announcementsEmpty');
        const composer = document.getElementById('announcementComposer');
        const newBtn = document.getElementById('newAnnouncementBtn');
        const textArea = document.getElementById('announcementText');
        const postBtn = document.getElementById('postAnnouncementBtn');
        const cancelBtn = document.getElementById('cancelAnnouncementBtn');
        if (!list) return;

        if (newBtn) {
            newBtn.addEventListener('click', () => {
                composer.hidden = !composer.hidden;
                if (!composer.hidden) textArea.focus();
            });
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                composer.hidden = true;
                textArea.value = '';
            });
        }
        if (postBtn) {
            postBtn.addEventListener('click', async () => {
                const text = textArea.value.trim();
                if (!text) return;
                postBtn.disabled = true;
                try {
                    await db.collection('announcements').add({
                        text,
                        authorName: OWNER_NAME,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    textArea.value = '';
                    composer.hidden = true;
                } catch (err) {
                    console.error(err);
                    alert('Could not post — check your Firestore rules & sign-in.');
                } finally {
                    postBtn.disabled = false;
                }
            });
        }

        db.collection('announcements')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .onSnapshot((snap) => {
                list.innerHTML = '';
                if (snap.empty) {
                    empty.hidden = false;
                    return;
                }
                empty.hidden = true;
                snap.forEach((doc) => {
                    const d = doc.data();
                    const card = el('div', 'glass-card announcement-card');

                    const top = el('div', 'announcement-top');
                    top.appendChild((() => {
                        const b = el('span', 'announcement-badge');
                        b.appendChild(el('i', 'fa-solid fa-bullhorn'));
                        b.appendChild(document.createTextNode(' ' + (d.authorName || OWNER_NAME)));
                        return b;
                    })());
                    const ts = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate() : null;
                    top.appendChild(el('span', 'announcement-time', ts ? timeAgo(ts) : 'just now'));

                    const deleteBtn = el('button', 'announcement-delete-btn owner-only');
                    deleteBtn.type = 'button';
                    deleteBtn.hidden = !isOwnerSignedIn;
                    deleteBtn.title = 'Delete this announcement';
                    deleteBtn.appendChild(el('i', 'fa-solid fa-trash'));
                    deleteBtn.addEventListener('click', async () => {
                        if (!confirm('Delete this announcement? This cannot be undone.')) return;
                        deleteBtn.disabled = true;
                        try {
                            await db.collection('announcements').doc(doc.id).delete();
                        } catch (err) {
                            console.error(err);
                            alert('Could not delete — check your sign-in.');
                            deleteBtn.disabled = false;
                        }
                    });
                    top.appendChild(deleteBtn);

                    card.appendChild(top);
                    card.appendChild(el('p', 'announcement-text', d.text || ''));
                    list.appendChild(card);
                });
                // Re-apply owner-only visibility to the delete buttons we
                // just built, in case sign-in state changed mid-render.
                document.querySelectorAll('#announcementsList .owner-only').forEach(node => {
                    node.hidden = !isOwnerSignedIn;
                });
            }, (err) => {
                console.error('announcements listener error', err);
                // If this fires with code "permission-denied" right after you
                // sign out, your Firestore rules are almost certainly gating
                // *reads* on the announcements collection to isOwner() (i.e.
                // signed-in only) instead of just gating writes/deletes that
                // way. Reads on /announcements/{id} need to stay public
                // (allow read: if true;) so everyone — including you, signed
                // out — keeps seeing them; only create/delete should require
                // isOwner(). This is a firestore.rules fix in the Firebase
                // Console, not something this file can patch on its own.
                if (err && err.code === 'permission-denied') {
                    empty.hidden = false;
                    empty.querySelector('p').textContent = 'Could not load announcements — check Firestore read rules.';
                }
            });
    }

    /* ---------------- Comment composer ---------------- */

    function initComposer() {
        const textArea = document.getElementById('commentText');
        const charCount = document.getElementById('commentCharCount');
        const status = document.getElementById('commentStatus');
        const postBtn = document.getElementById('postCommentBtn');
        const avatarEl = document.getElementById('composerAvatar');
        if (!textArea || !postBtn) return;

        // Every visitor posts as the same shared "Guest" identity — no
        // name field, no accounts. Your replies are the only ones that
        // ever carry a different name (OWNER_NAME, tagged isOwner:true
        // and enforced server-side in firestore.rules).
        if (avatarEl) avatarEl.textContent = initials(GUEST_NAME);

        const MAX = 1000;
        textArea.addEventListener('input', () => {
            const remaining = MAX - textArea.value.length;
            charCount.textContent = `${Math.max(0, remaining)} characters left`;
        });

        postBtn.addEventListener('click', async () => {
            const name = GUEST_NAME;
            const text = textArea.value.trim();
            status.textContent = '';
            status.classList.remove('ok');

            if (!text) {
                status.textContent = 'Write something first.';
                return;
            }
            if (text.length > MAX) {
                status.textContent = `Keep it under ${MAX} characters.`;
                return;
            }

            postBtn.disabled = true;
            try {
                await db.collection('comments').add({
                    name,
                    text,
                    isOwner: false,
                    parentId: null,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                textArea.value = '';
                charCount.textContent = `${MAX} characters left`;
                status.textContent = 'Posted!';
                status.classList.add('ok');
                setTimeout(() => { status.textContent = ''; status.classList.remove('ok'); }, 2500);
            } catch (err) {
                console.error(err);
                status.textContent = 'Could not post — try again in a moment.';
            } finally {
                postBtn.disabled = false;
            }
        });
    }

    /* ---------------- Comments feed + replies ---------------- */

    function buildReplyComposer(parentId) {
        const wrap = el('div', 'reply-composer');
        wrap.hidden = true;

        const row = el('div', 'comment-composer-row');
        const avatar = el('div', 'composer-avatar is-owner', initials(OWNER_NAME));
        const fields = el('div', 'composer-fields');

        const textArea = document.createElement('textarea');
        textArea.className = 'composer-textarea';
        textArea.placeholder = `Reply as ${OWNER_NAME}…`;
        textArea.rows = 2;

        const footer = el('div', 'composer-footer');
        const status = el('span', 'composer-status');
        const sendBtn = el('button', 'small-action-btn');
        sendBtn.type = 'button';
        sendBtn.appendChild(el('i', 'fa-solid fa-paper-plane'));
        sendBtn.appendChild(document.createTextNode(' Reply'));

        sendBtn.addEventListener('click', async () => {
            const text = textArea.value.trim();
            if (!text) return;
            sendBtn.disabled = true;
            try {
                await db.collection('comments').add({
                    name: OWNER_NAME,
                    text,
                    isOwner: true,
                    parentId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                textArea.value = '';
                wrap.hidden = true;
            } catch (err) {
                console.error(err);
                status.textContent = 'Could not post reply.';
            } finally {
                sendBtn.disabled = false;
            }
        });

        footer.appendChild(status);
        footer.appendChild(sendBtn);
        fields.appendChild(textArea);
        fields.appendChild(footer);
        row.appendChild(avatar);
        row.appendChild(fields);
        wrap.appendChild(row);
        return wrap;
    }

    function buildCommentNode(comment, isReply, visibleComments) {
        const item = el('div', isReply ? 'reply-item' : 'comment-item');

        const avatar = el('div', 'comment-avatar' + (comment.isOwner ? ' is-owner' : ''), initials(comment.name));
        const body = el('div', 'comment-body');

        const meta = el('div', 'comment-meta');
        meta.appendChild(el('span', 'comment-name', comment.name || 'Guest'));
        if (comment.isOwner) {
            const badge = el('span', 'owner-badge');
            badge.appendChild(el('i', 'fa-solid fa-star'));
            badge.appendChild(document.createTextNode(' ' + OWNER_NAME));
            meta.appendChild(badge);
        }
        const ts = comment.createdAt && comment.createdAt.toDate ? comment.createdAt.toDate() : null;
        meta.appendChild(el('span', 'comment-time', ts ? timeAgo(ts) : 'just now'));

        body.appendChild(meta);
        body.appendChild(el('p', 'comment-text', comment.text || ''));

        if (!isReply) {
            const actions = el('div', 'comment-actions owner-only');
            actions.hidden = !isOwnerSignedIn;
            const replyBtn = el('button', 'comment-reply-btn');
            replyBtn.type = 'button';
            replyBtn.textContent = 'Reply';
            const replyBox = buildReplyComposer(comment.id);
            replyBtn.addEventListener('click', () => { replyBox.hidden = !replyBox.hidden; });
            actions.appendChild(replyBtn);
            body.appendChild(actions);
            body.appendChild(replyBox);

            const replies = visibleComments.filter(c => c.parentId === comment.id);
            if (replies.length) {
                const repliesList = el('div', 'replies-list');
                replies
                    .sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0))
                    .forEach(r => repliesList.appendChild(buildCommentNode(r, true, visibleComments)));
                body.appendChild(repliesList);
            }
        }

        item.appendChild(avatar);
        item.appendChild(body);
        return item;
    }

    function renderComments() {
        const list = document.getElementById('commentsList');
        const empty = document.getElementById('commentsEmpty');
        const countBadge = document.getElementById('commentsCountBadge');
        if (!list) return;

        // Comments (and replies) older than COMMENT_LIFETIME_MS quietly
        // stop being shown — this never touches announcements, and it
        // doesn't delete anything from Firestore, it just hides expired
        // ones client-side. Anything with no timestamp yet (just posted,
        // still waiting on the server clock) is always kept.
        const cutoff = Date.now() - COMMENT_LIFETIME_MS;
        const visibleComments = allComments.filter(c => !c.createdAtMs || c.createdAtMs >= cutoff);

        const topLevel = visibleComments.filter(c => !c.parentId);
        if (countBadge) countBadge.textContent = String(visibleComments.length);

        if (!topLevel.length) {
            list.innerHTML = '';
            empty.hidden = false;
            return;
        }
        empty.hidden = true;
        list.innerHTML = '';
        topLevel
            .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0))
            .forEach(c => list.appendChild(buildCommentNode(c, false, visibleComments)));
    }

    function initCommentsFeed() {
        db.collection('comments')
            .orderBy('createdAt', 'asc')
            .onSnapshot((snap) => {
                allComments = snap.docs.map(doc => {
                    const d = doc.data();
                    const ts = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate() : null;
                    return {
                        id: doc.id,
                        name: d.name,
                        text: d.text,
                        isOwner: !!d.isOwner,
                        parentId: d.parentId || null,
                        createdAt: d.createdAt,
                        createdAtMs: ts ? ts.getTime() : 0
                    };
                });
                renderComments();
            }, (err) => {
                console.error('comments listener error', err);
                const empty = document.getElementById('commentsEmpty');
                if (empty) {
                    empty.hidden = false;
                    empty.querySelector('p').textContent = 'Could not load comments.';
                }
            });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initOwnerGate();
        initAnnouncements();
        initComposer();
        initCommentsFeed();

        // Nothing pushes a "your 20 days are up" event from Firestore —
        // re-run the expiry filter periodically so a comment that ages
        // past 20 days while the page is left open still disappears,
        // not just on the next fresh page load.
        setInterval(renderComments, 60 * 60 * 1000); // hourly is plenty for a 20-day window
    });

})();
