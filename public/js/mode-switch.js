// Mode Switch Functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize mode from localStorage or default to standard
  let currentMode = localStorage.getItem('uiMode') || 'standard';
  
  // Update UI with current mode
  updateModeDisplay(currentMode);
  
  // Check if mode-switch element exists
  const modeSwitch = document.getElementById('mode-switch');
  if (modeSwitch) {
    modeSwitch.textContent = currentMode;
    
    // Add click handler if it's interactive
    modeSwitch.addEventListener('click', function() {
      // Cycle through modes: standard -> advanced -> experimental -> standard
      switch(currentMode) {
        case 'standard':
          setMode('advanced');
          break;
        case 'advanced':
          setMode('experimental');
          break;
        case 'experimental':
          setMode('standard');
          break;
        default:
          setMode('standard');
      }
    });
  }
  
  function setMode(mode) {
    currentMode = mode;
    localStorage.setItem('uiMode', mode);
    updateModeDisplay(mode);
    
    // You would typically load different features based on mode
    loadFeaturesForMode(mode);
  }
  
  function updateModeDisplay(mode) {
    const modeSwitch = document.getElementById('mode-switch');
    if (modeSwitch) {
      modeSwitch.textContent = mode;
    }
    
    // Add/remove CSS classes based on mode
    document.body.classList.remove('mode-standard', 'mode-advanced', 'mode-experimental');
    document.body.classList.add('mode-' + mode);
  }
  
  function loadFeaturesForMode(mode) {
    // This would make API calls to load appropriate features
    console.log('Loading features for mode: ' + mode);
    
    // Example: fetch mode configuration
    fetch('/api/config/mode/' + mode)
      .then(response => response.json())
      .then(config => {
        console.log('Mode config loaded:', config);
        // Apply configuration
      })
      .catch(error => {
        console.error('Error loading mode config:', error);
      });
  }
});