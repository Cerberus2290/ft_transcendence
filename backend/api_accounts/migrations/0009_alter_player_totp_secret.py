# Generated by Django 5.0.2 on 2024-02-27 16:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_accounts', '0008_alter_player_totp_secret'),
    ]

    operations = [
        migrations.AlterField(
            model_name='player',
            name='totp_secret',
            field=models.CharField(default='FD3PBOJYOXQWYGV6H6Q2WJNKD67HH4XK', max_length=100),
        ),
    ]
