import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from church_management.models import Member, Contribution, Department, Service

def check_stats():
    print("--- Current Stats ---")
    print(f"Total Members: {Member.objects.count()}")
    print(f"Active: {Member.objects.filter(status='active').count()}")
    print(f"First Timer: {Member.objects.filter(status='first_timer').count()}")
    print(f"Inactive: {Member.objects.filter(status='inactive').count()}")
    
    now = timezone.now()
    tithes = Contribution.objects.filter(contribution_type='tithe', date__month=now.month, date__year=now.year)
    offerings = Contribution.objects.filter(contribution_type='offering', date__month=now.month, date__year=now.year)
    
    print(f"Monthly Tithes Sum: {sum(c.amount for c in tithes)}")
    print(f"Monthly Offerings Sum: {sum(c.amount for c in offerings)}")
    print("----------------------")

def add_test_data():
    print("\nAdding test data...")
    # Get or create a department
    dept, _ = Department.objects.get_or_create(name="Workforce")
    
    # 1. Add Active Member
    Member.objects.create(
        full_name="Test Active Member",
        phone="08012345678",
        gender="male",
        status="active",
        department=dept
    )
    print("Added Active Member: Test Active Member")
    
    # 2. Add First Timer (New This Month)
    Member.objects.create(
        full_name="Test First Timer",
        phone="08012345679",
        gender="female",
        status="first_timer",
        department=dept
    )
    print("Added First Timer: Test First Timer")
    
    # 3. Add Inactive Member
    Member.objects.create(
        full_name="Test Inactive Member",
        phone="08012345680",
        gender="male",
        status="inactive",
        department=dept
    )
    print("Added Inactive Member: Test Inactive Member")
    
    # 4. Add Tithe
    Contribution.objects.create(
        member=Member.objects.first(),
        amount=10000,
        contribution_type='tithe',
        date=timezone.now().date()
    )
    print("Added Tithe: 10,000")
    
    # 5. Add Offering
    Contribution.objects.create(
        member=Member.objects.first(),
        amount=5000,
        contribution_type='offering',
        date=timezone.now().date()
    )
    print("Added Offering: 5,000")

if __name__ == "__main__":
    check_stats()
    add_test_data()
    check_stats()
