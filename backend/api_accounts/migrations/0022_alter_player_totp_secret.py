# Generated by Django 5.0.2 on 2024-02-20 14:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_accounts', '0021_alter_player_totp_secret'),
    ]

    operations = [
        migrations.AlterField(
            model_name='player',
            name='totp_secret',
            field=models.CharField(default='D7VARDR6YKLVGXCKDTLFFCAVK2Z77GD4', max_length=100),
        ),
    ]
