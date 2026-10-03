import { store } from './store.js';
import { mockData } from './data/mockData.js';
import { renderHeader } from './components/header.js';
import { renderHero } from './components/hero.js';
import { renderDirectory, setDirectoryViewMode, resetVisibleCount, loadMoreColleges } from './components/directory.js';
import { renderCollegeDetail, setCollegeTab } from './components/collegeDetail.js';
import { renderComparison } from './components/comparison.js';
import { renderCalculator, updateCalc } from './components/calculator.js';
import { renderSeniorConnect, setSeniorCategoryFilter, setSeniorSearchQuery, setSeniorCityFilter, setSeniorInstFilter, setSeniorConnectTab } from './components/seniorConnect.js';
import { renderRoommateFinder, setRoommateGenderFilter, setRoommateOccupancyFilter, setRoommateMaxRentFilter, setRoommateCityFilter, setRoommateSearchQuery, toggleRoommateHyperFilter } from './components/roommateFinder.js';
import { renderCampusLiving, setCityHub } from './components/campusLiving.js';
import { renderMarketplace, setMarketplaceCategory, setMarketplaceCityFilter, setMarketplaceInstFilter, setMarketplaceSearchQuery, setMarketMode, openRewardedAdToUnlock, closeRewardedAdModal, claimAndUnlockContact, renderRewardedAdModal, isContactUnlocked, setSellerDashboardView, renderSellerDashboard, renderListingWizard, renderAroundMyCampus, reportMarketplaceListing, deleteMyListing, pauseMyListing, resumeMyListing, renewMyListing, markMyListingAs, confirmMyListingActive } from './components/marketplace.js';
import { renderScholarships, setScholarshipFilter } from './components/scholarships.js';
import { renderCampusEvents } from './components/eventsCampus.js';
import { renderCampusMap } from './components/campusMap.js';
import { renderMovingChecklist } from './components/movingChecklist.js';
import { renderClaimInstitutionModal } from './components/claimInstitutionModal.js';
import { renderDigitalMOUModal } from './components/digitalMOUModal.js';
import { renderDecisionAI, updateAdvisor } from './components/decisionAI.js';
import { renderAroundCampus, updateCampusState } from './components/aroundCampus.js';
import { renderExploreChill, openChillReviewModal, closeChillReviewModal, openHourlyBookingModal, closeHourlyBookingModal, closeBookingConfirmationModal, updateVibeSlider, toggleReviewTag, setBookingHours, setBookingGuests, submitChillReview, confirmHourlyBooking, shareChillSpot, shareBookingWhatsApp } from './components/exploreChill.js';
import { renderMyCollege } from './components/myCollege.js';
import { renderModals, openModal, closeModal, triggerCutoffAdTimer, renderStudentStageReviewBanner } from './components/onboarding.js';
import { initAdSense, saveAdSenseConfig, renderStickyBottomAnchorAd, toggleBottomAnchorAd } from './components/adsense.js';
import { renderAdminPortal, setAdminPortalTab } from './components/adminPortal.js';
import { renderBusinessPortal, setBusinessSection } from './components/businessPortal.js';
import { renderLoginPage, renderRegisterPage } from './components/loginPage.js';
import { renderProfileTab } from './components/profileTab.js';
import { updateOnPageSeo } from './components/seoEngine.js';
import { renderMoviesSection } from './components/movies.js';
import { renderDpdpFloatingBanner } from './components/dpdpConsent.js';
import { renderFindPartnerSection } from './components/findPartner.js';
import { renderJobsCareer, setJobsTab } from './components/jobsCareer.js';
import { renderJobGiverPortal } from './components/jobGiverPortal.js';
import { loadLiveOverrides, getLiveDataAge } from './utils/dataRefresher.js';
import { renderCoursesGlance } from './utils/coursesGlance.js';
import { renderOnlineCourses } from './utils/onlineCoursesGlance.js';

// Expose getLiveDataAge globally so components can use it in UI
window.getLiveDataAge = getLiveDataAge;

let isFloatingDealDismissed = false;
let searchDebounceTimer = null;

// ─── Focus Preservation Helpers ───────────────────────────────────────────────
// Capture the currently focused element's ID, attributes & cursor position before re-renders
function captureFocus() {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const isText = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';
  if (!isText && el.tagName !== 'SELECT' && el.getAttribute('contenteditable') !== 'true') return null;
  return {
    id: el.id || null,
    name: el.getAttribute('name') || null,
    placeholder: el.getAttribute('placeholder') || null,
    tagName: el.tagName,
    type: el.type || 'text',
    value: isText ? el.value : null,
    selectionStart: isText ? el.selectionStart : null,
    selectionEnd: isText ? el.selectionEnd : null,
  };
}

// Restore focus to the element captured by captureFocus()
function restoreFocus(state) {
  if (!state) return;
  let el = null;
  if (state.id) {
    el = document.getElementById(state.id);
  }
  if (!el && state.placeholder && state.tagName) {
    try {
      el = document.querySelector(`${state.tagName.toLowerCase()}[placeholder="${CSS.escape(state.placeholder)}"]`);
    } catch(e) {
      try {
        el = document.querySelector(`${state.tagName.toLowerCase()}[placeholder="${state.placeholder.replace(/"/g, '\\"')}"]`);
      } catch(err) {}
    }
  }
  if (!el && state.name && state.tagName) {
    try {
      el = document.querySelector(`${state.tagName.toLowerCase()}[name="${CSS.escape(state.name)}"]`);
    } catch(e) {}
  }
  if (!el) return;

  if (document.activeElement !== el) {
    try { el.focus(); } catch(e) {}
  }
  if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') &&
      state.selectionStart !== null && state.selectionEnd !== null &&
      typeof el.setSelectionRange === 'function') {
    try { el.setSelectionRange(state.selectionStart, state.selectionEnd); } catch(e) {}
  }
}

