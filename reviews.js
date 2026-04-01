import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://vggimxbnedaixxmpeaqs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_e-5Ayplh4Uh9BfhfygnQww_8o7QwBmK';
const PRODUCT_ID = '8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const reviewsList = document.getElementById('reviewsList');
const reviewsCount = document.getElementById('reviewsCount');
const reviewsAverage = document.getElementById('reviewsAverage');
const reviewForm = document.getElementById('reviewForm');
const reviewMessage = document.getElementById('reviewMessage');

let approvedReviews = [];
let pendingReviews = [];

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

  const allReviews = [...pendingReviews, ...approvedReviews];
  updateSummary(allReviews);

  if (!allReviews.length) {
    reviewsList.innerHTML = `
      <article class="bd-review-card">
        <div class="bd-review-card__stars">☆☆☆☆☆</div>
        <p class="bd-review-card__text">No reviews yet. Be the first to leave one.</p>
        <div class="bd-review-card__footer">
          <strong>Bad Decisions</strong>
          <span>Store</span>
        </div>
      </article>
    `;
    return;
  }

  reviewsList.innerHTML = allReviews.map((item) => `
    <article class="bd-review-card ${item.pending ? 'bd-review-card--pending' : ''}">
      <div class="bd-review-card__stars">${stars(Number(item.rating || 0))}</div>
      <p class="bd-review-card__text">${escapeHtml(item.review_text)}</p>

      ${item.image_url ? `
        <img
          class="bd-review-card__image"
          src="${item.image_url}"
          alt="Customer review photo"
        >
      ` : ''}

      <div class="bd-review-card__footer">
        <strong>${escapeHtml(item.name)}</strong>
        <span>${item.pending ? 'Submitted • awaiting approval' : 'Verified buyer'}</span>
      </div>
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
}

reviewForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('reviewName')?.value.trim();
  const email = document.getElementById('reviewEmail')?.value.trim();
  const rating = Number(document.getElementById('reviewRating')?.value);
  const reviewText = document.getElementById('reviewText')?.value.trim();
  const imageFile = document.getElementById('reviewImage')?.files?.[0];

  if (!name || !email || !rating || !reviewText) {
    reviewMessage.textContent = 'Please fill in all fields.';
    return;
  }

  reviewMessage.textContent = 'Submitting review...';

  let imageUrl = null;

  if (imageFile) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `reviews/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('review-images')
      .upload(filePath, imageFile);

    if (uploadError) {
      console.error('Image upload error:', uploadError);
      reviewMessage.textContent = 'Image upload failed. Please try again.';
      return;
    }

    const { data } = supabase.storage
      .from('review-images')
      .getPublicUrl(filePath);

    imageUrl = data.publicUrl;
  }

  const newReview = {
    product_id: PRODUCT_ID,
    name,
    email,
    rating,
    review_text: reviewText,
    image_url: imageUrl,
    approved: false
  };

  const { error } = await supabase
    .from('reviews')
    .insert([newReview]);

  if (error) {
    console.error('Submit review error:', error);
    reviewMessage.textContent = 'Something went wrong. Please try again.';
    return;
  }

  pendingReviews.unshift({
    ...newReview,
    pending: true
  });

  renderAllReviews();

  reviewForm.reset();
  reviewMessage.textContent = 'Thanks! Your review was submitted.';
});

loadReviews();