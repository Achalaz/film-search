/* ============================================================
   FilmFinder – app.js
   Full-featured movie search using TMDB + OMDb APIs
   ============================================================ */

const TMDB_API_KEY = '976a07aaef8052f08ba367eb0dad5256';
const OMDB_API_KEY = '4ef17996';

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
            
            if (themeIcon) {
                if (isLight) {
                    themeIcon.classList.remove('bi-moon-stars-fill');
                    themeIcon.classList.add('bi-sun-fill');
                } else {
                    themeIcon.classList.remove('bi-sun-fill');
                    themeIcon.classList.add('bi-moon-stars-fill');
                }
            }
            
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
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
        
        const isLightMode = document.body.classList.contains('light-mode');
        const opacityMult = isLightMode ? 0.6 : 1;
        
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


/* ─── Quick Search ──────────────────────────────────────────── */
window.quickSearch = function(title) {
    const input = document.getElementById('movie');
    const clearBtn = document.getElementById('clear-btn');
    if (input) input.value = title;
    if (clearBtn) clearBtn.style.display = 'flex';
    const dropdown = document.getElementById('autocomplete-dropdown');
    if (dropdown) dropdown.classList.remove('open');
    doSearch();
};


/* ─── Main Search Function ──────────────────────────────────── */
window.doSearch = async function() {
    const movieName = document.getElementById('movie').value.trim();
    const dropdown = document.getElementById('autocomplete-dropdown');
    if (dropdown) dropdown.classList.remove('open');

    if (!movieName) {
        shakeInput();
        return;
    }

    showLoading();

    try {
        // Step 1: Search TMDB
        const searchRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieName)}`);
        const searchData = await searchRes.json();

        if (!searchData.results || searchData.results.length === 0) {
            showError('Movie not found. Try a different title.');
            return;
        }

        const tmdbId = searchData.results[0].id;

        // Step 2: Get TMDB Details (with credits and videos)
        const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`);
        const tmdbData = await tmdbRes.json();

        let omdbData = null;

        // Step 3: Fetch OMDb for Ratings/BoxOffice if IMDb ID exists
        if (tmdbData.imdb_id) {
            try {
                const omdbRes = await fetch(`https://www.omdbapi.com/?i=${tmdbData.imdb_id}&plot=full&apikey=${OMDB_API_KEY}`);
                omdbData = await omdbRes.json();
            } catch (e) { console.warn("OMDb fetch failed", e); }
        }

        renderMovie(tmdbData, omdbData);

    } catch (err) {
        showError('⚠️ Network error. Please check your connection.');
        console.error(err);
    }
};


