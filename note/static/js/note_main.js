window.addEventListener('message', function(event) {
    if (event.origin !== 'http://127.0.0.1:8000') {
        return;
    }
    var articleIframe = document.getElementsByClassName('article')[0];
    var notesIframe = document.getElementsByClassName('notes')[0];
    if (event.data.msg && event.data.msg == 'delete') {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Both the highlight and note would be deleted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, keep it'
        }).then((result) => {
            if (result.isConfirmed) {
                var data = {
                    origin: 'main',
                    highlightId: event.data.highlightId,
                    msg: 'deletion confirmed'
                };
                if (event.data.origin == 'article') {
                    notesIframe.contentWindow.postMessage(event.data, 'http://127.0.0.1:8000');
                    articleIframe.contentWindow.postMessage(data, 'http://127.0.0.1:8000');
                } else if (event.data.origin == 'note') {
                    articleIframe.contentWindow.postMessage(event.data, 'http://127.0.0.1:8000');
                    notesIframe.contentWindow.postMessage(data, 'http://127.0.0.1:8000');
                }
            }
        });
    } else {
        if (event.data.origin == 'article') {
            notesIframe.contentWindow.postMessage(event.data, 'http://127.0.0.1:8000');
        } else if (event.data.origin == 'note') {
            articleIframe.contentWindow.postMessage(event.data, 'http://127.0.0.1:8000');
        }
    }

}, false);
