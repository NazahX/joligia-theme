class LuxuryTheme {
  constructor() {
    this.body = document.body;
    this.header = document.querySelector('[data-site-header]');
    this.cartDrawer = document.querySelector('[data-cart-drawer]');
    this.searchPanel = document.querySelector('[data-search-panel]');
    this.mobileMenu = document.querySelector('[data-mobile-menu]');

    this.bindGlobalUI();
    this.bindProductForms();
    this.bindCartActions();
    this.bindProductGallery();
    this.bindQuantityInputs();
    this.handleStickyHeader();
  }

  bindGlobalUI() {
    document.addEventListener('click', (event) => {
      const openDrawer = event.target.closest('[data-drawer-open]');
      const closeDrawer = event.target.closest('[data-drawer-close]');
      const openSearch = event.target.closest('[data-search-open]');
      const closeSearch = event.target.closest('[data-search-close]');
      const menuToggle = event.target.closest('[data-mobile-menu-toggle]');

      if (openDrawer) {
        event.preventDefault();
        this.openCartDrawer();
      }

      if (closeDrawer) {
        event.preventDefault();
        this.closeCartDrawer();
      }

      if (openSearch) {
        event.preventDefault();
        this.openSearchPanel();
      }

      if (closeSearch) {
        event.preventDefault();
        this.closeSearchPanel();
      }

      if (menuToggle) {
        event.preventDefault();
        this.toggleMobileMenu();
      }
    });

    document.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') {
        this.closeCartDrawer();
        this.closeSearchPanel();
        this.closeMobileMenu();
      }
    });
  }

  handleStickyHeader() {
    if (!this.header) return;

    const onScroll = () => {
      if (window.scrollY > 16) {
        this.header.classList.add('is-stuck');
      } else {
        this.header.classList.remove('is-stuck');
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  openCartDrawer() {
    if (!this.cartDrawer) return;
    this.cartDrawer.classList.add('is-open');
    this.syncOverflowLock();
  }

  closeCartDrawer() {
    if (!this.cartDrawer) return;
    this.cartDrawer.classList.remove('is-open');
    this.syncOverflowLock();
  }

  openSearchPanel() {
    if (!this.searchPanel) return;
    this.searchPanel.classList.add('is-open');
    this.syncOverflowLock();
    const input = this.searchPanel.querySelector('input[type="search"]');
    if (input) input.focus();
  }

  closeSearchPanel() {
    if (!this.searchPanel) return;
    this.searchPanel.classList.remove('is-open');
    this.syncOverflowLock();
  }

  toggleMobileMenu() {
    if (!this.mobileMenu) return;
    if (this.mobileMenu.hasAttribute('open')) {
      this.closeMobileMenu();
    } else {
      this.mobileMenu.setAttribute('open', 'open');
      this.syncOverflowLock();
    }
  }

  closeMobileMenu() {
    if (!this.mobileMenu) return;
    this.mobileMenu.removeAttribute('open');
    this.syncOverflowLock();
  }

  syncOverflowLock() {
    const isLocked =
      this.cartDrawer?.classList.contains('is-open') ||
      this.searchPanel?.classList.contains('is-open') ||
      this.mobileMenu?.hasAttribute('open');

    this.body.classList.toggle('overflow-hidden', Boolean(isLocked));
  }

  bindProductForms() {
    document.querySelectorAll('[data-product-form]').forEach((form) => {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = form.querySelector('[type="submit"]');
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.classList.add('is-disabled');
        }

        try {
          const formData = new FormData(form);
          formData.append('sections', 'cart-drawer');

          const response = await fetch(window.theme.routes.cartAdd, {
            method: 'POST',
            headers: {
              Accept: 'application/json'
            },
            body: formData
          });

          if (!response.ok) throw new Error('Cart error');

          await this.refreshSections();
          this.openCartDrawer();

          if (submitButton) {
            submitButton.textContent = window.theme.strings.addedToCart;
            window.setTimeout(() => {
              submitButton.textContent = window.theme.strings.addToCart;
            }, 1800);
          }
        } catch (error) {
          console.error(error);
          window.alert(window.theme.strings.cartError);
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.classList.remove('is-disabled');
          }
          this.bindCartActions();
        }
      });
    });
  }

  bindCartActions() {
    document.querySelectorAll('[data-cart-quantity]').forEach((button) => {
      button.onclick = async (event) => {
        event.preventDefault();
        const line = button.dataset.line;
        const quantity = Number(button.dataset.quantity);
        await this.updateCartLine(line, quantity);
      };
    });

    document.querySelectorAll('[data-cart-remove]').forEach((button) => {
      button.onclick = async (event) => {
        event.preventDefault();
        const line = button.dataset.line;
        await this.updateCartLine(line, 0);
      };
    });
  }

  async updateCartLine(line, quantity) {
    try {
      const response = await fetch(window.theme.routes.cartChange, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ line, quantity })
      });

      if (!response.ok) throw new Error('Cart update error');

      await this.refreshSections();
      this.openCartDrawer();
      this.bindCartActions();
    } catch (error) {
      console.error(error);
      window.alert(window.theme.strings.cartError);
    }
  }

  async refreshSections() {
    await Promise.all([this.refreshHeader(), this.refreshCartDrawer()]);
  }

  async refreshHeader() {
    const headerContainer = document.querySelector('[data-header-root]');
    if (!headerContainer) return;

    const response = await fetch(`${window.location.origin}${window.location.pathname}?section_id=site-header`);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const updated = doc.querySelector('[data-header-root]');
    if (updated) {
      headerContainer.innerHTML = updated.innerHTML;
    }
  }

  async refreshCartDrawer() {
    const drawerContainer = document.querySelector('[data-cart-drawer-root]');
    if (!drawerContainer) return;

    const response = await fetch(`${window.location.origin}${window.location.pathname}?section_id=cart-drawer`);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const updated = doc.querySelector('[data-cart-drawer-root]');
    if (updated) {
      drawerContainer.innerHTML = updated.innerHTML;
    }
  }

  bindProductGallery() {
    document.querySelectorAll('[data-gallery-thumb]').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const gallery = thumb.closest('[data-product-gallery]');
        if (!gallery) return;

        const targetId = thumb.dataset.galleryThumb;
        gallery.querySelectorAll('[data-gallery-thumb]').forEach((item) => item.classList.remove('is-active'));
        gallery.querySelectorAll('[data-gallery-slide]').forEach((slide) => {
          slide.classList.toggle('is-active', slide.dataset.gallerySlide === targetId);
        });
        thumb.classList.add('is-active');
      });
    });
  }

  bindQuantityInputs() {
    document.querySelectorAll('[data-quantity-button]').forEach((button) => {
      button.addEventListener('click', () => {
        const wrapper = button.closest('[data-quantity-wrapper]');
        if (!wrapper) return;
        const input = wrapper.querySelector('input');
        const current = Number(input.value) || 1;
        const direction = button.dataset.quantityButton;
        const nextValue = direction === 'increase' ? current + 1 : Math.max(1, current - 1);
        input.value = nextValue;
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new LuxuryTheme();
});
