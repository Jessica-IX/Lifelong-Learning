from django.contrib import admin
from . import models

class NotesAdmin(admin.ModelAdmin):
    list_display = ('title',)
admin.site.register(models.Note, NotesAdmin)

class ArticlesAdmin(admin.ModelAdmin):
    list_display = ('title',)
admin.site.register(models.Article, ArticlesAdmin)

class HighlightssAdmin(admin.ModelAdmin):
    list_display = ('content',)
admin.site.register(models.Highlight, HighlightssAdmin)