from django.urls import path
from . import views

app_name = 'note'

urlpatterns = [
    #path('', views.NotesView.as_view()),
    path('', views.article_gallery, name='article_gallery'),

    path('<int:article_id>/', views.combined_screen, name='combined'),
    path('<int:article_id>/article/', views.article_view, name='article_view'),
    path('<int:article_id>/article/add_highlight/', views.add_highlight, name='add_highlight'),
    path('<int:article_id>/article/change_highlight/', views.change_highlight, name='change_highlight'),
    path('<int:article_id>/article/delete_highlight/', views.delete_highlight, name='delete_highlight'),

    path('<int:article_id>/notes/', views.notes_view, name='notes_view'),
    path('<int:article_id>/notes/delete_note/', views.delete_note, name='delete_note'),
    path('<int:article_id>/notes/save_new/', views.save_new, name='save_new'),
    path('<int:article_id>/notes/update_note/', views.update_note, name='update_note'),
    path('<int:article_id>/notes/summary/', views.summary, name='summary'),
]