import os
import django
from django.urls import get_resolver

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def show_urls():
    resolver = get_resolver()
    for pattern in resolver.url_patterns:
        print(pattern)
        if hasattr(pattern, 'url_patterns'):
            for sub_pattern in pattern.url_patterns:
                print(f"  {sub_pattern}")

if __name__ == "__main__":
    show_urls()
