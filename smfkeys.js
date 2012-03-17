
var States = {
  OFF: 0,
  INDEX: 1,
  BOARD: 2,
  TOPIC: 3,
};

var SMFKeys = {};

SMFKeys.state = States.OFF;
SMFKeys.ready = false;
SMFKeys.loaded = false;
SMFKeys.enabled = true;

chrome.extension.sendRequest({ type: 'get', site: document.location.hostname }, handleGet);

function handleGet(response) {
  SMFKeys.data = response;
  SMFKeys.ready = true;
  maybeInit();
}

function maybeInit() {
  if(SMFKeys.ready && SMFKeys.loaded) {
    // Focus the New row when viewing a topic with the New link.
    if(SMFKeys.state == States.TOPIC && document.location.hash == '#new') {
      var target = $('#new + div')[0];
      var rows = getRows();
      for(var i = 0; i < rows.length; i++) {
        if(rows[i].offsetTop == target.offsetTop) {
          SMFKeys.data[States.TOPIC].position = i;
          break;
        }
      }
    }

    focusRow();
  }
}

function saveState() {
  chrome.extension.sendRequest({ type: 'put', site: document.location.hostname, state: SMFKeys.data });
}

function keyPress(event) {
  if(!SMFKeys.enabled) {
    return;
  }

  switch(event.keyCode) {
    case 106: // j
      SMFKeys.loaded && moveDown();
      break;
    case 107: // k
      SMFKeys.loaded && moveUp();
      break;
    case 111: // o
      SMFKeys.loaded && open();
      break;
    case 117: // u
      up();
      break;
    case 114: // r
      refresh();
      break;
    case 110: // n
      SMFKeys.loaded && openNew();
      break;
    case 109: // m
      SMFKeys.loaded && messages();
      break;
    default:
      return;
  }
}

// utility functions

// Returns the jQuery objects for all the rows in the current state.
function getRows() {
  if(SMFKeys.state == States.INDEX) {
    return $('tbody[class="content"] tr');
  } else if(SMFKeys.state == States.BOARD) {
    return $('div[id="messageindex"] table tbody tr');
  } else if(SMFKeys.state == States.TOPIC) {
    return $('div[class="post_wrapper"]');
  } else {
    return [];
  }
}

function getRow(a, b) {
  var index;
  var f;
  if(b) {
    index = a;
    f = b;
  } else {
    f = a;
    index = SMFKeys.data[SMFKeys.state].position;
  }

  getRows().eq(index).each(f);
}

// Returns the number of rows in the current state by counting the appropriate DOM elements.
function countRows() {
  return getRows().length;
}

// Focuses the currently selected row.
function focusRow() {
  getRow(function() {
    var row = $(this);

    if(SMFKeys.state == States.INDEX) {
      row.attr('style', 'background: red');
    } else if(SMFKeys.state == States.BOARD) {
      row.attr('style', 'border-left: 3px solid red');
    } else if(SMFKeys.state == States.TOPIC) {
      row.attr('style', 'border-left: 3px solid red');
    }

    var rowTop = row.offset().top;
    var rowHeight = row[0].offsetHeight;
    var rowBottom = rowTop + rowHeight;
    var windowHeight = $(window).height();

    if(rowTop < window.scrollY) { // need to scroll up
      window.scrollTo(0, rowTop);
    } else if (rowBottom > window.scrollY + windowHeight) { // need to scroll down
      if(rowHeight > windowHeight) { // doesn't fit, scroll to rowTop
        window.scrollTo(0, rowTop);
      } else { // does fit, scroll down to put it at the bottom.
        window.scrollTo(0, rowBottom - windowHeight);
      }
    }
  });
}

// Unfocuses the currently selected row.
function blurRow() {
  getRow(function() { $(this).attr('style', ''); });
}


// Command handlers
function moveDown() { // j
  var rows = countRows();
  if(SMFKeys.data[SMFKeys.state].position < countRows() - 1) {
    blurRow();
    SMFKeys.data[SMFKeys.state].position++;
    focusRow();
    saveState();
  }
}

function moveUp() { // k
  if(SMFKeys.data[SMFKeys.state].position > 0) {
    blurRow();
    SMFKeys.data[SMFKeys.state].position--;
    focusRow();
    saveState();
  }
}


function open() { // o
  if(SMFKeys.state == States.INDEX) {
    getRow(function(){
      window.location = $('a.subject', this).attr('href');
    });
  } else if(SMFKeys.state == States.BOARD) {
    getRow(function(){
      window.location = $('strong a', this).attr('href');
    });
  }
  // No 'open' on topic.
}

function up() { // u
  if(SMFKeys.state == States.TOPIC) {
    var matches = $('.navigate_section a[href*="?board="]');
    window.location = matches.first().attr('href');
  } else {
    // From anywhere but a topic, this goes to the index.
    document.location.search = ''; // up to index.php
  }
}


function refresh() {
  document.location.reload();
}

function openNew() {
  if(SMFKeys.state == States.BOARD) { // only makes sense on boards
    getRow(function() {
      window.location = $('a[id^=newicon]', this).attr('href');
    });
  }
}

function messages() {
  document.location.search = '?action=pm';
}



$("document").ready(function() {
  document.addEventListener('keypress', keyPress, false);

  $('input,textarea').focus(function() { SMFKeys.enabled = false; });
  $('input,textarea').blur(function() { SMFKeys.enabled = true; });

  // Determine state from the URL.
  var path = document.location.search;
  if(path.indexOf('board=') >= 0) {
    SMFKeys.state = States.BOARD;
  } else if(path.indexOf('topic=') >= 0) {
    SMFKeys.state = States.TOPIC;
  } else if(document.location.pathname.match(/index.php$/) && !path) {
    SMFKeys.state = States.INDEX;
  }

  if(SMFKeys.state && SMFKeys.state != States.OFF) {
    SMFKeys.loaded = true;
    maybeInit();
  }
});
