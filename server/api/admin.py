from django.contrib import admin

from .models import EventLog, Wallet, OG

# Register your models here.
admin.site.register(EventLog)
admin.site.register(Wallet)
admin.site.register(OG)
