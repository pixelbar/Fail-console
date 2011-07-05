$(function() {
  
  /* globals */
  var name = 'Anonymous';
  var lastValues = [];
  
  var socket = io.connect('http://192.168.1.102');
  
  socket.on('setname', function(n) {
    name = n;
    $('.main section:last-child').remove();
    appendMessage(name);
  });
  
  socket.on('notfound', function() {
    appendResponse('Command not found');
    $('.main section:last-child').remove();
    $('.main section:last-child input').focus();
  });
  
  socket.on('server', function(msg) {
    $('.main section:last-child input').blur();
    appendResponse(msg);
    $('.main section:last-child input').focus();
  });
  
  socket.on('say', function(data) {
    if(data.msg) {
      $('.main section:last-child input').blur();
      appendResponse(data.msg);
      $('.main section:last-child input').focus();
    } else {
      $('.main section:last-child input').focus();
    }
    if(!_.isUndefined(data.file)) {
      $('audio').attr('src', data.file);
      $('audio').load();
      $('audio').bind('canplay', function() {
        this.play();
      });
    } else {
      appendResponse('Meh, something went wrong');
      $('.main section:last-child input').focus();
    }
  });
  
  var sendMessage = function(e) {
    var value = $(this).val();
    if(e.keyCode == 13) {
      if(value == 'clear') {
        $('.main').empty();
        appendMessage(name);
      } else {
        if (value.indexOf('"') >= 0) {
          var s = value.match(/"(?:[^"\\]|\\.)*"/)[0];
          if(value.split('-').length == 2) {
            var c = [value.split(' ')[0], s.substr(1, s.length-2), value.split('-')[1]];
          } else if(value.split('-').length == 3) {
            var c = [value.split(' ')[0], s.substr(1, s.length-2), value.split('-')[1], value.split('-')[2]];
          } else {
            var c = [value.split(' ')[0], s.substr(1, s.length-2)];
          }
        } else {
          var c = value.split(' ');
        }
        c = _.compact(c);
        if(c.length >= 2) {
          socket.emit(c[0], _.without(c, c[0]), function(data) {
            if(data) {
              appendResponse(data);
              if(c[0] != 'setname') {
                 appendMessage(name);
                 $('.main section:last-child').remove();
                 $('.main section:last-child input').val('');
              }
            }
            lastValues.push(value);
          });
        } else {
          appendResponse('Command not found');
          $('.main section:last-child').remove();
          appendMessage(name);
        }
      }
    }
  }
  
  var previousMessage = function(e) {
    if(e.keyCode == 38) {
      if(!_.isEmpty(lastValues)) {
        var lastMsg = _.last(lastValues);
        $('.main section:last-child input').val(lastMsg);
        lastValues = _.without(lastValues, lastMsg);
        lastValues = _.uniq(lastValues);
        $('.main section:last-child input').focus();
      }
    }
  }
  
  $('section input').live('keypress', sendMessage);
  $('section input').live('keydown', previousMessage);
  
  var appendMessage = function(name, output, options) {
    var options = options || {};
    var template = $('#cmd-template').html();
    var message = {
      name: name,
      output: output
    };
    var cmd = Mustache.to_html(template, message);
    if($('.main section:last-child').length < 0) {
      $('.main section:last-child').before(cmd);
    } else {
      $('.main').append(cmd);
    }
    
    $('.main section:last-child input').focus();
  }
  
  var appendResponse = function(output, options) {
    var options = options || {};
    var template = $('#response-template').html();
    var response = Mustache.to_html(template, { response: output });
    $('.main section:last-child').before(response);
    $('.main section:last-child input').focus();
  }
  
  var failWhale = [
    "     FAIL WHALE!", 
    "W     W      W", 
    "W        W  W     W", 
    "              '.  W", 
    "  .-\"\"-._     \ \.--|", 
    " /       \"-..__) .-'", 
    "|     _         /", 
    "\'-.__,   .__.,'", 
    " '----'._\--'", 
    "VVVVVVVVVVVVVVVVVVVVV",
    ""
  ]
  
  _.each(failWhale, function(msg) {
    if(msg == '') {
      appendMessage(name);
    } else {
      appendMessage(name, msg);
      $('.main section input').attr('disabled', 'disabled');
    }
  });
});