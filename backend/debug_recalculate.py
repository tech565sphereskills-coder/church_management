import os
import django
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from church_management.models import MemberFollowUp

try:
    print("Starting recalculate...")
    MemberFollowUp.recalculate()
    print("Recalculate finished successfully.")
except Exception as e:
    print("Error during recalculate:")
    traceback.print_exc()
