import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://vggimxbnedaixxmpeaqs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_e-5Ayplh4Uh9BfhfygnQww_8o7QwBmK';
const PRODUCT_ID = 'oversized-hoodie';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const reviewsList = document.getElementById('reviewsList');
const reviewsCount = document.getElementById('reviewsCount');
const reviewsAverage = document.getElementById('reviewsAverage');

let approvedReviews = [];

function stars(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateSummary(allReviews) {
  if (!reviewsCount || !reviewsAverage) return;

  const starsEl = document.getElementById('productStars');
  const valueEl = document.getElementById('productRatingValue');
  const countEl = document.getElementById('productRatingCount');

  if (!allReviews.length) {
    reviewsCount.textContent = 'Based on 0 reviews';
    reviewsAverage.textContent = '— / 5';

    if (starsEl) starsEl.textContent = '☆☆☆☆☆';
    if (valueEl) valueEl.textContent = '— / 5';
    if (countEl) countEl.textContent = '(0 reviews)';

    return;
  }

  const avg = (
    allReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / allReviews.length
  ).toFixed(1);

  reviewsCount.textContent = `Based on ${allReviews.length} review${allReviews.length === 1 ? '' : 's'}`;
  reviewsAverage.textContent = `${avg}/5`;

  if (starsEl) starsEl.textContent = stars(Math.round(Number(avg)));
  if (valueEl) valueEl.textContent = `${avg}/5`;
  if (countEl) countEl.textContent = `(${allReviews.length} review${allReviews.length === 1 ? '' : 's'})`;
}

function renderAllReviews() {
  if (!reviewsList) return;

  const allReviews = [...approvedReviews];
  updateSummary(allReviews);

  if (!allReviews.length) {
    reviewsList.innerHTML = `
      <article class="bd-review-card">
        <div class="bd-review-card__stars">☆☆☆☆☆</div>
        <p class="bd-review-card__text">No reviews yet.</p>
        <div class="bd-review-card__footer">
          <strong>Bad Decisions</strong>
          <span>Store</span>
        </div>
      </article>
    `;
    return;
  }

  reviewsList.innerHTML = allReviews.map((item) => `
  <article class="bd-review">
    <div class="bd-review__header">
      <div class="bd-review__identity">
        <div class="bd-review__avatar">
          ${escapeHtml((item.name || 'A').charAt(0).toUpperCase())}
        </div>

        <div class="bd-review__meta">
          <div class="bd-review__name-row">
            <strong class="bd-review__name">${escapeHtml(item.name)}</strong>
            <span class="bd-review__verified">Verified buyer</span>
          </div>

          <div class="bd-review__stars">${stars(Number(item.rating || 0))}</div>
        </div>
      </div>
    </div>

    <p class="bd-review__text">${escapeHtml(item.review_text)}</p>

    ${item.image_url ? `
      <img
        class="bd-review__image"
        src="${item.image_url}"
        alt="Customer review photo"
      >
    ` : ''}
  </article>
`).join('');
}

async function loadReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('name, rating, review_text, image_url, created_at')
    .eq('product_id', PRODUCT_ID)
    .eq('approved', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Load reviews error:', error);
    return;
  }

  approvedReviews = data || [];
  renderAllReviews();
  updateProductRating(approvedReviews);
}

loadReviews();

function updateProductRating(reviews) {
  const starsEl = document.getElementById("productStars");
  const valueEl = document.getElementById("productRatingValue");
  const countEl = document.getElementById("productRatingCount");

  if (!reviews.length) {
    starsEl.textContent = "☆☆☆☆☆";
    valueEl.textContent = "0.0";
    countEl.textContent = "(0 reviews)";
    return;
  }

  const avg =
    reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
    reviews.length;

  const rounded = Math.round(avg);

  starsEl.textContent = "★★★★★".slice(0, rounded) + "☆☆☆☆☆".slice(rounded);
  valueEl.textContent = avg.toFixed(1);
  countEl.textContent = `(${reviews.length} review${reviews.length === 1 ? "" : "s"})`;
}