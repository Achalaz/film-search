/* ============================================================
   FilmFinder – app.js
   Full-featured movie search: all info, animations, particles
   ============================================================ */

/* ─── Particle System ───────────────────────────────────────── */
(function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let W, H;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function createParticle() {
        return {
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.5 + 0.3,
            dx: (Math.random() - 0.5) * 0.4,
            dy: -Math.random() * 0.6 - 0.2,
            alpha: Math.random() * 0.5 + 0.1,
            color: Math.random() > 0.7
                ? `rgba(245,197,24,` // gold
                : Math.random() > 0.5
                    ? `rgba(229,9,20,`  // red
                    : `rgba(255,255,255,` // white
        };
    }

    function init() {
        resize();
        particles = Array.from({ length: 120 }, createParticle);
    }

    function animate() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach((p, i) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color + p.alpha + ')';
            ctx.fill();
            p.x += p.dx;
            p.y += p.dy;
            p.alpha -= 0.0003;
            if (p.y < -10 || p.alpha < 0.02) {
                particles[i] = createParticle();
                particles[i].y = H + 5;
            }
        });
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    init();
    animate();
})();


/* ─── Typewriter Effect ─────────────────────────────────────── */
(function initTypewriter() {
    const el = document.getElementById('typewriter-text');
    if (!el) return;
    const words = ['Favourite Film', 'Next Masterpiece', 'Hidden Gem', 'Classic Story', 'Epic Adventure'];
    let wi = 0, ci = 0, deleting = false;

    function tick() {
        const word = words[wi];
        if (!deleting) {
            el.textContent = word.slice(0, ++ci);
            if (ci === word.length) {
                deleting = true;
                setTimeout(tick, 2200);
                return;
            }
        } else {
            el.textContent = word.slice(0, --ci);
            if (ci === 0) {
                deleting = false;
                wi = (wi + 1) % words.length;
            }
        }
        setTimeout(tick, deleting ? 60 : 90);
    }
    setTimeout(tick, 1200);
})();


/* ─── Scroll Hint ───────────────────────────────────────────── */
document.getElementById('scroll-hint')?.addEventListener('click', () => {
    document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });
});

window.addEventListener('scroll', () => {
    const hint = document.getElementById('scroll-hint');
    if (hint) hint.style.opacity = window.scrollY > 80 ? '0' : '1';
});


/* ─── Quick Search from Suggestion Pills ────────────────────── */
window.quickSearch = function(title) {
    document.getElementById('movie').value = title;
    doSearch();
};


