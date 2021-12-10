import os

from celery import Celery

# Set the default Django settings module for the 'celery' program.
from api.types import EventType

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'zoobreak.settings')

app = Celery('zoobreak')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()


@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    from api.tasks import watch_events
    sender.add_periodic_task(2.0, watch_events, args=(EventType.TRANSFER.value, ), name='WATCH_TXR')
    sender.add_periodic_task(2.0, watch_events, args=(EventType.NAME_CHANGE.value, ), name='WATCH_NAME')
