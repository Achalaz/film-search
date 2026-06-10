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

    /* ─── Theme Toggle Logic ─── */
    const themeBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    // Check local storage for theme preference
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'light') {
        document.body.classList.add('light-mode');
        if (themeIcon) {
            themeIcon.classList.remove('bi-moon-stars-fill');
            themeIcon.classList.add('bi-sun-fill');
        }
    }
    
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            
            // Update icon
            if (themeIcon) {
                if (isLight) {
                    themeIcon.classList.remove('bi-moon-stars-fill');
                    themeIcon.classList.add('bi-sun-fill');
                } else {
                    themeIcon.classList.remove('bi-sun-fill');
                    themeIcon.classList.add('bi-moon-stars-fill');
                }
            }
            
            // Save preference
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            
            // Update particle colors based on theme if needed, or re-init
            // For now, we'll keep the particles the same, but maybe make them slightly darker in light mode
        });
    }

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
        
        // Check if light mode is active for particle opacity
        const isLightMode = document.body.classList.contains('light-mode');
        const opacityMult = isLightMode ? 0.6 : 1; // Slightly dimmer particles in light mode
        
        particles.forEach((p, i) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color + (p.alpha * opacityMult) + ')';
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
    const input = document.getElementById('movie');
    const clearBtn = document.getElementById('clear-btn');
    if (input) input.value = title;
    if (clearBtn) clearBtn.style.display = 'flex';
    // Close dropdown if open
    const dropdown = document.getElementById('autocomplete-dropdown');
    if (dropdown) dropdown.classList.remove('open');
    doSearch();
};