/* ─── Main Search Function ──────────────────────────────────── */
window.doSearch = function() {
    const movieName = document.getElementById('movie').value.trim();
    if (!movieName) {
        shakeInput();
        return;
    }

    showLoading();

    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&plot=full&apikey=4ef17996`;
    const http = new XMLHttpRequest();
    http.open('GET', url);
    http.responseType = 'json';
    http.send();

    http.onload = function() {
        const data = http.response;
        if (!data || data.Response === 'False') {
            showError(data?.Error || 'Movie not found. Try a different title.');
            return;
        }
        renderMovie(data);
    };

    http.onerror = function() {
        showError('⚠️ Network error. Please check your connection.');
    };
};


/* ─── Shake Input on Empty Search ───────────────────────────── */
function shakeInput() {
    const box = document.getElementById('search-box');
    box.style.animation = 'none';
    box.offsetHeight; // reflow
    box.style.animation = 'shake 0.5s ease';
    setTimeout(() => box.style.animation = '', 500);

    // Add shake keyframes dynamically
    if (!document.getElementById('shake-style')) {
        const s = document.createElement('style');
        s.id = 'shake-style';
        s.textContent = `@keyframes shake {
            0%,100%{transform:translateX(0)}
            20%{transform:translateX(-8px)}
            40%{transform:translateX(8px)}
            60%{transform:translateX(-6px)}
            80%{transform:translateX(6px)}
        }`;
        document.head.appendChild(s);
    }
}


/* ─── Show / Hide States ─────────────────────────────────────── */
function showLoading() {
    hide('movie-card');
    hide('error-state');
    show('loading-state');
    document.getElementById('result-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showError(msg) {
    hide('loading-state');
    hide('movie-card');
    document.getElementById('error-msg').textContent = msg;
    show('error-state');
}

function show(id) { document.getElementById(id)?.classList.remove('d-none'); }
function hide(id) { document.getElementById(id)?.classList.add('d-none'); }


/* ─── Render Movie Data ─────────────────────────────────────── */
function renderMovie(data) {
    hide('loading-state');
    hide('error-state');

    // ── Title ──
    setText('title', data.Title || 'Unknown Title');

    // ── Poster ──
    const posterEl = document.getElementById('poster');
    if (data.Poster && data.Poster !== 'N/A') {
        posterEl.src = data.Poster;
        posterEl.alt = data.Title + ' poster';
        // Dynamic background glow from poster
        posterEl.onload = () => applyPosterGlow(data.Poster);
    } else {
        posterEl.src = 'https://via.placeholder.com/300x450/0f0f1a/666?text=No+Poster';
    }

    // ── Rating corner badge ──
    const rb = document.getElementById('rating-badge');
    if (data.imdbRating && data.imdbRating !== 'N/A') {
        rb.textContent = '⭐ ' + data.imdbRating;
        rb.style.display = 'block';
    } else {
        rb.style.display = 'none';
    }

    // ── Meta Chips ──
    setText('year-val',    data.Year    || '—');
    setText('genre-val',   data.Genre   || '—');
    setText('runtime-val', data.Runtime || '—');
    setText('lang-val',    data.Language || '—');
    setText('country-val', data.Country || '—');

    // ── Rated badge ──
    const ratedEl = document.getElementById('rated-badge');
    if (data.Rated && data.Rated !== 'N/A') {
        ratedEl.textContent = data.Rated;
        ratedEl.style.display = 'inline-block';
    } else {
        ratedEl.style.display = 'none';
    }

    // ── Director / Writer ──
    setText('director',    data.Director || '—');
    setText('writer-val',  data.Writer   || '—');

    // ── Plot ──
    setText('plot', data.Plot || 'No plot available.');

    // ── Actors (pill badges) ──
    const actorsEl = document.getElementById('actors-val');
    actorsEl.innerHTML = '';
    if (data.Actors && data.Actors !== 'N/A') {
        data.Actors.split(',').forEach(actor => {
            const pill = document.createElement('span');
            pill.className = 'actor-pill';
            pill.textContent = actor.trim();
            actorsEl.appendChild(pill);
        });
    } else {
        actorsEl.textContent = '—';
    }

    // ── Box Office ──
    const bo = document.getElementById('boxoffice-val');
    if (data.BoxOffice && data.BoxOffice !== 'N/A') {
        bo.textContent = data.BoxOffice;
    } else {
        bo.textContent = '—';
        bo.style.color = 'rgba(255,255,255,0.5)';
    }

    // ── Awards ──
    setText('awards-val',     data.Awards      || '—');
    setText('released-val',   data.Released    || '—');
    setText('production-val', data.Production  || data.Country || '—');

    // ── Ratings Bars ──
    animateScoreBars(data.Ratings || [], data.imdbRating);

    // ── Show card ──
    show('movie-card');

    // Re-trigger animation
    const card = document.getElementById('movie-card');
    card.style.animation = 'none';
    card.offsetHeight;
    card.style.animation = '';

    setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 200);
}


/* ─── Animate Score Bars ─────────────────────────────────────── */
function animateScoreBars(ratings, imdbRating) {
    // IMDb
    const imdbScore = parseFloat(imdbRating);
    if (!isNaN(imdbScore)) {
        document.getElementById('imdb-score-label').textContent = imdbRating + '/10';
        setTimeout(() => {
            document.getElementById('imdb-bar').style.width = (imdbScore / 10 * 100) + '%';
        }, 300);
    } else {
        document.getElementById('imdb-score-label').textContent = '—';
        document.getElementById('imdb-bar').style.width = '0%';
    }

    // Reset
    document.getElementById('rt-score-label').textContent = '—';
    document.getElementById('rt-bar').style.width = '0%';
    document.getElementById('meta-score-label').textContent = '—';
    document.getElementById('meta-bar').style.width = '0%';

    if (!ratings) return;

    ratings.forEach(r => {
        if (r.Source === 'Rotten Tomatoes') {
            const pct = parseInt(r.Value);
            document.getElementById('rt-score-label').textContent = r.Value;
            setTimeout(() => {
                document.getElementById('rt-bar').style.width = pct + '%';
            }, 500);
        }
        if (r.Source === 'Metacritic') {
            const pct = parseInt(r.Value.split('/')[0]);
            document.getElementById('meta-score-label').textContent = r.Value;
            setTimeout(() => {
                document.getElementById('meta-bar').style.width = pct + '%';
            }, 700);
        }
    });
}


/* ─── Dynamic Poster Glow ───────────────────────────────────── */
function applyPosterGlow(src) {
    // Extract dominant color using canvas sampling
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
        try {
            const c = document.createElement('canvas');
            c.width = 8; c.height = 8;
            const ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0, 8, 8);
            const d = ctx.getImageData(0, 0, 8, 8).data;
            let r = 0, g = 0, b = 0;
            for (let i = 0; i < d.length; i += 4) {
                r += d[i]; g += d[i+1]; b += d[i+2];
            }
            const pixels = d.length / 4;
            r = Math.round(r / pixels);
            g = Math.round(g / pixels);
            b = Math.round(b / pixels);
            const card = document.getElementById('movie-card');
            if (card) {
                card.style.boxShadow = `0 0 0 1px rgba(${r},${g},${b},0.15), 0 30px 100px rgba(0,0,0,0.8), 0 0 60px rgba(${r},${g},${b},0.12)`;
            }
        } catch (e) { /* CORS blocked, skip */ }
    };
}


/* ─── Utility ────────────────────────────────────────────────── */
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}


/* ─── Navbar scroll effect ──────────────────────────────────── */
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.navbar');
    if (nav) {
        nav.style.background = window.scrollY > 50
            ? 'rgba(8,8,16,0.95)'
            : 'rgba(8,8,16,0.7)';
    }
});


/* ─── Enter key on search input ─────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('movie');
    if (input) {
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') doSearch();
        });
    }
});
