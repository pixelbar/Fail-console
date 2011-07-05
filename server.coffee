express = require('express@2.4.0')
request = require('request@1.9.8')
irc = require('irc@0.2.0')
sanitizer = require('sanitizer@0.0.14')

apiURI = "http://faalapp2.dev/"

app = express.createServer()
io = require('socket.io@0.7.6').listen(app)

app.use express.bodyParser()

app.register '.html', require 'ejs'
app.set 'view engine', 'html'
app.use express.static __dirname + '/public'

app.get '/', (req, res) ->
  res.render 'index.html'

app.listen(8080)

bot = new irc.Client('irc.freenode.net', 'failbot', {
  debug: true,
  channels: ['#failconsole']
})

mainSocket = ''


bot.addListener 'message', (from, to, message) ->
  msg = sanitizer.sanitize(message)
  if to.match(/^[#&]/) and msg.match(/^!fail say/i)
    url = 'play/phrase?phrase='+encodeURI(msg.substr(10, msg.length))+'&auth_token=1jPR9YFI9dtaUxNttF2u'
    request {uri:apiURI+url}, (error, response, body) ->
      if not error and response.statusCode is 200
        object = JSON.parse body
        if object.soundname
          bot.say('#failconsole', 'I\'m saying "'+msg.substr(10, msg.length)+'" to everyone thats on the #failconsole')
          mainSocket.broadcast.emit('say', {file: apiURI+"sounds/"+object.soundname})
          mainSocket.emit('say', {file: apiURI+"sounds/"+object.soundname})
          mainSocket.broadcast.emit('server', from+' on IRC is saying: '+msg.substr(10, msg.length))
          mainSocket.emit('server', from+' on IRC is saying: '+msg.substr(10, msg.length))
  else if to.match(/^[#&]/) and msg.match(/^!fail/i)
    bot.say('#failconsole', 'Fail, fail, fail...')
    mainSocket.broadcast.emit('server', 'I\'m failing on IRC #failconsole')
    mainSocket.emit('server', 'I\'m failing on IRC #failconsole')
      

io.sockets.on 'connection', (socket) ->
  mainSocket = socket
  nick = 'A anonymous person'
  socket.on 'setname', (name, fn) ->
    fn('Your name is now '+ sanitizer.sanitize(name))
    nick = sanitizer.sanitize(name)
    socket.emit('setname', name)
  socket.on 'say', (options, fn) ->
    msg = sanitizer.sanitize(options[0])
    fn('Saying '+ msg)
    bot.say('#failconsole', nick+' is saying: '+msg)
    if(options[2])
      url = 'play/phrase?phrase='+encodeURI(msg)+'&src='+encodeURI(sanitizer.sanitize(options[1]))+'&tgt='+encodeURI(sanitizer.sanitize(options[2]))+'&auth_token=1jPR9YFI9dtaUxNttF2u'
    if(options[1])
      url = 'play/phrase?phrase='+encodeURI(msg)+'&tgt='+encodeURI(sanitizer.sanitize(options[1]))+'&auth_token=1jPR9YFI9dtaUxNttF2u'
    else
      url = 'play/phrase?phrase='+encodeURI(msg)+'&auth_token=1jPR9YFI9dtaUxNttF2u'
    request {uri:apiURI+url}, (error, response, body) ->
      if not error and response.statusCode is 200
        try
          object = JSON.parse body
          if object.soundname
            socket.emit('say', {file: apiURI+"sounds/"+object.soundname})
            socket.broadcast.emit('say', {file: apiURI+"sounds/"+object.soundname, msg: nick+' is saying: '+msg})
          else
            socket.emit('say', 'Something went wrong')
        catch error
          socket.emit('say', 'Something went wrong')
