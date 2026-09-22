// Initialize calculator
const calculator = new WindCalculator();

// Constants
const DISTANCE_TOLERANCE = 0.01; // Tolerance for matching distance preset values
const DRAG_THRESHOLD = 0.02; // Minimum movement to consider as drag vs click

// State
let selectedClubType = 'drivers';
let selectedClubName = null;
let selectedClubRarity = null;
let selectedLevel = null;

// Store selected clubs and levels for each tab
const selectedClubsByTab = {
  drivers: null,
  woods: null,
  longirons: null,
  shortirons: null,
  wedges: null,
  roughirons: null,
  sandwedges: null
};

const selectedLevelsByTab = {
  drivers: null,
  woods: null,
  longirons: null,
  shortirons: null,
  wedges: null,
  roughirons: null,
  sandwedges: null
};

// Get DOM elements
const clubTypeTabGroup = document.getElementById('clubTypeTabGroup');
const powerLevelSlider = document.getElementById('powerLevel');
const powerLevelValue = document.getElementById('powerLevelValue');
const windSpeedInput = document.getElementById('windSpeed');
const resultDiv = document.getElementById('result');

// Power Ball state (no longer using a slider)
let currentPowerBall = 2; // Default value

// Elevation state (no longer using a slider)
let currentElevation = 10; // Default value

// Power level is now a 0-1 ratio

// Create button groups for each club type
function populateClubButtons() {
  const clubTypes = ['drivers', 'woods', 'longirons', 'shortirons', 'wedges', 'roughirons', 'sandwedges'];

  clubTypes.forEach(clubType => {
    const container = document.getElementById(`clubButtons-${clubType}`);
    const buttonGroup = document.createElement('sl-button-group');
    const clubs = calculator.clubData[clubType] || [];

    clubs.forEach((club, index) => {
      const button = document.createElement('sl-button');

      // Create image element instead of text
      const img = document.createElement('img');
      img.src = `images/${club.image}`;
      img.alt = club.name;
      img.title = club.name;
      img.className = 'club-image';
      img.loading = 'lazy'; // Native lazy loading
      img.onerror = () => {
        console.warn(`Image not found: ${club.image}`);
        img.style.display = 'none';
      };
      button.appendChild(img);

      button.setAttribute('data-club-name', club.name);
      button.setAttribute('data-club-type', club.type);
      button.size = 'small';

      button.addEventListener('click', () => {
        selectClub(clubType, club.name, club.type, buttonGroup);
      });

      buttonGroup.appendChild(button);
    });

    container.appendChild(buttonGroup);

    // Auto-select first club on initial load
    if (clubType === selectedClubType && clubs.length > 0) {
      selectClub(clubType, clubs[0].name, clubs[0].type, buttonGroup);
    }
  });
}

// Select a club and update button states
function selectClub(clubType, clubName, clubRarity, buttonGroup) {
  selectedClubType = clubType;
  selectedClubName = clubName;
  selectedClubRarity = clubRarity;

  // Remember this selection for the tab
  selectedClubsByTab[clubType] = {
    name: clubName,
    rarity: clubRarity
  };

  // Update button states
  const buttons = buttonGroup.querySelectorAll('sl-button');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-club-name') === clubName) {
      btn.variant = 'primary';
    } else {
      btn.variant = 'default';
    }
  });

  // Populate levels
  populateLevelButtons();
  calculate();
}

// Populate level button group based on club rarity
function populateLevelButtons() {
  let maxLevel;
  switch (selectedClubRarity) {
    case 'Common':
      maxLevel = 10;
      break;
    case 'Rare':
      maxLevel = 9;
      break;
    case 'Epic':
      maxLevel = 8;
      break;
    default:
      maxLevel = 1; // For Beginner, Golden, Fixed types
  }

  const levelButtonsContainer = document.getElementById(`levelButtons-${selectedClubType}`);
  levelButtonsContainer.innerHTML = '';
  const buttonGroup = document.createElement('sl-button-group');

  for (let i = 1; i <= maxLevel; i++) {
    const button = document.createElement('sl-button');
    button.textContent = i;
    button.setAttribute('data-level', i);
    button.size = 'small';

    button.addEventListener('click', () => {
      selectLevel(i, buttonGroup);
    });

    buttonGroup.appendChild(button);
  }

  levelButtonsContainer.appendChild(buttonGroup);

  // Check if there's a previously selected level for this tab
  const previousLevel = selectedLevelsByTab[selectedClubType];
  if (previousLevel && previousLevel <= maxLevel) {
    selectLevel(previousLevel, buttonGroup);
  } else {
    // Default to last level
    selectLevel(maxLevel, buttonGroup);
  }
}