function getMainContent(tab) {
  const isExcluded = tab === 'admin-portal' || tab === 'advertiser-portal' || tab === 'business-portal' || tab === 'institution-portal' || tab === 'login' || tab === 'register' || tab === 'signup';
  const stageBanner = isExcluded ? '' : renderStudentStageReviewBanner();

  let body = '';
  switch (tab) {
    case 'login':
    case 'signin':
      body = renderLoginPage();
      break;
    case 'register':
    case 'signup':
      body = renderRegisterPage();
      break;
    case 'explore':
      body = `
        <div id="hero-container">${renderHero()}</div>

        <!-- ═══════════════════════════════════════════════════════════════════ -->
        <!-- ABOUT COLLEGESEEKERS — Lovable & Engaging Feature Hub -->
        <!-- ═══════════════════════════════════════════════════════════════════ -->
        <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <div class="text-center space-y-2">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-pink-50 border border-indigo-200 text-indigo-800 text-xs font-black uppercase tracking-wider shadow-2xs">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-indigo-600"></i>
              Everything CollegeSeekers Can Do For You
            </div>
            <h2 class="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              One Platform. Your Entire College Journey. 🎓
            </h2>
            <p class="text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
              From picking the right college to landing your first job &amp; surviving hostel life — we've got every step covered!
            </p>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            ${[
              { emoji:'🎓', tab:'explore', title:'College Directory', badge:'Verified Data', what:'1,250+ colleges with real verified data', why:'Actual fees, hostel costs, CTC — zero marketing fluff' },
              { emoji:'💼', tab:'jobs', title:'Jobseekers Explorer', badge:'Direct Apply', what:'Browse full-time jobs & paid student internships', why:'Direct recruiter connect with salary transparency' },
              { emoji:'🧠', tab:'decision-ai', title:'AI Fit Score Matcher', badge:'Smart AI', what:'Personalised college ranking based on what YOU care about', why:'Adjust weights for placements, fees, hostel, vibe' },
              { emoji:'👴', tab:'seniors', title:'Senior Connect & Chat', badge:'Verified Alumni', what:'Chat with real students & seniors', why:'Get honest answers from seniors who\'ve been there' },
              { emoji:'🤫', tab:'seniors', title:'Secret Alley', badge:'100% Uncensored', what:'The brutally honest stuff colleges don\'t write in brochures', why:'Hostel truth, mess quality, faculty reality & insider tea' },
              { emoji:'🏡', tab:'marketplace', title:'PG & Roommate Finder', badge:'Zero Broker', what:'Find verified PGs and compatible flatmates near campus', why:'Safe, affordable, verified — no broker nonsense' },
              { emoji:'🛒', tab:'marketplace', title:'Student Marketplace', badge:'P2P Deals', what:'Buy & sell books, cycles, tech — zero broker', why:'P2P campus commerce. Save thousands every semester.' },
              { emoji:'📍', tab:'around-campus', title:'Around Campus 5G', badge:'Hyperlocal', what:'Your campus survival map — food, printing, laundry', why:'Essential shops & services within walking distance' },
              { emoji:'🤝', tab:'partner', title:'Find a Partner', badge:'Study & Hangouts', what:'Activity-based study, dance, concert & hangout buddy', why:'Connect with verified peers sharing your interests' },
              { emoji:'🎬', tab:'movies', title:'Movies & Web Series', badge:'Cinema Passes', what:'Hostel watchlist + OTT student discounts & passes', why:'Student picks, trailers, where-to-watch and campus cinema' },
              { emoji:'🎉', tab:'events', title:'Events & Fests', badge:'Hackathons', what:'College fests, hackathons & cultural events across India', why:'Never miss a tech fest, cultural night, or sports meet' },
              { emoji:'🧮', tab:'calculator', title:'ROI & Fee Calculator', badge:'Hidden Fee Audit', what:'Will this college actually pay off? Let\'s find out.', why:'True cost vs expected CTC — the math colleges don\'t show' }
            ].map(f => `
              <div class="group bg-white hover:bg-gradient-to-br hover:from-indigo-50/80 hover:via-white hover:to-pink-50/30 rounded-3xl border border-slate-200/90 hover:border-indigo-400 hover:shadow-xl transition-all duration-300 p-4 flex flex-col gap-2.5 cursor-pointer app-tap-bounce relative overflow-hidden"
                   onclick="window.setTab('${f.tab}')">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">${f.emoji}</div>
                  <span class="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-600 transition">
                    ${f.badge}
                  </span>
                </div>
                <div>
                  <div class="text-sm font-black text-slate-900 leading-tight group-hover:text-indigo-700 transition">${f.title}</div>
                  <div class="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">${f.what}</div>
                </div>
                <div class="text-[10px] text-indigo-600 font-bold bg-indigo-50/80 group-hover:bg-indigo-100/80 px-2.5 py-1 rounded-xl leading-snug line-clamp-2 transition mt-auto">
                  💡 ${f.why}
                </div>
                <div class="flex items-center gap-1 text-[10px] text-indigo-600 font-black mt-1 pt-1 border-t border-slate-100">
                  <span>Explore Feature</span>
                  <i data-lucide="arrow-right" class="w-3 h-3 group-hover:translate-x-1 transition-transform"></i>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
        <!-- ═══════════════════════════════════════════════════════════════════ -->

        <!-- 🏷️ Sponsored Collections — Student Deals Hub -->
        <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          ${window.renderSponsoredCollectionsBar ? window.renderSponsoredCollectionsBar() : ''}
        </section>

        <div id="directory-container">${renderDirectory()}</div>
      `;
      break;
    case 'explore-chill':
      body = renderExploreChill();
      break;
    case 'compare':
      body = renderComparison();
      break;
    case 'decision-ai':
      body = renderDecisionAI();
      break;
    case 'calculator':
      body = renderCalculator();
      break;
    case 'seniors':
      body = renderSeniorConnect();
      break;
    case 'secret-alley':
      if (typeof setSeniorConnectTab === 'function') setSeniorConnectTab('secret-alley');
      body = renderSeniorConnect();
      break;
    case 'roommates':
      body = renderRoommateFinder();
      break;
    case 'around-campus':
      body = renderAroundCampus();
      break;
    case 'campus':
      if (store.state) store.state.sellerDashboardView = 'campus-living';
      body = renderMarketplace();
      break;
    case 'marketplace':
      body = renderMarketplace();
      break;
    case 'movies':
    case 'cinema':
      body = renderMoviesSection();
      break;
    case 'partner':
    case 'find-partner':
    case 'companion':
      body = renderFindPartnerSection();
      break;
    case 'scholarships':
      body = renderScholarships();
      break;
    case 'events':
      body = renderCampusEvents();
      break;
    case 'apply':
    case 'applications':
      body = renderDirectory();
      break;
    case 'campus-map':
      body = renderCampusMap();
      break;
    case 'moving-checklist':
      body = renderMovingChecklist();
      break;
    case 'my-college':
      body = renderMyCollege();
      break;
    case 'business-portal':
      body = renderBusinessPortal();
      break;
    case 'admin-portal':
      body = renderAdminPortal();
      break;
    case 'profile':
      body = renderProfileTab();
      break;
    case 'jobs':
    case 'careers':
    case 'jobseekers':
      body = renderJobsCareer();
      break;
    case 'job-giver-portal':
    case 'employer-portal':
      body = renderJobGiverPortal();
      break;
    default:
      body = renderDirectory();
      break;
  }
  return stageBanner + body;
}

function renderFooter() {
  return `
    <footer class="bg-slate-950 text-white border-t border-slate-800/80 pt-16 pb-10 px-4 sm:px-6 lg:px-8 mt-20 text-xs">
      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
        <div class="space-y-4 md:col-span-2">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-sm text-white shadow-md shadow-indigo-500/30">
              <i data-lucide="graduation-cap" class="w-4 h-4 text-white"></i>
            </div>
            <span class="text-xl font-black tracking-tight">College<span class="text-indigo-400">Seekers</span></span>
          </div>
          <p class="text-slate-400 max-w-sm text-xs leading-relaxed">
            The student-first platform for choosing your college or school and thriving throughout campus life. Real student-verified reviews, honest fees, verified housing, and zero spam.
          </p>
          <div class="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 text-emerald-400 text-[11px] flex items-center gap-2.5 max-w-md">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400 shrink-0"></i>
            <span>Zero Data-Resale Guarantee: We never sell student phone numbers to marketing brokers.</span>
          </div>
        </div>

        <div class="space-y-3">
          <h4 class="font-bold uppercase tracking-wider text-slate-200 text-[11px]">Discover & Decide</h4>
          <ul class="space-y-2 text-slate-400 text-xs">
            <li><button onclick="window.setTab('explore')" class="hover:text-white transition">Colleges & Schools</button></li>
            <li><button onclick="window.setTab('compare')" class="hover:text-white transition">Side-by-Side Comparison</button></li>
            <li><button onclick="window.setTab('decision-ai')" class="hover:text-white transition">Decision AI Matcher</button></li>
            <li><button onclick="window.setTab('calculator')" class="hover:text-white transition">True Cost & ROI Calculator</button></li>
          </ul>
        </div>

        <div class="space-y-3">
          <h4 class="font-bold uppercase tracking-wider text-slate-200 text-[11px]">Campus Life & Living</h4>
          <ul class="space-y-2 text-slate-400 text-xs">
            <li><button onclick="window.setTab('campus')" class="hover:text-white transition">Housing, PGs & Hostels</button></li>
            <li><button onclick="window.setTab('roommates')" class="hover:text-white transition">Roommate Finder</button></li>
            <li><button onclick="window.setTab('seniors')" class="hover:text-white transition">Senior & Secrets</button></li>
            <li><button onclick="window.setTab('marketplace')" class="hover:text-white transition">Student Marketplace (P2P)</button></li>
            <li><button onclick="window.setTab('movies')" class="hover:text-white text-pink-300 font-bold transition flex items-center gap-1"><span>🎬 Movies & Web Series</span></button></li>
            <li><button onclick="window.setTab('around-campus')" class="hover:text-white transition">Around Campus (5G & Delivery)</button></li>
            <li><button onclick="window.setTab('moving-checklist')" class="hover:text-white transition">Moving & Luggage Checklist</button></li>
          </ul>
        </div>

        <div class="space-y-3">
          <h4 class="font-bold uppercase tracking-wider text-slate-200 text-[11px]">Privacy, Legal &amp; Trust</h4>
          <ul class="space-y-2 text-slate-300 text-xs">
            <li><button onclick="window.openDpdpCenter('policy')" class="hover:text-white transition focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-300 flex items-center gap-1"><i data-lucide="shield" class="w-3.5 h-3.5"></i><span>Privacy Policy (DPDP Act)</span></button></li>
            <li><button onclick="window.openDpdpCenter('terms')" class="hover:text-white transition focus:ring-2 focus:ring-indigo-500">Terms &amp; Conditions</button></li>
            <li><button onclick="window.openDpdpCenter('cookies')" class="hover:text-white transition focus:ring-2 focus:ring-indigo-500">Cookie Policy &amp; Storage</button></li>
            <li><button onclick="window.openDpdpCenter('data-collected')" class="hover:text-white transition focus:ring-2 focus:ring-indigo-500">What User Data We Collect</button></li>
            <li><button onclick="window.openDpdpCenter('rights')" class="hover:text-white transition focus:ring-2 focus:ring-indigo-500">Data Principal Rights (Sec 6)</button></li>
            <li><button onclick="window.openDpdpCenter('grievance')" class="hover:text-white transition focus:ring-2 focus:ring-indigo-500">Grievance Redressal (Sec 13)</button></li>
            <li><button onclick="window.openDpdpCenter('children')" class="hover:text-white transition focus:ring-2 focus:ring-indigo-500">Child &amp; Minor Safety (Sec 9)</button></li>
          </ul>
        </div>
      </div>

      <div class="max-w-7xl mx-auto pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
        <div class="flex items-center gap-2 flex-wrap">
          <span>&copy; 2026 CollegeSeekers.com &bull; Universal Discovery Platform &bull; All Rights Reserved</span>
          <span>&bull;</span>
          <button onclick="window.openDpdpCenter('terms')" class="hover:text-slate-200 underline">Terms &amp; Conditions</button>
          <span>&bull;</span>
          <button onclick="window.openDpdpCenter('policy')" class="hover:text-slate-200 underline">Privacy Policy</button>
          <span>&bull;</span>
          <button onclick="window.openDpdpCenter('cookies')" class="hover:text-slate-200 underline">Cookies</button>
          <span>&bull;</span>
          <button onclick="window.openDpdpCenter('overview')" class="text-indigo-400 hover:text-indigo-300 underline font-bold flex items-center gap-1">
            <i data-lucide="shield-check" class="w-3 h-3"></i>
            <span>DPDP Act 2023 Compliant</span>
          </button>
        </div>
        <div class="text-slate-400">Grievance Officer: Arvind Saxena (dpo@collegeseekers.com)</div>
      </div>
    </footer>
  `;
}

function renderMobileNav() {
  const state = store.state;
  const user = state.currentUser;
  const isAuth = !!state.isAuthenticated && !!user;
  const compareCount = (state.comparingColleges || []).length;
  const shortlistCount = (state.shortlist || []).length;

  const tabs = [
    { id: 'explore',      icon: 'compass',      label: 'Explore',     badge: null },
    { id: 'around-campus',icon: 'map-pin',      label: 'Around Me',   badge: '5G' },
    { id: 'compare',      icon: 'columns',      label: 'Compare',     badge: compareCount > 0 ? compareCount : null },
    { id: 'marketplace',  icon: 'shopping-bag', label: 'Market',      badge: 'P2P' },
    { id: 'seniors',      icon: 'users',        label: 'Seniors 🔥',  badge: 'NEW' },
    { id: 'profile',      icon: 'user-circle',  label: isAuth ? (user.name ? user.name.split(' ')[0] : 'Profile') : 'Profile', badge: null },
  ];

  const seniorTabActive = state.activeTab === 'seniors';
  const profileTabActive = state.activeTab === 'profile' || state.activeTab === 'login' || state.activeTab === 'register';

  return `
    <nav class="fixed bottom-0 left-0 right-0 z-40 app-bottom-dock bg-white/95 backdrop-blur-2xl border-t border-slate-200/90 app-dock-shadow transition-all">
      <div class="max-w-md md:max-w-lg mx-auto flex items-center justify-around px-2 pt-1.5 pb-1">
        ${tabs.map(tab => {
          const isActive = tab.id === 'seniors' 
            ? seniorTabActive 
            : tab.id === 'profile' 
              ? profileTabActive 
              : state.activeTab === tab.id;

          const target = tab.id === 'profile' ? (isAuth ? 'profile' : 'login') : tab.id;
          
          return `
          <button onclick="window.setTab('${target}')"
            class="flex flex-col items-center justify-center gap-1 py-1 px-2.5 min-w-[50px] relative app-tap-bounce group flex-1"
            title="${tab.label}">
            
            ${isActive ? `
              <div class="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-sm shadow-indigo-300"></div>
            ` : ''}

            <div class="relative">
              ${tab.id === 'profile' && isAuth && user.avatar
                ? `<img src="${user.avatar}" class="w-5 h-5 rounded-full object-cover border-2 ${isActive ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-300'}" />`
                : `<i data-lucide="${tab.icon}" class="w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-600 stroke-[2.4]' : 'text-slate-400 group-hover:text-slate-700 stroke-[1.8]'}"></i>`
              }

              ${tab.badge ? `
                <span class="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                  isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                }">
                  ${tab.badge}
                </span>
              ` : ''}
            </div>

            <span class="text-[10px] font-bold leading-none tracking-tight truncate max-w-[56px] ${
              isActive ? 'text-indigo-600 font-black' : 'text-slate-500 group-hover:text-slate-800'
            }">
              ${tab.label}
            </span>
          </button>`;
        }).join('')}
      </div>
    </nav>
  `;
}

function renderFloatingDeal() {
  if (isFloatingDealDismissed || store.state.activeTab === 'login') return '';
  return `
    <aside class="fixed bottom-20 right-4 z-30 max-w-sm w-full sm:w-auto animate-fade-in" aria-label="Student Deals & Perks">
      <div class="bg-slate-950/90 backdrop-blur-xl text-white p-2.5 px-4 rounded-full border border-indigo-500/40 shadow-2xl flex items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
            ★
          </div>
          <div class="leading-tight">
            <span class="font-bold text-white text-xs">Flat 40% Off Laptops</span>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button 
            onclick="window.openDealsModal()" 
            class="px-2.5 py-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition app-tap-bounce">
            Claim
          </button>
          <button 
            onclick="window.dismissFloatingDeal()" 
            class="p-1 text-slate-400 hover:text-white transition" 
            title="Dismiss banner">
            <i data-lucide="x" class="w-3 h-3"></i>
          </button>
        </div>
      </div>
    </aside>
  `;
}

function setupMobileMenu() {
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  if (mobileBtn && mobileNav) {
    mobileBtn.onclick = () => mobileNav.classList.toggle('hidden');
  }
}

// Global View Render Function with Targeted DOM Diffing
export function render(changeType = 'general') {
  const app = document.getElementById('app');
  if (!app) return;

  const state = store.state;
  const shell = document.getElementById('app-shell');

  // Fast path 1: Search & Filter updates within directory on 'explore' tab
  if (shell && (changeType === 'search' || changeType === 'filter') && state.activeTab === 'explore') {
    const dirContainer = document.getElementById('directory-container');
    if (dirContainer) {
      const _f1 = captureFocus();
      dirContainer.innerHTML = renderDirectory();
      if (window.lucide) {
        window.lucide.createIcons({ root: dirContainer });
      }
      restoreFocus(_f1);
      initAdSense();
      return;
    }
  }

  // Fast path 2: Tab change - keep shell intact, replace only main-view & update navbars
  if (shell && changeType === 'tab') {
    const mainView = document.getElementById('main-view');
    const headerContainer = document.getElementById('app-header-container');
    const mobileNavContainer = document.getElementById('app-mobile-nav-container');

    if (mainView && headerContainer && mobileNavContainer) {
      mainView.innerHTML = getMainContent(state.activeTab);
      headerContainer.innerHTML = renderHeader();
      mobileNavContainer.innerHTML = renderMobileNav();
      
      const stickyAnchor = document.getElementById('app-sticky-anchor-ad-container');
      if (stickyAnchor) {
        stickyAnchor.innerHTML = renderStickyBottomAnchorAd();
      }

      if (window.lucide) {
        window.lucide.createIcons({ root: mainView });
        window.lucide.createIcons({ root: headerContainer });
        window.lucide.createIcons({ root: mobileNavContainer });
        if (stickyAnchor) window.lucide.createIcons({ root: stickyAnchor });
      }
      initAdSense();
      setupMobileMenu();
      updateOnPageSeo();
      return;
    }
  }

  // Fast path 3: College Detail Modal change
  if (shell && changeType === 'college_detail') {
    const detailContainer = document.getElementById('app-college-detail-container');
    if (detailContainer) {
      detailContainer.innerHTML = renderCollegeDetail();
      if (window.lucide) {
        window.lucide.createIcons({ root: detailContainer });
      }
      initAdSense();
      updateOnPageSeo();
      return;
    }
  }

  // Fast path 4: General updates, rewarded ad events, header updates, or dynamic views when shell already mounted
  if (shell && (changeType === 'general' || changeType === 'header' || changeType === 'rewarded_ad_finish' || changeType === 'roommate_filter')) {
    const _f4 = captureFocus();
    const mainView = document.getElementById('main-view');
    const headerContainer = document.getElementById('app-header-container');
    const rewardedContainer = document.getElementById('app-rewarded-ad-container');
    const modalsContainer = document.getElementById('app-modals-container');
    const stickyAnchor = document.getElementById('app-sticky-anchor-ad-container');

    if (headerContainer) {
      headerContainer.innerHTML = renderHeader();
      if (window.lucide) {
        window.lucide.createIcons({ root: headerContainer });
      }
    }

    if (mainView) {
      mainView.innerHTML = getMainContent(state.activeTab);
      if (window.lucide) {
        window.lucide.createIcons({ root: mainView });
      }
    }
    if (rewardedContainer) {
      rewardedContainer.innerHTML = renderRewardedAdModal();
      if (window.lucide) {
        window.lucide.createIcons({ root: rewardedContainer });
      }
    }
    if (modalsContainer) {
      modalsContainer.innerHTML = renderModals();
      if (window.lucide) {
        window.lucide.createIcons({ root: modalsContainer });
      }
    }
    const claimContainer = document.getElementById('app-claim-modal-container');
    if (claimContainer) {
      claimContainer.innerHTML = renderClaimInstitutionModal();
      if (window.lucide) window.lucide.createIcons({ root: claimContainer });
    }
    const mouContainer = document.getElementById('app-digital-mou-modal-container');
    if (mouContainer) {
      mouContainer.innerHTML = renderDigitalMOUModal();
      if (window.lucide) window.lucide.createIcons({ root: mouContainer });
    }
    if (stickyAnchor) {
      stickyAnchor.innerHTML = renderStickyBottomAnchorAd();
      if (window.lucide) {
        window.lucide.createIcons({ root: stickyAnchor });
      }
    }
    const detailContainer = document.getElementById('app-college-detail-container');
    if (detailContainer && state.selectedCollegeId) {
      detailContainer.innerHTML = renderCollegeDetail();
      if (window.lucide) {
        window.lucide.createIcons({ root: detailContainer });
      }
    }
    const dpdpBannerContainer = document.getElementById('app-dpdp-banner-container');
    if (dpdpBannerContainer) {
      dpdpBannerContainer.innerHTML = renderDpdpFloatingBanner();
      if (window.lucide) window.lucide.createIcons({ root: dpdpBannerContainer });
    }
    // Video ad overlay (hybrid 5s non-skip → skippable)
    const videoAdContainer = document.getElementById('cs-video-ad-overlay');
    if (videoAdContainer) {
      videoAdContainer.innerHTML = (window.videoAdState && window.videoAdState.active && window.renderVideoAdOverlay) ? window.renderVideoAdOverlay() : '';
      if (window.lucide && videoAdContainer.innerHTML) window.lucide.createIcons({ root: videoAdContainer });
    }
    // Sponsored collection modal
    const collectionModal = document.getElementById('cs-collection-modal');
    if (collectionModal && window.renderSponsoredCollectionModal) {
      collectionModal.innerHTML = window.renderSponsoredCollectionModal();
      if (window.lucide && collectionModal.innerHTML) window.lucide.createIcons({ root: collectionModal });
    }
    restoreFocus(_f4);
    initAdSense();
    updateOnPageSeo();
    return;
  }

  // Full Initial Mount
  app.innerHTML = `
    <div id="app-shell" class="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white pb-36 sm:pb-40">
      <div id="app-header-container">
        ${renderHeader()}
      </div>
      
      <main class="flex-1" id="main-view">
        ${getMainContent(state.activeTab)}
      </main>

      <div id="app-footer-container">
        ${renderFooter()}
      </div>

      <div id="app-mobile-nav-container">
        ${renderMobileNav()}
      </div>

      <div id="app-floating-deal-container">
        ${renderFloatingDeal()}
      </div>

      <!-- DPDP Act 2023 Consent & Preference Floating Banner -->
      <div id="app-dpdp-banner-container">
        ${renderDpdpFloatingBanner()}
      </div>

      <!-- Modals & Overlays -->
      <div id="app-college-detail-container">
        ${renderCollegeDetail()}
      </div>
      <div id="app-modals-container">
        ${renderModals()}
      </div>
      <div id="app-rewarded-ad-container">
        ${renderRewardedAdModal()}
      </div>
      <div id="app-claim-modal-container">
        ${renderClaimInstitutionModal()}
      </div>
      <div id="app-digital-mou-modal-container">
        ${renderDigitalMOUModal()}
      </div>

      <!-- Sticky High-Yield Bottom Anchor Ad Banner -->
      <div id="app-sticky-anchor-ad-container">
        ${renderStickyBottomAnchorAd()}
      </div>

      <!-- 🎬 Hybrid Video Ad Overlay (5s non-skip → skippable) -->
      <div id="cs-video-ad-overlay">
        ${(window.videoAdState && window.videoAdState.active) ? (window.renderVideoAdOverlay ? window.renderVideoAdOverlay() : '') : ''}
      </div>

      <!-- 🏷️ Sponsored Collection Modal -->
      <div id="cs-collection-modal">
        ${window.renderSponsoredCollectionModal ? window.renderSponsoredCollectionModal() : ''}
      </div>
    </div>
  `;

  // Initialize Lucide Icons for the entire shell
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Initialize and push Google AdSense units
  initAdSense();

  // Setup mobile nav toggle
  setupMobileMenu();

  // Update dynamic On-Page SEO meta & schema tags
  updateOnPageSeo();
}

// Global Window Handlers
window.render = render;

window.setCountry = function(code) { store.setCountry(code); };
window.setCurrency = function(code) { store.setCurrency(code); };
window.setLanguage = function(code) { store.setLanguage(code); };
window.toggleBottomAnchorAd = toggleBottomAnchorAd;
window.store = store;

// Student Academic Stage & Review Handlers
window.setStudentAcademicStage = function(stage, instId = null) {
  store.setStudentAcademicStage(stage, instId);
};

window.copyReviewInviteUrl = function(instId, stage) {
  const url = store.getStudentReviewInviteUrl(instId, stage);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      store.showToast(`📋 Direct review invite URL copied! Share with your classmates.`, 'success');
    }).catch(() => {
      prompt('Copy your direct campus review URL:', url);
    });
  } else {
    prompt('Copy your direct campus review URL:', url);
  }
  return url;
};

window.shareReviewWhatsApp = function(instId, stage) {
  const url = store.getStudentReviewInviteUrl(instId, stage);
  const inst = mockData.institutions.find(i => i.id === instId) || { name: 'our campus' };
  const stageLabel = store.formatStageLabel(stage);
  const text = encodeURIComponent(`Hey batchmates! Share your honest review of ${inst.name} as a ${stageLabel} on CollegeSeekers to guide upcoming junior aspirants:\n\n👉 Write review here: ${url}`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
};

window.openStageReviewModal = function(instId, stage) {
  if (stage) {
    store.setStudentAcademicStage(stage, instId);
  }
  openModal('review', { instId: instId || 'iit-ism-dhanbad', stage: stage || store.state.userProfile?.academicStage || '1st-year' });
};

// Super Admin & Automation Handlers
window.saveInstitutionRedirectUrl = function(instId, urlOverride = null) {
  const input = document.getElementById(`inst-redirect-url-${instId}`);
  const url = urlOverride || (input ? input.value : '');
  if (!url) {
    alert('Please enter a valid official admission redirect URL.');
    return;
  }
  store.setInstitutionAdmissionRedirectUrl(instId, url);
};

window.toggleAutoModeration = function(key, val) {
  store.toggleAutoModeration(key, val);
};

window.runAutoApprovalBatch = function() {
  return store.runAutoApprovalBatch();
};

window.toggleAdvertiserAutoPilot = function(campId) {
  store.toggleAdvertiserAutoPilot(campId);
};

window.runAdvertiserAutoPilotOptimization = function() {
  store.runAdvertiserAutoPilotOptimization();
};

function enforcePortalAccess(tab) {
  const user = store.state.currentUser;
  const type = user?.accountType || user?.role || 'guest';

  // If attempting to access Admin Panel
  if (tab === 'admin-portal') {
    if (type !== 'admin') {
      store.showToast('⛔ Access Denied: Admin Panel requires verified CollegeSeekers Admin credentials.', 'error');
      return type === 'institution' ? 'institution-portal' : type === 'advertiser' ? 'advertiser-portal' : 'explore';
    }
  }

  // If attempting to access Institution Dashboard
  if (tab === 'institution-portal') {
    if (type !== 'institution' && type !== 'admin') {
      store.showToast('⛔ Access Denied: Institution Portal requires an authorized Institution Admin account.', 'error');
      return type === 'advertiser' ? 'advertiser-portal' : 'explore';
    }
  }

  // If attempting to access Advertiser Dashboard
  if (tab === 'advertiser-portal') {
    if (type !== 'advertiser' && type !== 'admin') {
      store.showToast('⛔ Access Denied: Advertiser Dashboard requires a Brand Advertiser account.', 'error');
      return type === 'institution' ? 'institution-portal' : 'explore';
    }
  }

  return tab;
}

window.setTab = function(tab) {
  const authorizedTab = enforcePortalAccess(tab);
  if (authorizedTab !== tab) {
    tab = authorizedTab;
  }
  store.setActiveTab(tab);
  try {
    if (window.location.hash !== '#' + tab) {
      window.location.hash = tab;
    }
  } catch(e) {}
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function checkUrlHashRoute() {
  try {
    let rawHash = (window.location.hash || '').replace(/^#\/?/, '').trim();
    if (!rawHash) {
      if (store.state.activeTab !== 'explore') store.setActiveTab('explore');
      return;
    }

    // Save pending return URL for deep linking if entering login/register
    if (rawHash === 'login' || rawHash === 'signin' || rawHash === 'register' || rawHash === 'signup') {
      const prev = store.state.activeTab;
      if (prev && !['login', 'register', 'signin', 'signup'].includes(prev)) {
        try { localStorage.setItem('collegeseekers_return_url', prev); } catch(e) {}
      }
    }

    // Enforce wrong-portal protection
    const authorizedTab = enforcePortalAccess(rawHash);
    if (authorizedTab !== rawHash) {
      rawHash = authorizedTab;
      try { window.location.hash = rawHash; } catch(e) {}
    }

    // Review prompt deep link: #review?inst=...&stage=...
    if (rawHash.startsWith('review')) {
      const queryStr = rawHash.includes('?') ? rawHash.split('?')[1] : '';
      const params = new URLSearchParams(queryStr);
      const inst = params.get('inst') || 'iit-ism-dhanbad';
      const stage = params.get('stage') || '1st-year';
      if (store.state.activeTab !== 'explore') store.setActiveTab('explore');
      setTimeout(() => {
        if (typeof window.openStageReviewModal === 'function') {
          window.openStageReviewModal(inst, stage);
        }
      }, 50);
      return;
    }

    // College / School deep link: #college/<id> or #college?id=<id> or #college/<id>/<tab>
    if (rawHash.startsWith('college/') || rawHash.startsWith('college?')) {
      let instId = '';
      let initialTab = '';
      if (rawHash.startsWith('college/')) {
        const parts = rawHash.split('/');
        instId = parts[1]?.split('?')[0];
        if (parts[2]) initialTab = parts[2].split('?')[0];
      } else {
        const params = new URLSearchParams(rawHash.split('?')[1]);
        instId = params.get('id');
        initialTab = params.get('tab');
      }
      if (instId) {
        store.setSelectedCollege(instId);
        if (initialTab) {
          setTimeout(() => {
            if (typeof window.setCollegeTab === 'function') {
              window.setCollegeTab(initialTab);
            }
          }, 50);
        }
      }
      return;
    }

    // Register / Sign-up deep link
    if (rawHash === 'register' || rawHash === 'signup') {
      if (store.state.activeTab !== 'register') {
        store.setActiveTab('register');
      }
      return;
    }

    // Login / Sign-in deep link
    if (rawHash === 'login' || rawHash === 'signin') {
      if (store.state.activeTab !== 'login') {
        store.setActiveTab('login');
      }
      return;
    }

    // Logout deep link
    if (rawHash === 'logout' || rawHash === 'signout') {
      window.handleLogout();
      return;
    }

    // Standard platform tabs
    if (rawHash && rawHash !== store.state.activeTab) {
      store.setActiveTab(rawHash);
    }
  } catch(e) {
    console.error('Routing error:', e);
  }
}

window.handleLogout = function() {
  store.logout(true);
  try { closeModal(); } catch(e) {}
  try {
    if (window.location.hash !== '#explore') {
      window.location.hash = 'explore';
    }
  } catch(e) {}
  render();
};

window.openRegisterPage = function(role = 'student') {
  if (typeof window.setRegisterRole === 'function') {
    window.setRegisterRole(role);
  }
  window.setTab('register');
};

window.addEventListener('hashchange', checkUrlHashRoute);

window.handleSearchInput = function(query) {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    store.setSearchQuery(query);
  }, 200);
};

window.filterCityHubClassification = function(cityHubClassification) {
  store.setFilters({ cityHubClassification });
};

window.setDirectoryViewMode = setDirectoryViewMode;
window.loadMoreColleges = loadMoreColleges;
window.resetVisibleCount = resetVisibleCount;

window.filterState = function(state) {
  resetVisibleCount();
  store.setFilters({ state, city: 'All' });
};

window.filterCity = function(city) {
  store.setFilters({ city });
};

window.filterType = function(collegeType) {
  store.setFilters({ collegeType });
};

window.filterTier = function(tier) {
  store.setFilters({ tier });
};

window.filterSpecificType = function(specificType) {
  store.setFilters({ specificType });
};

window.filterMaxFees = function(maxFees) {
  store.setFilters({ maxFees });
};

window.filterMinRating = function(minRating) {
  store.setFilters({ minRating });
};

window.setSortBy = function(sortBy) {
  store.setFilters({ sortBy });
};

window.resetAllFilters = function() {
  resetVisibleCount();
  store.resetFilters();
};

window.applyQuickFilter = function(type, val) {
  if (type === 'city') {
    store.setFilters({ city: val });
  } else if (type === 'type') {
    store.setFilters({ collegeType: val });
  } else if (type === 'course') {
    store.setSearchQuery(val);
  }
  store.setActiveTab('explore');
};

window.viewCollegeDirect = function(id, subTab = null) {
  store.setSelectedCollege(id);
  if (subTab && typeof window.setCollegeTab === 'function') {
    window.setCollegeTab(subTab);
  }
  try {
    const hash = 'college/' + id + (subTab ? '/' + subTab : '');
    if (window.location.hash !== '#' + hash) {
      window.location.hash = hash;
    }
  } catch(e) {}
};

window.viewCollege = function(id, subTab = null) {
  if (typeof window.openRewardedAdToUnlock === 'function') {
    window.openRewardedAdToUnlock(id, 'details', null, () => {
      window.viewCollegeDirect(id, subTab);
    });
  } else {
    window.viewCollegeDirect(id, subTab);
  }
};
window.openCollegeModal = window.viewCollege;
window.mockData = mockData;
window.store = store;

window.closeCollegeModal = function(e) {
  if (!e || e === true || (e.target && (e.target.id === 'college-modal-backdrop' || !e.target.closest('#college-modal-backdrop > div')))) {
    store.setSelectedCollege(null);
    try {
      const currentTab = store.state.activeTab || 'explore';
      if (window.location.hash.startsWith('#college')) {
        window.location.hash = currentTab;
      }
    } catch(err) {}
  }
};

window.setCollegeTab = setCollegeTab;

window.toggleCompareDirect = function(id) {
  store.toggleComparison(id);
};

window.toggleCompare = function(id) {
  if (typeof window.openRewardedAdToUnlock === 'function') {
    window.openRewardedAdToUnlock(id, 'compare', null, () => {
      window.toggleCompareDirect(id);
    });
  } else {
    window.toggleCompareDirect(id);
  }
};

window.toggleShortlistDirect = function(id) {
  store.toggleShortlist(id);
  render();
};

window.toggleShortlist = function(id) {
  if (typeof window.openRewardedAdToUnlock === 'function') {
    window.openRewardedAdToUnlock(id, 'save', null, () => {
      window.toggleShortlistDirect(id);
    });
  } else {
    window.toggleShortlistDirect(id);
  }
};

window.toggleSaveAndMonitor = function(id) {
  if (typeof window.openRewardedAdToUnlock === 'function') {
    window.openRewardedAdToUnlock(id, 'save', null, () => {
      if (typeof store.toggleSaveAndMonitor === 'function') {
        store.toggleSaveAndMonitor(id);
      } else {
        store.toggleShortlist(id);
      }
      render('college_detail');
    });
  } else {
    if (typeof store.toggleSaveAndMonitor === 'function') {
      store.toggleSaveAndMonitor(id);
    } else {
      store.toggleShortlist(id);
    }
    render('college_detail');
  }
};

window.clearComparison = function() {
  store.state.comparingColleges = [];
  store.notify();
};

window.quickCalculate = function(id) {
  const col = mockData.colleges.find(c => c.id === id);
  if (col) {
    updateCalc('annualTuition', col.annualTuition);
    store.setActiveTab('calculator');
  }
};

window.updateCalc = updateCalc;
window.setCityHub = setCityHub;
window.setMarketplaceCategory = setMarketplaceCategory;
window.setScholarshipFilter = setScholarshipFilter;
window.updateAdvisor = updateAdvisor;
window.updateCampusState = updateCampusState;
window.setCategoryFilter = function(cat) {
  store.setCategoryFilter(cat);
};

// Institution Representative Portal Handlers
window.setPortalInstitution = function(id) {
  store.setPortalInstitution(id);
};

window.handleSaveAdmissionStatus = function(e, instId) {
  if (e) e.preventDefault();
  const form = e ? e.target : null;
  const statusEl = document.querySelector('input[name="admStatus"]:checked');
  const headlineEl = document.getElementById('adm-headline');
  const deadlineEl = document.getElementById('adm-deadline');
  const linkEl = document.getElementById('adm-link');

  const status = statusEl ? statusEl.value : 'Admissions Open';
  const headline = headlineEl ? headlineEl.value : '';
  const deadline = deadlineEl ? deadlineEl.value : '';
  const link = linkEl ? linkEl.value : '';

  store.updateAdmissionStatus(instId, status, headline, deadline, link);
  alert('Admission status and announcement banner updated successfully!');
};

window.toggleAddOfferForm = function() {
  const el = document.getElementById('add-offer-container');
  if (el) el.classList.toggle('hidden');
};

window.handleCreateOffer = function(instId) {
  const title = document.getElementById('new-offer-title')?.value;
  const tag = document.getElementById('new-offer-tag')?.value || 'Merit Offer';
  const desc = document.getElementById('new-offer-desc')?.value;
  const course = document.getElementById('new-offer-course')?.value;
  const deadline = document.getElementById('new-offer-deadline')?.value;

  if (!title || !desc) {
    alert('Please provide an offer title and description.');
    return;
  }

  store.addInstitutionOffer(instId, {
    title,
    tag,
    description: desc,
    applicableCourse: course || 'All Eligible Programs',
    validUntil: deadline || '31st July 2026'
  });

  window.toggleAddOfferForm();
  alert('Institutional offer / fee waiver published successfully!');
};

window.handleDeleteOffer = function(instId, offerId) {
  if (confirm('Are you sure you want to remove this active offer?')) {
    store.deleteInstitutionOffer(instId, offerId);
  }
};

window.handleReplyToReview = function(reviewId, repName) {
  const inputEl = document.getElementById(`reply-input-${reviewId}`);
  const text = inputEl ? inputEl.value : '';
  if (!text.trim()) {
    alert('Please enter your official reply text.');
    return;
  }
  store.respondToReview(reviewId, text, repName);
  alert('Official institutional response posted publicly on review!');
};

window.handleResolveCorrection = function(reportId) {
  store.resolveCorrectionReport(reportId);
  alert('Community correction report accepted and marked verified!');
};

window.upvoteQuestion = function(id) {
  const q = store.state.seniorQuestions.find(item => item.id === id);
  if (q) {
    q.upvotes += 1;
    store.notify();
  }
};

// Modal Openers
window.openOnboarding = function() {
  openModal('onboarding');
};

window.openAuthModal = function() {
  openModal('auth');
};

window.openAddCampusModal = function() {
  openModal('add-campus');
};

window.openAdminPanelModal = function() {
  window.setTab('admin-portal');
};

window.openRoomOwnerManageModal = function() {
  openModal('room-owner-manage');
};

window.openMOUModal = function(instId) {
  openModal('mou', instId);
};

window.openSeatBookingModal = function(instId) {
  openModal('seat-booking', instId);
};

window.handleSignMOU = function(e, instId) {
  if (e && e.preventDefault) e.preventDefault();
  const targetId = instId || document.getElementById('mou-inst-select')?.value || store.state.selectedInstitutionForPortal;
  const rate = document.getElementById('mou-rate-select')?.value || '8% of 1st Year Tuition';
  const name = document.getElementById('mou-sign-name')?.value?.trim();
  const desig = document.getElementById('mou-sign-desig')?.value?.trim();
  const email = document.getElementById('mou-sign-email')?.value?.trim();

  if (!name || !email) {
    alert('Please provide the authorized signatory name and official institutional email.');
    return;
  }

  const updated = store.signMOU(targetId, {
    commissionRate: rate,
    signatoryName: name,
    signatoryDesignation: desig,
    signatoryEmail: email
  });

  closeModal();
  alert(`🎉 Success! Digital Performance MOU signed for ${updated?.name || 'Institution'}.\nCommission Schedule: ${rate}.\nOfficial MOU Partner badge is now active across all directory & search listings!`);
  render();
};

window.handleBookSeatForm = function(e, instId) {
  if (e && e.preventDefault) e.preventDefault();
  const targetId = instId || store.state.selectedCollegeId;
  const inst = mockData.institutions.find(i => i.id === targetId) || { name: 'Partner Institution' };
  const course = document.getElementById('sb-course')?.value || 'General Admissions Stream';
  const studentName = document.getElementById('sb-student-name')?.value?.trim();
  const studentPhone = document.getElementById('sb-student-phone')?.value?.trim();
  const studentEmail = document.getElementById('sb-student-email')?.value?.trim();
  const parentPhone = document.getElementById('sb-parent-phone')?.value?.trim();
  const advanceToken = Number(document.getElementById('sb-advance')?.value || 5000);

  if (!studentName || !studentPhone) {
    alert('Please enter your full name and contact number.');
    return;
  }

  const booking = store.bookSeat({
    institutionId: targetId,
    institutionName: inst.name,
    studentName,
    studentPhone,
    studentEmail,
    parentPhone,
    course,
    advanceToken
  });

  closeModal();
  alert(`🎯 Seat Reservation Confirmed!\n\nReference: ${booking.trackingCode}\nInstitution: ${inst.name}\nCourse: ${course}\nAdvance Token: ₹${advanceToken.toLocaleString()}\n\nYour application has been directly dispatched to the official admissions cell of ${inst.name}. An admissions counselor will reach out to you shortly.`);
  render();
};

window.downloadMOUAgreement = function(instId) {
  const targetId = instId || store.state.selectedInstitutionForPortal;
  const inst = mockData.institutions.find(i => i.id === targetId) || { name: 'Institution', mouContractId: 'CS-MOU-2026' };
  alert(`📄 Downloading Official Executed MOU Document:\n\nContract ID: ${inst.mouContractId || 'CS-MOU-2026'}\nParties: CollegeSeekers.com & ${inst.name}\nCommission Schedule: ${inst.mouCommissionRate || '8% Success Commission (OYO Model)'}\nDigital Hash: SHA256-MOU-${inst.id.toUpperCase()}-VERIFIED\n\nLegal PDF Dossier generated and downloaded successfully!`);
};

window.openReviewModal = function(collegeId) {
  openModal('review', collegeId);
};

window.openQuestionModal = function(collegeId) {
  openModal('question', collegeId);
};

window.openSellModal = function() {
  openModal('sell');
};

window.openModal = openModal;

window.openShortlistDrawer = function() {
  openModal('shortlist');
};

window.handleAdmissionRedirectDirect = function(collegeId, programName = null) {
  const lead = store.logAdmissionReferral(collegeId, programName);
  const refData = store.generateReferralAdmissionUrl(collegeId, programName);
  if (typeof store.showToast === 'function') {
    store.showToast(`Redirecting to official ${refData.shortName || 'university'} admissions portal...`, 'success');
  }
  window.open(refData.url, '_blank');
};

window.handleAdmissionRedirect = function(collegeId, programName = null) {
  if (typeof window.openRewardedAdToUnlock === 'function') {
    window.openRewardedAdToUnlock(collegeId, 'apply', programName);
  } else {
    window.handleAdmissionRedirectDirect(collegeId, programName);
  }
};

window.syncInstitutionFromOfficialWebsite = function(instId) {
  return store.syncInstitutionFromOfficialWebsite(instId);
};

window.shareViaWhatsAppDirect = function(title, route, message) {
  const decodedTitle = decodeURIComponent(title || 'CollegeSeekers');
  const decodedMsg = decodeURIComponent(message || ('Check this out on CollegeSeekers: ' + decodedTitle));
  const baseUrl = window.location.origin + window.location.pathname;
  const shareUrl = route ? `${baseUrl}#${route}` : window.location.href;
  const fullText = `${decodedMsg}\n\n🔗 ${shareUrl}`;
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');
};

window.shareViaWhatsApp = function(title, route, message) {
  if (typeof window.openRewardedAdToUnlock === 'function') {
    window.openRewardedAdToUnlock(route || 'share', 'share', null, () => {
      window.shareViaWhatsAppDirect(title, route, message);
    });
  } else {
    window.shareViaWhatsAppDirect(title, route, message);
  }
};

window.copyPageLinkDirect = function(route, title) {
  const baseUrl = window.location.origin + window.location.pathname;
  const shareUrl = route ? `${baseUrl}#${route}` : window.location.href;
  const decodedTitle = title ? decodeURIComponent(title) : 'Page';

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      if (typeof store.showToast === 'function') {
        store.showToast(`📋 Link for ${decodedTitle} copied to clipboard!`, 'success');
      } else {
        alert('📋 Link copied to clipboard!');
      }
    }).catch(() => {
      fallbackCopyText(shareUrl);
    });
  } else {
    fallbackCopyText(shareUrl);
  }
};

