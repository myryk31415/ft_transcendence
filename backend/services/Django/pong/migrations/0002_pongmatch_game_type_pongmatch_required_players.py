# Generated by Django 5.1.6 on 2025-02-05 21:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pong', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='pongmatch',
            name='game_type',
            field=models.CharField(default='Pong', max_length=20),
        ),
        migrations.AddField(
            model_name='pongmatch',
            name='required_players',
            field=models.IntegerField(default=2),
        ),
    ]
