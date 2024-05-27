from django.db import models
from decimal import Decimal, ROUND_HALF_UP

class Book(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=11, decimal_places=2)

    def save(self, *args, **kwargs):
        self.price = Decimal(self.price).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        super().save(*args, **kwargs)
    
class User(models.Model):
    name = models.CharField(max_length=100)
    age = models.IntegerField()
    liked_books = models.ManyToManyField(Book, through='UserLikedBook', related_name='liked_by', blank=True)

class UserLikedBook(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.user.name} likes {self.book.name}"