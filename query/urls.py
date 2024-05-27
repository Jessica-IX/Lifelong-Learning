from django.urls import path
from . import views

app_name = 'query'

urlpatterns = [
    path('', views.query_list, name='query_list'),
    path('result/', views.search_result, name='search_result'),
    path('result/delete/', views.delete_entity, name='delete_entity'),
    path('result/delete_liked_book/', views.delete_liked, name='delete_liked_book'),
    path('result/add_liked_book/', views.add_liked_book, name='add_liked_book'),
    path('result/update_user/', views.update_user, name='update_user'),
    path('result/new_user/', views.add_user, name='add_user'),
    path('result/new_book/', views.add_book, name='add_book'),
    path('result/update_book/', views.update_book, name='update_book'),
]