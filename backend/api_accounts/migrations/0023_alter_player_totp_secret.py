# Generated by Django 5.0.2 on 2024-02-20 14:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_accounts', '0022_alter_player_totp_secret'),
    ]

    operations = [
        migrations.AlterField(
            model_name='player',
            name='totp_secret',
            field=models.CharField(default='QFZ7H3MDJKKPVX6W5LX3TVQCFRYNQDWH', max_length=100),
        ),
    ]
