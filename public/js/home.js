// === Scroll Navbar Effect ===
window.addEventListener('scroll', function () {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 20) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// === Centralized Cart Box Updater ===
async function updateCartBox() {
  const goToCartBox = document.getElementById('goToCartBox');
  const cartInfo = document.getElementById('cartInfo');

  if (goToCartBox && cartInfo) {
    try {
      const res = await fetch('/cart-count');
      const data = await res.json();

      if (data.totalItems > 0) {
        goToCartBox.style.display = 'flex';
        cartInfo.textContent = `🧺 ${data.totalItems} items • ₹${data.totalPrice}`;
      } else {
        goToCartBox.style.display = 'none';
      }
    } catch (err) {
      console.error('Cart box fetch failed:', err);
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  document.body.classList.add('fade-in');

  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const signinSidebar = document.getElementById('signinSidebar');
  const closeSidebar = document.getElementById('closeSidebar');
  const menuSearch = document.getElementById('menuSearch');
  const mobileMenuSearch = document.getElementById('mobileMenuSearch');
  const searchToggleBtn = document.getElementById('searchToggleBtn');
  const mobileSearchBar = document.getElementById('mobileSearchBar');
  const foodCards = document.querySelectorAll('.food-card');
  const profileIcon = document.getElementById('profileIcon');
  const profileDropdown = document.getElementById('profileDropdown');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const showSignupLink = document.getElementById('showSignupLink');
  const backToLoginLink = document.getElementById('backToLoginLink');

  // 🍕 Toggle mobile nav
  hamburger?.addEventListener('click', (e) => {
    e.stopPropagation();
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('open');
  });

  // 🚪 Close nav on link click
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      hamburger.classList.remove('open');
    });
  });

  // ✨ Open Signin Sidebar
  document.querySelectorAll('.signin-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      signinSidebar?.classList.add('open');
    });
  });

  // ✅ Detect login state via meta tag (set in home.ejs)
  const userMeta = document.getElementById('user-status');
  const isLoggedIn = userMeta?.dataset.loggedin === 'true';

  if (!isLoggedIn) {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('showSignup') === '1') {
      signinSidebar?.classList.add('open');
      loginForm?.classList.add('hidden');
      signupForm?.classList.remove('hidden');
      showSignupLink?.classList.add('hidden');
      backToLoginLink?.classList.remove('hidden');
    }

    if (urlParams.get('showLogin') === '1') {
      signinSidebar?.classList.add('open');
      loginForm?.classList.remove('hidden');
      signupForm?.classList.add('hidden');
      showSignupLink?.classList.remove('hidden');
      backToLoginLink?.classList.add('hidden');
    }
  }

  // ❌ Close Signin Sidebar
  closeSidebar?.addEventListener('click', () => {
    signinSidebar?.classList.remove('open');
  });

  // 👤 Profile dropdown
  profileIcon?.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown?.classList.toggle('show');
  });

  // ❌ Close overlays
  document.addEventListener('click', (e) => {
    const isClickInsideSidebar = signinSidebar?.contains(e.target);
    const isClickOnSigninTrigger = e.target.closest('.signin-trigger');

    if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
      navLinks.classList.remove('active');
      hamburger.classList.remove('open');
    }

    if (!isClickInsideSidebar && !isClickOnSigninTrigger) {
      signinSidebar?.classList.remove('open');
    }

    if (!mobileSearchBar.contains(e.target) && !searchToggleBtn.contains(e.target)) {
      mobileSearchBar.classList.remove('show');
    }

    if (profileDropdown && !profileDropdown.contains(e.target) && !profileIcon?.contains(e.target)) {
      profileDropdown.classList.remove('show');
    }
  });

  // 🔔 Sign In Reminder Card (new)
  const signupReminderCard = document.getElementById('signupReminderCard');
  const openSigninSidebarBtn = document.getElementById('openSigninSidebarBtn');
  const dismissReminderBtn = document.getElementById('dismissReminderBtn');

  if (!isLoggedIn && signupReminderCard) {
    setTimeout(() => {
      if (!signinSidebar?.classList.contains('open')) {
        signupReminderCard.classList.remove('hidden');
      }
    }, 3000);

   openSigninSidebarBtn?.addEventListener('click', () => {
  signupReminderCard.classList.add('hidden');
  signinSidebar?.classList.add('open');

  // ✅ This sets the login form action to include ?from=reminder
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.action = '/login?from=reminder';
  }
});


    dismissReminderBtn?.addEventListener('click', () => {
      signupReminderCard.classList.add('hidden');
    });
  }

  // 🔍 Desktop & mobile search
  const searchInputs = [menuSearch, mobileMenuSearch];
  searchInputs.forEach(input => {
    input?.addEventListener('input', () => {
      const query = input.value.toLowerCase().trim();
      foodCards.forEach(card => {
        const name = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
        card.style.display = name.includes(query) || desc.includes(query) ? 'block' : 'none';
      });
    });

    input?.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        const query = input.value.toLowerCase().trim();
        let matchedCard = null;
        foodCards.forEach(card => {
          const name = card.querySelector('h3')?.textContent.toLowerCase() || '';
          const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
          if (name.includes(query) || desc.includes(query)) {
            matchedCard = card;
          }
        });

        if (matchedCard) {
          matchedCard.scrollIntoView({ behavior: 'smooth' });
          matchedCard.style.transition = 'background-color 0.4s ease';
          matchedCard.style.backgroundColor = '#ffb70344';
          setTimeout(() => {
            matchedCard.style.backgroundColor = '';
          }, 800);
        } else {
          window.open('https://lacrostamenu.com', '_blank');
        }
      }
    });
  });

  // 🔍 Toggle mobile search bar
  searchToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileSearchBar.classList.toggle('show');
  });

  // 🔄 Login ↔ Signup Toggle
  if (showSignupLink && backToLoginLink && loginForm && signupForm) {
    showSignupLink.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
      showSignupLink.classList.add('hidden');
      backToLoginLink.classList.remove('hidden');
    });

    backToLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      signupForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
      backToLoginLink.classList.add('hidden');
      showSignupLink.classList.remove('hidden');
    });
  }

  // 🚀 Initial Cart Fetch
  await updateCartBox();
});

window.addEventListener('beforeunload', () => {
  const cart = localStorage.getItem('session_cart') || null;
  const user = document.querySelector('meta#user-status')?.dataset.loggedin;

  if (cart && user === 'true') {
    navigator.sendBeacon('/save-abandoned-cart', cart);
  }
});

