
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



// Command handlers
function moveDown() { // j
  var rows = countRows();
  if(SMFKeys.data[SMFKeys.state].position < countRows() - 1) {
    SMFKeys.data[SMFKeys.state].position++;
    focusRow();
    saveState();
  }
}

function moveUp() { // k
  if(SMFKeys.data[SMFKeys.state].position > 0) {
    SMFKeys.data[SMFKeys.state].position--;
    focusRow();
    saveState();
  }
}



$("document").ready(function() {
  document.addEventListener('keypress', keyPress, false);
});
