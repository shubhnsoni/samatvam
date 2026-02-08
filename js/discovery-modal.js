// Discovery Call Modal — shared across all pages
(function() {
  // Inject modal HTML
  var modalHTML = '' +
    '<div class="discovery-modal" id="discoveryModal">' +
      '<div class="discovery-modal__backdrop" id="discoveryBackdrop"></div>' +
      '<div class="discovery-modal__card">' +
        '<button class="discovery-modal__close" id="discoveryClose" aria-label="Close">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
        '</button>' +
        '<span class="discovery-modal__label label">Schedule a Call</span>' +
        '<h3 class="discovery-modal__title">Who would you like to <em>connect</em> with?</h3>' +
        '<p class="discovery-modal__desc">Choose a coach to book your free discovery call</p>' +
        '<div class="discovery-modal__options">' +
          '<a href="https://calendly.com/deepti-samatvam/" target="_blank" rel="noopener" class="discovery-modal__option">' +
            '<div class="discovery-modal__avatar">D</div>' +
            '<div class="discovery-modal__info">' +
              '<span class="discovery-modal__name">Dipti</span>' +
              '<span class="discovery-modal__role">Nutrition & Lifestyle Coach</span>' +
            '</div>' +
            '<svg class="discovery-modal__arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
          '</a>' +
          '<a href="https://calendly.com/hritwik-samatvam" target="_blank" rel="noopener" class="discovery-modal__option">' +
            '<div class="discovery-modal__avatar">H</div>' +
            '<div class="discovery-modal__info">' +
              '<span class="discovery-modal__name">Hritwik</span>' +
              '<span class="discovery-modal__role">Movement & Performance Coach</span>' +
            '</div>' +
            '<svg class="discovery-modal__arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
          '</a>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  var modal = document.getElementById('discoveryModal');

  function openModal() {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', function(e) {
    var trigger = e.target.closest('[data-discovery]');
    if (trigger) {
      e.preventDefault();
      e.stopPropagation();
      openModal();
      return;
    }
    if (e.target.id === 'discoveryBackdrop' || e.target.closest('.discovery-modal__close')) {
      closeModal();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
})();
