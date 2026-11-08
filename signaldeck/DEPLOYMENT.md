# Deployment Guide

This application relies on Laravel's **Scheduler** and **Queue System** to function correctly (specifically for syncing RSS feeds).

## 1. Scheduler (Cron Job)

To run the scheduled tasks (like `feeds:sync` which runs every 15 minutes), you need to add a single cron entry to your server.

Open your server's crontab:
```bash
crontab -e
```

Add the following line:
```cron
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```
*Replace `/path-to-your-project` with the actual path to your `signaldeck` directory.*

This cron job runs every minute and checks if any scheduled tasks are due.

## 2. Queue Worker (Supervisor)

The RSS feed processing happens in the background. In production, you should use a process monitor like **Supervisor** to keep `php artisan queue:work` running.

### Install Supervisor
```bash
sudo apt-get install supervisor
```

### Configuration
Create a configuration file at `/etc/supervisor/conf.d/signaldeck-worker.conf`:

```ini
[program:signaldeck-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path-to-your-project/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=your-username
numprocs=2
redirect_stderr=true
stdout_logfile=/path-to-your-project/storage/logs/worker.log
stopwaitsecs=3600
```
*Replace `/path-to-your-project` and `your-username` with your actual values.*

### Start Supervisor
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start signaldeck-worker:*
```

## 3. Database & Seeding
On your first deployment, remember to run migrations and seeds:
```bash
php artisan migrate --force
php artisan db:seed --class=FeedSeeder --force
```