// Select a level and update button states
function selectLevel(level, buttonGroup) {
  selectedLevel = level;

  // Remember this level selection for the tab
  selectedLevelsByTab[selectedClubType] = level;

  // Update button states
  const buttons = buttonGroup.querySelectorAll('sl-button');
  buttons.forEach(btn => {
    if (parseInt(btn.getAttribute('data-level')) === level) {
      btn.variant = 'primary';
    } else {
      btn.variant = 'default';
    }
  });

  calculate();
}

// Handle tab changes
clubTypeTabGroup.addEventListener('sl-tab-show', (event) => {
  selectedClubType = event.detail.name;
  const clubs = calculator.clubData[selectedClubType] || [];

  if (clubs.length > 0) {
    const container = document.getElementById(`clubButtons-${selectedClubType}`);
    const buttonGroup = container.querySelector('sl-button-group');

    // Check if there's a previously selected club for this tab
    const previousSelection = selectedClubsByTab[selectedClubType];

    if (previousSelection) {
      // Restore previous selection
      selectClub(selectedClubType, previousSelection.name, previousSelection.rarity, buttonGroup);
    } else {
      // Default to first club if no previous selection
      selectClub(selectedClubType, clubs[0].name, clubs[0].type, buttonGroup);
    }
  }
});

// Preset elevation values
const elevationPresets = [
  {value: 0, label: '0'},
  {value: 10, label: '10%'},
  {value: 20, label: '20%'},
  {value: 30, label: '30%'}
];

// Preset power ball values
const powerBallPresets = [
  {value: 2, label: '2'},
  {value: 6, label: '6'},
  {value: 10, label: '10'}
];

// Cached button references for performance
let elevationControl = null; // Now stores the entire control object
let powerBallControl = null; // Now stores the entire control object

/**
 * Creates a common control with preset buttons and a dropdown menu
 * @param {Object} config - Configuration object
 * @param {string} config.containerId - ID of the container element
 * @param {Array} config.allValues - Array of all valid values
 * @param {Array} config.shortcuts - Array of shortcut values to show as buttons
 * @param {number} config.defaultValue - Initial value
 * @param {Function} config.formatLabel - Function to format value labels (e.g., value => `${value}%`)
 * @param {Function} config.onChange - Callback when value changes
 * @param {string} config.className - CSS class name for the dropdown
 * @returns {Object} - Contains buttons, menuButton, dropdown, and getCurrentValue function
 */
function createPresetButtonsWithMenu(config) {
  const {
    containerId,
    allValues,
    shortcuts,
    defaultValue,
    formatLabel = (v) => String(v),
    onChange,
    className
  } = config;

  let currentValue = defaultValue;

  const container = document.getElementById(containerId);
  const buttonGroup = document.createElement('sl-button-group');

  // Create preset/shortcut buttons
  shortcuts.forEach(value => {
    const button = document.createElement('sl-button');
    button.textContent = formatLabel(value);
    button.size = 'small';
    button.setAttribute('data-value', value);

    button.addEventListener('click', () => {
      currentValue = value;
      updateStates();
      onChange(value);
    });

    buttonGroup.appendChild(button);
  });

  // Create dropdown menu for non-shortcut values
  const nonShortcutValues = allValues.filter(v => !shortcuts.includes(v));

  if (nonShortcutValues.length > 0) {
    const dropdown = document.createElement('sl-dropdown');
    dropdown.setAttribute('hoist', '');
    dropdown.className = className;

    const menuButton = document.createElement('sl-button');
    menuButton.setAttribute('slot', 'trigger');
    menuButton.size = 'small';
    menuButton.setAttribute('caret', '');
    menuButton.textContent = '- ';
    menuButton.className = `${className}-menu-button`;

    const menu = document.createElement('sl-menu');

    nonShortcutValues.forEach(value => {
      const menuItem = document.createElement('sl-menu-item');
      menuItem.textContent = formatLabel(value);
      menuItem.setAttribute('data-value', value);

      menuItem.addEventListener('click', () => {
        currentValue = value;
        updateStates();
        onChange(value);
      });

      menu.appendChild(menuItem);
    });

    dropdown.appendChild(menuButton);
    dropdown.appendChild(menu);
    buttonGroup.appendChild(dropdown);

    // Enable hover trigger on desktop
    dropdown.addEventListener('mouseenter', () => {
      if (window.matchMedia('(hover: hover)').matches) {
        dropdown.open = true;
      }
    });

    dropdown.addEventListener('mouseleave', () => {
      if (window.matchMedia('(hover: hover)').matches) {
        dropdown.open = false;
      }
    });

    container.appendChild(buttonGroup);

    // Cache elements
    const presetButtons = buttonGroup.querySelectorAll(`sl-button:not(.${className}-menu-button)`);

    // Update button and menu states
    function updateStates() {
      // Update preset button states
      presetButtons.forEach(btn => {
        const btnValue = parseFloat(btn.getAttribute('data-value'));
        if (btnValue === currentValue) {
          btn.variant = 'primary';
        } else {
          btn.variant = 'default';
        }
      });

      // Update menu button label
      const isShortcut = shortcuts.includes(currentValue);
      if (isShortcut) {
        menuButton.textContent = '- ';
        menuButton.variant = 'default';
      } else {
        menuButton.textContent = formatLabel(currentValue) + ' ';
        menuButton.variant = 'primary';
      }
    }

    return {
      buttons: presetButtons,
      menuButton: menuButton,
      dropdown: dropdown,
      updateStates: updateStates,
      setValue: (value) => {
        currentValue = value;
        updateStates();
      },
      getValue: () => currentValue
    };
  } else {
    // No dropdown needed, only preset buttons
    container.appendChild(buttonGroup);
    const presetButtons = buttonGroup.querySelectorAll('sl-button');

    function updateStates() {
      presetButtons.forEach(btn => {
        const btnValue = parseFloat(btn.getAttribute('data-value'));
        if (btnValue === currentValue) {
          btn.variant = 'primary';
        } else {
          btn.variant = 'default';
        }
      });
    }

    return {
      buttons: presetButtons,
      menuButton: null,
      dropdown: null,
      updateStates: updateStates,
      setValue: (value) => {
        currentValue = value;
        updateStates();
      },
      getValue: () => currentValue
    };
  }
}

