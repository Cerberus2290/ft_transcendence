# Generated by Django 5.0.2 on 2024-02-26 17:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_accounts', '0002_alter_player_totp_secret'),
    ]

    operations = [
        migrations.AlterField(
            model_name='player',
            name='totp_secret',
            field=models.CharField(default='HRKJCFXL5S7QTTDTPABKJIOVASWQ25ER', max_length=100),
        ),
    ]
