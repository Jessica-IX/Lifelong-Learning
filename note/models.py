from django.db import models
from django.utils import timezone

class Article(models.Model):
    title = models.CharField(max_length=100)
    content = models.TextField()
    created = models.DateTimeField(auto_now_add=True)

class Highlight(models.Model):
    content = models.TextField()
    created = models.DateTimeField(auto_now_add=True)
    article = models.ForeignKey(Article, related_name='highlights', on_delete=models.CASCADE)
    
class Note(models.Model):
    title = models.CharField(max_length=100)
    text = models.TextField()
    created = models.DateTimeField(auto_now_add=True)
    article = models.ForeignKey(Article, related_name='notes', on_delete=models.CASCADE)
    highlight = models.OneToOneField(Highlight, related_name='note', null=True, blank=True, on_delete=models.CASCADE)