window.copyPageLink = function(route, title) {
  if (typeof window.openRewardedAdToUnlock === 'function') {
    window.openRewardedAdToUnlock(route || 'share', 'share', null, () => {
      window.copyPageLinkDirect(route, title);
    });
  } else {
    window.copyPageLinkDirect(route, title);
  }
};

function fallbackCopyText(text) {
  try {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    if (typeof store.showToast === 'function') {
      store.showToast('📋 Link copied to clipboard!', 'success');
    } else {
      alert('📋 Link copied to clipboard!');
    }
  } catch(e) {
    prompt('Copy this link:', text);
  }
}

window.openAmbassadorModal = function(collegeId = null) {
  // Student peer referral retired as per platform guidelines
  window.handleAdmissionRedirect(collegeId);
};

window.confirmAdmissionLead = function(leadId) {
  store.confirmAdmissionLead(leadId);
  render();
};

window.openAnswerQuestionModal = function(qId) {
  openModal('answer-question', qId);
};

window.openPostRoommateModal = function() {
  openModal('list-pg');
};

window.compareAllShortlisted = function() {
  const ids = store.state.shortlist || [];
  if (ids.length < 2) {
    alert('Please shortlist at least 2 institutions to compare side-by-side.');
    return;
  }
  store.state.comparingColleges = [...ids.slice(0, 4)];
  closeModal();
  window.setTab('compare');
};