// Create elevation preset buttons with dropdown menu
function createElevationPresetButtons() {
  // Generate all elevation values from -50 to 50 in steps of 5
  const allElevationValues = [];
  for (let i = -20; i <= 50; i += 5) {
    allElevationValues.push(i);
  }

  // Extract shortcut values from presets
  const elevationShortcuts = elevationPresets.map(p => p.value);

  elevationControl = createPresetButtonsWithMenu({
    containerId: 'elevationPresetButtons',
    allValues: allElevationValues,
    shortcuts: elevationShortcuts,
    defaultValue: currentElevation,
    formatLabel: (value) => value > 0 ? `${value}%` : value === 0 ? '0' : `${value}%`,
    onChange: (value) => {
      currentElevation = value;
      calculate();
    },
    className: 'elevation-dropdown'
  });
}

// Create power ball preset buttons with dropdown menu
function createPowerBallPresetButtons() {
  // Generate all power ball values from 0 to 10
  const allPowerBallValues = [];
  for (let i = 0; i <= 10; i++) {
    allPowerBallValues.push(i);
  }

  // Extract shortcut values from presets
  const powerBallShortcuts = powerBallPresets.map(p => p.value);

  powerBallControl = createPresetButtonsWithMenu({
    containerId: 'powerBallPresetButtons',
    allValues: allPowerBallValues,
    shortcuts: powerBallShortcuts,
    defaultValue: currentPowerBall,
    formatLabel: (value) => String(value),
    onChange: (value) => {
      currentPowerBall = value;
      calculate();
    },
    className: 'powerball-dropdown'
  });
}

// Update power level display
function updatePowerLevel() {
  const percentage = parseFloat(powerLevelSlider.value || '100');
  powerLevelValue.textContent = `${percentage}%`;
  calculate();
}

// Update elevation display and menu button
function updateElevation() {
  if (elevationControl) {
    elevationControl.setValue(currentElevation);
  }
}

// Update power ball display and menu button
function updatePowerBall() {
  if (powerBallControl) {
    powerBallControl.setValue(currentPowerBall);
  }
}

// Handle slider interaction (Shoelace range uses sl-input and sl-change events)
powerLevelSlider.addEventListener('sl-input', () => {
  updatePowerLevel();
});

