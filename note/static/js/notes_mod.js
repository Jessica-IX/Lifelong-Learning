$(document).ready(function () {
    var articleId = $('#article-data').data('article-id');
    var mainURL = 'http://127.0.0.1:8000/note/' + articleId + '/';
    $('.card').each(function() {
        var highlightId = $(this).find('[data-highlight-id]').data('highlight-id');
        if (highlightId) {
            $(this).find('.card-header').css('background-color', 'rgba(185, 253, 117, 0.823)');
        }
    });

    function deleteNote(noteId) {
        $.ajax({
            type: 'POST',
            url: 'delete_note/',
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({ note_id: noteId }),
            success: function(response) {
                if (response.success) {
                    $('.card[data-note-id="' + noteId + '"]').remove();
                } else {
                    alert('Deletion Failed:' + response.error);
                }
            },
            error: function(xhr, status, error) {
                var errorMessage = JSON.parse(xhr.responseText).error;
                alert('Error! ' + errorMessage);
            }
        });
    }
    
    window.addEventListener('message', function(event) {
        if (event.data && event.data.msg) {
            var data = event.data;
            if (data.msg == 'delete') {
                $('.col-md-11').find('div[data-highlight-id="' + data.highlightId + '"]').closest('.col-md-11').hide();
            }
            if (data.msg == 'deletion confirmed') {
                var $highlightDiv = $('div[data-highlight-id="' + data.highlightId + '"]');
                if ($highlightDiv.length) {
                    var noteId = $highlightDiv.data('note-id');
                    deleteNote(noteId);
                }
            }
        }
    });
    $(document).on('click', '.card', function() {
        var $spDiv = $(this).find('.sp');
        if ($spDiv.length > 0) {
            var highlightId = $spDiv.data('highlight-id');
            var data = {
                origin: 'note',
                highlightId: highlightId,
                msg: 'scroll'
            };
            window.parent.postMessage(data, mainURL);
        }
    });
    $('.btn').on('click', function(event) {
        var $button = $(this);

        var noteId = $button.data('note-id');
        if ($button.closest('.delete-btn').length) {
            var highlightDiv = $('div[data-note-id="' + noteId + '"]').filter('.sp');
            if (highlightDiv.length) {
                var highlightId = highlightDiv.data('highlight-id');
                var data = {
                    origin: 'note',
                    highlightId: highlightId,
                    msg: 'delete'
                };
                window.parent.postMessage(data, mainURL);
            } else {
                deleteNote(noteId);
            }
        } else if ($button.closest('.edit-btn').length) {
            var $card = $(this).closest('.card');

            if ($button.hasClass('active')) {
                $button.removeClass('active');
                $card.find('button.save-btn').css('visibility', 'hidden');
                $card.find('textarea').prop('readonly', true);
                $button.attr('style', 'display: block !important; background-color:  #002664 !important; color: white !important; border: 2px solid #002664 !important;');
            } else {
                $button.addClass('active');
                $button.attr('style', 'display: block !important; background-color: white !important; color: #002664 !important; border: 2px solid #002664 !important;');
                $card.find('button.save-btn').css('visibility', 'visible');
                $card.find('textarea').prop('readonly', false);
            }

        }
    });
});