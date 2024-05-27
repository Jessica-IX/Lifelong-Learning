$(document).ready(function () {
    var isHighlighted = false;
    var deletionOn = false;
    let new_hightlight_note = true;
    var preElement = document.querySelector('pre');
    var articleDataDiv = $('#article-data');
    var articleId = articleDataDiv.data('article-id');
    var mainURL = 'http://127.0.0.1:8000/note/' + articleId + '/';

    //localStorage.clear();

    let savedContent = localStorage.getItem(`preContent_${articleId}`);
    if (savedContent) {
        preElement.innerHTML = savedContent;
        //console.log('Highlights loaded:', savedContent);
    }

    function deleteHighlight(highlightId, $mark) {
        $.ajax({
            type: 'POST',
            url: 'delete_highlight/',
            contentType: 'application/json',
            data: JSON.stringify({
                'highlight_id': highlightId
            }),
            success: function(response) {
                $mark.contents().unwrap();
                if ($('pre').find('mark').length === 0) {
                    localStorage.removeItem(`preContent_${articleId}`);
                } else {
                    let preContent = document.querySelector('pre').innerHTML;
                    localStorage.setItem(`preContent_${articleId}`, preContent);
                }
            },
            error: function(xhr, status, error) {
                var errorMessage = JSON.parse(xhr.responseText).error;
                alert('Error! ' + errorMessage);
            }
        });
    }
    window.addEventListener('message', function(event) {
        if (event.data && event.data.action) {
            new_hightlight_note = true;
            var data = event.data;
            var $temporaryMark = $('mark#temporary');
            if (data.action == 'no_add') {
                $temporaryMark.contents().unwrap();
            } else if (data.action == 'add') {
                $.ajax({
                    type: 'POST',
                    url: 'add_highlight/',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        'content' : $temporaryMark.text(),
                    }),
                    success: function(response){
                        var highlightId = response.highlight_id;
                        $temporaryMark.removeAttr('id');
                        $temporaryMark.attr('data-highlight-id', highlightId);
                        let preContent = document.querySelector('pre').innerHTML;
                        localStorage.setItem(`preContent_${articleId}`, preContent);
                        var data = {
                            origin: 'article',
                            highlightId: highlightId,
                            msg: 'save'
                        };
                        window.parent.postMessage(data, mainURL);
                    },
                    error: function(xhr, status, error){
                        var errorMessage = JSON.parse(xhr.responseText).error;
                        alert('Error! ' + errorMessage);
                    }
                });
            }
        } else if (event.data && event.data.origin && event.data.origin == 'main') {
            if (event.data.msg == 'deletion confirmed') {
                var highlightId = event.data.highlightId;
                var $mark = $('mark[data-highlight-id="' + highlightId + '"]');
                deleteHighlight(highlightId, $mark);
            }
        } else if (event.data && event.data.msg) {
            var $highlightMark = $('mark[data-highlight-id="' + event.data.highlightId + '"]');
            if (event.data.msg == 'delete') {
                $highlightMark.contents().unwrap();
                if ($('pre').find('mark').length === 0) {
                    localStorage.removeItem(`preContent_${articleId}`);
                } else {
                    let preContent = document.querySelector('pre').innerHTML;
                    localStorage.setItem(`preContent_${articleId}`, preContent);
                }
            } else if (event.data.msg == 'scroll') {
                var offsetTop = $highlightMark.offset().top;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });

            }
        }
    });

    function findMark(node) {
        if (node.parentNode && node.parentNode.tagName.toLowerCase() === 'mark') {
            return node.parentNode;
        };
        return null;
    }
    
    var targetElement = document.getElementById('highlight-button');

    var rect = targetElement.getBoundingClientRect();

    var dropdownMenu = $('.dropdown-menu');
    dropdownMenu.css({
        'top': rect.bottom + 10, 
        'left': rect.left
    });

    var clickTimer = null;
    var clickDelay = 250;

    var highlightButton = $('#highlight-button');

    var highlightNote = false;

    $('#highlight-note').on('click', function() {
        highlightNote = true;
        dropdownMenu.removeClass('show');
        highlightButton.hide().html('<i class="fas fa-highlighter"></i> Highlight Node');
        highlightButton.fadeIn(300);
    });

    highlightButton.on('click', function() {
        if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
            if (isHighlighted && !deletionOn && highlightNote == false) {
                dropdownMenu.addClass('show');
                highlightNote = true;
            }
        } else {
            clickTimer = setTimeout(function() {
                if (!isHighlighted) {
                    if (deletionOn) {
                        deletionOn = false;
                        $('#erase-button').css({
                            'background-color': 'black',
                            'color': 'rgba(255, 4, 4, 0.916)',
                        });
                    }
                    isHighlighted = true;
                    highlightButton.css({
                        'background-color': 'rgb(255, 242, 4)',
                        'color': 'black',
                    });
                } else {
                    isHighlighted = false;
                    dropdownMenu.removeClass('show');
                    highlightButton.css({
                        'background-color': 'black',
                        'color': 'rgb(255, 242, 4)',
                    });
                    if (highlightNote) {
                        highlightButton.hide().html('<i class="fas fa-highlighter"></i> Highlight');
                        highlightButton.fadeOut(500);
                        highlightButton.fadeIn(400);    
                        highlightNote = false;                
                    }
                }
                clickTimer = null;
            }, clickDelay);
        }
    });

    $('#erase-button').on('click', function() {
        if (!deletionOn) {
            if (isHighlighted) {
                isHighlighted = false;
                dropdownMenu.removeClass('show');
                highlightButton.css({
                    'background-color': 'black',
                    'color': 'rgb(255, 242, 4)',
                });
                if (highlightNote) {
                    highlightButton.hide().html('<i class="fas fa-highlighter"></i> Highlight');
                    highlightButton.fadeOut(500);
                    highlightButton.fadeIn(400);    
                    highlightNote = false;                
                }
            }
            deletionOn = true;
            $(this).css({
                'background-color': 'rgba(255, 4, 4, 0.916)',
                'color': 'black',
            });
        } else {
            deletionOn = false;
            $(this).css({
                'background-color': 'black',
                'color': 'rgba(255, 4, 4, 0.916)',
            });
        }
    });

    $(document).on('mouseup', 'pre', function() {
        if (isHighlighted) {
            var selection = window.getSelection().toString();
            if (selection !== '') {
                var range = window.getSelection().getRangeAt(0);

                let startMark = findMark(range.startContainer);
                let endMark = findMark(range.endContainer);

                if (startMark && endMark && startMark === endMark) {
                    console.log('Selected text is within the same <mark> tag');
                    return;
                }

                const markTags = preElement.querySelectorAll('mark');
                const deletedHighlightIds = [];
                let involveMark = false;
                markTags.forEach(markTag => {
                    if (range.intersectsNode(markTag)) {
                        involveMark = true;
                        const highlightId = markTag.getAttribute('data-highlight-id');
                        deletedHighlightIds.push(highlightId);
                    }
                });

                if (involveMark) {
                    if (highlightNote) {
                        alert('Failed to Create Highlight Note!\nClear Overlapping Highlights First to Create a Hightlight Note!');
                        return;
                    }
                    let startNonSelect = '';
                    let endNonSelect = '';
                    if (startMark) {
                        const startContent = startMark.textContent;
                        startNonSelect = startContent.substring(0, range.startOffset);
                    }
                    if (endMark) {
                        const endContent = endMark.textContent;
                        endNonSelect = endContent.substring(range.endOffset);
                    }
                    const newContent = startNonSelect + selection + endNonSelect;
                    $.ajax({
                        type: 'POST',
                        url: 'change_highlight/',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            'content' : newContent,
                            'deletedHighlightIds': deletedHighlightIds,
                        }),
                        success: function(response){
                            var highlightId = response.highlight_id;
                            var newNode = $('<mark data-highlight-id="' + highlightId + '"></mark>');
                            newNode.text(newContent);
                            range.deleteContents();
                            if (startMark) {
                                $(startMark).remove();
                            }
                            if (endMark) {
                                $(endMark).remove();
                            }
                            range.insertNode(newNode[0]);
                            let preContent = document.querySelector('pre').innerHTML;
                            localStorage.setItem(`preContent_${articleId}`, preContent);

                        },
                        error: function(xhr, status, error){
                            var errorMessage = JSON.parse(xhr.responseText).error;
                            alert('Error! ' + errorMessage);
                        }
                    });
                    console.log('Selected text partially includes <mark> tag');

                } else {
                    //console.log('Selected text does not include any <mark> tag');
                    if (highlightNote) {
                        if (new_hightlight_note) {
                            new_hightlight_note = false;
                            var data = {
                                origin: 'article',
                                text: selection
                            };
                            window.parent.postMessage(data, mainURL);
                            var newNode = $('<mark></mark>').attr({
                                'id': 'temporary',
                                'data-is-note': 'true'
                            });
                            newNode.text(selection);
                            range.deleteContents();
                            range.insertNode(newNode[0]); 
                        }
                    } else {
                        $.ajax({
                            type: 'POST',
                            url: 'add_highlight/',
                            contentType: 'application/json',
                            data: JSON.stringify({
                                'content' : selection,
                            }),
                            success: function(response){
                                var highlightId = response.highlight_id;
                                var newNode = $('<mark data-highlight-id="' + highlightId + '"></mark>').attr('data-is-note', 'false');                    
                                newNode.text(selection);
                                range.deleteContents();
                                range.insertNode(newNode[0]);
                                let preContent = document.querySelector('pre').innerHTML;
                                localStorage.setItem(`preContent_${articleId}`, preContent);
                            },
                            error: function(xhr, status, error){
                                var errorMessage = JSON.parse(xhr.responseText).error;
                                alert('Error! ' + errorMessage);
                            }
                        });
                    }
                }
            }
        }
    });

    $('pre').on('click', 'mark', function () {
        var highlightId = $(this).data('highlight-id');
        if (deletionOn) {
            var $mark = $(this);
            var isNote = $(this).data('is-note');
            if (isNote) {
                var data = {
                    origin: 'article',
                    highlightId: highlightId,
                    msg: 'delete'
                };
                window.parent.postMessage(data, mainURL);
            } else {
                deleteHighlight(highlightId, $mark);
            }
        } else {
            var data = {
                origin: 'article',
                highlightId: highlightId,
                msg: 'scroll'
            };
            window.parent.postMessage(data, mainURL);
        }
    });

});