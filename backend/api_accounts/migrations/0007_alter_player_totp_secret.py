# Generated by Django 5.0.2 on 2024-02-27 14:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_accounts', '0006_alter_player_totp_secret'),
    ]

    operations = [
        migrations.AlterField(
            model_name='player',
            name='totp_secret',
            field=models.CharField(default='NXP745YI2IFAMJQIKWZA65W6TCRKBSZB', max_length=100),
        ),
    ]