window.submitQuestionForm = function() {
  const collegeId = document.getElementById('sq-college')?.value || 'iit-ism-dhanbad';
  const text = document.getElementById('sq-text')?.value?.trim();
  if (!text) {
    alert('Please enter your question for the seniors.');
    return;
  }
  const col = mockData.institutions.find(c => c.id === collegeId) || mockData.colleges.find(c => c.id === collegeId) || { name: 'Institution', shortName: 'Campus' };
  const user = store.state.currentUser || { name: 'Junior Aspirant' };

  store.addSeniorQuestion({
    collegeId,
    collegeName: col.name,
    question: text,
    askedBy: user.name,
    author: user.name,
    category: 'General Advice',
    tags: ['Admissions', col.shortName || 'Campus'],
    seniorAnswer: null
  });

  closeModal();
  store.showToast('Your question was posted to verified seniors!', 'success');
  render();
};

window.submitAnswerQuestionForm = function(qId) {
  const answerText = document.getElementById('ans-text')?.value?.trim();
  if (!answerText) {
    alert('Please enter your answer.');
    return;
  }
  const mentorName = store.state.currentUser?.name || 'Verified Senior Mentor';
  store.answerSeniorQuestion(qId, answerText, mentorName);
  closeModal();
  render();
};

window.submitListPGForm = function(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (!store.requireLogin('listing a PG or property')) return;
  const name = document.getElementById('pg-name')?.value?.trim();
  const type = document.getElementById('pg-type')?.value || 'pg';
  const rentMin = Number(document.getElementById('pg-rent-min')?.value) || 5500;
  const rentMax = Number(document.getElementById('pg-rent-max')?.value) || 8500;
  const location = document.getElementById('pg-location')?.value?.trim() || 'Near Main Gate';
  const distance = document.getElementById('pg-distance')?.value?.trim() || '0.5 km';
  const phone = document.getElementById('pg-phone')?.value?.trim() || '+91 98765 43210';
  const gender = document.getElementById('pg-gender')?.value || 'Any';
  const amenitiesStr = document.getElementById('pg-amenities')?.value?.trim() || 'Wi-Fi, AC, 3 Meals';

  if (!name) {
    alert('Please enter property name.');
    return;
  }

  store.addPropertyListing({
    name,
    type,
    rentMin,
    rentMax,
    location,
    distanceToCollege: distance,
    phone,
    gender,
    amenities: amenitiesStr.split(',').map(s => s.trim()).filter(Boolean)
  });

  closeModal();
  render();
};

