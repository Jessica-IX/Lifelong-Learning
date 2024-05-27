$(document).ready(function () {
    $("#add-user-btn").click(function() {
        $("#user-modal").modal('show');
    });
    $('#user-modal').modal({
        backdrop: 'static',
    });

    $("#add-book-btn").click(function() {
        $("#book-modal").modal('show');
    });
    $('#book-modal').modal({
        backdrop: 'static',
    });

    $(document).on('click', '#user-close', function() {
        $("#new-user-name").val('');
        $("#new-age").val('');
        $('#liked-books option:selected').prop('selected', false);
    });

    $(document).on('click', '#book-close', function() {
        $("#new-book-name").val('');
        $("#new-price").val('');
    });

    function adjustWidth() {
        $(this).width('auto').width(this.scrollWidth);
    }

    $('.book-name').each(function() {
        adjustWidth.call(this);
    });

    $(document).on('input', '.book-name', adjustWidth);

    $(document).on('click', '.delete-btn', function() {
        var isUser = $(this).hasClass('user-delete');
        var id = isUser ? $(this).data('user-id') : $(this).data('book-id');
        var entity = isUser ? 'user' : 'book';

        Swal.fire({
            title: 'Are you sure?',
            text: 'You won\'t be able to revert this!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, keep it'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteEntity(entity, id);
            }
        });
    });

    function deleteEntity(entity, id) {
        $.ajax({
            url: 'delete/',
            type: 'DELETE',
            contentType: 'application/json',
            data: JSON.stringify({
                'entity': entity,
                'id': id,
            }),

            success: function(response) {
                $('tr[data-' + entity + '-id="' + id + '"]').remove();
                if (entity == 'book') {
                    var optionText = $("select.form-select option[value='" + id + "']").text();
                    $("select.form-select option[value='" + id + "']").remove();
                }
            },
            error: function(xhr, status, error) {
                Swal.fire(
                    'Failed!',
                    'Failed to delete the ' + entity,
                    'Error!'
                );
            }
        });
    }

    $(document).on('click', '.add-book', function() {
        var bookName = $("#new-book-name").val();
        var bookPrice = $("#new-price").val();

        if (!bookName || !bookPrice) {
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: "Book name and price are required!"
            });
            return;
        }

        var priceFloat = parseFloat(bookPrice);

        if (priceFloat < 0) {
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: "Book price not valid!"
            });
            return;
        }
        
        priceFloat = parseFloat(priceFloat.toFixed(2));

        $.ajax({
            url: 'new_book/',
            type: 'POST',
            data: JSON.stringify({
                'book_name': bookName,
                'book_price': priceFloat,
            }),
            contentType: 'application/json',
            success: function(response) {
                $("#books-container").append(response.new_book_html);
            
                $("#new-book-name").val('');
                $("#new-price").val('');
                $("#book-close").click();
                $("#books-container .book-name").last().each(function() {
                    adjustWidth.call(this);
                });

                var newBookId = response.book_id;
                $('.form-select').each(function() {
                    var newOption = $('<option>').val(newBookId).text('[' + newBookId + '] ' + bookName);
                    $(this).append(newOption);
                });
            },
            error: function(xhr, status, error) {
                var errorMessage = xhr.responseJSON.error;
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: errorMessage
                });
            }
        });
        
    });

    $(document).on('click', '.add-user', function() {
        var userName = $("#new-user-name").val();
        var age = $("#new-age").val();
        var ageInt = parseInt(age, 10);

        if (!userName || !age) {
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: "User name and age are required!"
            });
            return;
        }

        if (isNaN(ageInt) || !Number.isInteger(ageInt) || ageInt < 0) {
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: "User age not valid!"
            });
            return;
        }
        options = $('#liked-books');
        $.ajax({
            url: 'new_user/',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                'user_name': userName,
                'user_age': ageInt,
                'liked_ids': options.val(),
            }),
            success: function(response) {
                $("#users-container").append(response.new_user_html);
                $("#new-user-name").val('');
                $("#new-age").val('');
                $('#liked-books option:selected').prop('selected', false);
                $("#user-close").click();
            },
            error: function(xhr, status, error) {
                var errorMessage = xhr.responseJSON.error;
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: errorMessage
                });
            }
        });
        
    });

    $(document).on('click', '.liked-save', function() {
        var userId =  $(this).data('user-id');

        var selectElement = $(this).parent().find('select.form-select');
        var selectedOptions = selectElement.val();

        $.ajax({
            url: 'add_liked_book/',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                'liked-ids': selectedOptions,
                'user-id': userId,
            }),

            success: function(response) {
                $('select[data-user-id="' + userId + '"] option:selected').prop('selected', false);
                var add_new = response.add_new;
                if (!add_new) {
                    return;
                }
                var likedBooks = response.liked_books;
                var ulElement = $('ul[data-user-id="' + userId + '"]');
                ulElement.empty();
                $.each(likedBooks, function(index, book) {
                    var bookId = book['book__id'];
                    var bookName = book['book__name'];
                    var liElement = $('<li>').attr('id', 'user-' + userId + '-book-' + bookId).text('[' + bookId + '] ' + bookName);
                    var buttonElement = $('<button>').attr('type', 'button').addClass('btn ms-2 delete-btn btn-xs liked-delete').attr('data-user-id', userId).attr('data-book-id', bookId).append($('<i>').addClass('fas fa-trash'));
                    var divId = '-user-' + userId + '-book-' + bookId;
                    var divElement = $('<div>').attr('id', divId).addClass('d-flex justify-content-between').append(liElement).append(buttonElement);
                    ulElement.append(divElement);
                });
            },
            error: function(xhr, status, error) {
                var errorMessage = xhr.responseJSON.error;
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: errorMessage
                });
            }
        });
    });

    $(document).on('click', '.liked-delete', function() {
        var userId =  $(this).data('user-id')
        var bookId =  $(this).data('book-id');

        Swal.fire({
            title: 'Are you sure?',
            text: 'You won\'t be able to revert this!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, keep it'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: 'delete_liked_book/',
                    type: 'DELETE',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        'user-id': userId,
                        'book-id': bookId,
                    }),
        
                    success: function(response) {
                        var likedBookCombo = '#-user-' + userId + '-book-' + bookId;
                        var liElement = $(likedBookCombo);
                        liElement.remove();
                    },
                    error: function(xhr, status, error) {
                        Swal.fire(
                            'Failed!',
                            'Failed to delete the ' + entity,
                            'Error!'
                        );
                    }
                });
            }
        });
    });

    let ifEdit = true;
    $(document).on('click', '.edit-btn', function() {
        if (ifEdit) {
            ifEdit = false;
            $(this).removeClass('btn-primary').addClass('btn-success');
            var $icon = $(this).find('i');
            $icon.removeClass('fas fa-edit').addClass('fas fa-check');
            if ($(this).hasClass('book-edit')) {
                $(this).removeClass('book-edit').addClass('book-update');
                var id = $(this).data('book-id');
                $('input[data-book-id="' + id + '"]').prop('readonly', false);
                $('input[data-book-id="' + id + '"]').removeClass('no-focus');
            } else {
                $(this).removeClass('user-edit').addClass('user-update');
                var id = $(this).data('user-id');
                $('input[data-user-id="' + id + '"]').prop('readonly', false);
                $('input[data-user-id="' + id + '"]').removeClass('no-focus');
                var likedDeleteButtons = $('button.liked-delete[data-user-id="' + id + '"]');
                likedDeleteButtons.each(function() {
                    $(this).removeClass('d-none');
                });
                var likedListDiv = $('div.liked-list[data-user-id="' + id + '"]');
                likedListDiv.removeClass('d-none');
            }
        } 
    });

    $(document).on('click', '.btn-success', function() {
        $button = $(this)
        if ($(this).hasClass('book-update')) {
            var id = $(this).data('book-id');
            var bookName = $('input.book-name[data-book-id="' + id + '"]').val()
            var bookPrice = $('input.price[data-book-id="' + id + '"]').val();
            var pricePattern = /^\d+(\.\d+)?$/;

            var bookPriceFloat = parseFloat(bookPrice);

            if (!bookName) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: "Book name can't be empty!"
                });
                return;
            }

            if (!bookPrice || !pricePattern.test(bookPrice) || bookPriceFloat < 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: "Book price not valid!"
                });
                return;
            }

            bookPriceFloat = parseFloat(bookPrice).toFixed(2);

            $.ajax({
                url: 'update_book/', 
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    'book_id': id,
                    'new_name': bookName,
                    'new_price': bookPriceFloat
                }),
                success: function(response) {
                    ifEdit = true;
                    $button.removeClass('btn-success').addClass('btn-primary');
                    var $icon = $button.find('i');
                    $icon.removeClass('fas fa-check').addClass('fas fa-edit');                    
                    $button.removeClass('book-update').addClass('book-edit');
                    $('input[data-book-id="' + id + '"]').prop('readonly', true);
                    $('input[data-book-id="' + id + '"]').addClass('no-focus');
                    $('input.book-name[data-book-id="' + id + '"]').val(bookName);
                    $('input.price[data-book-id="' + id + '"]').val(bookPriceFloat);

                    var ifFetch = response.fetch;
                    if (ifFetch) {
                        liked_users_ids = response.liked_users_ids;
                        $.each(liked_users_ids, function(index, userId) {
                            var listItemSelector = '#user-' + userId + '-book-' + id;
                            $(listItemSelector).html('[' + id + '] ' + bookName);
                        });
                        var optionElement = $('option[value="' + id + '"]');
                        optionElement.text('[' + id + '] ' + bookName);
                    }
                },
                error: function(xhr, status, error) {
                    var errorMessage = xhr.responseJSON.error;
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: errorMessage
                    });
                }
            });

        } else {
            var id = $(this).data('user-id');
            var userName = $('input.user-name[data-user-id="' + id + '"]').val()
            var ageInput = $('input.age[data-user-id="' + id + '"]').val();
            var agePattern = /^\d+$/; 
            var age = parseInt(ageInput, 10);
            if (!age || !agePattern.test(ageInput) || age < 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: "User age not valid!"
                });
                return;
            }
            if (!userName) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: "User name can't be empty!"
                });
                return;
            }
            $.ajax({
                url: 'update_user/', 
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    'user_id': id,
                    'new_name': userName,
                    'new_age': age
                }),
                success: function(response) {
                    ifEdit = true;
                    $button.removeClass('btn-success').addClass('btn-primary');
                    var $icon = $button.find('i');
                    $icon.removeClass('fas fa-check').addClass('fas fa-edit');                    
                    $(this).removeClass('user-update').addClass('user-edit');
                    $('input[data-user-id="' + id + '"]').prop('readonly', true);
                    $('input[data-user-id="' + id + '"]').addClass('no-focus');
                    $('input.user-name[data-user-id="' + id + '"]').val(userName);
                    $('input.age[data-user-id="' + id + '"]').val(age);
                    var likedDeleteButtons = $('button.liked-delete[data-user-id="' + id + '"]');
                    likedDeleteButtons.each(function() {
                        $(this).addClass('d-none');
                    });
                    var likedListDiv = $('div.liked-list[data-user-id="' + id + '"]');
                    likedListDiv.addClass('d-none');
                    $('select[data-user-id="' + id + '"] option:selected').prop('selected', false);

                },
                error: function(xhr, status, error) {
                    var errorMessage = xhr.responseJSON.error;
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: errorMessage
                    });
                }
            });
        }
    });
    
});