function shakeInput() {
    const box = document.getElementById('search-box');
    box.style.animation = 'none';
    box.offsetHeight;
    box.style.animation = 'shake 0.5s ease';
    setTimeout(() => box.style.animation = '', 500);
}


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
function renderMovie(tmdb, omdb) {
    hide('loading-state');
    hide('error-state');

    // Title
    setText('title', tmdb.title || 'Unknown Title');

    // Poster
    const posterEl = document.getElementById('poster');
    if (tmdb.poster_path) {
        const posterUrl = `https://image.tmdb.org/t/p/w500${tmdb.poster_path}`;
        posterEl.src = posterUrl;
        posterEl.alt = tmdb.title + ' poster';
        posterEl.onload = () => applyPosterGlow(posterUrl);
    } else if (omdb && omdb.Poster && omdb.Poster !== 'N/A') {
        posterEl.src = omdb.Poster;
        posterEl.onload = () => applyPosterGlow(omdb.Poster);
    } else {
        posterEl.src = 'https://via.placeholder.com/300x450/0f0f1a/666?text=No+Poster';
    }

    // Rating corner badge
    const rb = document.getElementById('rating-badge');
    if (tmdb.vote_average) {
        rb.textContent = '⭐ ' + tmdb.vote_average.toFixed(1);
        rb.style.display = 'block';
    } else {
        rb.style.display = 'none';
    }

    // Meta Chips
    setText('year-val',    tmdb.release_date ? tmdb.release_date.split('-')[0] : '—');
    setText('genre-val',   tmdb.genres ? tmdb.genres.map(g => g.name).join(', ') : '—');
    setText('runtime-val', tmdb.runtime ? `${tmdb.runtime} min` : '—');
    setText('lang-val',    (omdb && omdb.Language && omdb.Language !== 'N/A') ? omdb.Language.split(',')[0] : (tmdb.original_language ? tmdb.original_language.toUpperCase() : '—'));
    setText('country-val', (omdb && omdb.Country && omdb.Country !== 'N/A') ? omdb.Country.split(',')[0] : (tmdb.production_countries && tmdb.production_countries[0] ? tmdb.production_countries[0].iso_3166_1 : '—'));

    // Rated badge
    const ratedEl = document.getElementById('rated-badge');
    if (omdb && omdb.Rated && omdb.Rated !== 'N/A') {
        ratedEl.textContent = omdb.Rated;
        ratedEl.style.display = 'inline-block';
    } else {
        ratedEl.style.display = 'none';
    }

    // Director / Writer
    const director = tmdb.credits?.crew?.find(c => c.job === 'Director')?.name || (omdb ? omdb.Director : '—');
    setText('director', director);
    setText('writer-val', (omdb && omdb.Writer !== 'N/A') ? omdb.Writer : '—');

    // Plot
    setText('plot', tmdb.overview || (omdb ? omdb.Plot : 'No plot available.'));

    // ── Cast Carousel ──
    const castContainer = document.getElementById('cast-carousel');
    castContainer.innerHTML = '';
    if (tmdb.credits && tmdb.credits.cast && tmdb.credits.cast.length > 0) {
        const topCast = tmdb.credits.cast.slice(0, 15);
        topCast.forEach(actor => {
            const card = document.createElement('div');
            card.className = 'cast-card';
            
            const imgUrl = actor.profile_path 
                ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&background=random&color=fff`;

            card.innerHTML = `
                <div class="cast-img-wrapper">
                    <img src="${imgUrl}" alt="${actor.name}" class="cast-img" loading="lazy">
                </div>
                <div class="cast-info">
                    <div class="cast-name">${actor.name}</div>
                    <div class="cast-role">${actor.character || 'Actor'}</div>
                </div>
            `;
            
            // Open Actor Modal on click
            card.addEventListener('click', () => openActorModal(actor.id, actor.name, imgUrl));
            castContainer.appendChild(card);
        });
    } else {
        castContainer.innerHTML = '<span style="color:var(--muted); font-size:0.9rem;">No cast info available.</span>';
    }

    // ── Trailer Button ──
    const trailerBtn = document.getElementById('trailer-btn');
    if (trailerBtn) {
        const trailer = tmdb.videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer');
        if (trailer) {
            trailerBtn.classList.remove('d-none');
            trailerBtn.onclick = () => openTrailerModal(trailer.key);
        } else {
            trailerBtn.classList.add('d-none');
        }
    }

    // ── Box Office ──
    const bo = document.getElementById('boxoffice-val');
    if (omdb && omdb.BoxOffice && omdb.BoxOffice !== 'N/A') {
        bo.textContent = omdb.BoxOffice;
        bo.style.color = '';
    } else if (tmdb.revenue && tmdb.revenue > 0) {
        bo.textContent = '$' + tmdb.revenue.toLocaleString();
        bo.style.color = '';
    } else {
        bo.textContent = '—';
        bo.style.color = 'rgba(255,255,255,0.5)';
    }

    // ── Awards & Production ──
    setText('awards-val', (omdb && omdb.Awards && omdb.Awards !== 'N/A') ? omdb.Awards : '—');
    setText('released-val', tmdb.release_date || '—');
    setText('production-val', (tmdb.production_companies && tmdb.production_companies.length > 0) ? tmdb.production_companies[0].name : (omdb ? omdb.Production : '—'));

    // ── Ratings Bars ──
    animateScoreBars(omdb ? omdb.Ratings : [], tmdb.vote_average);

    // Show card
    show('movie-card');

    const card = document.getElementById('movie-card');
    card.style.animation = 'none';
    card.offsetHeight;
    card.style.animation = '';

    setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 200);
}


/* ─── Score Bars ─────────────────────────────────────────────── */
function animateScoreBars(omdbRatings, tmdbVoteAvg) {
    // TMDB / IMDb score bar (Using TMDB vote average for consistency)
    const imdbScore = parseFloat(tmdbVoteAvg);
    if (!isNaN(imdbScore) && imdbScore > 0) {
        document.getElementById('imdb-score-label').textContent = imdbScore.toFixed(1) + '/10';
        setTimeout(() => {
            document.getElementById('imdb-bar').style.width = (imdbScore / 10 * 100) + '%';
        }, 300);
    } else {
        document.getElementById('imdb-score-label').textContent = '—';
        document.getElementById('imdb-bar').style.width = '0%';
    }

    document.getElementById('rt-score-label').textContent = '—';
    document.getElementById('rt-bar').style.width = '0%';
    document.getElementById('meta-score-label').textContent = '—';
    document.getElementById('meta-bar').style.width = '0%';

    if (!omdbRatings) return;

    omdbRatings.forEach(r => {
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
        } catch (e) { /* CORS blocked */ }
    };
}


function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}


window.addEventListener('scroll', () => {
    const nav = document.querySelector('.navbar');
    if (nav) {
        nav.style.background = window.scrollY > 50
            ? 'rgba(8,8,16,0.95)'
            : 'rgba(8,8,16,0.7)';
    }
});


/* ─── Autocomplete ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    const input     = document.getElementById('movie');
    const dropdown  = document.getElementById('autocomplete-dropdown');
    const inner     = document.getElementById('autocomplete-inner');
    const clearBtn  = document.getElementById('clear-btn');

    if (!input) return;

    let debounceTimer = null;
    function debounce(fn, delay) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(fn, delay);
    }

    let activeIdx = -1;

    function syncClearBtn() {
        if (clearBtn) clearBtn.style.display = input.value ? 'flex' : 'none';
    }

    function highlight(text, query) {
        if (!query) return text;
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
    }

    function openDropdown() {
        dropdown.classList.add('open');
        dropdown.style.animation = 'none';
        dropdown.offsetHeight;
        dropdown.style.animation = '';
    }

    function closeDropdown() {
        dropdown.classList.remove('open');
        activeIdx = -1;
    }

    function renderLoading() {
        inner.innerHTML = `
            <div class="ac-loading">
                <div class="ac-spinner"></div>
                Searching films…
            </div>`;
        openDropdown();
    }

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

        const header = document.createElement('div');
        header.className = 'autocomplete-header';
        header.innerHTML = `<i class="bi bi-lightning-fill"></i> Top Results`;
        inner.appendChild(header);

        movies.forEach((movie, i) => {
            if (i > 0) {
                const div = document.createElement('div');
                div.className = 'ac-divider';
                inner.appendChild(div);
            }

            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.dataset.title = movie.title;

            const posterHTML = movie.poster_path
                ? `<img class="ac-poster" src="https://image.tmdb.org/t/p/w92${movie.poster_path}" alt="poster">`
                : `<div class="ac-poster-placeholder"><i class="bi bi-film"></i></div>`;

            const year = movie.release_date ? movie.release_date.split('-')[0] : '';

            item.innerHTML = `
                ${posterHTML}
                <div class="ac-text">
                    <div class="ac-title">${highlight(movie.title, query)}</div>
                    <div class="ac-meta">
                        ${year ? `<span class="ac-year"><i class="bi bi-calendar3"></i>${year}</span>` : ''}
                        <span class="ac-type">Film</span>
                    </div>
                </div>
                <i class="bi bi-arrow-right ac-arrow"></i>`;

            item.addEventListener('click', () => {
                input.value = movie.title;
                syncClearBtn();
                closeDropdown();
                doSearch();
            });

            inner.appendChild(item);
        });

        openDropdown();
        activeIdx = -1;
    }

    function fetchSuggestions(query) {
        if (!query || query.length < 2) {
            closeDropdown();
            return;
        }

        renderLoading();

        const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`;
        fetch(url)
            .then(r => r.json())
            .then(data => {
                if (data && data.results) {
                    renderResults(data.results.slice(0, 6), query);
                } else {
                    renderResults([], query);
                }
            })
            .catch(() => closeDropdown());
    }

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

    input.addEventListener('input', () => {
        syncClearBtn();
        const q = input.value.trim();
        if (!q) { closeDropdown(); return; }
        debounce(() => fetchSuggestions(q), 280);
    });

    document.addEventListener('click', e => {
        if (!dropdown.contains(e.target) && e.target !== input) {
            closeDropdown();
        }
    });

    input.addEventListener('focus', () => {
        if (input.value.trim().length >= 2 && inner.querySelector('.autocomplete-item')) {
            openDropdown();
        }
    });
});

window.clearSearch = function() {
    const input = document.getElementById('movie');
    const clearBtn = document.getElementById('clear-btn');
    const dropdown = document.getElementById('autocomplete-dropdown');
    if (input) { input.value = ''; input.focus(); }
    if (clearBtn) clearBtn.style.display = 'none';
    if (dropdown) dropdown.classList.remove('open');
};


/* ─── Modals Logic ───────────────────────────────────────────── */

// Trailer Modal
window.openTrailerModal = function(youtubeKey) {
    const modal = document.getElementById('trailer-modal');
    const iframe = document.getElementById('trailer-iframe');
    if (modal && iframe) {
        iframe.src = `https://www.youtube.com/embed/${youtubeKey}?autoplay=1`;
        modal.classList.remove('d-none');
        document.body.style.overflow = 'hidden'; // prevent background scrolling
    }
};

window.closeTrailerModal = function(e) {
    if (e) {
        // Only close if clicking overlay or close button
        if (!e.target.classList.contains('modal-overlay') && !e.target.closest('.modal-close')) return;
    }
    const modal = document.getElementById('trailer-modal');
    const iframe = document.getElementById('trailer-iframe');
    if (modal && iframe) {
        modal.classList.add('d-none');
        iframe.src = ''; // stop video
        document.body.style.overflow = '';
    }
};

// Actor Modal
window.openActorModal = async function(actorId, actorName, profileUrl) {
    const modal = document.getElementById('actor-modal');
    document.getElementById('modal-actor-name').textContent = actorName;
    document.getElementById('modal-actor-img').src = profileUrl;
    
    const grid = document.getElementById('actor-movies-grid');
    grid.innerHTML = '<div style="color:var(--muted); text-align:center; padding: 20px; grid-column:1/-1;">Loading movies...</div>';
    
    modal.classList.remove('d-none');
    document.body.style.overflow = 'hidden';

    try {
        const res = await fetch(`https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        
        if (data && data.cast && data.cast.length > 0) {
            // Sort by popularity and filter out items with no poster
            const sortedMovies = data.cast
                .filter(m => m.poster_path)
                .sort((a, b) => b.vote_count - a.vote_count)
                .slice(0, 20); // Show top 20
            
            if (sortedMovies.length === 0) {
                grid.innerHTML = '<div style="color:var(--muted); grid-column:1/-1;">No recent movies found.</div>';
                return;
            }

            grid.innerHTML = '';
            sortedMovies.forEach(m => {
                const card = document.createElement('div');
                card.className = 'actor-movie-card';
                card.innerHTML = `
                    <img src="https://image.tmdb.org/t/p/w185${m.poster_path}" alt="${m.title}" class="actor-movie-poster" loading="lazy">
                    <div class="actor-movie-title">${m.title}</div>
                `;
                // Clicking a movie in the modal searches it
                card.addEventListener('click', () => {
                    closeActorModal();
                    document.getElementById('movie').value = m.title;
                    doSearch();
                });
                grid.appendChild(card);
            });
        } else {
            grid.innerHTML = '<div style="color:var(--muted); grid-column:1/-1;">No movie credits found.</div>';
        }
    } catch (err) {
        grid.innerHTML = '<div style="color:var(--accent); grid-column:1/-1;">Error loading movies.</div>';
    }
};

window.closeActorModal = function(e) {
    if (e) {
        if (!e.target.classList.contains('modal-overlay') && !e.target.closest('.modal-close')) return;
    }
    const modal = document.getElementById('actor-modal');
    if (modal) {
        modal.classList.add('d-none');
        document.body.style.overflow = '';
    }
};