window.closeModal = closeModal;

// Persona Switching & Authentication Handlers
window.handleQuickLogin = function(roleKey) {
  store.switchRole(roleKey);
  closeModal();
  const user = store.state.currentUser;
  alert(`Switched to: ${user?.roleBadge || user?.roleLabel || roleKey} (${user?.name})`);
};

window.handleCustomAuth = function(e) {
  if (e && e.preventDefault) e.preventDefault();
  const role = document.getElementById('auth-role')?.value || 'student';
  const name = document.getElementById('auth-name')?.value?.trim() || 'Verified User';
  const contact = document.getElementById('auth-contact')?.value?.trim() || 'user@college.edu';

  const roleLabelMap = {
    student: 'Student',
    room_owner: 'Room Owner / PG Landlord',
    institution: 'Institution Representative',
    admin: 'Super Admin'
  };
  const roleBadgeMap = {
    student: '🎓 Student',
    room_owner: '🏠 Room Owner',
    institution: '🏛️ Institution',
    admin: '🛡️ Admin'
  };

  store.login({
    id: 'usr-' + Date.now(),
    name,
    email: contact.includes('@') ? contact : `${name.toLowerCase().replace(/\s+/g, '')}@campus.edu`,
    phone: contact.includes('@') ? '+91 98765 43210' : contact,
    role,
    roleLabel: roleLabelMap[role] || 'Student',
    roleBadge: roleBadgeMap[role] || '🎓 Student',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    verified: true,
    location: 'India'
  });
  closeModal();
  store.showToast(`Welcome, ${name}! Signed in as ${roleLabelMap[role] || role}.`, 'success');
};

