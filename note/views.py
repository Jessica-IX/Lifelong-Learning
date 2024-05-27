from django.shortcuts import render, get_object_or_404, redirect
from django.conf import settings
from .models import Note, Article, Highlight
from django.views.generic import ListView
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
import json
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils import timezone
from transformers import pipeline, AutoModelForSeq2SeqLM, AutoTokenizer

model_name = "facebook/bart-large-cnn"
cache_dir = "./note/model_cache"

tokenizer = AutoTokenizer.from_pretrained(model_name, cache_dir=cache_dir)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name, cache_dir=cache_dir)
summarizer = pipeline("summarization", model=model, tokenizer=tokenizer)
'''
class NotesView(ListView):
    model = Note
    context_object_name = 'note'
    template_name = 'note/notes_taking.html'
'''

def article_gallery(request):
    articles = Article.objects.all()
    return render(request, 'note/article_gallery.html', {'articles': articles})

@require_POST
@csrf_exempt
def delete_note(request, article_id):
    data = json.loads(request.body.decode('utf-8'))
    note_id = data.get('note_id') 
    try:
        note = Note.objects.get(id=note_id, article_id=article_id)
        if note.highlight:
            note.highlight.delete()
        note.delete()

        return JsonResponse({'success': True})
    except Note.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Note Does Not Exist'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@require_POST
@csrf_exempt
def save_new(request, article_id):
    data = json.loads(request.body)
    title = data.get('title', '')
    text = data.get('text', '')
    highlightId = data.get('highlight', -1)
    if title and text:
        if highlightId < 0:
            note = Note.objects.create(title=title, text=text, article_id=article_id)
        else:
            highlight = get_object_or_404(Highlight, pk=highlightId)
            print("Highlight:", highlight)
            note = Note.objects.create(title=title, text=text, article_id=article_id, highlight=highlight)
        notes = Note.objects.filter(article_id=article_id)
        html = render_to_string('note/notes_list.html', {'notes': notes})

        return JsonResponse({'message': 'Note saved successfully.', 'updated_html': html})
    else:
        return JsonResponse({'error': 'Title and text are required fields.'}, status=400)
    
@csrf_exempt    
@require_POST
def update_note(request, article_id):
    data = json.loads(request.body)
    noteId = data.get('note_id')
    new_title = data.get('title', '')
    new_text = data.get('text', '')
    
    note = get_object_or_404(Note, pk=noteId)
    
    if new_title != note.title or new_text != note.text:
        if new_title and new_text:
            note.title = new_title
            note.text = new_text
            note.created = timezone.now()
            note.article_id = article_id
            note.save()
            notes = Note.objects.filter(article_id=article_id)
            html = render_to_string('note/notes_list.html', {'notes': notes, 'article_id': article_id})
            return JsonResponse({'message': 'Note updated successfully.', 'updated_html': html})
        else:
            return JsonResponse({'error': 'Title and text are required fields.'}, status=400)
    else:
        return JsonResponse({'message': 'No Change'})

@require_POST
@csrf_exempt
def add_highlight(request, article_id):
    try:
        data = json.loads(request.body)
        content = data.get('content', '')        
        highlight = Highlight.objects.create(content=content, article_id=article_id)
        return JsonResponse({'message': 'Highlight added successfully.', 'highlight_id': highlight.id})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)   

@require_POST
@csrf_exempt
def change_highlight(request, article_id):
    try:
        data = json.loads(request.body)
        content = data.get('content', '')
        deleted_highlight_ids = data.get('deletedHighlightIds', [])
        
        highlight = Highlight.objects.create(content=content, article_id=article_id)

        for highlight_id in deleted_highlight_ids:
            Highlight.objects.filter(id=highlight_id, article_id=article_id).delete()
            
        return JsonResponse({'message': 'Highlight adjusted successfully.', 'highlight_id': highlight.id})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)   

@require_POST
@csrf_exempt
def delete_highlight(request, article_id):
    try:
        data = json.loads(request.body)
        id = data.get('highlight_id', '')
        
        Highlight.objects.filter(id=id,  article_id=article_id).delete()            
        return JsonResponse({'message': 'Highlight deleted successfully.'})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)   

@require_POST
@csrf_exempt
def summary(request, article_id):
    try:
        data = json.loads(request.body)
        text = data.get('text', '')
        summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
        summary_result = summarizer(text, max_length=130, min_length=30, do_sample=False)
        summary_text = summary_result[0]['summary_text']
        return JsonResponse({'summary': summary_text})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)   


def article_view(request, article_id):
    if request.GET.get('from_combined_screen') != 'true':
        return redirect(reverse('note:combined'))
    article = get_object_or_404(Article, id=article_id)
    highlights = Highlight.objects.filter(article=article).values_list('id', 'content')
    highlights_json = json.dumps(list(highlights))
    return render(request, 'note/article.html', {'article': article, 'highlights_json': highlights_json})

def notes_view(request, article_id):
    if request.GET.get('from_combined_screen') != 'true':
        return redirect(reverse('note:combined'))
    notes = Note.objects.filter(article_id=article_id)
    return render(request, 'note/notes_taking.html', {'notes' : notes, 'article_id': article_id})

def combined_screen(request, article_id):
    return render(request, 'note/combined.html',  {'id': article_id})

def article_gallery(request):
    articles = Article.objects.all()
    return render(request, 'note/article_gallery.html', {'articles' : articles})