// DOM Elements
const plannerForm = document.getElementById('plannerForm');
const userContext = document.getElementById('userContext');
const budgetLimit = document.getElementById('budgetLimit');
const welcomeState = document.getElementById('welcomeState');
const loaderState = document.getElementById('loaderState');
const workspaceState = document.getElementById('workspaceState');
const mealsGrid = document.getElementById('mealsGrid');
const taskList = document.getElementById('taskList');
const groceryList = document.getElementById('groceryList');
const substitutionList = document.getElementById('substitutionList');
const budgetBanner = document.getElementById('budgetBanner');
const budgetBannerTitle = document.getElementById('budgetBannerTitle');
const budgetBannerDesc = document.getElementById('budgetBannerDesc');
const budgetBannerIcon = document.getElementById('budgetBannerIcon');
const mockModeCheckbox = document.getElementById('mockMode');
const checkoutPremiumBtn = document.getElementById('btnCheckoutPremium');
const headerUpgradeBtn = document.getElementById('headerUpgradeBtn');

// Navigation Tabs
const sidebarLinks = document.querySelectorAll('.nav-link');
const viewPanes = document.querySelectorAll('.view-pane');

// Inner Workspace tabs
const workspaceTabs = document.querySelectorAll('.w-tab-btn');
const workspacePanes = document.querySelectorAll('.w-tab-pane');

// Video Elements
const simVideo = document.getElementById('simVideo');
const playBtnOverlay = document.getElementById('playBtnOverlay');
const btnPlayPause = document.getElementById('btnPlayPause');
const btnMute = document.getElementById('btnMute');
const btnReset = document.getElementById('btnReset');
const telemetryTimer = document.getElementById('telemetryTimer');

// Dynamic Mock Data (Epicure branded)
const mockPlanData = {
  meals: [
    { type: 'Epicure-Breakfast', name: 'High-Protein Grain Oats with Organic Honey', desc: 'Light rolled oats steamed in coconut milk, seasoned with wild honey, sliced bananas, and pure whey isolate.', cost: 120 },
    { type: 'Epicure-Lunch', name: 'Mediterranean Herb Chicken & Saffron Rice Bowl', desc: 'Tender chicken slices marinated in lemon-oregano glaze, served on long-grain saffron rice with steamed broccoli florets.', cost: 180 },
    { type: 'Epicure-Dinner', name: 'Spiced Paneer Scramble & Wilted Spinach Sourdough', desc: 'Whipped egg white scramble loaded with freshly grated paneer, organic baby spinach, and grilled artisan sourdough toast.', cost: 110 }
  ],
  tasks: [
    { text: 'Mise en place: Wash, chop, and portion green vegetables & fresh toppings' },
    { text: 'Simmer long-grain saffron rice and prepare broccoli in double-boiler' },
    { text: 'Sear organic chicken breast in light extra virgin olive oil (5-7 mins)' },
    { text: 'Whisk eggs and scramble with fresh baby spinach and spices' },
    { text: 'Prepare rolled oats base and garnish with banana toppings' }
  ],
  grocery: [
    { name: 'Rolled Oats', qty: '150g' },
    { name: 'Wild Honey', qty: '1 bottle' },
    { name: 'Saffron Rice', qty: '250g' },
    { name: 'Organic Chicken Breast', qty: '300g' },
    { name: 'Fresh Paneer', qty: '150g' },
    { name: 'Broccoli & Baby Spinach', qty: '1 unit' }
  ],
  substitutions: [
    { original: 'Chicken Breast', replacement: 'Organic Firm Tofu / Seitan Strips' },
    { original: 'Whey Isolate', replacement: 'Hemp Seed Protein powder' },
    { original: 'Saffron Rice', replacement: 'Red Quinoa / Couscous grains' }
  ]
};

// Initialize Lucide Icons
lucide.createIcons();