// Campus Registration & Super Admin Moderation Handlers
window.handleRegisterCampusForm = function(e) {
  if (e && e.preventDefault) e.preventDefault();
  const name = document.getElementById('ac-name')?.value?.trim();
  const shortName = document.getElementById('ac-short')?.value?.trim();
  const category = document.getElementById('ac-category')?.value || 'college';
  const collegeType = document.getElementById('ac-type')?.value;
  const established = document.getElementById('ac-est')?.value;
  const state = document.getElementById('ac-state')?.value;
  const city = document.getElementById('ac-city')?.value?.trim();
  const campusArea = document.getElementById('ac-area')?.value?.trim();
  const landmark = document.getElementById('ac-landmark')?.value?.trim();
  const nirfRank = document.getElementById('ac-nirf')?.value;
  const naacGrade = document.getElementById('ac-naac')?.value;
  const tier = document.getElementById('ac-tier')?.value;
  const annualTuition = document.getElementById('ac-tuition')?.value;
  const annualHostelMess = document.getElementById('ac-hostel')?.value;
  const avgCTC = document.getElementById('ac-avg-ctc')?.value;
  const highCTC = document.getElementById('ac-high-ctc')?.value;
  const course = document.getElementById('ac-course')?.value?.trim();
  const curfew = document.getElementById('ac-curfew')?.value;
  const blinkit = document.getElementById('ac-blinkit')?.value;
  const fiveG = document.getElementById('ac-5g')?.value;
  const petrol = document.getElementById('ac-petrol')?.value?.trim();
  const wifi = document.getElementById('ac-wifi')?.value?.trim();
  const zomato = document.getElementById('ac-zomato')?.value?.trim();
  const repName = document.getElementById('ac-rep-name')?.value?.trim();
  const repDesignation = document.getElementById('ac-rep-desig')?.value?.trim();
  const repEmail = document.getElementById('ac-rep-email')?.value?.trim();
  const repPhone = document.getElementById('ac-rep-phone')?.value?.trim();
  const website = document.getElementById('ac-website')?.value?.trim();
  const mouAgree = document.getElementById('ac-mou-agree')?.checked ?? true;

  if (!name) {
    store.showToast('Please enter the institution name.', 'error');
    return;
  }

  const newInst = store.addInstitution({
    name,
    shortName: shortName || name,
    category,
    collegeType,
    established,
    state,
    city,
    campusArea,
    landmark,
    nirfRank,
    naacGrade,
    tier,
    annualTuition,
    annualHostelMess,
    medianCTC: avgCTC,
    highestCTC: highCTC,
    primaryCourse: course,
    repName,
    repDesignation,
    repEmail,
    repPhone,
    officialUrl: website,
    mouPartner: mouAgree,
    mouCommissionRate: '8% of 1st Year Tuition (or ₹25,000/seat)',
    campusDNA: {
      academics: Number(nirfRank) < 50 ? 9.5 : (Number(nirfRank) < 100 ? 8.9 : 8.3),
      roiPayback: Number(avgCTC) > 15 ? '1.8 Yrs' : (Number(avgCTC) > 8 ? '2.4 Yrs' : '3.5 Yrs'),
      hostelFreedom: curfew || 'Liberal / 11 PM',
      hyperlocalDelivery: blinkit || '10 min Blinkit Active',
      connectivity: fiveG || 'Jio 5G True Unlimited',
      chillVibe: '9.4 / 10',
      placementTruthScore: 94
    },
    hyperlocal: {
      blinkitDelivery: blinkit || '10 min Blinkit Active',
      jio5g: fiveG || 'Jio 5G True Unlimited',
      petrolPumpDistance: petrol || '500m (Indian Oil)',
      campusWifi: wifi || '1 Gbps Optical Fiber',
      zomatoCoverage: zomato || '35+ Restaurants Serving Hostels'
    }
  });

  // Open the rich celebratory InstiSync post-registration modal
  openModal('campus-published', newInst);
  store.showToast(`🎉 ${name} published & synchronized across 5 modules!`, 'success');
};

window.toggleMOUFilter = function() {
  const current = store.state.filters.mouOnly;
  store.setFilters({ mouOnly: !current });
};

window.toggleBlinkitFilter = function() {
  const current = store.state.filters.blinkitOnly;
  store.setFilters({ blinkitOnly: !current });
};

window.toggleJio5GFilter = function() {
  const current = store.state.filters.jio5gOnly;
  store.setFilters({ jio5gOnly: !current });
};

