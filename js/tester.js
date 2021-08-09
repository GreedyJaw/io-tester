localStorage.setItem('listeners', JSON.stringify([
    'betting-totals',
    'fight-totals',
    'fight-update',
    'event-update',
    'user-info',
    'cancelation'
]));

$(document).ready(function(){
    let token = localStorage.getItem('token');
    let url = localStorage.getItem('url');
    let listeners = [];
    let socket;

    if(localStorage.getItem('listeners')) {
        listeners = JSON.parse(localStorage.getItem('listeners'));
    }

    $('#token').val(token);
    $('#url').val(url);

    $('#connect').click(function(){
        connect($('#url').val(), $('#token').val());
    });

    $('#emit').click(function(){
        if(socket) {
            let data = $('#data').val();
            let action = $('#action').val();
            let callback = function(result) {
                writeResult('Emitting <b>' + action + '</b>', result);
            }

            if(action) {
                try {
                    if(data) {
                        data = JSON.parse(data);
                        socket.emit(action, data, callback);
                    } else {
                        socket.emit(action, callback);
                    }
                } catch (e) {
                    writeResult('Client error', e);
                }
            }
        }
    });

    $('#listen').click(function(){
        let event = $('#event').val();

        if(event && socket) {
            addListener(event);

            localStorage.setItem('listeners', JSON.stringify(listeners));
        }
    });

    $('#reset').click(function(){
        $('#listeners').html('');

        if(socket) {
            resetListeners();
        }

        localStorage.setItem('listeners', JSON.stringify(listeners));
    });

    function connect(url, token = null) {
        if(socket) socket.disconnect();

        socket = io(url, {
            "transports"	: ["websocket"],
            withCredentials	: true,
            auth: {
                token: token
            },
            extraHeaders	: {}
        });

        setStatus('warning', 'Waiting');

        socket.on('connect', function(){
            localStorage.setItem('token', token);
            localStorage.setItem('url', url);

            setStatus('success', 'Connected');
            writeResult('Connected to ' + url);

            listeners.forEach(event => {
                addListener(event);
            })
        });

        socket.on('disconnect', function(err){
            setStatus('danger', 'Disconnected');
            writeResult('Disconnect', err);
        });

        socket.on('connect_error', function (err) {
            setStatus('danger', 'Connection error');
            writeResult('Connection error', err);
        });
    }

    function addListener(event) {
        $('#listeners').html('');

        if(listeners.indexOf(event) < 0) {
            listeners.push(event);
        }

        listeners.forEach(event => {
            socket.off(event);
            socket.on(event, function(data) {
                writeResult('Listening ' + event, data);
            });

            $('#listeners').append('<p>' + event + '</p>');
        });
    }

    function resetListeners() {
        listeners.forEach(l => {
            socket.off(l);
        });

        listeners = [];
    }

    function setStatus(status, msg) {
        $('#status').attr('class', 'badge badge-' + status);
        $('#status').text(msg);
    }

    function writeResult(event, result) {
        if(result) {
            $('#result').append('<p><b>' + event + ': </b>' + syntaxHighlight(result) + '</p>');
        } else {
            $('#result').append('<p><b>' + event + '</b></p>');
        }
    }
});

function syntaxHighlight(json) {
    if (typeof json != 'string') {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}