// Sidebar tab switches
sidebarLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const tabName = link.getAttribute('data-tab');
    
    sidebarLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    
    viewPanes.forEach(pane => {
      pane.classList.remove('active');
      if (pane.id === paneIdMap[tabName]) {
        pane.classList.add('active');
      }
    });

    // Update Header Breadcrumbs
    const headerTitle = document.querySelector('.workspace-header h2');
    const breadcrumb = document.querySelector('.breadcrumbs');
    if (tabName === 'navDash') {
      headerTitle.textContent = 'Orchestrator Console';
      breadcrumb.textContent = 'Home / Orchestrator';
    } else if (tabName === 'navSim') {
      headerTitle.textContent = 'Simulator Console';
      breadcrumb.textContent = 'Home / Simulation';
    } else if (tabName === 'navBill') {
      headerTitle.textContent = 'Payment & Billing';
      breadcrumb.textContent = 'Home / Upgrade';
    }
  });
});

const paneIdMap = {
  navDash: 'paneDash',
  navSim: 'paneSim',
  navBill: 'paneBill'
};

// Inner dashboard output tabs
workspaceTabs.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-target');
    workspaceTabs.forEach(t => t.classList.remove('active'));
    workspacePanes.forEach(p => p.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(target).classList.add('active');
  });
});

// Quick-upgrade trigger shortcuts
headerUpgradeBtn.addEventListener('click', () => {
  document.querySelector('[data-tab="navBill"]').click();
});

// Video Simulation controls
let telemetryInterval;
playBtnOverlay.addEventListener('click', toggleVideoPlayback);
btnPlayPause.addEventListener('click', toggleVideoPlayback);

function toggleVideoPlayback() {
  if (simVideo.paused) {
    simVideo.play().then(() => {
      playBtnOverlay.classList.add('inactive');
      btnPlayPause.innerHTML = '<i data-lucide="pause"></i> Pause';
      lucide.createIcons();
      startTelemetryTimer();
    }).catch(e => {
      console.warn("Local video play blocked or missing", e);
      // Fallback: simulate timer anyway to show UI feedback
      startTelemetryTimer();
    });
  } else {
    simVideo.pause();
    btnPlayPause.innerHTML = '<i data-lucide="play"></i> Play';
    lucide.createIcons();
    clearInterval(telemetryInterval);
  }
}

btnMute.addEventListener('click', () => {
  simVideo.muted = !simVideo.muted;
  btnMute.innerHTML = simVideo.muted ? 
    '<i data-lucide="volume-x"></i> Unmute' : 
    '<i data-lucide="volume-2"></i> Mute';
  lucide.createIcons();
});

btnReset.addEventListener('click', () => {
  simVideo.currentTime = 0;
  if (simVideo.paused) {
    toggleVideoPlayback();
  }
});

function startTelemetryTimer() {
  clearInterval(telemetryInterval);
  let seconds = 0;
  telemetryInterval = setInterval(() => {
    seconds++;
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    telemetryTimer.textContent = `${hrs}:${mins}:${secs}`;
  }, 1000);
}

// Payment/Billing integration checkout protocol (Razorpay Simulation)
checkoutPremiumBtn.addEventListener('click', () => {
  const options = {
    key: 'rzp_test_T0n4Vjd6csVHk6', // Injected from credentials list
    amount: 29900, // INR 299 in paisa
    currency: 'INR',
    name: 'Epicure AI',
    description: 'Upgrade to Elite Gastronomy Protocol',
    handler: function (response) {
      alert(`Payment Succeeded! ID: ${response.razorpay_payment_id}`);
      // Elevate User tier visually
      document.querySelector('.user-badge').textContent = 'Elite Active';
      document.querySelector('.user-badge').style.color = '#ffb703';
      checkoutPremiumBtn.textContent = 'Elite Active';
      checkoutPremiumBtn.disabled = true;
    },
    prefill: {
      name: 'Avanish Kasar',
      email: 'avanishkasar57@gmail.com'
    },
    theme: {
      color: '#00e5ff'
    }
  };

  // Simulate payment processing sandbox visually
  const confirmPayment = confirm("Simulate Razorpay checkout transaction of ₹299 for Epicure Elite Tier?");
  if (confirmPayment) {
    const mockPaymentId = 'pay_mock_' + Math.random().toString(36).substring(2, 11);
    options.handler({ razorpay_payment_id: mockPaymentId });
  }
});

