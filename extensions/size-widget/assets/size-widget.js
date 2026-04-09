/* SizeSignal Widget - Vanilla JS size recommendation widget. No framework dependencies. */
(function () {
  'use strict';

  // 1. Locate widget container and read configuration
  var container = document.getElementById('sizesignal-widget');
  if (!container) return;

  var config = {
    productId: container.getAttribute('data-product-id') || '',
    shop: container.getAttribute('data-shop') || '',
    appUrl: (container.getAttribute('data-app-url') || '').replace(/\/+$/, ''),
    headingText: container.getAttribute('data-heading-text') || 'Find Your Perfect Size',
    buttonText: container.getAttribute('data-button-text') || 'Get My Size',
    primaryColor: container.getAttribute('data-primary-color') || '#000000',
    showConfidence: container.getAttribute('data-show-confidence') !== 'false',
    showFitPrediction: container.getAttribute('data-show-fit-prediction') !== 'false',
    showModelNotes: container.getAttribute('data-show-model-notes') !== 'false',
    widgetStyle: container.getAttribute('data-widget-style') || 'inline'
  };

  var STORAGE_KEY = 'sizesignal_profile_' + config.shop;

  // 2. Utility helpers

  /* Create an element with optional class, attributes, and text. */
  function el(tag, className, attrs, textContent) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        node.setAttribute(k, attrs[k]);
      });
    }
    if (textContent !== undefined) node.textContent = textContent;
    return node;
  }

  /* Apply merchant primary color as CSS custom properties. */
  function applyColors() {
    container.style.setProperty('--ss-primary', config.primaryColor);
    container.style.setProperty('--ss-primary-hover', config.primaryColor + 'cc');
  }

  /* Read stored profile from localStorage. */
  function getStoredProfile() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /* Save profile to localStorage. */
  function storeProfile(profile) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) { /* storage blocked */ }
  }

  /* Fire a lightweight analytics beacon. */
  function trackEvent(eventName, payload) {
    if (!config.appUrl) return;
    var url = config.appUrl + '/api/analytics';
    var body = JSON.stringify(
      Object.assign(
        {
          event: eventName,
          shop: config.shop,
          productId: config.productId,
          timestamp: new Date().toISOString()
        },
        payload || {}
      )
    );
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true
      }).catch(function () {});
    }
  }

  // 3. Build the widget UI
  var widgetBody = el('div', 'sizesignal-body');

  var ctaBtn = el('button', 'sizesignal-btn', { type: 'button' }, config.buttonText);
  ctaBtn.style.backgroundColor = config.primaryColor;

  var quizForm = el('form', 'sizesignal-quiz sizesignal-hidden');

  var heightLabel = el('label', 'sizesignal-label', { for: 'ss-height' }, 'Height (inches)');
  var heightInput = el('input', 'sizesignal-input', {
    type: 'number',
    id: 'ss-height',
    name: 'height',
    min: '48',
    max: '96',
    step: '1',
    placeholder: 'e.g. 68',
    required: 'required'
  });

  var weightLabel = el('label', 'sizesignal-label', { for: 'ss-weight' }, 'Weight (lbs)');
  var weightInput = el('input', 'sizesignal-input', {
    type: 'number',
    id: 'ss-weight',
    name: 'weight',
    min: '60',
    max: '500',
    step: '1',
    placeholder: 'e.g. 165',
    required: 'required'
  });

  var fitFieldset = el('fieldset', 'sizesignal-fieldset');
  var fitLegend = el('legend', 'sizesignal-legend', null, 'Fit Preference');
  fitFieldset.appendChild(fitLegend);

  var fitOptions = ['slim', 'regular', 'relaxed'];
  fitOptions.forEach(function (opt) {
    var wrapper = el('label', 'sizesignal-radio-label');
    var radio = el('input', 'sizesignal-radio', {
      type: 'radio',
      name: 'preferredFit',
      value: opt
    });
    if (opt === 'regular') radio.setAttribute('checked', 'checked');
    var span = el('span', null, null, opt.charAt(0).toUpperCase() + opt.slice(1));
    wrapper.appendChild(radio);
    wrapper.appendChild(span);
    fitFieldset.appendChild(wrapper);
  });

  var submitBtn = el('button', 'sizesignal-btn sizesignal-submit', { type: 'submit' }, config.buttonText);
  submitBtn.style.backgroundColor = config.primaryColor;

  quizForm.appendChild(heightLabel);
  quizForm.appendChild(heightInput);
  quizForm.appendChild(weightLabel);
  quizForm.appendChild(weightInput);
  quizForm.appendChild(fitFieldset);
  quizForm.appendChild(submitBtn);

  var resultArea = el('div', 'sizesignal-result sizesignal-hidden');

  var loader = el('div', 'sizesignal-loading sizesignal-hidden');
  var spinner = el('div', 'sizesignal-spinner');
  loader.appendChild(spinner);
  loader.appendChild(el('span', null, null, 'Finding your size...'));

  var errorArea = el('div', 'sizesignal-error sizesignal-hidden');
  var errorMsg = el('p', 'sizesignal-error-msg', null, 'Something went wrong.');
  var retryBtn = el('button', 'sizesignal-btn sizesignal-retry-btn', { type: 'button' }, 'Try Again');
  retryBtn.style.backgroundColor = config.primaryColor;
  errorArea.appendChild(errorMsg);
  errorArea.appendChild(retryBtn);

  widgetBody.appendChild(ctaBtn);
  widgetBody.appendChild(quizForm);
  widgetBody.appendChild(loader);
  widgetBody.appendChild(resultArea);
  widgetBody.appendChild(errorArea);

  // 4. Display mode wrappers (inline / modal / drawer)
  var overlay = null;
  var drawerEl = null;

  function openWidget() {
    if (config.widgetStyle === 'modal') {
      overlay = el('div', 'sizesignal-modal-overlay');
      var modalContent = el('div', 'sizesignal-modal-content');
      var closeBtn = el('button', 'sizesignal-close-btn', { type: 'button', 'aria-label': 'Close' }, '\u00d7');
      closeBtn.addEventListener('click', closeWidget);
      modalContent.appendChild(closeBtn);
      modalContent.appendChild(widgetBody);
      overlay.appendChild(modalContent);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeWidget();
      });
      document.body.appendChild(overlay);
      requestAnimationFrame(function () {
        overlay.classList.add('sizesignal-modal-visible');
      });
    } else if (config.widgetStyle === 'drawer') {
      overlay = el('div', 'sizesignal-modal-overlay');
      drawerEl = el('div', 'sizesignal-drawer');
      var closeBtn2 = el('button', 'sizesignal-close-btn', { type: 'button', 'aria-label': 'Close' }, '\u00d7');
      closeBtn2.addEventListener('click', closeWidget);
      drawerEl.appendChild(closeBtn2);
      drawerEl.appendChild(widgetBody);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeWidget();
      });
      document.body.appendChild(overlay);
      document.body.appendChild(drawerEl);
      requestAnimationFrame(function () {
        overlay.classList.add('sizesignal-modal-visible');
        drawerEl.classList.add('sizesignal-drawer-open');
      });
    }
    /* inline: body already in container */
  }

  function closeWidget() {
    if (overlay) {
      overlay.classList.remove('sizesignal-modal-visible');
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      overlay = null;
    }
    if (drawerEl) {
      drawerEl.classList.remove('sizesignal-drawer-open');
      if (drawerEl.parentNode) drawerEl.parentNode.removeChild(drawerEl);
      drawerEl = null;
    }
  }

  // 5. Show / hide helpers
  function show(node) {
    node.classList.remove('sizesignal-hidden');
  }

  function hide(node) {
    node.classList.add('sizesignal-hidden');
  }

  function showSection(section) {
    hide(quizForm);
    hide(resultArea);
    hide(loader);
    hide(errorArea);
    show(section);
  }

  // 6. API call
  var lastProfile = null;

  function fetchRecommendation(profile) {
    lastProfile = profile;
    showSection(loader);

    var params = [
      'shop=' + encodeURIComponent(config.shop),
      'productId=' + encodeURIComponent(config.productId),
      'height=' + encodeURIComponent(profile.height),
      'weight=' + encodeURIComponent(profile.weight),
      'preferredFit=' + encodeURIComponent(profile.preferredFit)
    ];
    var url = config.appUrl + '/api/widget?' + params.join('&');

    fetch(url)
      .then(function (resp) {
        if (!resp.ok) throw new Error('API responded with status ' + resp.status);
        return resp.json();
      })
      .then(function (data) {
        renderResult(data);
      })
      .catch(function (err) {
        errorMsg.textContent = err.message || 'Something went wrong.';
        showSection(errorArea);
      });
  }

  // 7. Render results
  function renderResult(data) {
    while (resultArea.firstChild) {
      resultArea.removeChild(resultArea.firstChild);
    }

    var sizeBadge = el('div', 'sizesignal-size-badge', null, data.recommendedSize || '--');
    sizeBadge.style.borderColor = config.primaryColor;
    sizeBadge.addEventListener('click', function () {
      trackEvent('size_selected', { size: data.recommendedSize });
    });
    resultArea.appendChild(sizeBadge);

    var sizeLabel = el('p', 'sizesignal-size-label', null, 'Recommended Size');
    resultArea.appendChild(sizeLabel);

    if (config.showConfidence && data.confidence !== undefined) {
      var conf = parseFloat(data.confidence);
      var confColor = conf > 0.75 ? '#22c55e' : conf > 0.5 ? '#eab308' : '#ef4444';
      var confPct = Math.round(conf * 100) + '%';
      var confBadge = el('span', 'sizesignal-confidence', null, confPct + ' confidence');
      confBadge.style.setProperty('--ss-confidence-color', confColor);
      resultArea.appendChild(confBadge);
    }

    if (config.showFitPrediction && data.fitPrediction) {
      var fitContainer = el('div', 'sizesignal-fit-prediction');
      var fitText = el('p', 'sizesignal-fit-text', null, data.fitPrediction);
      fitContainer.appendChild(fitText);

      var scale = el('div', 'sizesignal-fit-scale');
      var labels = ['Tight', 'True to Size', 'Loose'];
      labels.forEach(function (lbl) {
        scale.appendChild(el('span', 'sizesignal-fit-scale-label', null, lbl));
      });
      var track = el('div', 'sizesignal-fit-track');
      var indicator = el('div', 'sizesignal-fit-indicator');
      indicator.style.backgroundColor = config.primaryColor;
      var fitScore = data.fitScore !== undefined ? parseFloat(data.fitScore) : 0.5;
      indicator.style.left = (fitScore * 100) + '%';
      track.appendChild(indicator);
      scale.appendChild(track);
      fitContainer.appendChild(scale);
      resultArea.appendChild(fitContainer);
    }

    if (config.showModelNotes && data.modelNotes) {
      var notes = el('div', 'sizesignal-notes');
      var notesIcon = el('span', 'sizesignal-notes-icon', null, '\ud83d\udccc');
      var notesText = el('span', null, null, data.modelNotes);
      notes.appendChild(notesIcon);
      notes.appendChild(notesText);
      resultArea.appendChild(notes);
    }

    if (data.alternativeSize) {
      var alt = el('div', 'sizesignal-alternative');
      alt.appendChild(el('span', null, null, 'Also consider: '));
      var altBadge = el('strong', null, null, data.alternativeSize);
      altBadge.addEventListener('click', function () {
        trackEvent('size_selected', { size: data.alternativeSize, type: 'alternative' });
      });
      alt.appendChild(altBadge);
      resultArea.appendChild(alt);
    }

    var retake = el('button', 'sizesignal-retake', { type: 'button' }, 'Retake Quiz');
    retake.addEventListener('click', function () {
      showSection(quizForm);
    });
    resultArea.appendChild(retake);

    showSection(resultArea);
    trackEvent('recommendation_click', { size: data.recommendedSize });
  }

  // 8. Event listeners
  ctaBtn.addEventListener('click', function () {
    if (config.widgetStyle === 'inline') {
      show(quizForm);
      hide(ctaBtn);
    } else {
      openWidget();
      show(quizForm);
      hide(ctaBtn);
    }
  });

  quizForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var fitRadio = quizForm.querySelector('input[name="preferredFit"]:checked');
    var profile = {
      height: heightInput.value,
      weight: weightInput.value,
      preferredFit: fitRadio ? fitRadio.value : 'regular'
    };
    storeProfile(profile);
    fetchRecommendation(profile);
  });

  retryBtn.addEventListener('click', function () {
    if (lastProfile) {
      fetchRecommendation(lastProfile);
    } else {
      showSection(quizForm);
    }
  });

  // 9. Mount and initialise
  applyColors();

  if (config.widgetStyle === 'inline') {
    container.appendChild(widgetBody);
  } else {
    /* For modal/drawer, only the CTA sits inline */
    container.appendChild(ctaBtn);
  }

  trackEvent('widget_view');

  // Auto-fetch if returning visitor has a stored profile
  var stored = getStoredProfile();
  if (stored && stored.height && stored.weight) {
    heightInput.value = stored.height;
    weightInput.value = stored.weight;
    var radio = quizForm.querySelector('input[name="preferredFit"][value="' + stored.preferredFit + '"]');
    if (radio) radio.checked = true;
    if (config.widgetStyle === 'inline') {
      hide(ctaBtn);
    }
    fetchRecommendation(stored);
  }
})();
