# Generated by Django 3.2.9 on 2021-12-05 17:22

import api.models
import api.validators
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Wallet',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('address', models.CharField(max_length=42, unique=True, validators=[api.validators.validate_address])),
                ('email', models.EmailField(max_length=256, unique=True)),
                ('discord', models.CharField(max_length=256, unique=True, validators=[api.validators.validate_discord])),
                ('twitter', models.CharField(max_length=256, unique=True, validators=[api.validators.validate_twitter])),
                ('join_date', models.DateField(default=django.utils.timezone.now)),
                ('points', models.IntegerField(default=0)),
                ('love', models.IntegerField(default=0)),
                ('rank', models.IntegerField(blank=True, null=True, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='OG',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token_id', models.IntegerField(unique=True)),
                ('name', models.CharField(max_length=256)),
                ('birthday', models.DateField(default=django.utils.timezone.now)),
                ('fed_until', models.DateTimeField(default=api.models.OG.birth_fed_until)),
                ('rested_until', models.DateTimeField(default=api.models.OG.birth_rested_until)),
                ('sleeping_until', models.DateTimeField(default=django.utils.timezone.now)),
                ('love', models.IntegerField(default=0)),
                ('purged', models.BooleanField(default=False)),
                ('wallet', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to='api.wallet')),
            ],
        ),
    ]