// Dynamic form submission verification gates
plannerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  let isValid = true;

  if (!userContext.value.trim()) {
    document.getElementById('contextError').style.display = 'block';
    userContext.parentElement.classList.add('invalid');
    isValid = false;
  } else {
    document.getElementById('contextError').style.display = 'none';
    userContext.parentElement.classList.remove('invalid');
  }

  const budget = parseFloat(budgetLimit.value);
  if (isNaN(budget) || budget < 50) {
    document.getElementById('budgetError').style.display = 'block';
    budgetLimit.parentElement.parentElement.classList.add('invalid');
    isValid = false;
  } else {
    document.getElementById('budgetError').style.display = 'none';
    budgetLimit.parentElement.parentElement.classList.remove('invalid');
  }

  if (!isValid) return;

  // Swap output views
  welcomeState.classList.remove('active');
  workspaceState.classList.remove('active');
  loaderState.classList.add('active');

  try {
    let result;
    if (mockModeCheckbox.checked) {
      await new Promise(resolve => setTimeout(resolve, 1200));
      result = mockPlanData;
    } else {
      result = await callRealAI(userContext.value, budget);
    }
    renderPlan(result, budget);
  } catch (error) {
    console.error('Plan mapping failed', error);
    renderPlan(mockPlanData, budget);
  }
});

async function callRealAI(context, budget) {
  const response = await fetch('/api/epicure-generate-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context, budget })
  });
  if (!response.ok) throw new Error('API Execution Error');
  return response.json();
}

function renderPlan(data, userBudget) {
  // Render Meals grid
  mealsGrid.innerHTML = '';
  let totalCost = 0;

  data.meals.forEach(meal => {
    totalCost += meal.cost;
    const card = document.createElement('div');
    card.className = 'meal-card';
    card.innerHTML = `
      <span class="meal-type">${meal.type}</span>
      <h3>${meal.name}</h3>
      <p>${meal.desc}</p>
      <div class="meal-cost">Cost: ₹${meal.cost}</div>
    `;
    mealsGrid.appendChild(card);
  });

  // Verify budget banners
  budgetBanner.className = 'budget-analytics-card';
  if (totalCost <= userBudget) {
    budgetBanner.classList.add('success');
    budgetBannerTitle.textContent = `Budget Check: Feasible (₹${totalCost} / ₹${userBudget})`;
    budgetBannerDesc.textContent = 'Estimated meal structure fits securely inside your configured limits.';
    budgetBannerIcon.setAttribute('data-lucide', 'shield-check');
  } else {
    budgetBanner.classList.add('warning');
    budgetBannerTitle.textContent = `Budget Check: Over Limit (₹${totalCost} / ₹${userBudget})`;
    budgetBannerDesc.textContent = 'Costs exceed user targets. Check substitutions to optimize resource limits.';
    budgetBannerIcon.setAttribute('data-lucide', 'alert-triangle');
  }

  // Render check list
  taskList.innerHTML = '';
  data.tasks.forEach((task, idx) => {
    const item = document.createElement('li');
    item.className = 'task-item';
    item.innerHTML = `
      <input type="checkbox" id="task-${idx}" class="task-checkbox">
      <label for="task-${idx}" class="task-text">${task.text}</label>
    `;
    item.querySelector('.task-checkbox').addEventListener('change', (e) => {
      item.classList.toggle('completed', e.target.checked);
    });
    taskList.appendChild(item);
  });

  // Render Groceries
  groceryList.innerHTML = '';
  data.grocery.forEach(g => {
    const item = document.createElement('li');
    item.innerHTML = `<span>${g.name}</span> <span>${g.qty}</span>`;
    groceryList.appendChild(item);
  });

  // Render substitutions
  substitutionList.innerHTML = '';
  data.substitutions.forEach(s => {
    const item = document.createElement('li');
    item.innerHTML = `
      <span class="sub-original">${s.original}</span>
      <span class="sub-replacement">↳ Use ${s.replacement}</span>
    `;
    substitutionList.appendChild(item);
  });

  // Re-generate Lucide Icons
  lucide.createIcons();

  // Swap panels
  loaderState.classList.remove('active');
  workspaceState.classList.add('active');
}
