from django.contrib import admin
from . import models

'''
class UserAdmin(admin.ModelAdmin):
    list_display = ('name',)
admin.site.register(models.User, UserAdmin)

class BookAdmin(admin.ModelAdmin):
    list_display = ('name',)
admin.site.register(models.Book, BookAdmin) '''

class UserLikedBookInline(admin.TabularInline):
    model = models.UserLikedBook
    extra = 1
    
class UserAdmin(admin.ModelAdmin):
    list_display = ('name',)
    inlines = [UserLikedBookInline]

class BookAdmin(admin.ModelAdmin):
    list_display = ('name',)
    inlines = [UserLikedBookInline]
admin.site.register(models.User, UserAdmin)
admin.site.register(models.Book, BookAdmin)
admin.site.register(models.UserLikedBook)