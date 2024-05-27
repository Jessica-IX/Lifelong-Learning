$(document).ready(function () {
    var articleId = $('#article-data').data('article-id');
    var mainURL = 'http://127.0.0.1:8000/note/' + articleId + '/';

    $(document).on('click', '#close', function() {
        $('#new-title').val('');
        $('#new-text').val('');
        var monitorValue = $(this).attr('monitor');
        if (monitorValue === 'true') {
            var data = {
                origin: 'note',
                action: 'no_add'
            };
            window.parent.postMessage(data, mainURL);
        }
    });
    
    $(document).on('click', '#save[monitor="true"]', function() {
        var data = {
            origin: 'note',
            action: 'add',
        };
        window.parent.postMessage(data, mainURL);
    });    

    function saveNewNote(title, text, highlight) {
        $.ajax({
            type: 'POST',
            url: 'save_new/',
            contentType: 'application/json',
            data: JSON.stringify({
                'title': title,
                'text': text,
                'highlight': highlight,
            }),
            success: function(response){
                $('#notes-list').html(response.updated_html);
                $('#new-title').val('');
                $('#new-text').val('');
                $('#miModal').modal('hide');
            },
            error: function(xhr, status, error){
                try {
                    var errorMessage = JSON.parse(xhr.responseText).error;
                    alert('Error! ' + errorMessage);
                } catch (e) {
                    alert('Error! ' + xhr.responseText);
                }
            }
        });
    }

    $('.save-new').on('click', function(event) {
        var monitor = $(this).attr('monitor') !== undefined;
        var title = $('#new-title').val();
        var text = $('#new-text').val();
        let highlightId = -1;
        if (!monitor) {   
            saveNewNote(title, text, highlightId);
        } else {
            window.addEventListener('message', function(event) {
                var data = event.data;
                if (data && data.msg && data.msg == 'save') {
                    highlightId = data.highlightId;
                    saveNewNote(title, text, highlightId);
                }
            }, false);
        }

    });
    $('#notes-list').on('click', '.save-btn', function(event) {
        var noteId = $(this).data('note-id');
        var $noteContainer = $('.card[data-note-id="' + noteId + '"]');
        var title = $noteContainer.find('.note-title').val();
        var text = $noteContainer.find('.note-text').val();

        $.ajax({
            type: 'POST',
            url: 'update_note/',
            contentType: 'application/json',
            data: JSON.stringify({
                'title': title,
                'text': text,
                'note_id': noteId, 
            }),
            success: function(response){
                if (response.message == 'No Change') {
                    var $editBtn = $('button[data-note-id="' + noteId + '"].edit-btn');
                    $editBtn.removeClass('active');
                    $editBtn.attr('style', 'display: block !important; background-color:  #002664 !important; color: white !important; border: 2px solid #002664 !important;');
                } else {
                    $('#notes-list').html(response.updated_html);
                }
            },
            error: function(xhr, status, error){
                var errorMessage = JSON.parse(xhr.responseText).error;
                alert('Error! ' + errorMessage);
            }
        });
    });
});

window.addEventListener('message', function(event) {
    if (event.data && event.data.text) {
        var data = event.data;
        var button = document.getElementById('miBoton');
        var wordsArray = data.text.trim().match(/\b[\w']+\b/g);
        var wordCount = wordsArray ? wordsArray.length : 0;
        if (button) {
            button.click();
            $('#close, #save').attr('monitor', true);
            if (wordCount < 25) {
                $('#new-title').val(data.text);
            } else {
                $('#new-title').val('Summary');
                $.ajax({
                    type: 'POST',
                    url: 'summary/',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        'text': data.text,
                    }),
                    success: function(response) {
                        $('#new-text').val(response.summary);
                        console.log(response.summary);
                    },
                    error: function(xhr, status, error) {
                        var errorMessage = JSON.parse(xhr.responseText).error;
                        alert('Error! ' + errorMessage);
                    }
                });
            }
        }
    } else {
        if (event.data && event.data.msg) {
            if (event.data.msg == 'scroll') {
                var divElement = document.querySelector('div[data-highlight-id="' + event.data.highlightId + '"]');
                if (divElement) {
                    divElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    }
});