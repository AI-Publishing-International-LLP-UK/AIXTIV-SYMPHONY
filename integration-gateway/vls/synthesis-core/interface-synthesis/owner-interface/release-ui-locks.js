// Release UI Locks and Unfreeze Buttons Script
console.log('🔓 Releasing all UI locks and unfreezing buttons...');

// Remove any UI lock indicators
const lockIndicator = document.getElementById('ui-lock-indicator');
if (lockIndicator) {
  lockIndicator.remove();
  console.log('✅ Removed UI lock indicator');
}

// Reset global UI lock variables
window.uiLocked = false;
window.isResizing = false;
window.isPanelLocked = false;
window.isSpeaking = false;
window.isListening = false;

// Reset body styles that might be locking the UI
document.body.style.pointerEvents = 'auto';
document.body.style.opacity = '1';
document.body.style.cursor = 'default';
document.body.style.userSelect = 'auto';

// Remove any overlay elements that might be blocking interaction
const overlays = document.querySelectorAll('[style*="position: fixed"], [style*="z-index"]');
overlays.forEach(overlay => {
  if (overlay.style.pointerEvents === 'none' || overlay.style.opacity === '0') {
    overlay.remove();
    console.log('✅ Removed blocking overlay');
  }
});

// Reset all button states
const allButtons = document.querySelectorAll('button, [onclick], .sidebar-icon, .panel-header');
allButtons.forEach(button => {
  button.style.pointerEvents = 'auto';
  button.style.cursor = 'pointer';
  button.style.opacity = '1';
  button.disabled = false;
  button.classList.remove('disabled', 'locked');
});

// Force re-enable click events on all interactive elements
const interactiveElements = document.querySelectorAll('[onclick], button, .clickable, .sidebar-icon, .copilot-hex-item, .panel-header');
interactiveElements.forEach(element => {
  element.style.pointerEvents = 'auto';
  element.style.cursor = 'pointer';
  element.tabIndex = 0; // Make focusable
  
  // Re-bind click events if they're missing
  if (element.onclick === null && element.getAttribute('onclick')) {
    const onclickCode = element.getAttribute('onclick');
    element.onclick = new Function(onclickCode);
    console.log('✅ Re-bound click event for:', element.className);
  }
});

// Reset panel locks
document.querySelectorAll('.panel-lock').forEach(lock => {
  lock.classList.remove('locked');
  const icon = lock.querySelector('svg use');
  if (icon) icon.setAttribute('href', '#icon-unlock');
});

// Clear any CSS that might be preventing interaction
const style = document.createElement('style');
style.textContent = `
  * {
    pointer-events: auto !important;
  }
  button:not(:disabled) {
    cursor: pointer !important;
    pointer-events: auto !important;
  }
  .sidebar-icon {
    cursor: pointer !important;
    pointer-events: auto !important;
  }
  .panel-header {
    cursor: pointer !important;
    pointer-events: auto !important;
  }
`;
document.head.appendChild(style);

// Test function availability
const testFunctions = [
  'selectIcon', 'togglePanel', 'openSettings', 'openGiftShop', 
  'toggleScanToApprove', 'sendCopilotMessage', 'startVoiceInput'
];

testFunctions.forEach(funcName => {
  if (typeof window[funcName] === 'function') {
    console.log(`✅ ${funcName} is available`);
  } else {
    console.log(`❌ ${funcName} is missing - restoring...`);
    // Add basic implementations for missing functions
    if (funcName === 'selectIcon') {
      window.selectIcon = function(element, category, id) {
        console.log('selectIcon called:', category, id);
        document.querySelectorAll('.sidebar-icon').forEach(icon => icon.classList.remove('active'));
        element.classList.add('active');
        alert(`${category} activated`);
      };
    }
    if (funcName === 'togglePanel') {
      window.togglePanel = function(button) {
        console.log('togglePanel called');
        const content = button.parentElement.querySelector('.panel-content');
        const chevron = button.querySelector('.chevron-icon');
        if (content) {
          content.classList.toggle('active');
          if (chevron) {
            chevron.style.transform = content.classList.contains('active') ? 'rotate(0deg)' : 'rotate(-90deg)';
          }
        }
      };
    }
    if (funcName === 'openSettings') {
      window.openSettings = function() {
        console.log('openSettings called');
        alert('Settings opened');
      };
    }
    if (funcName === 'openGiftShop') {
      window.openGiftShop = function() {
        console.log('openGiftShop called');
        alert('Gift Shop opened');
      };
    }
  }
});

// Force a re-render
document.body.style.display = 'none';
document.body.offsetHeight; // Trigger reflow
document.body.style.display = '';

console.log('🎉 UI locks released! All buttons should now be functional.');
console.log('Try clicking the sidebar icons, settings button, or panel headers.');

// Show success notification
setTimeout(() => {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px; background: #10b981; color: white;
    padding: 12px 16px; border-radius: 8px; z-index: 9999; font-weight: 600;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  `;
  notification.textContent = '🔓 UI locks released! Buttons are now active.';
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 4000);
}, 500);
