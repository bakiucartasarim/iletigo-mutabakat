# BillionMail for Coolify

Self-hosted email marketing platform deployed on Coolify.

## 🚀 Quick Deploy to Coolify

### Prerequisites
- Coolify instance running
- Domain name (e.g., `mail.yourdomain.com`)
- DNS access for configuring records

### Step 1: Add to Coolify

1. Go to your Coolify dashboard
2. Click **+ New Resource**
3. Select **Docker Compose**
4. Choose **From GitHub**
5. Repository URL: `https://github.com/bakiucartasarim/iletigo-mutabakat`
6. Branch: `main`
7. Docker Compose Path: `billionmail-coolify/docker-compose.yml`
8. Click **Continue**

### Step 2: Configure Environment Variables

In Coolify, add these environment variables:

```env
DOMAIN=mail.yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_password
MYSQL_ROOT_PASSWORD=mysql_root_secure_password
MYSQL_DATABASE=billionmail
MYSQL_USER=billionmail
MYSQL_PASSWORD=mysql_user_secure_password
TZ=Europe/Istanbul
```

### Step 3: Configure DNS Records

Add these DNS records to your domain:

#### A Record
```
mail.yourdomain.com  →  YOUR_COOLIFY_SERVER_IP
```

#### MX Record
```
yourdomain.com  →  mail.yourdomain.com  (Priority: 10)
```

#### TXT Records (SPF)
```
yourdomain.com  →  "v=spf1 mx ~all"
```

#### TXT Records (DMARC)
```
_dmarc.yourdomain.com  →  "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com"
```

#### DKIM Record
After BillionMail starts, get the DKIM key:
```bash
docker exec billionmail bm show-record
```

Add the DKIM record shown in the output.

### Step 4: Deploy

1. Click **Deploy** in Coolify
2. Wait for deployment to complete
3. Access BillionMail at: `https://mail.yourdomain.com:8888/billionmail`

### Step 5: Initial Setup

1. Login with your `ADMIN_EMAIL` and `ADMIN_PASSWORD`
2. Complete the setup wizard
3. Configure SMTP settings
4. Add your first domain

## 📋 Default Ports

- **8888** - Web UI (HTTPS recommended via Coolify proxy)
- **25** - SMTP
- **587** - SMTP with STARTTLS
- **465** - SMTP with SSL
- **993** - IMAP with SSL
- **995** - POP3 with SSL

## 🔧 Management Commands

Access the container:
```bash
docker exec -it billionmail bash
```

View default credentials:
```bash
docker exec billionmail bm default
```

Show DNS records:
```bash
docker exec billionmail bm show-record
```

Update BillionMail:
```bash
docker exec billionmail bm update
```

View logs:
```bash
docker logs billionmail -f
```

## 🔒 Security Best Practices

### 1. Firewall Configuration
Ensure these ports are open on your Coolify server:
- 25 (SMTP)
- 587 (SMTP TLS)
- 465 (SMTP SSL)
- 993 (IMAP SSL)
- 995 (POP3 SSL)

### 2. SSL/TLS Configuration
Coolify automatically provides SSL for the web UI. For SMTP SSL:
1. Use port 587 with STARTTLS
2. Configure certificates in BillionMail settings

### 3. Strong Passwords
- Use complex passwords for admin account
- Use different passwords for MySQL
- Store passwords in Coolify's secrets management

### 4. Regular Updates
```bash
docker exec billionmail bm update
```

## 📊 Monitoring

### Check Service Status
```bash
docker ps | grep billionmail
```

### View Resource Usage
```bash
docker stats billionmail
```

### Health Check
```bash
curl http://localhost:8888
```

## 🔗 Integration with İletigo Mail Engine

After deploying BillionMail, configure İletigo Mail Engine:

### Environment Variables
```env
BILLIONMAIL_HOST=https://mail.yourdomain.com
BILLIONMAIL_API_KEY=your_api_key
BILLIONMAIL_API_SECRET=your_api_secret
BILLIONMAIL_FROM_EMAIL=noreply@yourdomain.com
BILLIONMAIL_FROM_NAME=İletigo
```

### API Usage
```bash
curl -X POST http://your-iletigo-app.com/api/mail-engine/billionmail/send \
  -H "Content-Type: application/json" \
  -d '{
    "billionmailHost": "https://mail.yourdomain.com",
    "apiKey": "your-api-key",
    "apiSecret": "your-api-secret",
    "toEmail": "user@example.com",
    "subject": "Test Email",
    "htmlContent": "<h1>Hello!</h1>"
  }'
```

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs
docker logs billionmail

# Check if ports are available
netstat -tuln | grep -E '25|587|465|993|995|8888'
```

### Can't access Web UI
- Check if port 8888 is open
- Verify Coolify proxy configuration
- Check container health: `docker inspect billionmail --format='{{.State.Health.Status}}'`

### Emails not sending
1. Verify DNS records are correct
2. Check SMTP ports are open
3. Test with: `telnet mail.yourdomain.com 25`
4. Check BillionMail logs: `docker logs billionmail -f`

### Database errors
```bash
# Restart MySQL
docker exec billionmail systemctl restart mysql

# Check MySQL logs
docker exec billionmail tail -f /var/log/mysql/error.log
```

## 📚 Resources

- [BillionMail GitHub](https://github.com/aaPanel/BillionMail)
- [BillionMail Demo](https://demo.billionmail.com/billionmail)
- [Coolify Documentation](https://coolify.io/docs)
- [İletigo Mail Engine Guide](../app/api/mail-engine/BILLIONMAIL_GUIDE.md)

## 🆘 Support

- BillionMail Issues: https://github.com/aaPanel/BillionMail/issues
- Coolify Discord: https://discord.gg/coolify
- İletigo Support: Your team

## 📝 License

BillionMail is licensed under AGPLv3.

---

**Note:** This setup is production-ready but requires proper DNS configuration and firewall rules. Always use strong passwords and enable SSL/TLS for production deployments.