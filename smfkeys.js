
var States = {
  OFF: 0,
  INDEX: 1,
  BOARD: 2,
  TOPIC: 3,
  POST: 4,
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
    // If viewing a different board from the last one.
    else if(SMFKeys.state == States.BOARD) {
      if(SMFKeys.data[States.BOARD].id != document.location.search) {
        SMFKeys.data[States.BOARD].position = 0;
      }
      SMFKeys.data[States.BOARD].id = document.location.search;
    }
    // If posting, focus the post box.
    else if(SMFKeys.state == States.POST) {
      window.scrollTo(0, $('.cat_bar').first().scrollTop());
      if(document.location.search.indexOf('topic') >= 0) {
        // A reply, focus the text box.
        $('textarea').focus();
      } else {
        // A new topic, focus the subject box.
        $('input[name="subject"]').focus();
      }
      return;
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
      if(SMFKeys.state == States.TOPIC) {
        reply();
      } else {
        refresh();
      }
      break;
    case 110: // n
      SMFKeys.loaded && openNew();
      break;
    case 109: // m
      SMFKeys.loaded && messages();
      break;
    case 99: // c
      SMFKeys.loaded && newTopic();
      break;

    case 113: // q
      SMFKeys.loaded && quote();
      break;
    case 101: // e
      SMFKeys.loaded && edit();
      break;
    case 105: // i
      SMFKeys.loaded && toIndex();
      break;
    default:
      return;
  }
}

// utility functions

// Returns the jQuery objects for all the rows in the current state.
function getRows() {
  if(SMFKeys.state == States.INDEX) {
    return $('tbody[class="content"] tr.windowbg2');
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

    if(SMFKeys.state == States.TOPIC) { // always scroll the post to the top of the screen for topics.
      window.scrollTo(0, rowTop);
    } else if(rowTop < window.scrollY) { // need to scroll up
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
  } else if($('.pagelinks a').length > 0) {
    page(+1);
  }
}

function moveUp() { // k
  if(SMFKeys.data[SMFKeys.state].position > 0) {
    blurRow();
    SMFKeys.data[SMFKeys.state].position--;
    focusRow();
    saveState();
  } else if($('.pagelinks a').length > 0) {
    page(-1);
  }
}

function page(delta) {
  var linkbar = $('.pagelinks');
  var page = $('strong', linkbar).first();
  var links = page.parent().children();

  var index = 0;
  for(; index < links.length; index++) {
    if(links.eq(index).is('strong')) {
      break;
    }
  }
  if(index+delta >= 0 && index+delta < links.length) {
    window.location = links.eq(index+delta).attr('href');
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

function reply() {
  window.location = $('.buttonlist .button_strip_reply').first().attr('href');
}

function newTopic() {
  if(SMFKeys.state == States.BOARD) {
    window.location = $('.buttonlist .button_strip_new_topic').first().attr('href');
  }
}

function quote() {
  if(SMFKeys.state == States.TOPIC) {
    getRow(function() {
      window.location = $('.quote_button a', this).attr('href');
    });
  }
}

function edit() {
  if(SMFKeys.state == States.TOPIC) {
    getRow(function() {
      var button = $('.modify_button a', this);
      if(button.length > 0) {
        window.location = button.attr('href');
      }
    });
  }
}

function toIndex() {
  if(SMFKeys.state != States.INDEX) {
    document.location.search = '';
  }
}


$("document").ready(function() {
  document.addEventListener('keypress', keyPress, false);

  $('input,textarea').focus(function() { SMFKeys.enabled = false; });
  $('input,textarea').blur(function() { SMFKeys.enabled = true; });

  // Determine state from the URL.
  var search = document.location.search;
  var path = document.location.pathname;

  if(search.indexOf('?board=') >= 0) {
    SMFKeys.state = States.BOARD;
  } else if(search.indexOf('?topic=') >= 0) {
    SMFKeys.state = States.TOPIC;
  } else if(search.indexOf('?action=post') >= 0) {
    SMFKeys.state = States.POST;
  } else if((path.match(/index.php$/) || path.match('/forum/')) && !search) {
    SMFKeys.state = States.INDEX;
  }

  if(SMFKeys.state && SMFKeys.state != States.OFF) {
    SMFKeys.loaded = true;
    maybeInit();
  }
});
