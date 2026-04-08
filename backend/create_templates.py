import os
import django
import uuid

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from church_management.models import SMSTemplate

templates = [
    {
        'name': 'We Missed You',
        'body': 'Hello {name}, we missed you at service recently. We hope everything is well. God bless!'
    },
    {
        'name': 'Prayer Request Follow-up',
        'body': 'Hi {name}, we have been praying for your requests. Is there any update or testimony you would like to share?'
    },
    {
        'name': 'First Timer Welcome',
        'body': 'Dear {name}, thank you for joining us today! We hope you felt at home. See you again soon!'
    }
]

for t in templates:
    SMSTemplate.objects.get_or_create(name=t['name'], defaults={'body': t['body']})

print("Default templates created successfully.")
