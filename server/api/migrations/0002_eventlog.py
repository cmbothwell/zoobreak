# Generated by Django 3.2.9 on 2021-12-05 20:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='EventLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('transaction_hash', models.CharField(max_length=256)),
                ('type', models.CharField(choices=[('NameChange', 'NameChange'), ('Transfer', 'Transfer')], max_length=256)),
            ],
        ),
    ]
