
var States = {
  INDEX: 1,
  BOARD: 2,
  THREAD: 3,
  OFF: 4,
};

var SMFKeys = {};

SMFKeys.state = States.OFF;

chrome.extension.sendRequest({ type: 'get', site: document.location.hostname }, handleGet);

function handleGet(response) {
  SMFKeys.data = response;
  focusRow();
}

function saveState() {
  chrome.extension.sendRequest({ type: 'put', site: document.location.hostname, state: SMFKeys.data });
}

function keyPress(event) {
  switch(event.keyCode) {
    case 106: // j
      moveDown();
      break;
    case 107: // k
      moveUp();
      break;
    default:
      return;
  }
}

// utility functions

// Returns the jQuery objects for all the rows in the current state.
function getRows() {
  if(SMFKeys.state = States.INDEX) {
    return $('tbody[class="content"] tr');
  } else if(SMFKeys.state = States.BOARD) {
    return $('div[id="messageindex"] table tbody tr');
  } else if(SMFKeys.state = States.THREAD) {
    return $('div[class="post_wrapper"]');
  } else {
    return [];
  }
}

// Returns the number of rows in the current state by counting the appropriate DOM elements.
function countRows() {
  return getRows().length;
}

// Focuses the currently selected row.
function focusRow() {
  var row = getRows()[SMFKeys.data[SMFKeys.state].position];
  if(row) {
    row.style.cssText = 'background: red';
  }
}

// Unfocuses the currently selected row.
function blurRow() {
  var row = getRows()[SMFKeys.data[SMFKeys.state].position];
  if(row) {
    row.style.cssText = '';
  }
}


// Command handlers
function moveDown() { // j
  window.console.log('moveDown');
  var rows = countRows();
  if(SMFKeys.data[SMFKeys.state].position < countRows() - 1) {
    blurRow();
    SMFKeys.data[SMFKeys.state].position++;
    focusRow();
    saveState();
  }
}

function moveUp() { // k
  window.console.log('moveUp');
  if(SMFKeys.data[SMFKeys.state].position > 0) {
    blurRow();
    SMFKeys.data[SMFKeys.state].position--;
    focusRow();
    saveState();
  }
}



$("document").ready(function() {
  document.addEventListener('keypress', keyPress, false);
});