/* ─── Main Search Function ──────────────────────────────────── */
window.doSearch = function() {
    const movieName = document.getElementById('movie').value.trim();
    // Close autocomplete dropdown
    const dropdown = document.getElementById('autocomplete-dropdown');
    if (dropdown) dropdown.classList.remove('open');

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
    const input     = document.getElementById('movie');
    const dropdown  = document.getElementById('autocomplete-dropdown');
    const inner     = document.getElementById('autocomplete-inner');
    const clearBtn  = document.getElementById('clear-btn');

    if (!input) return;

    /* ── Debounce helper ── */
    let debounceTimer = null;
    function debounce(fn, delay) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(fn, delay);
    }

    /* ── Keyboard navigation state ── */
    let activeIdx = -1;

    /* ── Show / hide clear button ── */
    function syncClearBtn() {
        if (clearBtn) clearBtn.style.display = input.value ? 'flex' : 'none';
    }

    /* ── Highlight matched query in title ── */
    function highlight(text, query) {
        if (!query) return text;
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
    }

    /* ── Open dropdown ── */
    function openDropdown() {
        dropdown.classList.add('open');
        // Restart animation
        dropdown.style.animation = 'none';
        dropdown.offsetHeight;
        dropdown.style.animation = '';
    }

    /* ── Close dropdown ── */
    function closeDropdown() {
        dropdown.classList.remove('open');
        activeIdx = -1;
    }

    /* ── Render loading state ── */
    function renderLoading() {
        inner.innerHTML = `
            <div class="ac-loading">
                <div class="ac-spinner"></div>
                Searching films…
            </div>`;
        openDropdown();
    }

    /* ── Render results ── */
    function renderResults(movies, query) {
        inner.innerHTML = '';

        if (!movies || movies.length === 0) {
            inner.innerHTML = `
                <div class="ac-empty">
                    <i class="bi bi-film"></i>
                    No films found for "<strong>${query}</strong>"
                </div>`;
            openDropdown();
            return;
        }

        // Header
        const header = document.createElement('div');
        header.className = 'autocomplete-header';
        header.innerHTML = `<i class="bi bi-lightning-fill"></i> ${movies.length} result${movies.length !== 1 ? 's' : ''} found`;
        inner.appendChild(header);

        movies.forEach((movie, i) => {
            if (i > 0) {
                const div = document.createElement('div');
                div.className = 'ac-divider';
                inner.appendChild(div);
            }

            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.setAttribute('role', 'option');
            item.dataset.title = movie.Title;

            // Poster
            const posterHTML = movie.Poster && movie.Poster !== 'N/A'
                ? `<img class="ac-poster" src="${movie.Poster}" alt="${movie.Title} poster" loading="lazy">`
                : `<div class="ac-poster-placeholder"><i class="bi bi-film"></i></div>`;

            // Type label
            const typeLabel = movie.Type ? movie.Type.replace('movie', 'Film').replace('series', 'Series') : '';

            item.innerHTML = `
                ${posterHTML}
                <div class="ac-text">
                    <div class="ac-title">${highlight(movie.Title, query)}</div>
                    <div class="ac-meta">
                        ${movie.Year ? `<span class="ac-year"><i class="bi bi-calendar3"></i>${movie.Year}</span>` : ''}
                        ${typeLabel ? `<span class="ac-type">${typeLabel}</span>` : ''}
                    </div>
                </div>
                <i class="bi bi-arrow-right ac-arrow"></i>`;

            // Click to search
            item.addEventListener('click', () => {
                input.value = movie.Title;
                syncClearBtn();
                closeDropdown();
                doSearch();
            });

            inner.appendChild(item);
        });

        openDropdown();
        activeIdx = -1;
    }

    /* ── Fetch autocomplete suggestions ── */
    function fetchSuggestions(query) {
        if (!query || query.length < 2) {
            closeDropdown();
            return;
        }

        renderLoading();

        const url = `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&type=movie&apikey=4ef17996`;
        fetch(url)
            .then(r => r.json())
            .then(data => {
                if (data && data.Response === 'True' && data.Search) {
                    renderResults(data.Search.slice(0, 8), query);
                } else {
                    renderResults([], query);
                }
            })
            .catch(() => closeDropdown());
    }

    /* ── Keyboard navigation ── */
    input.addEventListener('keydown', e => {
        const items = inner.querySelectorAll('.autocomplete-item');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIdx = Math.min(activeIdx + 1, items.length - 1);
            items.forEach((el, i) => el.classList.toggle('active', i === activeIdx));
            if (items[activeIdx]) items[activeIdx].scrollIntoView({ block: 'nearest' });

        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIdx = Math.max(activeIdx - 1, -1);
            items.forEach((el, i) => el.classList.toggle('active', i === activeIdx));
            if (activeIdx === -1) input.focus();

        } else if (e.key === 'Enter') {
            if (activeIdx >= 0 && items[activeIdx]) {
                const title = items[activeIdx].dataset.title;
                input.value = title;
                syncClearBtn();
                closeDropdown();
                doSearch();
            } else {
                closeDropdown();
                doSearch();
            }

        } else if (e.key === 'Escape') {
            closeDropdown();
        }
    });

    /* ── Input event → debounced fetch ── */
    input.addEventListener('input', () => {
        syncClearBtn();
        const q = input.value.trim();
        if (!q) { closeDropdown(); return; }
        debounce(() => fetchSuggestions(q), 280);
    });

    /* ── Close on outside click ── */
    document.addEventListener('click', e => {
        if (!dropdown.contains(e.target) && e.target !== input) {
            closeDropdown();
        }
    });

    /* ── Reopen on focus if has value ── */
    input.addEventListener('focus', () => {
        if (input.value.trim().length >= 2) {
            if (inner.querySelector('.autocomplete-item')) {
                openDropdown();
            }
        }
    });
});


/* ─── Clear search input ─────────────────────────────────────── */
window.clearSearch = function() {
    const input = document.getElementById('movie');
    const clearBtn = document.getElementById('clear-btn');
    const dropdown = document.getElementById('autocomplete-dropdown');
    if (input) { input.value = ''; input.focus(); }
    if (clearBtn) clearBtn.style.display = 'none';
    if (dropdown) dropdown.classList.remove('open');
};