window.toggleHighChillFilter = function() {
  const current = store.state.filters.highChillOnly;
  store.setFilters({ highChillOnly: !current });
};

window.toggleDirectApplyFilter = function() {
  const current = store.state.filters.directApplyOnly;
  store.setFilters({ directApplyOnly: !current });
};

window.filterUnder2Lakhs = function() {
  const current = store.state.filters.maxFees;
  store.setFilters({ maxFees: current <= 200000 ? 1500000 : 200000 });
};



window.handleApproveCampus = function(id) {
  store.approveInstitution(id);
  alert('Campus verified and official seal granted!');
};

window.handleDeleteCampus = function(id) {
  if (confirm('Are you sure you want to remove this campus?')) {
    store.deleteInstitution(id);
  }
};

window.handleDeleteReview = function(id) {
  if (confirm('Delete this review?')) {
    store.deleteReview(id);
  }
};

window.handleToggleRoommateStatus = function(id) {
  store.toggleRoommateAvailability(id);
};

window.handleDeleteRoommate = function(id) {
  if (confirm('Remove this vacancy?')) {
    store.deleteRoommateListing(id);
  }
};

window.handleOverlayClick = function(e) {
  if (e.target.id === 'global-modal-overlay') {
    closeModal();
  }
};

window.saveOnboardingForm = function() {
  const roleEl = document.querySelector('input[name="onboardRole"]:checked');
  const nameEl = document.getElementById('ob-name');
  const locEl = document.getElementById('ob-location');
  const courseEl = document.getElementById('ob-course');

  if (nameEl && locEl) {
    store.saveUserProfile({
      name: nameEl.value || 'Student',
      role: roleEl ? roleEl.value : 'Future Student',
      location: locEl.value || 'India',
      targetCourse: courseEl ? courseEl.value : 'Engineering'
    });
  }
  closeModal();
};

window.onReviewInstChange = function(instId) {
  openModal('review', instId);
};

window.submitReviewForm = function(collegeId) {
  const instId = document.getElementById('rev-institute-select')?.value || collegeId;
  const studentName = document.getElementById('rev-student-name')?.value || store.state.userProfile?.name || 'Verified Student';
  const email = document.getElementById('rev-email')?.value;
  const phone = document.getElementById('rev-phone')?.value;
  const programSelect = document.getElementById('rev-program-select')?.value;
  const customCourse = document.getElementById('rev-course')?.value;
  const course = (customCourse && customCourse.trim()) ? customCourse.trim() : ((programSelect && programSelect !== 'Other') ? programSelect : 'B.Tech / Senior Stream');
  const linkedin = document.getElementById('rev-linkedin')?.value;
  const instagram = document.getElementById('rev-instagram')?.value;
  const proofId = document.getElementById('rev-proof-id')?.value;

  const academicYearKey = document.getElementById('rev-academic-year')?.value || '4th-year';
  const yearTitleMap = {
    '1st-year': '1st Year (Freshman)',
    '2nd-year': '2nd Year (Core Engineering / Foundations)',
    '3rd-year': '3rd Year (Industrial Tour & Internships)',
    '4th-year': '4th Year (Senior Placements & Final Degrees)',
    'class-11': 'Class 11 (Foundational School Stream)',
    'class-12': 'Class 12 (Board Prep & Competitive Focus)'
  };
  const academicYearName = yearTitleMap[academicYearKey] || 'Verified Student';
  const calendarYear = document.getElementById('rev-calendar-year')?.value || '2025-26';

  const hostelSelect = document.getElementById('rev-hostel-block-select')?.value;
  const hostelCustom = document.getElementById('rev-hostel-custom')?.value;
  const hostelName = (hostelCustom && hostelCustom.trim()) ? hostelCustom.trim() : (hostelSelect && hostelSelect !== 'Day Scholar' ? hostelSelect : null);

  const parse7Rating = (id) => {
    const val = document.getElementById(id)?.value;
    if (!val || val === 'unexperienced') return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };

  const ratings7 = {
    placement: parse7Rating('rev-rate-placement'),
    faculty: parse7Rating('rev-rate-faculty'),
    transport: parse7Rating('rev-rate-transport'),
    studentLife: parse7Rating('rev-rate-studentLife'),
    practicalLearning: parse7Rating('rev-rate-practicalLearning'),
    valueForMoney: parse7Rating('rev-rate-valueForMoney'),
    placementGuidance: parse7Rating('rev-rate-placementGuidance')
  };

  const getCheckedTags = (name) => {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(cb => cb.value);
  };

  const reasonTags = {
    placement: getCheckedTags('tag-placement'),
    faculty: getCheckedTags('tag-faculty'),
    transport: getCheckedTags('tag-transport'),
    studentLife: getCheckedTags('tag-studentLife'),
    practicalLearning: getCheckedTags('tag-practicalLearning'),
    valueForMoney: getCheckedTags('tag-valueForMoney'),
    placementGuidance: getCheckedTags('tag-placementGuidance')
  };

  const likedMost = document.getElementById('rev-like-most')?.value || document.getElementById('rev-good')?.value || '';
  const shouldImprove = document.getElementById('rev-improve')?.value || document.getElementById('rev-bad')?.value || '';
  const wishIKnew = document.getElementById('rev-wish-before')?.value || document.getElementById('rev-wish')?.value || '';
  const wouldChooseAgainVal = document.querySelector('input[name="rev-choose-again"]:checked')?.value || 'Yes';

  if (!likedMost && !shouldImprove) {
    alert('Please share at least what you liked most or what should improve.');
    return;
  }

  if (!store.requireLogin('publishing a review', () => window.submitReviewForm(collegeId))) return;

  store.addReview({
    collegeId: instId,
    author: studentName,
    course,
    academicStage: academicYearKey,
    calendarYear,
    ratings: ratings7,
    reasonTags,
    likedMost,
    shouldImprove,
    wishIKnew,
    wouldChooseAgain: wouldChooseAgainVal,
    studentProof: {
      verified: !!proofId,
      type: proofId ? 'Student ID & Enrollment Verified' : 'Community Submission'
    },
    socials: {
      linkedin: linkedin || null,
      instagram: instagram || null
    }
  });

  closeModal();
  store.showToast('✅ Course experience published to CollegeSeekers Standardized Rating Engine!', 'success');
};

window.submitQuestionForm = function() {
  const collegeId = document.getElementById('sq-college')?.value || 'iit-ism-dhanbad';
  const text = document.getElementById('sq-text')?.value;

  if (!text) {
    alert('Please write your question.');
    return;
  }

  if (!store.requireLogin('asking a senior question', () => window.submitQuestionForm())) return;

  store.addSeniorQuestion({
    collegeId,
    question: text,
    askedBy: (store.state.userProfile?.name || 'Student') + ' (' + (store.state.userProfile?.role || 'Explorer') + ')',
    seniorAnswer: 'Question posted to active verified seniors. You will receive an in-platform notification once an enrolled mentor posts their verified answer.',
    answeredBy: 'Awaiting Senior Response'
  });

  closeModal();
  alert('Your question has been posted to the campus board!');
};

let sellFormDraft = null;
window.submitSellForm = function() {
  const titleEl = document.getElementById('sell-title');
  if (titleEl && titleEl.value.trim()) {
    sellFormDraft = {
      title: titleEl.value.trim(),
      category: document.getElementById('sell-category')?.value || 'Projects & Academic Equipment',
      type: document.getElementById('sell-type')?.value || 'Buy / Sell',
      price: Number(document.getElementById('sell-price')?.value || 0),
      condition: document.getElementById('sell-condition')?.value || 'Good (Inspected by Student)',
      location: document.getElementById('sell-location')?.value || 'Campus Hostel / Saraidhela',
      sellerName: document.getElementById('sell-seller-name')?.value || store.state.userProfile?.name || 'Student',
      sellerBranch: document.getElementById('sell-seller-branch')?.value || 'Student',
      phone: document.getElementById('sell-phone')?.value || '+91 98351 XXXXX',
      linkedin: document.getElementById('sell-linkedin')?.value || null,
      instagram: document.getElementById('sell-instagram')?.value || null
    };
  }

  const data = sellFormDraft;

  if (!data || !data.title) {
    alert('Please enter an item or service title.');
    return;
  }

  if (!store.requireLogin('listing an item for sale', () => window.submitSellForm())) return;

  store.addMarketplaceItem({
    title: data.title,
    category: data.category,
    type: data.type,
    price: data.price,
    originalPrice: data.price > 0 ? data.price * 2 : 0,
    condition: data.condition,
    college: data.location,
    sellerName: data.sellerName,
    sellerBranch: data.sellerBranch,
    location: data.location,
    phone: data.phone,
    whatsapp: data.phone.replace(/[^0-9]/g, ''),
    linkedin: data.linkedin,
    instagram: data.instagram,
    image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=500&auto=format&fit=crop&q=80'
  });

  sellFormDraft = null;
  closeModal();
  alert('Your listing has been published across the 14-category Student Marketplace!');
};

// Roommate & Flatmate Handlers
window.setRoommateGenderFilter = setRoommateGenderFilter;
window.setRoommateOccupancyFilter = setRoommateOccupancyFilter;
window.setRoommateMaxRentFilter = setRoommateMaxRentFilter;
window.setRoommateCityFilter = setRoommateCityFilter;
window.setRoommateSearchQuery = setRoommateSearchQuery;
window.resetRoommateFilters = function() {
  store.setRoommateFilters({ gender: 'All', occupancy: 'All', maxRent: 20000, city: 'All', query: '' });
};

window.openPostRoommateModal = function() {
  openModal('post-roommate');
};

