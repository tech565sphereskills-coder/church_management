from django.apps import AppConfig

class ChurchManagementConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'church_management'

    def ready(self):
        import church_management.signals
