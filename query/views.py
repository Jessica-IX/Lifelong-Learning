from django.shortcuts import render
from .models import User, Book, UserLikedBook
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from django.views.decorators.http import require_POST
from django.template.loader import render_to_string
from django.shortcuts import render, get_object_or_404
from django.db import transaction

def query_list(request):
    users = User.objects.all().order_by('id')
    books = Book.objects.all().order_by('id')
    user_liked_books = UserLikedBook.objects.select_related('user', 'book').order_by('book__id')

    context = {
        'users': users,
        'user_liked_books': user_liked_books,
        'books': books,
    }
    return render(request, 'query/query_list.html', context)

def search_result(request):
    model = request.GET.get('table')
    name = request.GET.get('name')
    age_min = request.GET.get('age_min_value')
    age_max = request.GET.get('age_max_value')
    price_min = request.GET.get('price_min_value')
    price_max = request.GET.get('price_max_value')
    book_name = request.GET.get('book_name')
    
    users = User.objects.all().order_by('id')
    books = Book.objects.all().order_by('id')
    
    allBooks = Book.objects.all().order_by('id')
    if model == 'User':
        if price_min or price_max:
            return render(request, 'query/results.html', {'users': None, 'books': None, 'all_books': allBooks})
        if name:
            users = users.filter(name__icontains=name)
        if age_min:
            users = users.filter(age__gte=age_min)
        if age_max:
            users = users.filter(age__lte=age_max)
        if book_name:
            users = users.filter(liked_books__name__icontains=book_name).distinct()
        return render(request, 'query/results.html', {'users': users, 'books': None, 'all_books': allBooks})
    elif model == 'Book':
        if age_min or age_max or book_name:
            return render(request, 'query/results.html', {'users': None, 'books': None, 'all_books': allBooks})
        if name:
            books = books.filter(name__icontains=name)
        if price_min:
            books = books.filter(price__gte=price_min)
        if price_max:
            books = books.filter(price__lte=price_max)
        return render(request, 'query/results.html', {'users': None, 'books': books, 'all_books': allBooks})
    else:
        if book_name:
            users = users.filter(liked_books__name__icontains=book_name).distinct()
            if name:
                books = books.filter(name__icontains=name)
        elif name and not book_name:
            users = users.filter(name__icontains=name)
            books = books.filter(name__icontains=name)
        if age_min:
            users = users.filter(age__gte=age_min)
        if age_max:
            users = users.filter(age__lte=age_max)
        if price_min:
            books = books.filter(price__gte=price_min)
        if price_max:
            books = books.filter(price__lte=price_max)     
  
        if (age_min or age_max or book_name) and not price_min and not price_max and not name:
            return render(request, 'query/results.html', {'users': users, 'books': None, 'all_books': allBooks})
        if (price_min or price_max) and not age_min and not age_max and not book_name:
            return render(request, 'query/results.html', {'users': None, 'books': books, 'all_books': allBooks})

        return render(request, 'query/results.html', {'users': users, 'books': books, 'all_books': allBooks})

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_entity(request):
    try:
        data = json.loads(request.body)
        entity = data.get('entity', '')
        id = data.get('id', '')
        if entity == 'user':
            user = User.objects.get(id=id)
            user.delete()
        elif entity == 'book':
            book = Book.objects.get(id=id)
            
            book.delete()
        else:
            return JsonResponse({'error': 'Invalid entity'}, status=400)

        return JsonResponse({'message': f'{entity} deleted successfully'}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_liked(request):
    try:
        data = json.loads(request.body)
        userId = data.get('user-id', '')
        bookId = data.get('book-id', '')
        UserLikedBook.objects.filter(user_id=userId, book_id=bookId).delete()
        return JsonResponse({'message': 'Successfully deleted liked book'}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
@require_POST
@csrf_exempt
def add_book(request):
    try:
        data = json.loads(request.body)
        book_name = data.get('book_name', '')
        book_price = data.get('book_price', 0)
        new_book = Book.objects.create(name=book_name, price=book_price)
        new_book_html = render_to_string('query/add_book.html', {'book': new_book})
        return JsonResponse({'message': 'Book added successfully.', 'new_book_html': new_book_html, 'book_id': new_book.id}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_POST
@csrf_exempt
def add_user(request):
    try:
        data = json.loads(request.body)
        user_name = data.get('user_name', '')
        user_age = data.get('user_age', 0)
        liked_books =  data.get('liked_ids', [])
        with transaction.atomic():
            user = User.objects.create(name=user_name, age=user_age)
            for book_id in liked_books:
                UserLikedBook.objects.create(user=user, book_id=book_id)
        allBooks = Book.objects.all().order_by('id')
        new_user_html = render_to_string('query/add_user.html', {'user': user, 'all_books': allBooks})
        return JsonResponse({'message': 'User added successfully.', 'new_user_html': new_user_html}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
@require_POST
@csrf_exempt
def add_liked_book(request):
    try:
        data = json.loads(request.body)
        liked_books = data.get('liked-ids', [])
        user_id = data.get('user-id', '')
        add_new = False
        for book_id in liked_books:
            if not UserLikedBook.objects.filter(user_id=user_id, book_id=book_id).exists():
                add_new = True
                UserLikedBook.objects.create(user_id=user_id, book_id=book_id)
        if add_new:
            user = User.objects.get(id=user_id)
            user_liked_books = user.userlikedbook_set.order_by('book__id').values('book__id', 'book__name')
            return JsonResponse({'add_new': add_new, 'liked_books': list(user_liked_books)}, status=200)
        return JsonResponse({'add_new': add_new})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
        
@csrf_exempt    
@require_POST
def update_book(request):
    data = json.loads(request.body)
    book_id = data.get('book_id')
    new_name = data.get('new_name', '')
    new_price = data.get('new_price', 0)
    fetch = False
    book = get_object_or_404(Book, pk=book_id)
    original_name = book.name
    if new_name != original_name or new_price != book.price:
        book.name = new_name
        book.price = new_price
        book.save()
        if new_name != original_name:
            fetch = True
            if book.liked_by.count() != 0:
                liked_users_ids = [user.id for user in book.liked_by.all()]
                return JsonResponse({'message': 'Book updated successfully.', 'fetch': fetch, 'liked_users_ids': liked_users_ids})
        return JsonResponse({'message': 'Book updated successfully.', 'fetch': fetch})
    else:
        return JsonResponse({}, status=204)

@csrf_exempt    
@require_POST
def update_user(request):
    data = json.loads(request.body)
    user_id = data.get('user_id')
    new_name = data.get('new_name', '')
    new_age = data.get('new_age', 0)
    user = get_object_or_404(User, pk=user_id)
    if new_name != user.name or new_age != user.age:
        user.name = new_name
        user.age = new_age
        user.save()
        return JsonResponse({'message': 'User updated successfully.'})
    else:
        return JsonResponse({}, status=204)