// Calculate wind rings
function calculate() {
  const elevation = currentElevation;
  const powerBall = currentPowerBall;
  const windSpeed = parseFloat(windSpeedInput.value);
  const powerRatio = parseInt(powerLevelSlider.value || '100') / 100; // 0-1 value
  // Validate inputs
  if (!selectedClubName || !selectedLevel || isNaN(windSpeed) || windSpeed <= 0) {
    resultDiv.textContent = '-';
    document.getElementById('resultMax').textContent = '-';
    document.getElementById('resultMid').textContent = '-';
    document.getElementById('resultMin').textContent = '-';
    return;
  }

  try {
    // Calculate all wind ring values in a single call
    const results = calculator.calculateWindRings(
      selectedClubName,
      selectedLevel,
      windSpeed,
      elevation,
      powerBall,
      0, // wind ball (can be added later)
      powerRatio
    );

    // Update all result displays
    resultDiv.textContent = results.current;
    document.getElementById('resultMax').textContent = results.max;
    document.getElementById('resultMid').textContent = results.mid;
    document.getElementById('resultMin').textContent = results.min;

    // Update result details
    updateResultDetails(elevation, powerBall, powerRatio);
  } catch (error) {
    resultDiv.textContent = '-';
    document.getElementById('resultMax').textContent = '-';
    document.getElementById('resultMid').textContent = '-';
    document.getElementById('resultMin').textContent = '-';
    console.error(error);
  }
}

// Update result details panel
function updateResultDetails(elevation, powerBall, powerRatio) {
  // Update club level
  const clubLevelElement = document.getElementById('selectedClubLevel');
  clubLevelElement.textContent = `Lv. ${selectedLevel}`;

  // Update club image
  const clubImageElement = document.getElementById('selectedClubImage');
  const club = calculator.findClub(selectedClubName, selectedLevel);
  if (club && club.image) {
    clubImageElement.src = `images/${club.image}`;
    clubImageElement.alt = selectedClubName;
    clubImageElement.style.display = 'block';
    clubImageElement.onerror = () => {
      console.warn(`Image not found: ${club.image}`);
      clubImageElement.style.display = 'none';
    };
  }

  // Update power ball
  const powerBallElement = document.getElementById('selectedPowerBall');
  powerBallElement.textContent = powerBall;

  // Update elevation
  const elevationElement = document.getElementById('selectedElevation');
  elevationElement.textContent = elevation > 0 ? `${elevation}%` : `${elevation}%`;

  // Update power level (now showing as percentage)
  const powerLevelElement = document.getElementById('selectedPowerLevel');
  const percentage = Math.round(powerRatio * 100);
  let powerLevelText;
  if (percentage === 100) {
    powerLevelText = 'Max';
  } else if (percentage === 50) {
    powerLevelText = 'Mid';
  } else if (percentage === 0) {
    powerLevelText = 'Min';
  } else {
    powerLevelText = `${percentage}%`;
  }
  powerLevelElement.textContent = powerLevelText;
}

// Handle wind speed input with auto-conversion
function handleWindSpeedInput() {
  let value = parseFloat(windSpeedInput.value);

  if (isNaN(value)) {
    return;
  }

  // If value is greater than 25, divide by 10
  if (value > 25) {
    value = value / 10;
    // Round to 1 decimal place
    value = Math.round(value * 10) / 10;
    windSpeedInput.value = value;
  }

  // Ensure value is within range
  if (value < 0.1) {
    windSpeedInput.value = 0.1;
  } else if (value > 25) {
    windSpeedInput.value = 25;
  }

  calculate();
}

// Clear wind speed button
const clearWindSpeedButton = document.getElementById('clearWindSpeed');
clearWindSpeedButton.addEventListener('click', () => {
  windSpeedInput.value = '';
  windSpeedInput.focus();
  resultDiv.textContent = '-';
});

// Wind speed increase/decrease buttons
const increaseWindButton = document.getElementById('increaseWind');
const decreaseWindButton = document.getElementById('decreaseWind');

increaseWindButton.addEventListener('click', () => {
  let currentValue = parseFloat(windSpeedInput.value) || 0;
  currentValue = Math.min(currentValue + 0.1, 25);
  windSpeedInput.value = Math.round(currentValue * 10) / 10;
  handleWindSpeedInput();
});

decreaseWindButton.addEventListener('click', () => {
  let currentValue = parseFloat(windSpeedInput.value) || 0;
  currentValue = Math.max(currentValue - 0.1, 0.1);
  windSpeedInput.value = Math.round(currentValue * 10) / 10;
  handleWindSpeedInput();
});

// Event listeners
windSpeedInput.addEventListener('input', handleWindSpeedInput);

// Initialize
populateClubButtons();
createElevationPresetButtons();
createPowerBallPresetButtons();
updatePowerLevel();
updateElevation();
updatePowerBall();

// Feedback dialog
const feedbackDialog = document.getElementById('feedbackDialog');
const feedbackButton = document.getElementById('feedbackButton');
const closeDialogButton = document.getElementById('closeDialogButton');

feedbackButton.addEventListener('click', () => {
  feedbackDialog.show();
});

closeDialogButton.addEventListener('click', () => {
  feedbackDialog.hide();
});
