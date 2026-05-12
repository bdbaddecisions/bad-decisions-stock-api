import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://vggimxbnedaixxmpeaqs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_e-5Ayplh4Uh9BfhfygnQww_8o7QwBmK';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const intro = document.getElementById('reviewIntro');
const form = document.getElementById('verifiedReviewForm');
const msg = document.getElementById('reviewMessage');
const submitBtn = document.getElementById('submitReviewBtn');

const params = new URLSearchParams(window.location.search);
const token = params.get('token');

let inviteData = null;

function setMessage(text, type = '') {
  msg.textContent = text;
  msg.className = `msg${type ? ` ${type}` : ''}`;
}

async function validateToken() {
  if (!token) {
    intro.textContent = 'Invalid review link.';
    setMessage('Missing token.', 'error');
    return;
  }

  intro.textContent = 'Checking your review link...';

  try {
    const { data, error } = await supabase.functions.invoke('validate-review-token', {
      body: { token }
    });

    if (error) {
      console.error('Validate token error:', error);
      intro.textContent = 'This review link could not be verified.';
      setMessage('Please try again later.', 'error');
      return;
    }

    if (!data?.valid) {
      intro.textContent = data?.message || 'This review link is invalid.';
      setMessage(data?.message || 'Token not valid.', 'error');
      return;
    }

    inviteData = data;
    intro.textContent = 'Your purchase was verified. You can leave your review below.';
    form.classList.remove('hidden');
    setMessage('');
  } catch (err) {
    console.error('Unexpected validate token error:', err);
    intro.textContent = 'This review link could not be verified.';
    setMessage('Please try again later.', 'error');
  }
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!inviteData || !token) {
    setMessage('Invalid review session.', 'error');
    return;
  }

  const name = document.getElementById('reviewName')?.value.trim();
  const rating = Number(document.getElementById('reviewRating')?.value);
  const reviewText = document.getElementById('reviewText')?.value.trim();
  const imageFile = document.getElementById('reviewImage')?.files?.[0];

  if (!name || !rating || !reviewText) {
    setMessage('Please fill in all fields.', 'error');
    return;
  }

  if (reviewText.length < 10) {
    setMessage('Review must be at least 10 characters long.', 'error');
    return;
  }

  submitBtn.disabled = true;
  setMessage('Submitting review...');

  let imageBase64 = null;
  let imageMimeType = null;
  let imageFileName = null;

  try {
    if (imageFile) {
      if (imageFile.size > 5 * 1024 * 1024) {
        setMessage('Image must be smaller than 5MB.', 'error');
        submitBtn.disabled = false;
        return;
      }

      imageMimeType = imageFile.type;
      imageFileName = imageFile.name;

      imageBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          const result = reader.result;
          if (typeof result !== 'string') {
            reject(new Error('Invalid file read result'));
            return;
          }

          const base64 = result.split(',')[1];
          resolve(base64);
        };

        reader.onerror = () => reject(reader.error || new Error('File read failed'));
        reader.readAsDataURL(imageFile);
      });
    }

    const { data, error } = await supabase.functions.invoke('submit-verified-review', {
      body: {
        token,
        name,
        rating,
        review_text: reviewText,
        imageBase64,
        imageMimeType,
        imageFileName
      }
    });

    if (error) {
      console.error('Submit review error:', error);
      setMessage('Something went wrong while submitting your review.', 'error');
      submitBtn.disabled = false;
      return;
    }

    if (!data?.success) {
      setMessage(data?.message || 'Review submission failed.', 'error');
      submitBtn.disabled = false;
      return;
    }

    form.reset();
    form.classList.add('hidden');
    intro.textContent = 'Thank you for your review.';
    setMessage(data?.message || 'Your review was submitted successfully.', 'success');
  } catch (err) {
    console.error('Unexpected submit error:', err);
    setMessage('Something went wrong while submitting your review.', 'error');
    submitBtn.disabled = false;
  }
});

validateToken();