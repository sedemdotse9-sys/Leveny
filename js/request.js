// ========== MOVIE REQUEST FORM (Desktop) ==========
document.addEventListener('DOMContentLoaded', function () {
    initMovieRequestForm();
});

function initMovieRequestForm() {
    const form = document.getElementById('movieRequestForm');
    if (!form) return;

    const submitBtn = form.querySelector('.submit-btn');
    const movieTitleInput = document.getElementById('movieTitle');

    // Dynamic placeholder rotation
    const placeholders = [
        "e.g., Interstellar, Avengers: Endgame",
        "e.g., The Shawshank Redemption",
        "e.g., Spirited Away, Inception",
        "e.g., The Dark Knight, Parasite"
    ];
    let placeholderIndex = 0;

    setInterval(() => {
        if (document.activeElement !== movieTitleInput) {
            movieTitleInput.placeholder = placeholders[placeholderIndex];
            placeholderIndex = (placeholderIndex + 1) % placeholders.length;
        }
    }, 3000);

    // Form submission
    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const movieTitle = movieTitleInput.value.trim();
        const releaseYear = document.getElementById('releaseYear').value;
        const movieGenre = document.getElementById('movieGenre').value;

        if (!movieTitle) {
            showMessage('⚠️ Please enter a movie title.', 'error');
            movieTitleInput.focus();
            return;
        }

        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        try {
            const formDataToSend = new FormData(form);
            const response = await fetch(form.action, {
                method: 'POST',
                body: formDataToSend,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                showMessage(`🎬 Success! "${movieTitle}" request has been sent.`, 'success');
                form.reset();
            } else {
                showMessage('⚠️ Something went wrong. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showMessage('⚠️ No connection. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    const resetBtn = form.querySelector('.reset-btn');
    resetBtn.addEventListener('click', function () {
        showMessage('Form cleared. Ready for a new request.', 'info');
    });
}

function showMessage(text, type) {
    const existingMsg = document.querySelector('.form-message');
    if (existingMsg) existingMsg.remove();

    const icon = type === 'success'
        ? 'check-circle'
        : type === 'error'
            ? 'exclamation-circle'
            : 'info-circle';

    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${text}</span>
        <button class="close-msg" type="button" aria-label="Dismiss">&times;</button>
    `;

    const targetForm = document.getElementById('movieRequestForm');
    if (!targetForm) return;

    targetForm.parentNode.insertBefore(messageDiv, targetForm);

    messageDiv.querySelector('.close-msg').addEventListener('click', function () {
        messageDiv.remove();
    });

    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 8000);
}