let roommateFormDraft = null;
window.submitPostRoommateForm = function() {
  const titleEl = document.getElementById('rm-title');
  if (titleEl && titleEl.value.trim()) {
    roommateFormDraft = {
      title: titleEl.value.trim(),
      gender: document.getElementById('rm-gender')?.value || 'Boy',
      occupancy: document.getElementById('rm-occupancy')?.value || 'Single Room',
      rentPerHead: Number(document.getElementById('rm-rent')?.value || 4500),
      depositPerHead: Number(document.getElementById('rm-deposit')?.value || 5000),
      moveInDate: document.getElementById('rm-movein')?.value || 'Immediate',
      location: document.getElementById('rm-location')?.value || 'Campus Area',
      nearInstitution: document.getElementById('rm-near')?.value || 'Campus Main Gate',
      phone: document.getElementById('rm-phone')?.value || '+91 98351 XXXXX',
      linkedin: document.getElementById('rm-linkedin')?.value || 'https://linkedin.com',
      habits: document.getElementById('rm-habits')?.value || 'Non-smoker, friendly'
    };
  }

  const data = roommateFormDraft;

  if (!data || !data.title) {
    alert('Please provide a title for the flat vacancy.');
    return;
  }

  if (!store.requireLogin('posting a roommate vacancy', () => window.submitPostRoommateForm())) return;

  store.addRoommateListing({
    title: data.title,
    gender: data.gender,
    occupancy: data.occupancy,
    rentPerHead: data.rentPerHead,
    depositPerHead: data.depositPerHead,
    moveInDate: data.moveInDate,
    location: data.location,
    nearInstitution: data.nearInstitution,
    city: data.location.includes(',') ? data.location.split(',')[1].trim() : 'Dhanbad',
    amenities: ['High Speed Wi-Fi', 'Attached Washroom', 'Kitchen Setup', 'RO Water', 'Power Backup'],
    preferences: {
      diet: 'Flexible',
      habits: data.habits,
      lookingFor: `Looking for ${data.gender.toLowerCase()} roommate for ${data.occupancy.toLowerCase()}`
    },
    postedBy: {
      name: store.state.userProfile?.name || 'Verified Student',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      verifiedStudent: true,
      college: store.state.userProfile?.college || 'Engineering College',
      branchYear: store.state.userProfile?.targetCourse || 'Student',
      contactNumber: data.phone,
      whatsapp: data.phone.replace(/[^0-9]/g, ''),
      socialProfiles: {
        linkedin: data.linkedin
      }
    },
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80'
  });

  roommateFormDraft = null;
  closeModal();
  alert('Your roommate & flat vacancy listing has been published successfully!');
};

// Roommate Finder Filter Handlers
window.setRoommateGenderFilter = setRoommateGenderFilter;
window.setRoommateOccupancyFilter = setRoommateOccupancyFilter;
window.setRoommateMaxRentFilter = setRoommateMaxRentFilter;
window.setRoommateCityFilter = setRoommateCityFilter;
window.setRoommateSearchQuery = setRoommateSearchQuery;
window.toggleRoommateHyperFilter = toggleRoommateHyperFilter;

// Senior Connect & Review Consultation Handlers
window.setSeniorCategoryFilter = setSeniorCategoryFilter;
window.setSeniorSearchQuery = setSeniorSearchQuery;
window.setSeniorCityFilter = setSeniorCityFilter;
window.setSeniorInstFilter = setSeniorInstFilter;
window.setSeniorConnectTab = setSeniorConnectTab;

// Marketplace Filter Handlers
window.setMarketplaceCategory = setMarketplaceCategory;
window.setMarketplaceCityFilter = setMarketplaceCityFilter;
window.setMarketplaceInstFilter = setMarketplaceInstFilter;
window.setMarketplaceSearchQuery = setMarketplaceSearchQuery;
window.confirmMyListingActive = confirmMyListingActive;

window.openSeniorReviewModal = function(mentorId) {
  openModal('senior-review', mentorId);
};

window.openSeniorOnboardingModal = function() {
  openModal('senior-onboard');
};

window.submitSeniorReviewQuestion = function(mentorId) {
  const q = document.getElementById('sr-question')?.value;
  const contact = document.getElementById('sr-contact')?.value;

  if (!q) {
    alert('Please enter your review question or doubt.');
    return;
  }

  const mentor = mockData.seniors.find(s => s.id === mentorId);
  store.addSeniorQuestion({
    collegeId: mentor ? mentor.collegeId : 'iit-ism-dhanbad',
    question: q,
    askedBy: store.state.userProfile.name + ' (' + (contact || 'LinkedIn Connect') + ')',
    seniorAnswer: `Direct review consultation request delivered to ${mentor ? mentor.name : 'Senior'}. You can also connect directly via their verified LinkedIn: ${mentor?.linkedin || ''}`,
    answeredBy: mentor ? mentor.name : 'Senior Mentor',
    seniorLinkedin: mentor?.linkedin,
    seniorGithub: mentor?.github
  });

  closeModal();
  alert(`Your review inquiry has been sent to ${mentor ? mentor.name : 'the senior mentor'}!`);
};

window.submitSeniorOnboardForm = function() {
  const name = document.getElementById('sm-name')?.value;
  const college = document.getElementById('sm-college')?.value;
  const branch = document.getElementById('sm-branch')?.value;
  const linkedin = document.getElementById('sm-linkedin')?.value;
  const phone = document.getElementById('sm-phone')?.value;
  const instagram = document.getElementById('sm-instagram')?.value;
  const specialty = document.getElementById('sm-specialty')?.value;

  if (!name || !college || !linkedin) {
    alert('Please provide your name, college, and verified LinkedIn profile link.');
    return;
  }

  mockData.seniors.unshift({
    id: 'sen-' + Date.now(),
    name,
    collegeId: 'custom-college',
    collegeName: college,
    branch: branch || 'Student Senior',
    year: 'Verified Mentor',
    badge: 'Verified Senior Mentor',
    specialty: specialty || 'Campus Placements & Academic Reviews',
    reviewSpecialty: specialty || 'Honest college reality, hostel and curriculum reviews',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    linkedin,
    instagram,
    phone,
    whatsapp: phone ? phone.replace(/[^0-9]/g, '') : '',
    answersGiven: 1,
    helpScore: 100
  });

  closeModal();
  render();
  alert('Welcome to the Student Mentorship Network! Your profile and LinkedIn badge are now live.');
};

// Ads Monetization & Rewarded Ad Unlocking Handlers
window.openRewardedAdToUnlock = openRewardedAdToUnlock;
window.closeRewardedAdModal = closeRewardedAdModal;
window.claimAndUnlockContact = claimAndUnlockContact;
window.isContactUnlocked = isContactUnlocked;
window.setMarketMode = setMarketMode;

window.dismissFloatingDeal = function() {
  isFloatingDealDismissed = true;
  render();
};

window.openDealsModal = function() {
  openModal('deals');
};

window.openCutoffReportModal = function(collegeId) {
  openModal('cutoff-ad', collegeId);
  triggerCutoffAdTimer();
};

window.downloadCutoffReport = function(collegeId) {
  const col = mockData.institutions.find(i => i.id === collegeId) || { name: 'Institution' };
  closeModal();
  alert(`Official 2026 Cutoff & Placement CTC Dossier for ${col.name} downloaded successfully!`);
};

window.copyDealCoupon = function(code) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(() => {
      alert(`Coupon code "${code}" copied to clipboard! Apply at checkout.`);
    }).catch(() => {
      alert(`Coupon code: ${code}`);
    });
  } else {
    alert(`Coupon code: ${code}`);
  }
};

// Google AdSense Management Handlers
window.openAdSenseModal = function() {
  openModal('adsense');
};

window.saveAdSenseSettingsFromForm = function() {
  const pubId = document.getElementById('adsense-pub-id')?.value?.trim() || 'ca-pub-9847120394812345';
  const mode = document.querySelector('input[name="adMode"]:checked')?.value || 'preview';
  const leaderboardSlot = document.getElementById('adsense-slot-leaderboard')?.value?.trim() || '1234567890';
  const inFeedSlot = document.getElementById('adsense-slot-infeed')?.value?.trim() || '2345678901';
  const rectSlot = document.getElementById('adsense-slot-rect')?.value?.trim() || '3456789012';
  const modalSlot = document.getElementById('adsense-slot-modal')?.value?.trim() || '4567890123';

  saveAdSenseConfig({
    publisherId: pubId,
    isLiveMode: mode === 'live',
    slots: {
      leaderboard: leaderboardSlot,
      inFeed: inFeedSlot,
      rectangle: rectSlot,
      modalBanner: modalSlot
    }
  });

  closeModal();
  render();
  alert(`Google AdSense configuration updated successfully!\nActive Publisher ID: ${pubId}\nMode: ${mode.toUpperCase()}`);
};

// Explore & Chill and Hourly Rooms Handlers
window.openChillReviewModal = openChillReviewModal;
window.closeChillReviewModal = closeChillReviewModal;
window.openHourlyBookingModal = openHourlyBookingModal;
window.closeHourlyBookingModal = closeHourlyBookingModal;
window.closeBookingConfirmationModal = closeBookingConfirmationModal;
window.updateVibeSlider = updateVibeSlider;
window.toggleReviewTag = toggleReviewTag;
window.setBookingHours = setBookingHours;
window.setBookingGuests = setBookingGuests;
window.submitChillReview = submitChillReview;
window.confirmHourlyBooking = confirmHourlyBooking;
window.shareChillSpot = shareChillSpot;
window.shareBookingWhatsApp = shareBookingWhatsApp;
let _chillSearchTimer = null;
window.setChillFilter = function(key, val) {
  store.setChillFilter(key, val);
  if (key === 'query') {
    if (_chillSearchTimer) clearTimeout(_chillSearchTimer);
    _chillSearchTimer = setTimeout(() => {
      render();
    }, 150);
  } else {
    render();
  }
};
window.upvoteReview = function(revId) {
  store.upvoteChillReview(revId);
  render();
};

// Initial Subscribe & Reactive Render
store.subscribe((state, changeType) => render(changeType));

// Immediate and robust execution: execute render() right away
checkUrlHashRoute();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    checkUrlHashRoute();
    render('initial');
    // 🔄 Zero-cost live data refresh — fires after first render, updates data silently
    loadLiveOverrides(mockData);
  });
} else {
  render('initial');
  // 🔄 Zero-cost live data refresh — fires after first render, updates data silently
  loadLiveOverrides(mockData);
}


// Phase 4 & 5 Global Exposing
window.renderCampusEvents = renderCampusEvents;
window.renderCampusMap = renderCampusMap;
window.renderMovingChecklist = renderMovingChecklist;
window.renderClaimInstitutionModal = renderClaimInstitutionModal;
window.renderDigitalMOUModal = renderDigitalMOUModal;
window.renderRegisterPage = renderRegisterPage;
window.renderBusinessPortal = renderBusinessPortal;
window.setBusinessSection = setBusinessSection;
window.renderJobsCareer = renderJobsCareer;
window.renderJobGiverPortal = renderJobGiverPortal;

// End of CollegeSeekers Application Engine



