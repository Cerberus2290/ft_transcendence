# Generated by Django 5.0.2 on 2024-02-26 17:59

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_accounts', '0005_alter_player_totp_secret'),
    ]

    operations = [
        migrations.AlterField(
            model_name='player',
            name='totp_secret',
            field=models.CharField(default='NYAMHCCZIWIL7JTKE3PWOB2TXWHYGO2Y', max_length=100),
        ),
    ]
